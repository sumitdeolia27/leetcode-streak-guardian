import mongoose from 'mongoose';

export interface IDailyQuestion {
  _id: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  url?: string;
  topic?: string;
  slug?: string;
  targetDate: string;
  completed: boolean;
  createdAt: Date;
}

const DailyQuestionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    trim: true,
  },
  topic: {
    type: String,
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    index: true,
  },
  targetDate: {
    type: String,
    required: true,
    index: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.DailyQuestion ||
  mongoose.model('DailyQuestion', DailyQuestionSchema);
