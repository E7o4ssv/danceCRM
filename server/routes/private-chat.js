const express = require('express');
const { body, validationResult } = require('express-validator');
const PrivateChat = require('../models/PrivateChat');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/private-chat/chats:
 *   get:
 *     summary: Получить список приватных чатов пользователя
 *     tags: [PrivateChat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список чатов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   partner:
 *                     type: object
 *                   lastMessage:
 *                     type: object
 *                   unreadCount:
 *                     type: number
 */
router.get('/chats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Находим все чаты, где участвует текущий пользователь
    const chats = await PrivateChat.find({
      participants: userId,
      isActive: true
    })
    .populate('participants', 'name username role')
    .populate('messages.sender', 'name username role')
    .sort({ lastActivity: -1 });

    // Формируем ответ с партнером и последним сообщением
    const formattedChats = chats.map(chat => {
      const partner = chat.participants.find(p => p._id.toString() !== userId.toString());
      const lastMessage = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
      const unreadCount = chat.messages.filter(msg => 
        !msg.isRead && msg.sender._id.toString() !== userId.toString()
      ).length;

      return {
        _id: chat._id,
        partner,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          timestamp: lastMessage.timestamp,
          sender: lastMessage.sender._id.toString() === userId.toString() ? 'me' : 'partner'
        } : null,
        unreadCount
      };
    });

    res.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/private-chat/users:
 *   get:
 *     summary: Получить список пользователей для создания чата
 *     tags: [PrivateChat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 */
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Получаем всех пользователей кроме текущего
    const users = await User.find({
      _id: { $ne: userId },
      isActive: { $ne: false }
    })
    .select('name username role')
    .sort({ name: 1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/private-chat/chats/{partnerId}:
 *   get:
 *     summary: Получить чат с конкретным пользователем
 *     tags: [PrivateChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Чат с пользователем
 */
router.get('/chats/:partnerId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const partnerId = req.params.partnerId;

    // Проверяем, что партнер существует
    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Ищем существующий чат между пользователями
    let chat = await PrivateChat.findOne({
      participants: { $all: [userId, partnerId] },
      isActive: true
    })
    .populate('participants', 'name username role')
    .populate('messages.sender', 'name username role');

    // Если чата нет, создаем новый
    if (!chat) {
      chat = new PrivateChat({
        participants: [userId, partnerId],
        messages: []
      });
      await chat.save();
      await chat.populate('participants', 'name username role');
    }

    // Отмечаем сообщения как прочитанные
    await PrivateChat.updateMany(
      {
        _id: chat._id,
        'messages.sender': { $ne: userId },
        'messages.isRead': false
      },
      {
        $set: { 'messages.$[].isRead': true }
      }
    );

    // Формируем ответ
    const formattedChat = {
      _id: chat._id,
      partner,
      messages: chat.messages.map(msg => ({
        _id: msg._id,
        content: msg.content,
        timestamp: msg.timestamp,
        sender: {
          _id: msg.sender._id,
          name: msg.sender.name,
          isMe: msg.sender._id.toString() === userId.toString()
        }
      }))
    };

    res.json(formattedChat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /api/private-chat/chats/{partnerId}/messages:
 *   post:
 *     summary: Отправить сообщение в приватный чат
 *     tags: [PrivateChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
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
 */
router.post('/chats/:partnerId/messages', [
  authenticateToken,
  body('content').notEmpty().withMessage('Message content is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.user._id;
    const partnerId = req.params.partnerId;
    const { content } = req.body;

    // Проверяем, что партнер существует
    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Ищем или создаем чат
    let chat = await PrivateChat.findOne({
      participants: { $all: [userId, partnerId] },
      isActive: true
    });

    if (!chat) {
      chat = new PrivateChat({
        participants: [userId, partnerId],
        messages: []
      });
    }

    // Добавляем сообщение
    const newMessage = {
      sender: userId,
      content: content,
      timestamp: new Date(),
      isRead: false
    };

    chat.messages.push(newMessage);
    chat.lastActivity = new Date();
    await chat.save();

    // Заполняем данные отправителя
    await chat.populate('messages.sender', 'name username role');
    const savedMessage = chat.messages[chat.messages.length - 1];

    // Формируем ответ
    const formattedMessage = {
      _id: savedMessage._id,
      content: savedMessage.content,
      timestamp: savedMessage.timestamp,
      sender: {
        _id: savedMessage.sender._id,
        name: savedMessage.sender.name,
        isMe: true
      }
    };

    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 