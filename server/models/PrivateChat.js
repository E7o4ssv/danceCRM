const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

const privateChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  messages: [messageSchema],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Индекс для быстрого поиска чатов по участникам
privateChatSchema.index({ participants: 1 });

// Метод для получения партнера чата для конкретного пользователя
privateChatSchema.methods.getPartner = function(userId) {
  return this.participants.find(participant => 
    participant.toString() !== userId.toString()
  );
};

module.exports = mongoose.model('PrivateChat', privateChatSchema); 