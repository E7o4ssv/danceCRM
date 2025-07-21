const express = require('express');
const { body, validationResult } = require('express-validator');
const IndividualLesson = require('../models/IndividualLesson');
const Student = require('../models/Student');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     IndividualLesson:
 *       type: object
 *       required:
 *         - name
 *         - teacher
 *         - room
 *         - schedule
 *       properties:
 *         name:
 *           type: string
 *           description: Название занятия
 *         teacher:
 *           type: string
 *           description: ID преподавателя
 *         students:
 *           type: array
 *           items:
 *             type: string
 *           description: ID студентов (1-2)
 *         schedule:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               dayOfWeek:
 *                 type: string
 *                 enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *               time:
 *                 type: string
 *         room:
 *           type: string
 *           description: Номер зала
 *         duration:
 *           type: number
 *           description: Длительность в минутах
 *         price:
 *           type: number
 *           description: Стоимость занятия
 *         notes:
 *           type: string
 *           description: Заметки
 */

// Получить список индивидуальных занятий
router.get('/', authenticateToken, async (req, res) => {
  try {
    let filter = {};

    // Если пользователь - учитель, показываем только его занятия
    if (req.user.role === 'teacher') {
      filter.teacher = req.user._id;
    }

    const lessons = await IndividualLesson.find(filter)
      .populate('teacher', 'name username')
      .populate('students', 'name phone')
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });

    res.json(lessons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Создать новое индивидуальное занятие
router.post('/', [
  authenticateToken,
  requireRole(['teacher', 'admin']),
  body('name').notEmpty().withMessage('Lesson name is required'),
  body('teacher').notEmpty().withMessage('Teacher is required'),
  body('room').notEmpty().withMessage('Room is required'),
  body('schedule').isArray({ min: 1 }).withMessage('At least one schedule entry is required'),
  body('schedule.*.dayOfWeek').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of week'),
  body('schedule.*.time').notEmpty().withMessage('Time is required'),
  body('students').optional().isArray({ max: 2 }).withMessage('Individual lessons can have maximum 2 students'),
  body('duration').optional().isInt({ min: 30, max: 180 }).withMessage('Duration must be between 30 and 180 minutes')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, teacher, students = [], schedule, room, duration = 60, price, notes } = req.body;

    // Проверяем, что преподаватель существует
    const teacherUser = await User.findOne({ _id: teacher, role: 'teacher' });
    if (!teacherUser) {
      return res.status(400).json({ message: 'Teacher not found' });
    }

    // Если не админ, можно создавать только свои занятия
    if (req.user.role === 'teacher' && teacher !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Teachers can only create their own lessons' });
    }

    // Проверяем, что все студенты существуют
    if (students.length > 0) {
      const existingStudents = await Student.find({ _id: { $in: students } });
      if (existingStudents.length !== students.length) {
        return res.status(400).json({ message: 'One or more students not found' });
      }
    }

    const lesson = new IndividualLesson({
      name,
      teacher,
      students,
      schedule,
      room,
      duration,
      price,
      notes,
      createdBy: req.user._id
    });

    await lesson.save();
    await lesson.populate('teacher', 'name username');
    await lesson.populate('students', 'name phone');
    await lesson.populate('createdBy', 'name username');

    res.status(201).json(lesson);
  } catch (error) {
    console.error('Error creating individual lesson:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message
    });
  }
});

