import mongoose from 'mongoose'

const idiomSchema = new mongoose.Schema({
  idiom: { type: String, required: true },
  meaning: { type: String, required: true },
  hindi: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('Idiom', idiomSchema)
