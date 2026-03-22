import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const QUIZ_MODES = [
  { key: 'ows', label: 'One Word Substitution', icon: '🔤', desc: 'Guess the word from its meaning' },
  { key: 'idioms', label: 'Idioms & Phrases', icon: '💬', desc: 'Identify the correct meaning' },
  { key: 'syn_ant', label: 'Synonyms & Antonyms', icon: '🔁', desc: 'Find the synonym or antonym' },
  { key: 'mix', label: 'Mixed Quiz', icon: '🎲', desc: 'Random questions from all categories' },
]

const QUESTIONS_PER_QUIZ = 10

// Utility: shuffle array
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Pick n random items from array (excluding specific indices)
function pickRandom(arr, n, excludeIndices = []) {
  const available = arr.filter((_, i) => !excludeIndices.includes(i))
  return shuffle(available).slice(0, n)
}

// Generate OWS questions
function generateOwsQuestions(data, count) {
  if (data.length < 4) return []
  const selected = shuffle(data).slice(0, count)
  return selected.map((entry, _, selectedArr) => {
    const correctAnswer = entry.word
    const wrongPool = data.filter(e => e.id !== entry.id)
    const wrongAnswers = pickRandom(wrongPool, 3).map(e => e.word)
    return {
      category: 'ows',
      categoryLabel: '🔤 One Word Substitution',
      question: entry.phrase,
      questionLabel: 'What is the one word for:',
      correctAnswer,
      options: shuffle([correctAnswer, ...wrongAnswers]),
      hindi: entry.hindi,
    }
  })
}

// Generate Idiom questions
function generateIdiomQuestions(data, count) {
  if (data.length < 4) return []
  const selected = shuffle(data).slice(0, count)
  return selected.map(entry => {
    const correctAnswer = entry.meaning
    const wrongPool = data.filter(e => e.id !== entry.id)
    const wrongAnswers = pickRandom(wrongPool, 3).map(e => e.meaning)
    return {
      category: 'idioms',
      categoryLabel: '💬 Idioms & Phrases',
      question: entry.idiom,
      questionLabel: 'What does this idiom mean?',
      correctAnswer,
      options: shuffle([correctAnswer, ...wrongAnswers]),
      hindi: entry.hindi,
    }
  })
}

// Generate Synonym/Antonym questions
function generateSynAntQuestions(data, count) {
  if (data.length < 4) return []
  const selected = shuffle(data).slice(0, count)
  return selected.map(entry => {
    // Randomly decide synonym or antonym question
    const hasSynonyms = entry.synonyms && entry.synonyms.trim()
    const hasAntonyms = entry.antonyms && entry.antonyms.trim()

    let askSynonym
    if (hasSynonyms && hasAntonyms) {
      askSynonym = Math.random() > 0.5
    } else if (hasSynonyms) {
      askSynonym = true
    } else if (hasAntonyms) {
      askSynonym = false
    } else {
      askSynonym = true // fallback
    }

    // Parse comma-separated values and pick one as correct
    const sourceField = askSynonym ? entry.synonyms : entry.antonyms
    const oppositeField = askSynonym ? entry.antonyms : entry.synonyms
    const words = (sourceField || '').split(',').map(w => w.trim()).filter(Boolean)
    const correctAnswer = words.length > 0 ? words[Math.floor(Math.random() * words.length)] : entry.word

    // Wrong options: pick words from OTHER entries' synonym/antonym lists
    const wrongPool = data.filter(e => e.id !== entry.id)
    const allWrongWords = []
    wrongPool.forEach(e => {
      const syns = (e.synonyms || '').split(',').map(w => w.trim()).filter(Boolean)
      const ants = (e.antonyms || '').split(',').map(w => w.trim()).filter(Boolean)
      allWrongWords.push(...syns, ...ants)
    })
    // Filter out the correct answer and any that match
    const filteredWrong = [...new Set(allWrongWords)].filter(
      w => w.toLowerCase() !== correctAnswer.toLowerCase()
    )
    const wrongAnswers = shuffle(filteredWrong).slice(0, 3)

    return {
      category: 'syn_ant',
      categoryLabel: '🔁 Synonyms & Antonyms',
      question: entry.word,
      questionLabel: askSynonym
        ? 'Which is a SYNONYM of:'
        : 'Which is an ANTONYM of:',
      questionType: askSynonym ? 'synonym' : 'antonym',
      correctAnswer,
      options: shuffle([correctAnswer, ...wrongAnswers]),
      hindi: entry.hindi,
      meaning: entry.meaning,
    }
  })
}

