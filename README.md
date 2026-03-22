# 📖 VocabVault — English Vocabulary Builder

A web-based vocabulary builder app designed for competitive exam aspirants (SSC, UPSC, Defence, Banking, etc.). Add words daily, revise anytime, and test yourself with MCQ quizzes — all from your laptop or phone.

🌐 **Live at:** [https://versatilesoul.co.in](https://versatilesoul.co.in)

## ✨ Features

- **3 Vocabulary Sections** — One Word Substitutions, Idioms & Phrases, Synonyms & Antonyms
- **Data Entry Form** — Add 20–30 words daily with ease (admin only)
- **Hindi Transliteration** — Type in English, get Hindi meanings automatically
- **View & Search** — Browse all entries in a searchable table
- **MCQ Quiz Mode** — 4 quiz types:
  - 🔤 One Word Substitution Quiz
  - 💬 Idioms & Phrases Quiz
  - 🔁 Synonyms & Antonyms Quiz
  - 🎲 Mixed Quiz (random from all categories)
- **Quiz Review** — See correct/wrong answers with Hindi meanings after each quiz
- **Admin Authentication** — Login system to protect add/edit/delete operations
- **Mobile Responsive** — Works on phone and desktop
- **Score Tracking** — Instant feedback with score, percentage, and grade
- **Cloud Hosted** — Deployed on Render with MongoDB Atlas, accessible from anywhere

## 🛠️ Tech Stack

| Tech | Purpose |
|------|---------|
| React.js | Frontend UI |
| Vite | Build tool & dev server |
| Express.js | Backend REST API |
| MongoDB Atlas | Cloud database |
| Mongoose | MongoDB ODM |
| JWT + bcrypt | Authentication & security |
| Google Input Tools API | Hindi transliteration |
| Render.com | Hosting & deployment |
| GoDaddy | Custom domain (`versatilesoul.co.in`) |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (comes with Node.js)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier works)

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

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/vocabvault
   JWT_SECRET=your-secret-key-here
   ADMIN_USERNAME=your-admin-username
   ADMIN_PASSWORD_HASH=your-bcrypt-hashed-password
   ```

   To generate a password hash, run in Node.js:
   ```javascript
   const bcrypt = require('bcryptjs');
   bcrypt.hash('your-password', 10).then(hash => console.log(hash));
   ```

4. **Start the app (development)**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

   The app runs both the frontend (Vite on port 5173) and backend (Express on port 3001) together.

### Access on Phone (Local Development)

To test on your mobile (same Wi-Fi network):
1. Find your PC's IP address (`ipconfig` on Windows)
2. Open `http://YOUR_IP:5173` on your phone's browser

## 📁 Project Structure

```
VocabVault/
├── models/                    # Mongoose schemas
│   ├── Ows.js                 # One Word Substitution model
│   ├── Idiom.js               # Idioms & Phrases model
│   └── SynAnt.js              # Synonyms & Antonyms model
├── src/
│   ├── components/
│   │   ├── DataEntryForm.jsx  # Form for adding entries
│   │   ├── HindiInput.jsx     # Hindi transliteration input
│   │   └── Navbar.jsx         # Category navigation tabs
│   ├── context/
│   │   └── AuthContext.jsx    # Authentication state management
│   ├── pages/
│   │   ├── ViewCategory.jsx   # View/search/edit/delete entries
│   │   ├── Quiz.jsx           # MCQ quiz with 4 modes
│   │   └── Login.jsx          # Admin login page
│   ├── App.jsx                # Main app with routing
│   ├── App.css                # All styles
│   └── main.jsx               # React entry point
├── server.js                  # Express backend API + auth + static serving
├── migrate.js                 # JSON → MongoDB migration script
├── index.html                 # HTML entry point
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies & scripts
├── HOSTING_GUIDE.md           # Detailed deployment documentation
└── .env                       # Environment variables (not in repo)
```

## 📝 How to Use

### For Public Users (No Login Required)
1. **Browse Words** — Click on any stat card (OWS / Idioms / Syn & Ant) to view all entries
2. **Search** — Use the search bar to find specific words
3. **Take a Quiz** — Click "Take a Quiz" on the home page, choose a quiz type, and answer 10 MCQs
4. **Review** — After the quiz, review all answers with correct/wrong breakdown and Hindi meanings

### For Admin (Login Required)
1. **Login** — Click "🔐 Admin Login" in the header and enter your credentials
2. **Add Words** — Select a category on the home page and fill in the form
3. **Edit/Delete** — Go to any category view, use ✏️ to edit or 🗑️ to delete entries
4. **Logout** — Click "Logout" in the header when done

## 🌐 Deployment

The app is deployed using:
- **Render.com** — Hosts the Node.js backend + serves the built React frontend
- **MongoDB Atlas** — Cloud database (free tier, AWS Mumbai region)
- **GoDaddy** — Custom domain pointing to Render via A record and CNAME

For a detailed step-by-step deployment guide, see [HOSTING_GUIDE.md](./HOSTING_GUIDE.md).

### Production Build

```bash
npm run build    # Builds React app to /dist
npm run start    # Starts Express server (serves API + static files)
```

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
- Multiple user accounts

## 📄 License

This project is open source and available for personal and educational use.
