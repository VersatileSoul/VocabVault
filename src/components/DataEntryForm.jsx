import { useState, useEffect, useRef } from 'react'
import HindiInput from './HindiInput'

const FORM_CONFIGS = {
  ows: {
    fields: [
      { name: 'phrase', label: 'Phrase / Description', placeholder: 'e.g. A person who loves books', type: 'text' },
      { name: 'word', label: 'One Word', placeholder: 'e.g. Bibliophile', type: 'text' },
      { name: 'hindi', label: 'Hindi Meaning (हिंदी अर्थ)', placeholder: 'Type in English e.g. pustak premi → पुस्तक प्रेमी', type: 'hindi' },
    ],
  },
  idioms: {
    fields: [
      { name: 'idiom', label: 'Idiom / Phrase', placeholder: 'e.g. Break the ice', type: 'text' },
      { name: 'meaning', label: 'Meaning', placeholder: 'e.g. To initiate a conversation in a social setting', type: 'text' },
      { name: 'hindi', label: 'Hindi Meaning (हिंदी अर्थ)', placeholder: 'Type in English e.g. baat shuru karna → बात शुरू करना', type: 'hindi' },
    ],
  },
  syn_ant: {
    fields: [
      { name: 'word', label: 'Word', placeholder: 'e.g. Happy', type: 'text' },
      { name: 'meaning', label: 'Meaning (English)', placeholder: 'e.g. Feeling or showing pleasure', type: 'text' },
      { name: 'hindi', label: 'Hindi Meaning (हिंदी अर्थ)', placeholder: 'Type in English e.g. khush → खुश', type: 'hindi' },
      { name: 'synonyms', label: 'Synonyms (comma separated)', placeholder: 'e.g. Joyful, Elated, Cheerful, Delighted', type: 'text' },
      { name: 'antonyms', label: 'Antonyms (comma separated)', placeholder: 'e.g. Sad, Unhappy, Miserable, Gloomy', type: 'text' },
    ],
  },
}

function DataEntryForm({ category, onSubmit }) {
  const [formData, setFormData] = useState({})
  const [formKey, setFormKey] = useState(0) // to force HindiInput reset
  const firstInputRef = useRef(null)
  const config = FORM_CONFIGS[category]

  // Reset form when category changes
  useEffect(() => {
    setFormData({})
    setFormKey(prev => prev + 1)
    if (firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [category])

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate required fields
    const requiredFields = config.fields.filter(f => !f.optional)
    const allFilled = requiredFields.every(f => formData[f.name]?.trim())
    
    if (!allFilled) {
      return
    }

    // Clean up data - trim whitespace
    const cleanData = {}
    for (const [key, value] of Object.entries(formData)) {
      if (value && value.trim()) {
        cleanData[key] = value.trim()
      }
    }

    onSubmit(cleanData)
    setFormData({})
    setFormKey(prev => prev + 1) // reset HindiInput

    // Focus back on first input for quick consecutive entries
    if (firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      {config.fields.map((field, index) => (
        <div key={field.name} className="form-group">
          <label htmlFor={field.name}>
            {field.label}
            {field.optional && <span className="optional-tag">optional</span>}
          </label>
          {field.type === 'hindi' ? (
            <HindiInput
              key={formKey}
              id={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(val) => handleChange(field.name, val)}
              required={!field.optional}
            />
          ) : (
            <input
              ref={index === 0 ? firstInputRef : null}
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={!field.optional}
              autoComplete="off"
            />
          )}
        </div>
      ))}
      <button type="submit" className="submit-btn">
        ➕ Add Entry
      </button>
    </form>
  )
}

export default DataEntryForm
