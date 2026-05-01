# GlamVerse — Setup Guide

## Prerequisites
- **Node.js** 18+ (recommended: 20+)
- **Python** 3.10+
- **npm** 9+
- **Firebase** account with a project
- **API Keys**: Anthropic (chatbot), Google Gemini (virtual try-on)

---

## 1. Frontend Setup (Next.js)

```bash
cd glamverse
npm install
```

### Environment Variables
Create `glamverse/.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# AI Service (Python backend)
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000

# Anthropic API (Chatbot - Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google Gemini API (Virtual Try-On image generation)
GEMINI_API_KEY=your_gemini_api_key
```

### Run Frontend
```bash
npm run dev
# → http://localhost:3000
```

### Build for Production
```bash
npm run build
```

---

## 2. Python AI Service Setup

```bash
cd glamverse/ai-service

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables
Create `glamverse/ai-service/.env`:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Run AI Service
```bash
python api.py
# → http://localhost:8000
```

The AI service loads 5 models on startup:
- YOLOv8 (face detection)
- MediaPipe Face Landmarker (face shape)
- Skin Tone Classifier (OpenCV L*a*b*)
- MediaPipe Pose Landmarker (body type)
- Recommendation Engine (rule-based)

If `ANTHROPIC_API_KEY` is set, Claude Vision is used as primary analyzer with local models as fallback.

---

## 3. Firebase Setup

### Authentication
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable **Email/Password** provider

### Realtime Database
1. Go to Firebase Console → Realtime Database → Create Database
2. Choose your region (e.g., asia-southeast1)
3. Set Rules:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### Set Admin Role
1. Sign up through the app
2. Go to Firebase Console → Realtime Database → `users/{your-uid}`
3. Add field: `role` = `"admin"`
4. OR: Visit `/store` — the auto-seed will set your role to admin automatically

### Seed Demo Products
1. Go to `/admin/dashboard` → click **"Seed Demo Products"**
2. OR: Visit `/store` — auto-seeds 12 products if none exist
3. Products are stored with Base64 images in Firebase RTDB (no Firebase Storage needed)

---

## 4. Running Both Services

### Quick Start
```bash
# Terminal 1: Frontend
cd glamverse && npm run dev

# Terminal 2: AI Backend
cd glamverse/ai-service && ./venv/Scripts/python api.py
```

### Verify
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/health

---

## 5. Project Structure

```
glamverse/
├── src/
│   ├── app/                    # Next.js App Router pages (21 pages)
│   │   ├── page.tsx            # Landing page
│   │   ├── store/              # Product catalog + detail + try-on
│   │   ├── cart/               # Shopping cart
│   │   ├── checkout/           # Order placement
│   │   ├── orders/             # Order history
│   │   ├── dashboard/          # AI face/body analysis
│   │   ├── profile/            # User profile + body photo
│   │   ├── tryon/              # Custom virtual try-on
│   │   ├── admin/              # Admin panel (dashboard, products, orders)
│   │   ├── auth/               # Login, signup, forgot password
│   │   └── api/                # API routes (chat, tryon)
│   ├── components/             # React components
│   │   ├── layout/Navbar.tsx   # Shared navigation bar
│   │   ├── store/ProductSheet.tsx  # Slide-in product detail
│   │   ├── auth/               # AuthGuard, AdminGuard
│   │   ├── chat/ChatWidget.tsx # AI chatbot with voice
│   │   └── camera/             # Camera capture component
│   ├── context/AuthContext.tsx  # Firebase auth + RBAC
│   ├── lib/                    # Utilities (Firebase, API, cart, products, orders)
│   └── types/                  # TypeScript interfaces
├── ai-service/                 # Python FastAPI backend
│   ├── api.py                  # Main server
│   ├── inference/              # AI models (YOLO, MediaPipe, Claude Vision)
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # API keys for AI service
├── public/products/            # Product images (used for seeding)
├── .env.local                  # Frontend environment variables
└── SETUP.md                    # This file
```

---

## 6. Key Features

| Feature | Tech |
|---------|------|
| E-Commerce Store | Next.js + Firebase RTDB |
| RBAC (Admin/User) | Firebase Auth + RTDB role field |
| Virtual Try-On | Google Gemini AI (image generation) |
| AI Analysis | YOLO + MediaPipe + Claude Vision |
| Smart Chatbot | Anthropic Claude Haiku 4.5 |
| Voice Interaction | Web Speech API (STT/TTS) |
| Image Storage | Base64 in Firebase RTDB (no Storage needed) |

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| "Permission denied" on Firebase | Update RTDB rules (see step 3) |
| "AI Service offline" | Start Python server: `python ai-service/api.py` |
| Products not showing | Visit `/store` to auto-seed, or `/admin/dashboard` → Seed |
| Try-on shows text instead of image | Check `GEMINI_API_KEY` is set in `.env.local` |
| Admin pages redirect | Set `role: "admin"` in Firebase Console for your user |
| Chatbot not responding | Check `ANTHROPIC_API_KEY` in `.env.local` |
