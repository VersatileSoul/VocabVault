# 📖 VocabVault — English Vocabulary Builder

A web-based vocabulary builder app designed for competitive exam aspirants (SSC, UPSC, Defence, Banking, etc.). Add words daily, revise anytime, and test yourself with MCQ quizzes — all from your laptop or phone.

## ✨ Features

- **3 Vocabulary Sections** — One Word Substitutions, Idioms & Phrases, Synonyms & Antonyms
- **Data Entry Form** — Add 20–30 words daily with ease
- **Hindi Transliteration** — Type in English, get Hindi meanings automatically
- **View & Search** — Browse all entries in a searchable table with edit/delete support
- **MCQ Quiz Mode** — 4 quiz types:
  - 🔤 One Word Substitution Quiz
  - 💬 Idioms & Phrases Quiz
  - 🔁 Synonyms & Antonyms Quiz
  - 🎲 Mixed Quiz (random from all categories)
- **Quiz Review** — See correct/wrong answers with Hindi meanings after each quiz
- **Mobile Responsive** — Works on phone and desktop
- **Score Tracking** — Instant feedback with score, percentage, and grade

## 🛠️ Tech Stack

| Tech | Purpose |
|------|---------|
| React.js | Frontend UI |
| Vite | Build tool & dev server |
| Express.js | Backend REST API |
| JSON Files | Simple data storage |
| Google Input Tools API | Hindi transliteration |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VersatileSoul/VocabVault.git
   cd VocabVault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the app**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

   The app runs both the frontend (Vite on port 5173) and backend (Express on port 3001) together.

### Access on Phone

To test on your mobile (same Wi-Fi network):
1. Find your PC's IP address (`ipconfig` on Windows)
2. Open `http://YOUR_IP:5173` on your phone's browser

## 📁 Project Structure

```
VocabVault/
├── data/                  # JSON data files
│   ├── ows.json           # One Word Substitutions
│   ├── idioms.json        # Idioms & Phrases
│   └── syn_ant.json       # Synonyms & Antonyms
├── src/
│   ├── components/
│   │   ├── DataEntryForm.jsx   # Form for adding entries
│   │   ├── HindiInput.jsx      # Hindi transliteration input
│   │   └── Navbar.jsx          # Category navigation tabs
│   ├── pages/
│   │   ├── ViewCategory.jsx    # View/search/edit/delete entries
│   │   └── Quiz.jsx            # MCQ quiz with 4 modes
│   ├── App.jsx            # Main app with routing
│   ├── App.css            # All styles
│   └── main.jsx           # React entry point
├── server.js              # Express backend API
├── index.html             # HTML entry point
├── vite.config.js         # Vite configuration
└── package.json           # Dependencies & scripts
```

## 📝 How to Use

1. **Add Words** — Select a category (OWS / Idioms / Syn & Ant) on the home page and fill in the form
2. **View & Edit** — Click on the stat cards to see all entries, search, edit or delete them
3. **Take a Quiz** — Click "Take a Quiz" on the home page, choose a quiz type, and answer 10 MCQs
4. **Review** — After the quiz, review all answers with correct/wrong breakdown and Hindi meanings

## 🎯 Who Is This For?

Anyone preparing for competitive exams where English is part of the syllabus:
- SSC (CGL, CHSL, MTS)
- UPSC
- Defence (NDA, CDS, AFCAT)
- Banking (IBPS, SBI, RBI)
- Railway (RRB)
- State-level exams

## 🤝 Contributing

Feel free to fork, improve, and submit a pull request. Ideas for future improvements:
- Spaced repetition for revision
- Score history and progress tracking
- More quiz types (fill in the blank, match the following)
- Import/export data

## 📄 License

This project is open source and available for personal and educational use.
