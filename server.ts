import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini SDK with User-Agent header as required by skill
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Database file path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'bashar_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: string[];
}

interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: User[];
  chats: Chat[];
  messages: Message[];
  notes: Note[];
}

let db: DatabaseSchema = {
  users: [],
  chats: [],
  messages: [],
  notes: [],
};

// Load database from disk
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = JSON.parse(raw);
    if (!Array.isArray(db.users)) db.users = [];
    if (!Array.isArray(db.chats)) db.chats = [];
    if (!Array.isArray(db.messages)) db.messages = [];
    if (!Array.isArray(db.notes)) db.notes = [];
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }
} catch (err) {
  console.error('Error loading DB file, initializing empty db', err);
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB', err);
  }
}

// Password hashing helper using crypto
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const chosenSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, chosenSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: chosenSalt };
}

// Signed token generator
const JWT_SECRET = process.env.JWT_SECRET || 'bashar-ai-secret-key-2026-secure';

function createToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token?: string): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  if (expectedSig !== signature) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (data.exp && data.exp < Date.now()) return null;
    return data.userId;
  } catch {
    return null;
  }
}

const app = express();

// Enable CORS and OPTIONS Preflight
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// Strict Auth Middleware (For protected endpoints like /api/auth/me)
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'লগইন করুন বা সেশনটি যাচাই করুন (Unauthorized)' });
  }
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'ব্যবহারকারী পাওয়া যায়নি' });
  }
  (req as any).user = user;
  next();
}

// Optional Auth Middleware (For /api/ai/chat so guests can also ask questions)
function optionalAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const userId = verifyToken(token);
  if (userId) {
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      (req as any).user = user;
    }
  }
  next();
}

// ----------------- AUTH ROUTES ----------------- //

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'দয়া করে নাম, ইমেইল এবং পাসওয়ার্ড প্রদান করুন।' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'সঠিক ইমেইল ঠিকানা প্রদান করুন।' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
    }

    const existing = db.users.find((u) => u.email === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট খোলা হয়েছে।' });
    }

    const { hash, salt } = hashPassword(password);
    const newUser: User = {
      id: crypto.randomUUID(),
      name: cleanName,
      email: cleanEmail,
      passwordHash: hash,
      salt,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb();

    const token = createToken(newUser.id);
    return res.json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        bio: newUser.bio,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'নিবন্ধন সম্পন্ন করতে সমস্যা হয়েছে।' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'ইমেইল এবং পাসওয়ার্ড আবশ্যক।' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = db.users.find((u) => u.email === cleanEmail);
    if (!user) {
      return res.status(400).json({ error: 'ভুল ইমেইল বা পাসওয়ার্ড।' });
    }

    const { hash } = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) {
      return res.status(400).json({ error: 'ভুল ইমেইল বা পাসওয়ার্ড।' });
    }

    const token = createToken(user.id);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'লগইন করতে সমস্যা হয়েছে।' });
  }
});

// Get current user profile + stats
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const userChats = db.chats.filter((c) => c.userId === user.id);
  const userMessages = db.messages.filter((m) => m.userId === user.id);

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    },
    stats: {
      totalChats: userChats.length,
      totalMessages: userMessages.length,
    },
  });
});

// Update profile name, bio, avatar
app.put('/api/auth/profile', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user as User;
    const { name, bio, avatar } = req.body;

    if (name && typeof name === 'string') {
      user.name = name.trim();
    }
    if (bio !== undefined && typeof bio === 'string') {
      user.bio = bio.trim();
    }
    if (avatar && typeof avatar === 'string') {
      user.avatar = avatar;
    }

    user.updatedAt = new Date().toISOString();
    saveDb();

    return res.json({
      message: 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে।',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে।' });
  }
});

// Change Password
app.put('/api/auth/password', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user as User;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'বর্তমান ও নতুন উভয় পাসওয়ার্ড প্রদান করুন।' });
    }

    const { hash: currentHash } = hashPassword(currentPassword, user.salt);
    if (currentHash !== user.passwordHash) {
      return res.status(400).json({ error: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
    }

    const { hash: newHash, salt: newSalt } = hashPassword(newPassword);
    user.passwordHash = newHash;
    user.salt = newSalt;
    user.updatedAt = new Date().toISOString();
    saveDb();

    return res.json({ message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।' });
  } catch (err: any) {
    return res.status(500).json({ error: 'পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।' });
  }
});

// ----------------- CHAT & DATA SYNC ROUTES ----------------- //

// Get all chats for logged-in user
app.get('/api/chats', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const chats = db.chats
    .filter((c) => c.userId === user.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return res.json(chats);
});

// Create new chat
app.post('/api/chats', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { title } = req.body;

  const newChat: Chat = {
    id: crypto.randomUUID(),
    userId: user.id,
    title: (title && typeof title === 'string' && title.trim()) || 'নতুন কথোপকথন',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.chats.unshift(newChat);
  saveDb();

  return res.json(newChat);
});

// Get messages for a chat
app.get('/api/chats/:chatId/messages', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { chatId } = req.params;

  const chat = db.chats.find((c) => c.id === chatId && c.userId === user.id);
  if (!chat) {
    return res.status(404).json({ error: 'কথোপকথন পাওয়া যায়নি।' });
  }

  const messages = db.messages
    .filter((m) => m.chatId === chatId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return res.json(messages);
});

// Rename chat
app.put('/api/chats/:chatId/title', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { chatId } = req.params;
  const { title } = req.body;

  const chat = db.chats.find((c) => c.id === chatId && c.userId === user.id);
  if (!chat) {
    return res.status(404).json({ error: 'কথোপকথন পাওয়া যায়নি।' });
  }

  if (title && typeof title === 'string') {
    chat.title = title.trim();
    chat.updatedAt = new Date().toISOString();
    saveDb();
  }

  return res.json(chat);
});

