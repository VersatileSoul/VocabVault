import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());

// Valid categories
const VALID_CATEGORIES = ['ows', 'idioms', 'syn_ant'];

// Helper: read JSON file
function readData(category) {
  const filePath = path.join(DATA_DIR, `${category}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

// Helper: write JSON file
function writeData(category, data) {
  const filePath = path.join(DATA_DIR, `${category}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Middleware: validate category
function validateCategory(req, res, next) {
  const { category } = req.params;
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }
  next();
}

// GET /api/transliterate - Convert English text to Hindi (MUST be before /:category routes)
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

// GET /api/all/stats - Get stats for all categories (MUST be before /:category routes)
app.get('/api/all/stats', (req, res) => {
  try {
    const stats = {};
    for (const category of VALID_CATEGORIES) {
      const data = readData(category);
      stats[category] = { total: data.length };
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read stats' });
  }
});

// GET /api/:category - Get all entries for a category
app.get('/api/:category', validateCategory, (req, res) => {
  try {
    const data = readData(req.params.category);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// POST /api/:category - Add a new entry
app.post('/api/:category', validateCategory, (req, res) => {
  try {
    const data = readData(req.params.category);
    const newEntry = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    data.push(newEntry);
    writeData(req.params.category, data);
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save entry' });
  }
});

// DELETE /api/:category/:id - Delete an entry
app.delete('/api/:category/:id', validateCategory, (req, res) => {
  try {
    let data = readData(req.params.category);
    const index = data.findIndex(item => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    data.splice(index, 1);
    writeData(req.params.category, data);
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// PUT /api/:category/:id - Update an entry
app.put('/api/:category/:id', validateCategory, (req, res) => {
  try {
    let data = readData(req.params.category);
    const index = data.findIndex(item => item.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    data[index] = { ...data[index], ...req.body, updatedAt: new Date().toISOString() };
    writeData(req.params.category, data);
    res.json(data[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

app.listen(PORT, () => {
  console.log(`📚 VocabVault server running on http://localhost:${PORT}`);
});
