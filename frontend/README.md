# Blue Orb - Frontend

Open education hub for Africa, empowering learners through digital resources.

## Features

- **Curricula Browser** - Explore educational curricula with thumbnails and descriptions
- **Exams Repository** - Access past exam questions and resources
- **Learning Materials** - Browse open educational materials by category
- **Community Forum** - Ask questions and participate in discussions (powered by Nostr)
- **Admin Dashboard** - Manage content with built-in authentication
- **Bilingual Support** - English and Wolof language toggle

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **i18n** - Internationalization (English + Wolof)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set:
   ```
   VITE_API_URL=http://localhost:4000/api
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Admin Access

Navigate to `/admin` and login with:
- Username: `kehnmarv`
- Password: `#Dronestech2021`

## Project Structure

```
frontend/
├── src/
│   ├── pages/              # Main pages
│   │   ├── Home.jsx
│   │   ├── Curricula.jsx
│   │   ├── Exams.jsx
│   │   ├── Materials.jsx
│   │   ├── Community.jsx
│   │   └── Admin.jsx
│   ├── components/         # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── admin/          # Admin dashboard components
│   ├── hooks/              # Custom hooks
│   │   └── useApi.js
│   ├── utils/              # Utilities
│   │   ├── i18n.js
│   │   └── auth.js
│   ├── i18n/               # Language files
│   │   ├── en.json
│   │   └── wo.json
│   └── styles/             # Global styles
│       └── index.css
```

## IPFS Integration

All files are stored on IPFS. The app uses Content Identifiers (CIDs) to reference:
- Curriculum thumbnails
- Exam files
- Learning material files

Files are accessed via: `https://dweb.link/ipfs/{cid}`

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Set environment variable:
   ```
   VITE_API_URL=https://your-backend-url.vercel.app/api
   ```
3. Deploy

## License

MIT
