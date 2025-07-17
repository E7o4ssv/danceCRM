const mongoose = require('mongoose');

const individualLessonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }],
    validate: {
      validator: function(students) {
        return students.length >= 0 && students.length <= 2;
      },
      message: 'Индивидуальные занятия могут иметь максимум 2 учеников'
    }
  },
  schedule: [{
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    time: {
      type: String,
      required: true,
      trim: true
    }
  }],
  room: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  duration: {
    type: Number,
    default: 60, // в минутах
    min: 30,
    max: 180
  },
  price: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    trim: true
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

module.exports = mongoose.model('IndividualLesson', individualLessonSchema); 