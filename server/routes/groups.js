const express = require('express');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const Student = require('../models/Student');
const User = require('../models/User');
const { authenticateToken, requireRole, isGroupTeacher } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       required:
 *         - name
 *         - room
 *         - dayOfWeek
 *         - time
 *       properties:
 *         name:
 *           type: string
 *           description: Название группы
 *         room:
 *           type: string
 *           description: Номер зала
 *         dayOfWeek:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *           description: День недели
 *         time:
 *           type: string
 *           description: Время занятия
 *         teachers:
 *           type: array
 *           items:
 *             type: string
 *           description: ID учителей группы
 *         isActive:
 *           type: boolean
 *           description: Активна ли группа
 */

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: Получить список групп
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacher
 *         schema:
 *           type: string
 *         description: ID учителя для фильтрации
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Фильтр по активности
 *     responses:
 *       200:
 *         description: Список групп
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { teacher, active } = req.query;
    let filter = {};

    // Если пользователь - учитель, показываем только группы где он является учителем
    if (req.user.role === 'teacher') {
      filter.$or = [
        { teacher: req.user._id },
        { teachers: req.user._id }
      ];
    } else if (teacher) {
      // Админ может фильтровать по учителю
      filter.$or = [
        { teacher: teacher },
        { teachers: teacher }
      ];
    }

    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const groups = await Group.find(filter)
      .populate('teacher', 'name username')
      .populate('teachers', 'name username')
      .populate('students', 'name phone')
      .populate('createdBy', 'name username')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Создать новую группу (только админ)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Group'
 *     responses:
 *       201:
 *         description: Группа создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Ошибка валидации
 */
