const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Оставляем teacher для обратной совместимости
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  room: {
    type: String,
    required: true,
    trim: true
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  time: {
    type: String,
    required: true,
    trim: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Автоматически добавляем основного учителя в массив teachers
groupSchema.pre('save', function(next) {
  if (this.teacher && (!this.teachers || !this.teachers.includes(this.teacher))) {
    if (!this.teachers) this.teachers = [];
    this.teachers.push(this.teacher);
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema); 