// Migration script: Import existing JSON data into MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ows from './models/Ows.js';
import Idiom from './models/Idiom.js';
import SynAnt from './models/SynAnt.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Migrate OWS
    const owsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'ows.json'), 'utf-8'));
    if (owsData.length > 0) {
      await Ows.deleteMany({}); // Clear existing
      const owsDocs = owsData.map(e => ({
        phrase: e.phrase,
        word: e.word,
        hindi: e.hindi || '',
        createdAt: e.createdAt || new Date(),
      }));
      await Ows.insertMany(owsDocs);
      console.log(`📝 Migrated ${owsDocs.length} OWS entries`);
    }

    // Migrate Idioms
    const idiomsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'idioms.json'), 'utf-8'));
    if (idiomsData.length > 0) {
      await Idiom.deleteMany({});
      const idiomDocs = idiomsData.map(e => ({
        idiom: e.idiom,
        meaning: e.meaning,
        hindi: e.hindi || '',
        createdAt: e.createdAt || new Date(),
      }));
      await Idiom.insertMany(idiomDocs);
      console.log(`📝 Migrated ${idiomDocs.length} Idiom entries`);
    }

    // Migrate Syn/Ant
    const synAntData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'syn_ant.json'), 'utf-8'));
    if (synAntData.length > 0) {
      await SynAnt.deleteMany({});
      const synAntDocs = synAntData.map(e => ({
        word: e.word,
        meaning: e.meaning,
        hindi: e.hindi || '',
        synonyms: e.synonyms || '',
        antonyms: e.antonyms || '',
        createdAt: e.createdAt || new Date(),
      }));
      await SynAnt.insertMany(synAntDocs);
      console.log(`📝 Migrated ${synAntDocs.length} Syn/Ant entries`);
    }

    console.log('\n🎉 Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
