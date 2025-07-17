const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const Group = require('../models/Group');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         sender:
 *           type: string
 *           description: ID отправителя
 *         content:
 *           type: string
 *           description: Содержание сообщения
 *         timestamp:
 *           type: string
 *           format: date-time
 *         isRead:
 *           type: boolean
 *     Chat:
 *       type: object
 *       properties:
 *         group:
 *           type: string
 *           description: ID группы
 *         participants:
 *           type: array
 *           items:
 *             type: string
 *           description: Участники чата
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Message'
 *         lastActivity:
 *           type: string
 *           format: date-time
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/chat/group/{groupId}:
 *   get:
 *     summary: Получить чат группы
 *     tags: [Chat]
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
 *         description: Чат группы
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       404:
 *         description: Чат не найден
 */
router.get('/group/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Проверяем, что группа существует
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Проверяем права доступа
    const isTeacherInGroup = group.teachers.some(teacherId => 
      teacherId.toString() === req.user._id.toString()
    ) || (group.teacher && group.teacher.toString() === req.user._id.toString());

    if (req.user.role !== 'admin' && !isTeacherInGroup) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Ищем существующий чат
    let chat = await Chat.findOne({ group: groupId })
      .populate('participants', 'name username role')
      .populate('messages.sender', 'name username role');

    // Если чата нет, создаем новый
    if (!chat) {
      // Получаем всех админов
      const admins = await User.find({ role: 'admin' });
      const participants = [...group.teachers, ...admins.map(admin => admin._id)];
      
      // Убираем дубликаты
      const uniqueParticipants = [...new Set(participants.map(p => p.toString()))];

      chat = new Chat({
        group: groupId,
        participants: uniqueParticipants,
        messages: []
      });
      await chat.save();
      await chat.populate('participants', 'name username role');
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/chat/group/{groupId}/messages:
 *   post:
 *     summary: Отправить сообщение в чат группы
 *     tags: [Chat]
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
 *               content:
 *                 type: string
 *                 description: Содержание сообщения
 *     responses:
 *       201:
 *         description: Сообщение отправлено
 *       400:
 *         description: Ошибка валидации
 */
router.post('/group/:groupId/messages', [
  authenticateToken,
  body('content').notEmpty().withMessage('Message content is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { groupId } = req.params;
    const { content } = req.body;

    // Проверяем, что группа существует
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Проверяем права доступа
    const isTeacherInGroup = group.teachers.some(teacherId => 
      teacherId.toString() === req.user._id.toString()
    ) || (group.teacher && group.teacher.toString() === req.user._id.toString());

    if (req.user.role !== 'admin' && !isTeacherInGroup) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Ищем или создаем чат
    let chat = await Chat.findOne({ group: groupId });
    if (!chat) {
      const admins = await User.find({ role: 'admin' });
      const participants = [...group.teachers, ...admins.map(admin => admin._id)];
      const uniqueParticipants = [...new Set(participants.map(p => p.toString()))];

      chat = new Chat({
        group: groupId,
        participants: uniqueParticipants,
        messages: []
      });
    }

    // Добавляем сообщение
    const newMessage = {
      sender: req.user._id,
      content: content,
      timestamp: new Date(),
      isRead: false
    };

    chat.messages.push(newMessage);
    await chat.save();

    // Заполняем данные отправителя
    await chat.populate('messages.sender', 'name username role');
    
    // Возвращаем только последнее сообщение
    const lastMessage = chat.messages[chat.messages.length - 1];

    res.status(201).json(lastMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/chat/group/{groupId}/messages/{messageId}/read:
 *   put:
 *     summary: Отметить сообщение как прочитанное
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Сообщение отмечено как прочитанное
 *       404:
 *         description: Сообщение не найдено
 */
router.put('/group/:groupId/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { groupId, messageId } = req.params;

    const chat = await Chat.findOne({ group: groupId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.isRead = true;
    await chat.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/chat/my-chats:
 *   get:
 *     summary: Получить все чаты пользователя
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список чатов пользователя
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 */
router.get('/my-chats', authenticateToken, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'admin') {
      // Админ видит все чаты
      filter = {};
    } else if (req.user.role === 'teacher') {
      // Учитель видит только чаты своих групп
      filter = { participants: req.user._id };
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const chats = await Chat.find(filter)
      .populate('group', 'name room dayOfWeek time')
      .populate('participants', 'name username role')
      .populate({
        path: 'messages.sender',
        select: 'name username role'
      })
      .sort({ lastActivity: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 