// Delete chat
app.delete('/api/chats/:chatId', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { chatId } = req.params;

  db.chats = db.chats.filter((c) => !(c.id === chatId && c.userId === user.id));
  db.messages = db.messages.filter((m) => m.chatId !== chatId);
  saveDb();

  return res.json({ success: true, chatId, message: 'চ্যাট সফলভাবে মুছে ফেলা হয়েছে।' });
});

// Delete all chats
app.delete('/api/chats', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const userChatIds = new Set(db.chats.filter((c) => c.userId === user.id).map((c) => c.id));
  db.chats = db.chats.filter((c) => c.userId !== user.id);
  db.messages = db.messages.filter((m) => !userChatIds.has(m.chatId));
  saveDb();

  return res.json({ success: true, message: 'সমস্ত চ্যাট মুছে ফেলা হয়েছে।' });
});

// ----------------- NOTES MANAGEMENT ROUTES ----------------- //

// Get all notes for user
app.get('/api/notes', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const userNotes = (db.notes || [])
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return res.json(userNotes);
});

// Create note
app.post('/api/notes', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { title, content } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'নোটের শিরোনাম বা নাম আবশ্যক।' });
  }

  const newNote: Note = {
    id: crypto.randomUUID(),
    userId: user.id,
    title: title.trim(),
    content: (content && typeof content === 'string' ? content.trim() : ''),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!Array.isArray(db.notes)) db.notes = [];
  db.notes.unshift(newNote);
  saveDb();

  return res.json(newNote);
});

// Update note
app.put('/api/notes/:id', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;
  const { title, content } = req.body;

  if (!Array.isArray(db.notes)) db.notes = [];
  const note = db.notes.find((n) => n.id === id && n.userId === user.id);
  if (!note) {
    return res.status(404).json({ error: 'নোট পাওয়া যায়নি।' });
  }

  if (title && typeof title === 'string') {
    note.title = title.trim();
  }
  if (content !== undefined && typeof content === 'string') {
    note.content = content.trim();
  }
  note.updatedAt = new Date().toISOString();
  saveDb();

  return res.json(note);
});

// Delete note
app.delete('/api/notes/:id', authMiddleware, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;

  if (!Array.isArray(db.notes)) db.notes = [];
  db.notes = db.notes.filter((n) => !(n.id === id && n.userId === user.id));
  saveDb();

  return res.json({ success: true, message: 'নোট মুছে ফেলা হয়েছে।' });
});

// ----------------- REAL AI CHAT WITH GEMINI ----------------- //

