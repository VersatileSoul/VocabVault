import mongoose from 'mongoose'

const owsSchema = new mongoose.Schema({
  phrase: { type: String, required: true },
  word: { type: String, required: true },
  hindi: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('Ows', owsSchema)
