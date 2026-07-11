import { Schema, model, Types } from 'mongoose';

export interface IConversation {
  user: Types.ObjectId;
  document?: Types.ObjectId;
  question: string;
  answer: string;
  timestamp: Date;
}

const conversationSchema = new Schema<IConversation>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Conversation user is required'],
  },
  document: {
    type: Schema.Types.ObjectId,
    ref: 'Document', // Optional if user is chatting across all files
  },
  question: {
    type: String,
    required: [true, 'Question is required'],
  },
  answer: {
    type: String,
    required: [true, 'AI response answer is required'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const Conversation = model<IConversation>('Conversation', conversationSchema);
