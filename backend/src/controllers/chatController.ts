import { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document } from '../models/Document';
import { Conversation } from '../models/Conversation';
import { AuthRequest } from '../middleware/auth';

// Ask Question Controller
export const askQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { documentId, question } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ message: 'Question text is required.' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized. User context missing.' });
    }

    let contextText = '';
    let selectedDocName = 'All Documents';
    let targetDocId: string | undefined = undefined;

    if (documentId) {
      // Query specific document
      const doc = await Document.findOne({ _id: documentId, owner: req.user.id });
      if (!doc) {
        return res.status(404).json({ message: 'Selected document not found or access denied.' });
      }
      contextText = doc.textContent;
      selectedDocName = doc.name;
      targetDocId = doc._id.toString();
    } else {
      // Query all documents of the user
      const docs = await Document.find({ owner: req.user.id });
      if (docs.length === 0) {
        return res.status(400).json({ message: 'You must upload at least one document before asking a question.' });
      }
      
      // Combine contents up to ~500k characters to prevent any model slowdowns
      let combinedText = '';
      for (const doc of docs) {
        if (combinedText.length + doc.textContent.length > 500000) {
          break;
        }
        combinedText += `\n--- START DOCUMENT: ${doc.name} ---\n${doc.textContent}\n--- END DOCUMENT ---\n`;
      }
      contextText = combinedText;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let answer = '';
    let isDemoMode = false;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Fail-soft: Run in Demo Mode if API Key is not configured
      isDemoMode = true;
      const wordCount = contextText.split(/\s+/).filter(Boolean).length;
      answer = `### ⚠️ Demo Mode Active (No API Key Configured)\n\nTo unlock real AI responses, please add your **Gemini API Key** in \`backend/.env\` (\`GEMINI_API_KEY=...\`).\n\n---\n\n**Simulation Answer**:\nI parsed your context from **${selectedDocName}** (approx. ${wordCount} words).\n\nBased on a simulated reading of the file, you asked: *"${question}"*\n\nHere is a guide on how this app works:\n1. The server extracts the text from your uploaded PDFs, TXT, or MD files.\n2. When you ask a question, the server queries the database, extracts the relevant context, and sends a prompt to Gemini.\n3. The response is rendered using Markdown (supporting lists, **bold text**, \`code\`, and tables).`;
    } else {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-1.5-flash for super-fast speed and large context sizes
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are a professional, helpful, and highly intelligent AI Knowledge Base Assistant.
You have access to the text contents of the user's uploaded document(s) below.
Your task is to answer the user's question accurately, based ONLY on the text content provided.
If the answer cannot be found in the provided context, politely explain that you cannot find it based on the available files.
Always explain your reasoning clearly and format your response beautifully using markdown (headings, bold, lists, code blocks, or tables where appropriate).

--- CONTEXT DOCUMENT CONTENT ---
${contextText}
-------------------------------

User Question: ${question}

Provide your structured markdown answer below:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        answer = response.text();
      } catch (err: any) {
        console.error('Gemini API call failure:', err);
        return res.status(502).json({
          message: 'Failed to communicate with the Gemini AI service. Please verify your API key and connection.',
          error: err.message
        });
      }
    }

    // Save conversation log
    const conversation = new Conversation({
      user: req.user.id,
      document: targetDocId,
      question,
      answer,
      timestamp: new Date()
    });

    await conversation.save();

    return res.status(200).json({
      message: 'Question answered successfully.',
      isDemoMode,
      conversation: {
        id: conversation._id,
        documentId: targetDocId,
        documentName: selectedDocName,
        question: conversation.question,
        answer: conversation.answer,
        timestamp: conversation.timestamp
      }
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ message: 'Server error during question processing.', error: error.message });
  }
};

// Get Chat History with search & filters
export const getChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const { search, documentId } = req.query;
    const query: any = { user: req.user.id };

    if (documentId) {
      query.document = documentId;
    }

    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } }
      ];
    }

    const history = await Conversation.find(query)
      .populate('document', 'name type')
      .sort({ timestamp: -1 });

    const formattedHistory = history.map(item => ({
      id: item._id,
      documentId: item.document?._id || null,
      documentName: (item.document as any)?.name || 'All Documents',
      question: item.question,
      answer: item.answer,
      timestamp: item.timestamp
    }));

    return res.status(200).json(formattedHistory);
  } catch (error: any) {
    console.error('Get history error:', error);
    return res.status(500).json({ message: 'Failed to retrieve chat history.', error: error.message });
  }
};