// Note: optionalAuthMiddleware allows both logged-in users and guests to ask questions!
app.post('/api/ai/chat', optionalAuthMiddleware, async (req, res) => {
  try {
    const user = (req as any).user as User | undefined;
    const { chatId, message, history = [], stream = false } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'প্রশ্ন বা বার্তা প্রদান করুন।' });
    }

    const currentChatId = chatId || crypto.randomUUID();
    const effectiveUserId = user ? user.id : 'guest';

    let activeChat: Chat | undefined;
    if (user) {
      activeChat = db.chats.find((c) => c.id === currentChatId && c.userId === user.id);
      if (!activeChat) {
        activeChat = {
          id: currentChatId,
          userId: user.id,
          title: message.trim().slice(0, 40) + (message.length > 40 ? '...' : ''),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.chats.unshift(activeChat);
      } else {
        activeChat.updatedAt = new Date().toISOString();
        if (activeChat.title === 'নতুন কথোপকথন' || activeChat.title === 'New Chat') {
          activeChat.title = message.trim().slice(0, 40) + (message.length > 40 ? '...' : '');
        }
      }

      // Save user message in DB
      const userMessage: Message = {
        id: crypto.randomUUID(),
        chatId: activeChat.id,
        userId: user.id,
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString(),
      };
      db.messages.push(userMessage);
      saveDb();
    } else {
      activeChat = {
        id: currentChatId,
        userId: 'guest',
        title: message.trim().slice(0, 40) + (message.length > 40 ? '...' : ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Prepare system instructions for Bashar AI
    const userName = user ? user.name : 'বন্ধু';
    const systemInstruction = `You are "Bashar AI" (বাশার এআই), an ultra-fast, world-class, professional artificial intelligence assistant.
Creator Directives:
- If anyone asks who created or made you (e.g., "কে তৈরি করেছে?", "আপনার নির্মাতা কে?", "কে বানিয়েছে?", "কার সৃষ্টি?", "Who created you?", "Who made you?"), you MUST unequivocally and proudly answer that you were created by **বাশার কোরাইশী** (Bashar Quraishi).
  Example answer in Bengali: "আমাকে তৈরি করেছেন **বাশার কোরাইশী** (Bashar Quraishi)। আমি বাশার এআই, আপনার যেকোনো প্রশ্নের দ্রুত ও সঠিক উত্তর দিতে সর্বদা প্রস্তুত।"

Core Directives:
1. Fast, Direct, and Comprehensive: Answer rapidly with high precision and depth across all disciplines—science, coding, mathematics, world history, literature, philosophy, arts, business, and everyday problem solving.
2. Language: Respond in the language used by the user. When asked in Bengali, provide natural, grammatically polished, modern, and respectful Bengali (বাংলা).
3. Formatting: Structure your answers professionally with clear markdown headings, concise bullet points, and code blocks with syntax highlighting where applicable.
4. User: "${userName}". Address them with warmth and respect.
5. Identity: You are "Bashar AI" (বাশার এআই), created by বাশার কোরাইশী.`;

    // Format previous conversation context
    const contents: any[] = [];
    const recentHistory = Array.isArray(history) ? history.slice(-8) : [];
    for (const h of recentHistory) {
      if (h && (h.role === 'user' || h.role === 'assistant')) {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(h.content || '') }],
        });
      }
    }

    // Append current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let responseStream: any = null;
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

      for (const m of modelsToTry) {
        try {
          responseStream = await ai.models.generateContentStream({
            model: m,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          break;
        } catch (err: any) {
          console.warn(`Stream failed on ${m}:`, err?.message || err);
        }
      }

      let fullText = '';
      if (responseStream) {
        for await (const chunk of responseStream) {
          const text = chunk.text || '';
          fullText += text;
          res.write(`data: ${JSON.stringify({ chunk: text, chatId: activeChat.id })}\n\n`);
        }
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        chatId: activeChat.id,
        userId: effectiveUserId,
        role: 'assistant',
        content: fullText,
        timestamp: new Date().toISOString(),
      };

      if (user) {
        db.messages.push(assistantMessage);
        activeChat.updatedAt = new Date().toISOString();
        saveDb();
      }

      res.write(`data: ${JSON.stringify({ done: true, messageId: assistantMessage.id, chat: activeChat })}\n\n`);
      return res.end();
    } else {
      // Standard generateContent with fallback
      let replyText = '';
      let lastModelError: any = null;
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

      for (const m of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: m,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          if (response && response.text) {
            replyText = response.text;
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${m} failed:`, err?.message || err);
          lastModelError = err;
        }
      }

      if (!replyText) {
        if (lastModelError) {
          throw lastModelError;
        }
        replyText = 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি। অনুগ্রহ করে পুনরায় প্রশ্নটি করুন।';
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        chatId: activeChat.id,
        userId: effectiveUserId,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString(),
      };

      if (user) {
        db.messages.push(assistantMessage);
        activeChat.updatedAt = new Date().toISOString();
        saveDb();
      }

      return res.json({
        reply: replyText,
        message: assistantMessage,
        chat: activeChat,
        isGuest: !user,
      });
    }
  } catch (err: any) {
    console.error('Gemini AI chat error:', err);
    return res.status(500).json({
      error: 'এআই থেকে উত্তর পেতে সমস্যা হয়েছে: ' + (err.message || 'অজানা ত্রুটি'),
    });
  }
});

// Real-time synchronization check endpoint
app.get('/api/sync/status', optionalAuthMiddleware, (req, res) => {
  const user = (req as any).user as User | undefined;
  if (!user) {
    return res.json({
      syncedAt: new Date().toISOString(),
      chatsCount: 0,
      messagesCount: 0,
      isGuest: true,
    });
  }
  const userChats = db.chats.filter((c) => c.userId === user.id);
  const userMessages = db.messages.filter((m) => m.userId === user.id);
  return res.json({
    syncedAt: new Date().toISOString(),
    chatsCount: userChats.length,
    messagesCount: userMessages.length,
    lastUpdate: userChats[0]?.updatedAt || new Date().toISOString(),
    isGuest: false,
  });
});

// Catch-all for undefined /api routes so they NEVER fall through to Vite HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ----------------- VITE MIDDLEWARE / STATIC ASSETS ----------------- //

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bashar AI server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
