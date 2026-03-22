import mongoose from 'mongoose'

const synAntSchema = new mongoose.Schema({
  word: { type: String, required: true },
  meaning: { type: String, required: true },
  hindi: { type: String, default: '' },
  synonyms: { type: String, default: '' },
  antonyms: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('SynAnt', synAntSchema)
