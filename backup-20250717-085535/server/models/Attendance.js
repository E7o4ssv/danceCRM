const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    present: {
      type: Boolean,
      default: false
    },
    note: {
      type: String,
      trim: true
    }
  }],
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate attendance records
attendanceSchema.index({ group: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema); 