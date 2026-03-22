import { useState, useRef, useEffect } from 'react'

function HindiInput({ value, onChange, placeholder, id, required, initialHindi }) {
  const [englishText, setEnglishText] = useState('')   // what user types
  const [hindiText, setHindiText] = useState('')         // converted Hindi
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeWordIndex, setActiveWordIndex] = useState(-1)
  const [isConverting, setIsConverting] = useState(false)
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const initializedRef = useRef(false)

  // Initialize with existing Hindi text when editing (only once on mount)
  useEffect(() => {
    if (initialHindi && !initializedRef.current) {
      setHindiText(initialHindi)
      setEnglishText('')
      initializedRef.current = true
    }
  }, [initialHindi])

  // Sync external value reset (e.g. form clear)
  useEffect(() => {
    if (!value) {
      setEnglishText('')
      setHindiText('')
      setSuggestions([])
    }
  }, [value])

  // Transliterate a word via our backend proxy
  const transliterateWord = async (word) => {
    if (!word.trim()) return { result: '', suggestions: [] }
    try {
      const res = await fetch(`/api/transliterate?text=${encodeURIComponent(word)}`)
      const data = await res.json()
      return data
    } catch {
      return { result: word, suggestions: [] }
    }
  }

  const handleInputChange = async (e) => {
    const typed = e.target.value
    setEnglishText(typed)

    if (!typed.trim()) {
      setHindiText('')
      setSuggestions([])
      setShowSuggestions(false)
      onChange('')
      return
    }

    // Split into words - transliterate each completed word + current word
    const words = typed.split(' ')
    const currentWord = words[words.length - 1]

    // If user just pressed space (completed a word), convert everything
    if (typed.endsWith(' ')) {
      setIsConverting(true)
      const allWords = typed.trim().split(/\s+/)
      const hindiWords = []
      for (const w of allWords) {
        const result = await transliterateWord(w)
        hindiWords.push(result.result)
      }
      const fullHindi = hindiWords.join(' ') + ' '
      setHindiText(fullHindi)
      onChange(fullHindi.trim())
      setSuggestions([])
      setShowSuggestions(false)
      setIsConverting(false)
    } else if (currentWord.length >= 1) {
      // Show suggestions for current word being typed
      setIsConverting(true)
      const result = await transliterateWord(currentWord)

      // Build full hindi: previously completed words + current word suggestion
      const completedWords = words.slice(0, -1)
      if (completedWords.length > 0) {
        const hindiCompleted = []
        for (const w of completedWords) {
          const r = await transliterateWord(w)
          hindiCompleted.push(r.result)
        }
        const preview = hindiCompleted.join(' ') + ' ' + result.result
        setHindiText(preview)
        onChange(preview)
      } else {
        setHindiText(result.result)
        onChange(result.result)
      }

      if (result.suggestions && result.suggestions.length > 1) {
        setSuggestions(result.suggestions)
        setActiveWordIndex(0)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
      setIsConverting(false)
    }
  }

  // Pick a suggestion
  const pickSuggestion = async (suggestion) => {
    const words = englishText.split(' ')
    const completedWords = words.slice(0, -1)

    if (completedWords.length > 0) {
      const hindiCompleted = []
      for (const w of completedWords) {
        const r = await transliterateWord(w)
        hindiCompleted.push(r.result)
      }
      const fullHindi = hindiCompleted.join(' ') + ' ' + suggestion
      setHindiText(fullHindi)
      onChange(fullHindi)
    } else {
      setHindiText(suggestion)
      onChange(suggestion)
    }

    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  // Handle keyboard nav in suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveWordIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveWordIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && showSuggestions) {
      e.preventDefault()
      if (activeWordIndex >= 0 && activeWordIndex < suggestions.length) {
        pickSuggestion(suggestions[activeWordIndex])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="hindi-input-wrapper">
      <input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        value={englishText}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        required={required}
        autoComplete="off"
        className="hindi-english-input"
      />

      {/* Hindi preview */}
      {hindiText && (
        <div className="hindi-preview">
          <span className="hindi-preview-label">हिंदी:</span>
          <span className="hindi-preview-text">{hindiText}</span>
          {isConverting && <span className="hindi-loading">...</span>}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 1 && (
        <div className="hindi-suggestions" ref={suggestionsRef}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              className={`hindi-suggestion ${i === activeWordIndex ? 'active' : ''}`}
              onClick={() => pickSuggestion(s)}
              type="button"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default HindiInput
