# Health Helper
An intelligent health tracking application.
<!-- Trigger Vercel Re-deploy -->

A comprehensive health tracking and AI-powered analysis platform built with Next.js 15 and React 19.

## Features

- 🏥 **Multi-Domain Health Tracking**: Track nutrition, sleep, stress, skin conditions, and gastrointestinal health
- 🤖 **AI-Powered Insights**: Machine learning models for health predictions and personalized recommendations
- 📊 **Advanced Analytics**: Visualize health trends and patterns over time
- 💬 **Specialized Chat Interfaces**: Domain-specific AI chat assistants (Gastro, Mind, Skin)
- 📱 **Progressive Web App**: Installable on mobile and desktop with offline support
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS and Radix UI components

## Tech Stack

### Frontend
- **Framework**: Next.js 15.3.5 with App Router
- **React**: 19.0.0
- **Styling**: Tailwind CSS 4 + Tailwind Animate
- **UI Components**: Radix UI, shadcn/ui
- **Animations**: Framer Motion
- **Charts**: Recharts
- **3D Graphics**: React Three Fiber, Three.js
- **Forms**: React Hook Form + Zod validation
- **State Management**: React hooks & Context

### Backend
- **API Routes**: Next.js API routes (TypeScript)
- **Python Backend**: Separate Python backend for ML models (see `python-backend/`)
- **ML Framework**: scikit-learn, TensorFlow (in Python backend)

## Getting Started

### Prerequisites
- Node.js 20+ 
- npm or bun
- Python 3.9+ (for ML backend, optional for frontend development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HealthHelper-codebase
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration.

4. **Run the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Python Backend Setup (Optional)

The Python backend provides ML-powered features. It can be run separately:

1. **Navigate to python-backend**
   ```bash
   cd python-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the API server**
   ```bash
   python api_server.py
   ```

The Python API will be available at `http://localhost:8000`

## Deployment

### Deploying to Vercel (Frontend)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel**
   - Go to your project settings
   - Add `PYTHON_API_URL` pointing to your deployed Python backend
   - Add any other required environment variables

### Deploying Python Backend

The Python backend needs to be deployed separately. Recommended platforms:

- **Railway**: [railway.app](https://railway.app)
- **Render**: [render.com](https://render.com)
- **Fly.io**: [fly.io](https://fly.io)
- **AWS Lambda** with API Gateway (for serverless)

See `python-backend/README.md` for detailed instructions.

## Project Structure

```
HealthHelper-codebase/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── analytics/         # Analytics dashboard
│   │   ├── gastro/           # GI health tracking
│   │   ├── mindtrack/        # Mental health tracking
│   │   ├── nutrition/        # Nutrition tracking
│   │   ├── skintrack/        # Skin health tracking
│   │   └── sleeptrack/       # Sleep tracking
│   ├── components/            # React components
│   │   ├── chat/             # Chat interfaces
│   │   ├── ui/               # shadcn/ui components
│   │   └── pwa/              # PWA components
│   ├── lib/                   # Utilities and helpers
│   │   └── chat/             # Chat logic
│   └── hooks/                 # Custom React hooks
├── python-backend/            # Python ML backend (separate deployment)
│   ├── api_server.py         # FastAPI server
│   ├── ml_models.py          # ML model definitions
│   ├── unified_health_ai.py  # Unified AI logic
│   └── requirements.txt      # Python dependencies
├── public/                    # Static assets
├── .vercelignore             # Files to exclude from Vercel
├── vercel.json               # Vercel configuration
└── next.config.ts            # Next.js configuration
```

## Environment Variables

Required environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `PYTHON_API_URL` | URL of deployed Python backend | No (optional for frontend-only features) |
| `NEXT_PUBLIC_APP_URL` | Public URL of your app | Yes (for production) |
| `NODE_ENV` | Environment mode | Auto-set by Vercel |

See `.env.example` for a complete list.

## Features & Routes

- `/` - Home dashboard
- `/analytics` - Health analytics and insights
- `/nutrition` - Nutrition tracking
- `/sleeptrack` - Sleep tracking
- `/mindtrack` - Mental health tracking
- `/skintrack` - Skin health tracking
- `/gastro` - GI health tracking
- `/remedies` - Health remedies and tips
- `/integrations` - Third-party integrations

## Development

### Scripts

```bash
npm run dev      # Start development server (with Turbopack)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New Features

1. Create new pages in `src/app/`
2. Add components in `src/components/`
3. Add utilities in `src/lib/`
4. Add API routes in `src/app/api/`

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For questions or issues, please open an issue on the repository.

---

Built with ❤️ using Next.js and modern web technologies.
