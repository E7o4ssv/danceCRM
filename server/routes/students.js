const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Group = require('../models/Group');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Имя студента
 *         phone:
 *           type: string
 *           description: Номер телефона
 *         isActive:
 *           type: boolean
 *           description: Активен ли студент
 */

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Получить список студентов
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: group
 *         schema:
 *           type: string
 *         description: ID группы для фильтрации
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Фильтр по активности
 *     responses:
 *       200:
 *         description: Список студентов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { group, active } = req.query;
    let filter = {};

    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    let students;
    if (group) {
      // Если указана группа, получаем студентов этой группы
      const groupDoc = await Group.findById(group);
      if (!groupDoc) {
        return res.status(404).json({ message: 'Group not found' });
      }

      // Проверяем права доступа для учителей
      if (req.user.role === 'teacher' && groupDoc.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      students = await Student.find({
        _id: { $in: groupDoc.students },
        ...filter
      }).populate('groups', 'name room dayOfWeek time');
    } else {
      // Если пользователь - учитель, показываем только студентов его групп
      if (req.user.role === 'teacher') {
        const teacherGroups = await Group.find({ teacher: req.user._id });
        const studentIds = teacherGroups.flatMap(group => group.students);
        filter._id = { $in: studentIds };
      }

      students = await Student.find(filter).populate('groups', 'name room dayOfWeek time');
    }

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Создать нового студента
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Студент создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       400:
 *         description: Ошибка валидации
 */
router.post('/', [
  authenticateToken,
  requireRole(['teacher', 'admin']),
  body('name').notEmpty().withMessage('Student name is required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, phone } = req.body;

    const student = new Student({
      name,
      phone
    });

    await student.save();
    await student.populate('groups', 'name room dayOfWeek time');

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/students/{studentId}:
 *   get:
 *     summary: Получить информацию о студенте
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Информация о студенте
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       404:
 *         description: Студент не найден
 */
router.get('/:studentId', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('groups', 'name room dayOfWeek time');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Проверяем права доступа для учителей
    if (req.user.role === 'teacher') {
      const hasAccess = student.groups.some(group => 
        group.teacher && group.teacher.toString() === req.user._id.toString()
      );
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/students/{studentId}:
 *   put:
 *     summary: Обновить информацию о студенте
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Студент обновлен
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Студент не найден
 */
router.put('/:studentId', [
  authenticateToken,
  requireRole(['teacher', 'admin']),
  body('name').optional().notEmpty().withMessage('Student name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, phone, isActive } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    const student = await Student.findByIdAndUpdate(
      req.params.studentId,
      updateData,
      { new: true }
    ).populate('groups', 'name room dayOfWeek time');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Проверяем права доступа для учителей
    if (req.user.role === 'teacher') {
      const hasAccess = student.groups.some(group => 
        group.teacher && group.teacher.toString() === req.user._id.toString()
      );
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/students/{studentId}:
 *   delete:
 *     summary: Удалить студента
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Студент удален
 *       403:
 *         description: Доступ запрещен
 *       404:
 *         description: Студент не найден
 */
router.delete('/:studentId', [
  authenticateToken,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Удаляем студента из всех групп
    await Group.updateMany(
      { students: student._id },
      { $pull: { students: student._id } }
    );

    await Student.findByIdAndDelete(req.params.studentId);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 