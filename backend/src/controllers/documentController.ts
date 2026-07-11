import { Response } from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import { Document } from '../models/Document';
import { AuthRequest } from '../middleware/auth';

// Configure multer with memory storage and size limits (max 10MB)
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(pdf|txt|md)$/i;
    const allowedMimeTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    
    const isExtensionAllowed = allowedExtensions.test(file.originalname);
    const isMimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);

    if (isExtensionAllowed && isMimeTypeAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only PDF, TXT, and Markdown (MD) files are allowed.'));
    }
  }
});

// Upload and Parse Document
export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. User context missing.' });
    }

    const { originalname, size, buffer, mimetype } = req.file;
    let extractedText = '';
    let pageCount = 1;

    // Detect type based on originalname extension
    const extension = originalname.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      try {
        const pdfData = await pdf(buffer);
        extractedText = pdfData.text;
        pageCount = pdfData.numpages || 1;
      } catch (err: any) {
        console.error('PDF extraction error:', err);
        return res.status(422).json({ message: 'Failed to extract text from the PDF file. It might be corrupted or encrypted.' });
      }
    } else {
      // For TXT and MD, read buffer directly as UTF-8 string
      extractedText = buffer.toString('utf-8');
    }

    // Clean and validate extracted text
    const trimmedText = extractedText.trim();
    if (!trimmedText) {
      return res.status(422).json({ message: 'The uploaded file appears to have no readable text content.' });
    }

    // Approximate word count
    const wordCount = trimmedText.split(/\s+/).filter(Boolean).length;

    // Save to Database
    const newDoc = new Document({
      name: originalname,
      type: extension === 'pdf' ? 'pdf' : extension === 'md' ? 'md' : 'txt',
      size,
      owner: req.user.id,
      textContent: trimmedText,
      metadata: {
        pageCount,
        wordCount,
        encoding: 'UTF-8'
      }
    });

    await newDoc.save();

    return res.status(201).json({
      message: 'Document uploaded and parsed successfully.',
      document: {
        id: newDoc._id,
        name: newDoc.name,
        type: newDoc.type,
        size: newDoc.size,
        uploadTimestamp: newDoc.uploadTimestamp,
        metadata: newDoc.metadata
      }
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return res.status(500).json({ message: 'Server error during document upload.', error: error.message });
  }
};

// Retrieve user's documents with search & filter
export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const { search, type } = req.query;
    const query: any = { owner: req.user.id };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (type && ['pdf', 'txt', 'md'].includes(type as string)) {
      query.type = type;
    }

    const documents = await Document.find(query)
      .select('-textContent') // Exclude raw text contents for list performance
      .sort({ uploadTimestamp: -1 });

    return res.status(200).json(documents);
  } catch (error: any) {
    console.error('Get documents error:', error);
    return res.status(500).json({ message: 'Failed to retrieve documents.', error: error.message });
  }
};

// Preview Document (retrieves text content)
export const previewDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const docId = req.params.id;
    const document = await Document.findOne({ _id: docId, owner: req.user.id });

    if (!document) {
      return res.status(404).json({ message: 'Document not found or access denied.' });
    }

    return res.status(200).json({
      id: document._id,
      name: document.name,
      type: document.type,
      textContent: document.textContent,
      metadata: document.metadata
    });
  } catch (error: any) {
    console.error('Preview document error:', error);
    return res.status(500).json({ message: 'Failed to preview document.', error: error.message });
  }
};

// Delete Document
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const docId = req.params.id;
    const result = await Document.deleteOne({ _id: docId, owner: req.user.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Document not found or access denied.' });
    }

    return res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (error: any) {
    console.error('Delete document error:', error);
    return res.status(500).json({ message: 'Failed to delete document.', error: error.message });
  }
};
