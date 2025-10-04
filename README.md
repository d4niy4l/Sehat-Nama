# Sehat Nama - صحت نامہ

A beautiful Next.js application for automated medical history taking for local people in Urdu, featuring Supabase authentication with Google OAuth.

## Features

- 🔐 **Secure Authentication** - Supabase Auth with Google OAuth
- 🌙 **Dark/Light Theme** - Beautiful theme switching
- 🇵🇰 **Urdu Support** - Full Urdu language support with proper fonts
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Fast Loading** - Optimized with loading states and spinners
- 🎨 **Beautiful UI** - Modern design with medical-themed colors
- 🏥 **Medical Focus** - Designed specifically for healthcare professionals

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a Service with Auth
- **Lucide React** - Beautiful icons
- **Next Themes** - Theme management

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sehat-nama
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API to get your project URL and anon key
   - Enable Google OAuth in Authentication > Providers

4. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Supabase Setup

### 1. Create a Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Wait for the project to be ready

### 2. Configure Authentication
- Go to Authentication > Settings
- Add your domain to "Site URL" (e.g., `http://localhost:3000`)
- Add redirect URLs (e.g., `http://localhost:3000/dashboard`)

### 3. Enable Google OAuth
- Go to Authentication > Providers
- Enable Google provider
- Add your Google OAuth credentials:
  - Client ID
  - Client Secret
- Set redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

### 4. Get API Keys
- Go to Settings > API
- Copy your project URL and anon key
- Add them to your `.env.local` file

## Project Structure

```
sehat-nama/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth-form.tsx     # Authentication form
│   ├── dashboard-content.tsx
│   ├── supabase-provider.tsx
│   └── theme-provider.tsx
├── lib/                  # Utility functions
│   ├── supabase.ts      # Supabase client
│   └── utils.ts         # Utility functions
└── public/              # Static assets
```

## Features Overview

### Authentication
- Email/password authentication
- Google OAuth integration
- Secure session management
- Automatic redirects

### UI/UX
- Beautiful gradient backgrounds
- Medical-themed color scheme
- Urdu font support (Noto Nastaliq Urdu)
- Responsive design
- Loading states with spinners
- Smooth animations

### Dashboard
- Welcome screen with user info
- Statistics cards
- Quick action buttons
- Recent activity feed
- Feature highlights

## Customization

### Colors
The app uses a medical-themed color palette defined in `tailwind.config.js`:
- Primary: Blue tones for trust and professionalism
- Medical: Green tones for health and wellness
- Accent: Purple tones for highlights

### Fonts
- **Inter**: For English text
- **Noto Nastaliq Urdu**: For Urdu text

### Themes
The app supports both light and dark themes with smooth transitions.

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean
- AWS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email your-email@example.com or create an issue in the repository.

---

**Sehat Nama** - Making healthcare accessible through technology 🏥💚
