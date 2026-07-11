import { Schema, model, Types } from 'mongoose';

export interface IDocument {
  name: string;
  type: string;
  size: number;
  owner: Types.ObjectId;
  textContent: string;
  uploadTimestamp: Date;
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    encoding?: string;
  };
}

const documentSchema = new Schema<IDocument>({
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Document type is required'],
    enum: ['pdf', 'txt', 'md'],
  },
  size: {
    type: Number,
    required: [true, 'Document size is required'],
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Document owner is required'],
  },
  textContent: {
    type: String,
    required: [true, 'Document content is required'],
  },
  uploadTimestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    pageCount: Number,
    wordCount: Number,
    encoding: String,
  },
});

export const Document = model<IDocument>('Document', documentSchema);