function Quiz() {
  const [mode, setMode] = useState(null)        // null = selection screen
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState([])     // track all answers for review
  const [quizDone, setQuizDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dataCounts, setDataCounts] = useState({})

  // Fetch counts for each category on mount
  useEffect(() => {
    fetchCounts()
  }, [])

  const fetchCounts = async () => {
    try {
      const res = await fetch('/api/all/stats')
      const data = await res.json()
      setDataCounts(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const startQuiz = async (selectedMode) => {
    setLoading(true)
    setError(null)
    try {
      let allQuestions = []

      if (selectedMode === 'mix') {
        // Fetch all categories and mix
        const [owsRes, idiomsRes, synAntRes] = await Promise.all([
          fetch('/api/ows'),
          fetch('/api/idioms'),
          fetch('/api/syn_ant'),
        ])
        const [owsData, idiomsData, synAntData] = await Promise.all([
          owsRes.json(),
          idiomsRes.json(),
          synAntRes.json(),
        ])

        // Calculate how many from each based on available data
        const owsQ = generateOwsQuestions(owsData, QUESTIONS_PER_QUIZ)
        const idiomsQ = generateIdiomQuestions(idiomsData, QUESTIONS_PER_QUIZ)
        const synAntQ = generateSynAntQuestions(synAntData, QUESTIONS_PER_QUIZ)
        const pool = [...owsQ, ...idiomsQ, ...synAntQ]

        if (pool.length < QUESTIONS_PER_QUIZ) {
          setError(`Not enough data to generate a quiz. Add more entries first.`)
          setLoading(false)
          return
        }

        allQuestions = shuffle(pool).slice(0, QUESTIONS_PER_QUIZ)
      } else {
        // Single category
        const res = await fetch(`/api/${selectedMode}`)
        const data = await res.json()

        if (data.length < 4) {
          setError(`Need at least 4 entries in this category to generate a quiz. Currently have ${data.length}.`)
          setLoading(false)
          return
        }

        if (selectedMode === 'ows') {
          allQuestions = generateOwsQuestions(data, QUESTIONS_PER_QUIZ)
        } else if (selectedMode === 'idioms') {
          allQuestions = generateIdiomQuestions(data, QUESTIONS_PER_QUIZ)
        } else if (selectedMode === 'syn_ant') {
          allQuestions = generateSynAntQuestions(data, QUESTIONS_PER_QUIZ)
        }
      }

      setQuestions(allQuestions)
      setMode(selectedMode)
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setIsAnswered(false)
      setScore(0)
      setAnswers([])
      setQuizDone(false)
    } catch (err) {
      setError('Failed to load quiz data. Make sure the server is running.')
    }
    setLoading(false)
  }

  const handleAnswer = (option) => {
    if (isAnswered) return
    setSelectedAnswer(option)
    setIsAnswered(true)
    const isCorrect = option === questions[currentIndex].correctAnswer
    if (isCorrect) setScore(prev => prev + 1)
    setAnswers(prev => [...prev, {
      ...questions[currentIndex],
      userAnswer: option,
      isCorrect,
    }])
  }

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setQuizDone(true)
    } else {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    }
  }

  const resetQuiz = () => {
    setMode(null)
    setQuestions([])
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setScore(0)
    setAnswers([])
    setQuizDone(false)
    setError(null)
  }

  // ===== MODE SELECTION SCREEN =====
  if (!mode) {
    return (
      <div className="quiz-page">
        <div className="quiz-header">
          <Link to="/" className="back-link">‹ Back to Home</Link>
          <h1>🧠 Quiz Mode</h1>
          <p className="quiz-subtitle">Test your vocabulary knowledge</p>
        </div>

        {error && <div className="quiz-error">{error}</div>}

        <div className="quiz-modes">
          {QUIZ_MODES.map(m => {
            const count = m.key === 'mix'
              ? (dataCounts.ows?.total || 0) + (dataCounts.idioms?.total || 0) + (dataCounts.syn_ant?.total || 0)
              : dataCounts[m.key]?.total || 0
            const minRequired = m.key === 'mix' ? QUESTIONS_PER_QUIZ : 4
            const canStart = count >= minRequired

            return (
              <button
                key={m.key}
                className={`quiz-mode-card ${!canStart ? 'disabled' : ''}`}
                onClick={() => canStart && startQuiz(m.key)}
                disabled={loading || !canStart}
              >
                <span className="quiz-mode-icon">{m.icon}</span>
                <div className="quiz-mode-info">
                  <span className="quiz-mode-label">{m.label}</span>
                  <span className="quiz-mode-desc">{m.desc}</span>
                  <span className="quiz-mode-count">
                    {count} entries {!canStart && `(need ${minRequired}+)`}
                  </span>
                </div>
                <span className="quiz-mode-arrow">→</span>
              </button>
            )
          })}
        </div>

        {loading && <div className="quiz-loading">Generating quiz...</div>}
      </div>
    )
  }

  // ===== RESULTS SCREEN =====
  if (quizDone) {
    const percentage = Math.round((score / questions.length) * 100)
    let grade, gradeColor
    if (percentage >= 90) { grade = 'Excellent! 🌟'; gradeColor = '#22c55e' }
    else if (percentage >= 70) { grade = 'Great job! 👏'; gradeColor = '#3b82f6' }
    else if (percentage >= 50) { grade = 'Good effort! 💪'; gradeColor = '#f59e0b' }
    else { grade = 'Keep practicing! 📚'; gradeColor = '#ef4444' }

    return (
      <div className="quiz-page">
        <div className="quiz-results">
          <div className="results-header">
            <h1>Quiz Complete!</h1>
            <div className="results-score" style={{ color: gradeColor }}>
              {score}/{questions.length}
            </div>
            <div className="results-percentage" style={{ color: gradeColor }}>
              {percentage}%
            </div>
            <p className="results-grade" style={{ color: gradeColor }}>{grade}</p>
          </div>

          <div className="results-progress-bar">
            <div
              className="results-progress-fill"
              style={{ width: `${percentage}%`, backgroundColor: gradeColor }}
            />
          </div>

          <div className="results-actions">
            <button className="quiz-btn primary" onClick={() => startQuiz(mode)}>
              🔄 Retry Same Category
            </button>
            <button className="quiz-btn secondary" onClick={resetQuiz}>
              🏠 Choose Another Quiz
            </button>
          </div>

          {/* Review Section */}
          <div className="results-review">
            <h2>📋 Review Answers</h2>
            {answers.map((ans, i) => (
              <div key={i} className={`review-card ${ans.isCorrect ? 'correct' : 'wrong'}`}>
                <div className="review-number">
                  <span className={`review-icon ${ans.isCorrect ? 'correct' : 'wrong'}`}>
                    {ans.isCorrect ? '✓' : '✗'}
                  </span>
                  Q{i + 1}
                </div>
                <div className="review-content">
                  <span className="review-category-tag">{ans.categoryLabel}</span>
                  <p className="review-question-label">{ans.questionLabel}</p>
                  <p className="review-question">{ans.question}</p>
                  {ans.meaning && <p className="review-meaning">({ans.meaning})</p>}
                  <div className="review-answers">
                    <p className="review-correct">
                      ✓ Correct: <strong>{ans.correctAnswer}</strong>
                    </p>
                    {!ans.isCorrect && (
                      <p className="review-wrong">
                        ✗ Your answer: <strong>{ans.userAnswer}</strong>
                      </p>
                    )}
                  </div>
                  {ans.hindi && (
                    <p className="review-hindi">हिंदी: {ans.hindi}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ===== QUESTION SCREEN =====
  const q = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="quiz-page">
      {/* Top bar with quit */}
      <div className="quiz-top-bar">
        <button className="quiz-quit-btn" onClick={resetQuiz}>✕ Quit Quiz</button>
      </div>

      {/* Progress */}
      <div className="quiz-progress-section">
        <div className="quiz-progress-info">
          <span className="quiz-progress-text">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="quiz-score-text">Score: {score}/{currentIndex + (isAnswered ? 1 : 0)}</span>
        </div>
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="quiz-question-card">
        <span className="quiz-category-tag">{q.categoryLabel}</span>
        <p className="quiz-question-label">{q.questionLabel}</p>
        <h2 className="quiz-question-text">{q.question}</h2>
        {q.meaning && <p className="quiz-question-meaning">{q.meaning}</p>}
      </div>

      {/* Options */}
      <div className="quiz-options">
        {q.options.map((option, i) => {
          let optionClass = 'quiz-option'
          if (isAnswered) {
            if (option === q.correctAnswer) {
              optionClass += ' correct'
            } else if (option === selectedAnswer && option !== q.correctAnswer) {
              optionClass += ' wrong'
            } else {
              optionClass += ' faded'
            }
          } else if (option === selectedAnswer) {
            optionClass += ' selected'
          }

          return (
            <button
              key={i}
              className={optionClass}
              onClick={() => handleAnswer(option)}
              disabled={isAnswered}
            >
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              <span className="option-text">{option}</span>
              {isAnswered && option === q.correctAnswer && <span className="option-icon">✓</span>}
              {isAnswered && option === selectedAnswer && option !== q.correctAnswer && <span className="option-icon">✗</span>}
            </button>
          )
        })}
      </div>

      {/* Feedback & Next */}
      {isAnswered && (
        <div className="quiz-feedback">
          <div className={`feedback-text ${selectedAnswer === q.correctAnswer ? 'correct' : 'wrong'}`}>
            {selectedAnswer === q.correctAnswer
              ? '🎉 Correct!'
              : `❌ Wrong! The answer is: ${q.correctAnswer}`
            }
            {q.hindi && <span className="feedback-hindi"> • हिंदी: {q.hindi}</span>}
          </div>
          <button className="quiz-btn primary next-btn" onClick={nextQuestion}>
            {currentIndex + 1 >= questions.length ? '📊 See Results' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Quiz
