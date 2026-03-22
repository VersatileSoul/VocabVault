import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ows from './models/Ows.js';
import Idiom from './models/Idiom.js';
import SynAnt from './models/SynAnt.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// MongoDB model map
const MODELS = {
  ows: Ows,
  idioms: Idiom,
  syn_ant: SynAnt,
};

const VALID_CATEGORIES = Object.keys(MODELS);

// Middleware: validate category
function validateCategory(req, res, next) {
  const { category } = req.params;
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  req.model = MODELS[category];
  next();
}

// Middleware: require admin auth (protects POST, PUT, DELETE)
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ===== AUTH ROUTES =====

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  if (username !== process.env.ADMIN_USERNAME) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const isMatch = bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username, role: 'admin' });
});

// GET /api/auth/verify - Check if token is still valid
app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ valid: true, username: req.user.username, role: req.user.role });
});

// ===== PUBLIC ROUTES (no auth needed) =====

// GET /api/transliterate
app.get('/api/transliterate', async (req, res) => {
  const { text } = req.query;
  if (!text) {
    return res.json({ result: '', suggestions: [] });
  }
  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=hi-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
      res.json({ result: data[1][0][1][0], suggestions: data[1][0][1] });
    } else {
      res.json({ result: text, suggestions: [] });
    }
  } catch (err) {
    console.error('Transliteration error:', err);
    res.json({ result: text, suggestions: [] });
  }
});

// GET /api/all/stats
app.get('/api/all/stats', async (req, res) => {
  try {
    const stats = {};
    for (const [category, Model] of Object.entries(MODELS)) {
      const total = await Model.countDocuments();
      stats[category] = { total };
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read stats' });
  }
});

// GET /api/:category - Public: anyone can view
app.get('/api/:category', validateCategory, async (req, res) => {
  try {
    const entries = await req.model.find().sort({ createdAt: 1 });
    const data = entries.map(e => {
      const obj = e.toObject();
      obj.id = obj._id.toString();
      delete obj._id;
      delete obj.__v;
      return obj;
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// ===== PROTECTED ROUTES (admin only) =====

// POST /api/:category - Admin only: add entry
app.post('/api/:category', requireAuth, validateCategory, async (req, res) => {
  try {
    const entry = await req.model.create(req.body);
    const obj = entry.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;
    res.status(201).json(obj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save entry' });
  }
});

// DELETE /api/:category/:id - Admin only: delete entry
app.delete('/api/:category/:id', requireAuth, validateCategory, async (req, res) => {
  try {
    const result = await req.model.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// PUT /api/:category/:id - Admin only: update entry
app.put('/api/:category/:id', requireAuth, validateCategory, async (req, res) => {
  try {
    const entry = await req.model.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    const obj = entry.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// ===== SERVE FRONTEND IN PRODUCTION =====
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`📚 VocabVault server running on http://localhost:${PORT}`);
});