// Получить конкретное индивидуальное занятие
router.get('/:lessonId', authenticateToken, async (req, res) => {
  try {
    const lesson = await IndividualLesson.findById(req.params.lessonId)
      .populate('teacher', 'name username')
      .populate('students', 'name phone')
      .populate('createdBy', 'name username');

    if (!lesson) {
      return res.status(404).json({ message: 'Individual lesson not found' });
    }

    // Проверяем права доступа для учителей
    if (req.user.role === 'teacher' && lesson.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Обновить индивидуальное занятие
router.put('/:lessonId', [
  authenticateToken,
  requireRole(['teacher', 'admin']),
  body('name').optional().notEmpty().withMessage('Lesson name cannot be empty'),
  body('room').optional().notEmpty().withMessage('Room cannot be empty'),
  body('schedule').optional().isArray({ min: 1 }).withMessage('At least one schedule entry is required'),
  body('students').optional().isArray({ max: 2 }).withMessage('Individual lessons can have maximum 2 students'),
  body('duration').optional().isInt({ min: 30, max: 180 }).withMessage('Duration must be between 30 and 180 minutes')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const lesson = await IndividualLesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Individual lesson not found' });
    }

    // Проверяем права доступа для учителей
    if (req.user.role === 'teacher' && lesson.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, students, schedule, room, duration, price, notes, isActive } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (students !== undefined) {
      // Проверяем, что все студенты существуют
      if (students.length > 0) {
        const existingStudents = await Student.find({ _id: { $in: students } });
        if (existingStudents.length !== students.length) {
          return res.status(400).json({ message: 'One or more students not found' });
        }
      }
      updateData.students = students;
    }
    if (schedule !== undefined) updateData.schedule = schedule;
    if (room !== undefined) updateData.room = room;
    if (duration !== undefined) updateData.duration = duration;
    if (price !== undefined) updateData.price = price;
    if (notes !== undefined) updateData.notes = notes;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedLesson = await IndividualLesson.findByIdAndUpdate(
      req.params.lessonId,
      updateData,
      { new: true }
    ).populate('teacher', 'name username')
     .populate('students', 'name phone')
     .populate('createdBy', 'name username');

    res.json(updatedLesson);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Удалить индивидуальное занятие
router.delete('/:lessonId', [
  authenticateToken,
  requireRole(['teacher', 'admin'])
], async (req, res) => {
  try {
    const lesson = await IndividualLesson.findById(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Individual lesson not found' });
    }

    // Проверяем права доступа для учителей
    if (req.user.role === 'teacher' && lesson.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await IndividualLesson.findByIdAndDelete(req.params.lessonId);
    res.json({ message: 'Individual lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Добавить студента в индивидуальное занятие
router.post('/:lessonId/students', [
  authenticateToken,
  requireRole(['teacher', 'admin']),
  body('studentId').notEmpty().withMessage('Student ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { studentId } = req.body;
    const lesson = await IndividualLesson.findById(req.params.lessonId);

    if (!lesson) {
      return res.status(404).json({ message: 'Individual lesson not found' });
    }

    // Проверяем права доступа для учителей
    if (req.user.role === 'teacher' && lesson.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Проверяем, что студент существует
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Проверяем лимит студентов (максимум 2)
    if (lesson.students.length >= 2) {
      return res.status(400).json({ message: 'Individual lessons can have maximum 2 students' });
    }

    // Проверяем, что студент не уже в занятии
    if (lesson.students.includes(studentId)) {
      return res.status(400).json({ message: 'Student is already in this lesson' });
    }

    lesson.students.push(studentId);
    await lesson.save();

    await lesson.populate('teacher', 'name username');
    await lesson.populate('students', 'name phone');

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Удалить студента из индивидуального занятия
router.delete('/:lessonId/students/:studentId', [
  authenticateToken,
  requireRole(['teacher', 'admin'])
], async (req, res) => {
  try {
    const { lessonId, studentId } = req.params;
    const lesson = await IndividualLesson.findById(lessonId);

    if (!lesson) {
      return res.status(404).json({ message: 'Individual lesson not found' });
    }

    // Проверяем права доступа для учителей
    if (req.user.role === 'teacher' && lesson.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    lesson.students = lesson.students.filter(id => id.toString() !== studentId);
    await lesson.save();

    await lesson.populate('teacher', 'name username');
    await lesson.populate('students', 'name phone');

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 