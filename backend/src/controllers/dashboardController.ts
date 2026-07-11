import { Response } from 'express';
import { Document } from '../models/Document';
import { Conversation } from '../models/Conversation';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const userId = req.user.id;

    // 1. Total Documents Count
    const totalDocuments = await Document.countDocuments({ owner: userId });

    // 2. Total Questions Asked Count
    const totalQuestions = await Conversation.countDocuments({ user: userId });

    // 3. Recent Uploads (limit 5)
    const recentUploads = await Document.find({ owner: userId })
      .select('name type size uploadTimestamp metadata')
      .sort({ uploadTimestamp: -1 })
      .limit(5);

    // 4. File Type Breakdown (Count of pdf, txt, md)
    const pdfCount = await Document.countDocuments({ owner: userId, type: 'pdf' });
    const txtCount = await Document.countDocuments({ owner: userId, type: 'txt' });
    const mdCount = await Document.countDocuments({ owner: userId, type: 'md' });

    // 5. Aggregate Size & Word Count
    const docs = await Document.find({ owner: userId }).select('size metadata.wordCount');
    let totalSize = 0;
    let totalWords = 0;

    docs.forEach(doc => {
      totalSize += doc.size || 0;
      totalWords += doc.metadata?.wordCount || 0;
    });

    // 6. Recent Chat Activity (limit 3)
    const recentChats = await Conversation.find({ user: userId })
      .populate('document', 'name')
      .sort({ timestamp: -1 })
      .limit(3);

    const formattedRecentChats = recentChats.map(chat => ({
      id: chat._id,
      question: chat.question,
      timestamp: chat.timestamp,
      documentName: (chat.document as any)?.name || 'All Documents'
    }));

    return res.status(200).json({
      totalDocuments,
      totalQuestions,
      totalSize,
      totalWords,
      typeDistribution: {
        pdf: pdfCount,
        txt: txtCount,
        md: mdCount
      },
      recentUploads: recentUploads.map(doc => ({
        id: doc._id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        uploadTimestamp: doc.uploadTimestamp,
        pageCount: doc.metadata?.pageCount || 1,
        wordCount: doc.metadata?.wordCount || 0
      })),
      recentConversations: formattedRecentChats
    });
  } catch (error: any) {
    console.error('Dashboard statistics fetch error:', error);
    return res.status(500).json({ message: 'Failed to retrieve dashboard statistics.', error: error.message });
  }
};
