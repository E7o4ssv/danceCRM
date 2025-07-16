const express = require('express');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const Student = require('../models/Student');
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

    // Если пользователь - учитель, показываем только его группы
    if (req.user.role === 'teacher') {
      filter.teacher = req.user._id;
    } else if (teacher) {
      filter.teacher = teacher;
    }

    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const groups = await Group.find(filter)
      .populate('teacher', 'name username')
      .populate('students', 'name phone')
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
 *     summary: Создать новую группу
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
  requireRole(['teacher']),
  body('name').notEmpty().withMessage('Group name is required'),
  body('room').notEmpty().withMessage('Room is required'),
  body('dayOfWeek').isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of week'),
  body('time').notEmpty().withMessage('Time is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, room, dayOfWeek, time } = req.body;

    const group = new Group({
      name,
      room,
      dayOfWeek,
      time,
      teacher: req.user._id
    });

    await group.save();
    await group.populate('teacher', 'name username');

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
      .populate('students', 'name phone');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Проверяем права доступа
    if (req.user.role === 'teacher' && group.teacher._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
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
  requireRole(['teacher']),
  isGroupTeacher,
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
    ).populate('teacher', 'name username')
     .populate('students', 'name phone');

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
 * /api/groups/{groupId}/students/{studentId}:
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
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Студент добавлен в группу
 *       404:
 *         description: Группа или студент не найдены
 */
router.post('/:groupId/students/:studentId', [
  authenticateToken,
  requireRole(['teacher']),
  isGroupTeacher
], async (req, res) => {
  try {
    const { groupId, studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const group = await Group.findById(groupId);
    if (group.students.includes(studentId)) {
      return res.status(400).json({ message: 'Student already in group' });
    }

    group.students.push(studentId);
    await group.save();

    // Добавляем группу в список групп студента
    if (!student.groups.includes(groupId)) {
      student.groups.push(groupId);
      await student.save();
    }

    await group.populate('students', 'name phone');
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
  requireRole(['teacher']),
  isGroupTeacher
], async (req, res) => {
  try {
    const { groupId, studentId } = req.params;

    const group = await Group.findById(groupId);
    if (!group.students.includes(studentId)) {
      return res.status(400).json({ message: 'Student not in group' });
    }

    group.students = group.students.filter(id => id.toString() !== studentId);
    await group.save();

    // Удаляем группу из списка групп студента
    const student = await Student.findById(studentId);
    if (student) {
      student.groups = student.groups.filter(id => id.toString() !== groupId);
      await student.save();
    }

    await group.populate('students', 'name phone');
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 