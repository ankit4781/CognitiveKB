import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import multer from 'multer';

// Controllers
import { signup, login } from './controllers/authController';
import { authenticateToken } from './middleware/auth';
import { upload, uploadDocument, getDocuments, previewDocument, deleteDocument } from './controllers/documentController';
import { askQuestion, getChatHistory } from './controllers/chatController';
import { getDashboardStats } from './controllers/dashboardController';

// Load Environment Variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // For development flexibility; restrict in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes Setup
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);

app.get('/api/documents', authenticateToken as any, getDocuments as any);
app.post('/api/documents', authenticateToken as any, upload.single('file'), uploadDocument as any);
app.get('/api/documents/:id', authenticateToken as any, previewDocument as any);
app.delete('/api/documents/:id', authenticateToken as any, deleteDocument as any);

app.post('/api/ask', authenticateToken as any, askQuestion as any);
app.get('/api/history', authenticateToken as any, getChatHistory as any);
app.get('/api/dashboard', authenticateToken as any, getDashboardStats as any);

// Base Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Custom Error Handler for Multer Upload Errors and general exceptions
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err.message && err.message.includes('Unsupported file type')) {
    return res.status(400).json({ message: err.message });
  }
  console.error('Unhandled Server Error:', err);
  return res.status(500).json({ message: 'An internal server error occurred.', error: err.message });
});

// MongoDB Connection Handler
let mongoServer: MongoMemoryServer | null = null;

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (mongoUri) {
      console.log('Connecting to configured MongoDB database...');
      await mongoose.connect(mongoUri);
      console.log('MongoDB connection established successfully.');
    } else {
      console.log('No MONGODB_URI found. Launching in-memory MongoDB database server...');
      mongoServer = await MongoMemoryServer.create();
      const tempUri = mongoServer.getUri();
      await mongoose.connect(tempUri);
      console.log(`In-memory MongoDB online at: ${tempUri}`);
    }

    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`===================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful exit handler
const gracefulShutdown = async () => {
  console.log('\nShutting down server gracefully...');
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    console.log('In-memory MongoDB database server stopped.');
  }
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

startServer();