router.post('/', [
  authenticateToken,
  requireRole(['admin']),
  body('name').notEmpty().withMessage('Group name is required'),
  body('room').notEmpty().withMessage('Room is required'),
  body('dayOfWeek').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of week'),
  body('time').notEmpty().withMessage('Time is required'),
  body('teachers').optional().isArray().withMessage('Teachers must be an array')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, room, dayOfWeek, time, teachers = [], isActive = true } = req.body;

    // Проверяем, что все указанные учителя существуют
    if (teachers.length > 0) {
      const existingTeachers = await User.find({ 
        _id: { $in: teachers }, 
        role: 'teacher' 
      });
      if (existingTeachers.length !== teachers.length) {
        return res.status(400).json({ message: 'One or more teachers not found or invalid role' });
      }
    }

    const group = new Group({
      name,
      room,
      dayOfWeek,
      time,
      teachers,
      teacher: teachers[0] || null, // Первый учитель как основной для совместимости
      isActive,
      createdBy: req.user._id
    });

    await group.save();
    await group.populate('teachers', 'name username');
    await group.populate('teacher', 'name username');
    await group.populate('createdBy', 'name username');

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/groups/{groupId}:
 *   get:
 *     summary: Получить информацию о группе
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Информация о группе
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       404:
 *         description: Группа не найдена
 */
router.get('/:groupId', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('teacher', 'name username')
      .populate('teachers', 'name username')
      .populate('students', 'name phone')
      .populate('createdBy', 'name username');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Проверяем права доступа для учителей
    if (req.user.role === 'teacher') {
      const isTeacherInGroup = group.teachers.some(teacher => 
        teacher._id.toString() === req.user._id.toString()
      ) || (group.teacher && group.teacher._id.toString() === req.user._id.toString());
      
      if (!isTeacherInGroup) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/groups/{groupId}:
 *   put:
 *     summary: Обновить группу
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Group'
 *     responses:
 *       200:
 *         description: Группа обновлена
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Группа не найдена
 */
router.put('/:groupId', [
  authenticateToken,
  requireRole(['teacher', 'admin']),
  (req, res, next) => {
    // Админ может редактировать любую группу
    if (req.user.role === 'admin') {
      return next();
    }
    // Учителя проходят проверку через isGroupTeacher
    return isGroupTeacher(req, res, next);
  },
  body('name').optional().notEmpty().withMessage('Group name cannot be empty'),
  body('room').optional().notEmpty().withMessage('Room cannot be empty'),
  body('dayOfWeek').optional().isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of week'),
  body('time').optional().notEmpty().withMessage('Time cannot be empty')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, room, dayOfWeek, time, isActive } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (room !== undefined) updateData.room = room;
    if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
    if (time !== undefined) updateData.time = time;
    if (isActive !== undefined) updateData.isActive = isActive;

    const group = await Group.findByIdAndUpdate(
      req.params.groupId,
      updateData,
      { new: true }
    ).populate('teacher', 'name username');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/groups/{groupId}:
 *   delete:
 *     summary: Удалить группу
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Группа удалена
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Группа не найдена
 */
router.delete('/:groupId', [
  authenticateToken,
  requireRole(['teacher', 'admin']),
  (req, res, next) => {
    // Админ может удалять любую группу
    if (req.user.role === 'admin') {
      return next();
    }
    // Учителя проходят проверку через isGroupTeacher
    return isGroupTeacher(req, res, next);
  }
], async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/groups/{groupId}/students:
 *   post:
 *     summary: Добавить студента в группу
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: ID студента
 *     responses:
 *       200:
 *         description: Студент добавлен в группу
 *       400:
 *         description: Студент уже в группе
 *       404:
 *         description: Группа или студент не найдены
 */
router.post('/:groupId/students', [
  authenticateToken,
  requireRole(['teacher', 'admin']),
  (req, res, next) => {
    // Админ может добавлять студентов в любую группу
    if (req.user.role === 'admin') {
      return next();
    }
    // Учителя проходят проверку через isGroupTeacher
    return isGroupTeacher(req, res, next);
  },
  body('studentId').notEmpty().withMessage('Student ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { studentId } = req.body;
    const groupId = req.params.groupId;

    // Проверяем, существует ли студент
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Проверяем, есть ли уже студент в группе
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.students.includes(studentId)) {
      return res.status(400).json({ message: 'Student is already in this group' });
    }

    // Добавляем студента в группу
    group.students.push(studentId);
    await group.save();

    // Добавляем группу к студенту
    if (!student.groups) {
      student.groups = [];
    }
    if (!student.groups.includes(groupId)) {
      student.groups.push(groupId);
      await student.save();
    }

    await group.populate('students', 'name phone');
    await group.populate('teacher', 'name username');

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/groups/{groupId}/students/{studentId}:
 *   delete:
 *     summary: Удалить студента из группы
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Студент удален из группы
 *       404:
 *         description: Группа или студент не найдены
 */
router.delete('/:groupId/students/:studentId', [
  authenticateToken,
  requireRole(['teacher', 'admin']),
  (req, res, next) => {
    // Админ может удалять студентов из любой группы
    if (req.user.role === 'admin') {
      return next();
    }
    // Учителя проходят проверку через isGroupTeacher
    return isGroupTeacher(req, res, next);
  }
], async (req, res) => {
  try {
    const { groupId, studentId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Удаляем студента из группы
    group.students = group.students.filter(id => id.toString() !== studentId);
    await group.save();

    // Удаляем группу у студента
    const student = await Student.findById(studentId);
    if (student) {
      student.groups = student.groups.filter(id => id.toString() !== groupId);
      await student.save();
    }

    await group.populate('students', 'name phone');
    await group.populate('teacher', 'name username');

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Новый роут для добавления учителя в группу (только админ)
router.post('/:groupId/teachers', [
  authenticateToken,
  requireRole(['admin']),
  body('teacherId').notEmpty().withMessage('Teacher ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { teacherId } = req.body;
    const groupId = req.params.groupId;

    // Проверяем, что учитель существует
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Проверяем, что учитель еще не в группе
    if (group.teachers.includes(teacherId)) {
      return res.status(400).json({ message: 'Teacher is already assigned to this group' });
    }

    group.teachers.push(teacherId);
    await group.save();

    await group.populate('teachers', 'name username');
    await group.populate('teacher', 'name username');
    await group.populate('students', 'name phone');

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Роут для удаления учителя из группы (только админ)
router.delete('/:groupId/teachers/:teacherId', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const { groupId, teacherId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    group.teachers = group.teachers.filter(id => id.toString() !== teacherId);
    
    // Если удаляем основного учителя, назначаем нового
    if (group.teacher && group.teacher.toString() === teacherId) {
      group.teacher = group.teachers[0] || null;
    }
    
    await group.save();

    await group.populate('teachers', 'name username');
    await group.populate('teacher', 'name username');
    await group.populate('students', 'name phone');

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 