import mongoose from 'mongoose';

export interface IUser {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  leetcodeUsername: string;
  telegramChatId?: string;
  alertTime: string;
  timezone: string;
  isActive: boolean;
  lastAlertSent: Date | null;
  alertFrequency: '1' | '5' | '15' | 'urgent';
  alertMethod: 'telegram';
  currentStreak: number;
  createdAt: Date;
}

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    index: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
  },
  passwordHash: {
    type: String,
  },
  passwordSalt: {
    type: String,
  },
  leetcodeUsername: {
    type: String,
    required: [true, 'LeetCode username is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  telegramChatId: {
    type: String,
    trim: true,
  },
  alertTime: {
    type: String,
    required: [true, 'Alert time is required'],
    default: '21:00',
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastAlertSent: {
    type: Date,
    default: null,
  },
  alertFrequency: {
    type: String,
    enum: ['1', '5', '15', 'urgent'],
    default: '1',
  },
  alertMethod: {
    type: String,
    enum: ['telegram'],
    default: 'telegram',
  },
  currentStreak: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
