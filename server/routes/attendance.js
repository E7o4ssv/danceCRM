const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Group = require('../models/Group');
const Student = require('../models/Student');
const { authenticateToken, requireRole, isGroupTeacher } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AttendanceRecord:
 *       type: object
 *       required:
 *         - student
 *         - present
 *       properties:
 *         student:
 *           type: string
 *           description: ID студента
 *         present:
 *           type: boolean
 *           description: Присутствовал ли студент
 *         note:
 *           type: string
 *           description: Заметка о студенте
 *     Attendance:
 *       type: object
 *       required:
 *         - group
 *         - date
 *         - students
 *       properties:
 *         group:
 *           type: string
 *           description: ID группы
 *         date:
 *           type: string
 *           format: date
 *           description: Дата занятия
 *         students:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AttendanceRecord'
 */

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Получить отчеты о посещаемости
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: group
 *         schema:
 *           type: string
 *         description: ID группы для фильтрации
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Дата для фильтрации
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата периода
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата периода
 *     responses:
 *       200:
 *         description: Список отчетов о посещаемости
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attendance'
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { group, date, startDate, endDate } = req.query;
    let filter = {};

    // Фильтр по группе
    if (group) {
      filter.group = group;
      
      // Проверяем права доступа для учителей
      if (req.user.role === 'teacher') {
        const groupDoc = await Group.findById(group);
        if (!groupDoc || groupDoc.teacher.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    } else if (req.user.role === 'teacher') {
      // Если учитель, показываем только его группы
      const teacherGroups = await Group.find({ teacher: req.user._id });
      filter.group = { $in: teacherGroups.map(g => g._id) };
    }

    // Фильтр по дате
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      filter.date = { $gte: startOfDay, $lt: endOfDay };
    } else if (startDate || endDate) {
      if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      } else if (startDate) {
        filter.date = { $gte: new Date(startDate) };
      } else if (endDate) {
        filter.date = { $lte: new Date(endDate) };
      }
    }

    const attendance = await Attendance.find(filter)
      .populate('group', 'name room dayOfWeek time')
      .populate('students.student', 'name phone')
      .populate('submittedBy', 'name username')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/attendance:
 *   post:
 *     summary: Создать отчет о посещаемости
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Attendance'
 *     responses:
 *       201:
 *         description: Отчет о посещаемости создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Ошибка валидации
 *       409:
 *         description: Отчет за эту дату уже существует
 */
router.post('/', [
  authenticateToken,
  requireRole(['teacher']),
  body('group').notEmpty().withMessage('Group is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('students').isArray().withMessage('Students array is required'),
  body('students.*.student').notEmpty().withMessage('Student ID is required'),
  body('students.*.present').isBoolean().withMessage('Present must be boolean')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { group, date, students } = req.body;

    // Проверяем, что группа принадлежит учителю
    const groupDoc = await Group.findById(group);
    if (!groupDoc) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (groupDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only submit attendance for your own groups.' });
    }

    // Проверяем, что все студенты принадлежат группе
    const groupStudentIds = groupDoc.students.map(id => id.toString());
    const submittedStudentIds = students.map(s => s.student.toString());
    
    const invalidStudents = submittedStudentIds.filter(id => !groupStudentIds.includes(id));
    if (invalidStudents.length > 0) {
      return res.status(400).json({ message: 'Some students do not belong to this group' });
    }

    // Проверяем, что отчет за эту дату еще не существует
    const existingAttendance = await Attendance.findOne({ group, date: new Date(date) });
    if (existingAttendance) {
      return res.status(409).json({ message: 'Attendance report for this date already exists' });
    }

    const attendance = new Attendance({
      group,
      date: new Date(date),
      students,
      submittedBy: req.user._id
    });

    await attendance.save();
    await attendance.populate('group', 'name room dayOfWeek time');
    await attendance.populate('students.student', 'name phone');
    await attendance.populate('submittedBy', 'name username');

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/attendance/{attendanceId}:
 *   get:
 *     summary: Получить отчет о посещаемости по ID
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Отчет о посещаемости
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attendance'
 *       404:
 *         description: Отчет не найден
 */
router.get('/:attendanceId', authenticateToken, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.attendanceId)
      .populate('group', 'name room dayOfWeek time')
      .populate('students.student', 'name phone')
      .populate('submittedBy', 'name username');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance report not found' });
    }

    // Проверяем права доступа
    if (req.user.role === 'teacher' && attendance.submittedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/attendance/{attendanceId}:
 *   put:
 *     summary: Обновить отчет о посещаемости
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Attendance'
 *     responses:
 *       200:
 *         description: Отчет о посещаемости обновлен
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Отчет не найден
 */
router.put('/:attendanceId', [
  authenticateToken,
  requireRole(['teacher']),
  body('students').isArray().withMessage('Students array is required'),
  body('students.*.student').notEmpty().withMessage('Student ID is required'),
  body('students.*.present').isBoolean().withMessage('Present must be boolean')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { students } = req.body;

    const attendance = await Attendance.findById(req.params.attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance report not found' });
    }

    // Проверяем права доступа
    if (attendance.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only update your own attendance reports.' });
    }

    attendance.students = students;
    attendance.submittedAt = new Date();

    await attendance.save();
    await attendance.populate('group', 'name room dayOfWeek time');
    await attendance.populate('students.student', 'name phone');
    await attendance.populate('submittedBy', 'name username');

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/attendance/{attendanceId}:
 *   delete:
 *     summary: Удалить отчет о посещаемости
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Отчет о посещаемости удален
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Отчет не найден
 */
router.delete('/:attendanceId', [
  authenticateToken,
  requireRole(['teacher', 'admin'])
], async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.attendanceId);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance report not found' });
    }

    // Проверяем права доступа
    if (req.user.role === 'teacher' && attendance.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own attendance reports.' });
    }

    await Attendance.findByIdAndDelete(req.params.attendanceId);

    res.json({ message: 'Attendance report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/attendance/group/{groupId}/date/{date}:
 *   get:
 *     summary: Получить отчет о посещаемости для группы на конкретную дату
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Отчет о посещаемости
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attendance'
 *       404:
 *         description: Отчет не найден
 */
router.get('/group/:groupId/date/:date', authenticateToken, async (req, res) => {
  try {
    const { groupId, date } = req.params;

    // Проверяем права доступа для учителей
    if (req.user.role === 'teacher') {
      const groupDoc = await Group.findById(groupId);
      if (!groupDoc || groupDoc.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const attendance = await Attendance.findOne({
      group: groupId,
      date: { $gte: startOfDay, $lt: endOfDay }
    }).populate('group', 'name room dayOfWeek time')
      .populate('students.student', 'name phone')
      .populate('submittedBy', 'name username');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance report not found for this date' });
    }

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 