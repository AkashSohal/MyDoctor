# MediNear - Nearby Specialist Doctor Discovery Platform

A production-ready healthcare discovery web application that helps patients find verified MBBS doctors, specialists, ratings, hospitals, and availability — all in one place.

## 🌟 Features

### For Patients
- **Smart Doctor Search** - Search by specialty, name, hospital, or symptom
- **Location-Based Discovery** - GPS-powered nearby doctor search with real distance calculation
- **Verified Profiles** - Every doctor verified for medical registration, qualifications, and credentials
- **Authentic Reviews** - Only verified patients with completed appointments can review
- **Real-time Availability** - See which doctors are available today, this week, or right now
- **Smart Matching** - Best Match algorithm considering specialty, ratings, experience, availability, and distance
- **Side-by-Side Comparison** - Compare up to 3 doctors across all key metrics
- **Appointment Booking** - Book appointments with hospital, date, and time selection
- **Directions & Contact** - One-tap navigation and calling

### For Doctors
- **Profile Management** - Complete professional profile with qualifications and experience
- **Multi-location Schedules** - Manage availability across multiple hospitals/clinics
- **Appointment Management** - View, confirm, reject, and complete appointments
- **Verification Dashboard** - Track verification status and profile completion

### For Admins
- **Doctor Verification** - Approve, reject, or suspend doctor profiles
- **Review Moderation** - Manage reported reviews and content
- **Platform Analytics** - User statistics and platform metrics
- **Content Management** - Specialties, hospitals, and platform settings

## 🛠 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **React Leaflet** for interactive maps
- **React Hook Form** + **Zod** for forms

### Backend
- **Next.js API Routes** & Server Actions
- **Supabase** (PostgreSQL + Auth + Realtime)
- **PostGIS** for geospatial queries

### Authentication
- **Supabase Auth** (Email/Password, OAuth ready)

### Maps
- **OpenStreetMap** via Leaflet (free, no API key required)
- Modular provider integration (Google Maps, Mapbox ready)

### Deployment
- **Vercel** (recommended)
- **GitHub** for version control
- **Supabase** for database hosting

## 📁 Project Structure

```
medinear/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── doctors/           # Doctor search & profiles
│   ├── specialties/       # Specialty browsing
│   ├── hospitals/         # Hospital listings
│   ├── dashboard/         # Protected dashboards
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/                # Base UI components
│   ├── doctors/           # Doctor-specific components
│   ├── hospitals/         # Hospital components
│   ├── map/               # Map components
│   ├── forms/             # Form components
│   ├── layout/            # Layout components
│   └── common/            # Shared components
├── lib/                   # Utilities & configurations
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Helper functions
│   ├── supabase/          # Supabase clients
│   ├── types/             # TypeScript types
│   └── constants/         # App constants
├── supabase/              # Database schema & migrations
│   └── migrations/        # SQL migrations
├── public/                # Static assets
└── middleware.ts          # Auth middleware
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/medinear.git
cd medinear

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run database migrations (via Supabase dashboard or CLI)
# See supabase/migrations/ for SQL files

# Start development server
npm run dev
```

### Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Maps (optional - uses OpenStreetMap by default)
# NEXT_PUBLIC_MAPS_PROVIDER=leaflet
# GOOGLE_MAPS_API_KEY=your_google_maps_key
# MAPBOX_ACCESS_TOKEN=your_mapbox_token

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MediNear
```

## 🗄 Database Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/` in order:
   - `20240101000000_initial_schema.sql` - Core tables
   - `20240101000001_rls_policies.sql` - Row Level Security
   - `20240101000002_functions_triggers.sql` - Functions & triggers
   - `20240101000003_seed_data.sql` - Reference data
3. Enable PostGIS extension in Supabase SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
4. Configure Supabase Auth providers (Email, Google, etc.)

## 🧪 Demo Accounts

After running seed data, you can test with:

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@demo.com | demo123 |
| Doctor | doctor@demo.com | demo123 |
| Admin | admin@demo.com | demo123 |

*Note: Demo accounts are created via the seed script. In production, users register normally.*

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Database Migrations on Deploy

Supabase migrations run via the Supabase dashboard or CLI. For CI/CD:

```bash
# Using Supabase CLI
supabase db push
```

## 🔒 Security Features

- **Row Level Security (RLS)** on all tables
- **Server-side validation** for all mutations
- **Role-based access control** (Patient, Doctor, Admin)
- **Rate limiting** on auth endpoints
- **Input sanitization** for user-generated content
- **No exposed secrets** - all keys via environment variables

## ♿ Accessibility

- Semantic HTML5
- Keyboard navigation support
- ARIA labels and roles
- WCAG 2.1 AA contrast ratios
- Focus management
- Screen reader compatible

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interactions
- Optimized for all device sizes

## 🏥 Medical Safety & Compliance

### Disclaimer
MediNear is a **discovery and appointment-support platform**, NOT a diagnosis or treatment platform.

We **never**:
- Diagnose patients
- Recommend medicines or treatments
- Guarantee treatment outcomes
- Claim medical superiority based on ratings
- Invent qualifications or affiliations

### Data Handling
- All doctor information sourced from authorized submissions
- Demo data clearly labeled
- Patient data encrypted and secured
- HIPAA/GDPR considerations in architecture

## 🔮 Future-Ready Architecture

The codebase is designed to support:
- Online payments integration
- Telemedicine & video consultations
- Prescription management
- Hospital API integrations
- SMS/WhatsApp/Email notifications
- AI-powered search & recommendations
- Multi-language support (Hindi, Punjabi, English)
- Emergency services directory
- Doctor subscription plans

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📞 Support

- **Email**: support@medinear.com
- **Issues**: GitHub Issues
- **Documentation**: /docs (coming soon)

## 🙏 Acknowledgments

- OpenStreetMap contributors
- Supabase team
- shadcn/ui contributors
- Next.js team
- All healthcare professionals who inspired this platform

---

**Built with ❤️ for better healthcare access**