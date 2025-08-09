# Project: Food & Friends

## Background

Me and my girlfriend have an annual food festival experience. It has a duration of 5 days from Monday to Friday. It's only for our closest friends. Each day has a different theme/menu. Our friends can only join for one day and we have a limited number of tickets for each day. The price is 50DKK per person.

## Purpose/Features

Create a web app for our food festival. It should allow our friends to see a user-facing page with the following features:

1. See the menu for each day
2. See the price
3. See how many people are attending and how many tickets are left
4. See the date of the festival
5. See the location of the festival
6. Book a ticket for a specific day
7. Create a user profile (optionally with an email address to get info).
8. See their own booking on a profile page.
9. Edit their booking on their profile page.

## Tech Stack

- Frontend: React (Vite)
- Backend: FastAPI
- UI Framework: shadcn/ui
- Database: MongoDB
- Authentication: Google OAuth
- Frontend Deployment: Vercel
- Backend Deployment: Railway
- Email: AWS SES for booking confirmations

## Implementation Details

### Authentication

- Google OAuth for user login

### Email Notifications

- Email confirmation sent when booking is made
- Email confirmation sent when booking is updated
- Using AWS SES for email delivery

### Festival Details

- Dates: November 3-7, 2024 (Monday to Friday)
- Price: 50DKK per person
- Location: Guldbergsgade 51A, 4. tv., 2200 København N
- Capacity: 6 tickets per day
- Background: Use bg-autumn.png for all pages
- Users can only book one ticket for one day
- Users can modify their booking on their profile page

### Admin Features

- Update menus
- Manage ticket availability
- View all bookings
- Send announcements to attendees

### Admin Content Management Decisions (Phase 5.2)

- Scope & data model
  - Single festival instance for now
  - Admins can add and remove days
  - Day "menu" is a simple rich text string
- Festival settings
  - Changing festival start/end dates should constrain day dates in the UI
  - Timezone: Europe/Copenhagen
  - Price changes apply only to future bookings
- Day editing
  - Admins may change a day’s date even if bookings exist; no emails sent
  - Capacity reductions are allowed even if below current bookings
  - Capacity increases update availability immediately
- Ticket availability management
  - Manage capacity per day only
  - Tickets sold are derived strictly from bookings
- Validation and safeguards
  - Use confirmation dialogs for risky actions (date changes, capacity reductions)
  - No preview needed for menu edits; no special field requirements
- Notifications
  - No emails sent for admin-driven content changes
- Permissions & access
  - Admin-only actions (both server and client enforced)
- UX expectations
  - Use a modal for editing day details
  - Manage festival settings within the same admin dashboard
  - No undo/version history required

### User Profile

- Name
- Email

### Development Priority

1. Start with basic viewing functionality
2. Then implement booking system
3. Finally add user profiles and management

## Implementation Structure

### Project Structure

```bash
foodandfriends/
├── frontend/                 # React (Vite) application
│   ├── public/              # Static assets
│   │   └── assets/          # Images, logos, and favicons
│   │       ├── background/  # Background images
│   │       ├── favicons/    # Favicon files
│   │       └── logos/       # Logo files
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── layout/      # Layout components
│   │   │   ├── forms/       # Form components
│   │   │   └── auth/        # Authentication components
│   │   ├── pages/           # Page components
│   │   │   ├── About.tsx    # About page
│   │   │   ├── BookingPage.tsx # Booking page
│   │   │   ├── Login.tsx    # Login page
│   │   │   └── Profile.tsx  # User profile page
│   │   ├── contexts/        # React contexts
│   │   │   └── AuthContext.tsx # Authentication context
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions
│   │   │   ├── auth.ts      # Authentication utilities
│   │   │   ├── bookings.ts  # Booking utilities
│   │   │   ├── config.ts    # Configuration
│   │   │   └── utils.ts     # General utilities
│   │   ├── types/           # TypeScript type definitions
│   │   ├── assets/          # Frontend assets
│   │   ├── App.tsx          # Main app component
│   │   ├── App.css          # App styles
│   │   ├── index.css        # Global styles
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── components.json
│   ├── eslint.config.js
│   └── README.md
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   ├── festival/    # Festival data endpoints
│   │   │   ├── bookings/    # Booking endpoints
│   │   │   ├── users/       # User management
│   │   │   ├── admin/       # Admin endpoints
│   │   │   ├── auth.py      # Auth endpoints
│   │   │   ├── bookings.py  # Booking endpoints
│   │   │   └── festival.py  # Festival endpoints
│   │   ├── core/            # Core configuration
│   │   │   ├── config.py    # App configuration
│   │   │   └── database.py  # Database connection
│   │   ├── models/          # Database models
│   │   │   ├── user.py      # User model
│   │   │   ├── festival.py  # Festival model
│   │   │   ├── booking.py   # Booking model
│   │   │   └── day.py       # Day model
│   │   ├── schemas/         # Pydantic schemas (empty)
│   │   ├── services/        # Business logic
│   │   │   └── auth.py      # Authentication service
│   │   └── main.py          # FastAPI app
│   ├── scripts/             # Utility scripts
│   │   └── populate_database.py # Database population script
│   ├── main.py              # Entry point
│   ├── run.py               # Run script
│   ├── pyproject.toml       # Python project config
│   ├── uv.lock              # UV lock file
│   ├── .python-version      # Python version
│   └── README.md
├── docs/                     # Documentation
│   ├── project.md           # Project overview
│   └── plan.md              # Implementation plan
└── assets/                   # Design assets
    ├── background/          # Background images
    ├── favicons/            # Favicon files
    └── logos/               # Logo files
```

### Frontend Architecture

#### Component Structure

- **Layout Components**: Header, Footer, Navigation
- **Page Components**: Home, Festival, Profile, Admin
- **UI Components**: Cards, Buttons, Forms, Modals
- **Form Components**: Booking forms, Profile forms, Admin forms

#### State Management

- **React Context**: For authentication state
- **Local State**: For form data and UI state
- **Server State**: For API data (using React Query or SWR)

#### Routing

- **React Router**: For client-side routing
- **Protected Routes**: For authenticated pages
- **Admin Routes**: For admin-only pages

### Backend Architecture

#### API Structure

```bash
/api/v1/
├── /auth
│   ├── /google/login         # Google OAuth login
│   ├── /google/callback      # OAuth callback
│   └── /logout              # Logout endpoint
├── /festival
│   ├── /info                # Festival information
│   ├── /days                # Daily menu data
│   └── /availability        # Ticket availability
├── /bookings
│   ├── /                    # CRUD operations
│   ├── /my-booking          # User's current booking
│   └── /validate            # Booking validation
├── /users
│   ├── /profile             # User profile
│   └── /update              # Profile updates
└── /admin
    ├── /bookings            # All bookings
    ├── /menus               # Menu management
    ├── /users               # User management
    └── /emails              # Email management
```

#### Database Models

User Model

```python
{
  "_id": ObjectId,
  "google_id": str,
  "email": str,
  "name": str,
  "created_at": datetime,
  "updated_at": datetime
}
```

Festival Model

```python
{
  "_id": ObjectId,
  "name": str,
  "start_date": datetime,
  "end_date": datetime,
  "location": str,
  "price": float,
  "capacity_per_day": int
}
```

Day Model

```python
{
  "_id": ObjectId,
  "festival_id": ObjectId,
  "date": datetime,
  "theme": str,
  "menu": str,
  "tickets_sold": int,
  "capacity": int
}
```

Booking Model

```python
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "day_id": ObjectId,
  "festival_id": ObjectId,
  "booking_date": datetime,
  "status": str,  # "confirmed", "cancelled"
  "created_at": datetime,
  "updated_at": datetime
}
```

### Authentication Flow

1. **User clicks "Login with Google"**
2. **Redirect to Google OAuth**
3. **Google returns authorization code**
4. **Backend exchanges code for tokens**
5. **Backend creates/updates user in database**
6. **Backend issues JWT token**
7. **Frontend stores JWT token**
8. **Frontend uses token for authenticated requests**

### Email System

#### Email Templates

- **Booking Confirmation**: Welcome email with booking details
- **Booking Update**: Notification of booking changes
- **Booking Cancellation**: Confirmation of cancellation
- **Admin Notifications**: New booking alerts

#### Email Service

- **AWS SES**: For reliable email delivery
- **Template Engine**: For dynamic email content
- **Queue System**: For handling email failures

### Deployment

#### Architecture

- **Frontend**: Deployed as static site on Vercel
- **Backend**: Deployed as FastAPI application on Railway
- **Environment Variables**: Configured in respective dashboards
- **Custom Domain**: Optional custom domain setup

#### Environment Configuration

```bash
# Frontend (.env)
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=

# Backend (.env) - Railway
MONGODB_CONNECTION_STRING=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
FRONTEND_URL=
```

### Security Considerations

- **JWT Tokens**: For session management
- **CORS**: Configured for frontend domain
- **Input Validation**: Using Pydantic schemas
- **Rate Limiting**: For API endpoints
- **HTTPS**: Enforced in production
- **Environment Variables**: Secure credential management

## Implementation Plan

See [plan.md](plan.md) for the complete implementation plan with detailed phases, tasks, and success criteria.

## Good to know

- The logo is in the `assets/logo` folder and is called `full-logo.png`.
- The favicons are in the `assets/favicons` folder and are called `favicon-16x16.png`, `favicon-32x32.png`, `favicon-96x96.png`, `favicon-128x128.png` and `favicon-196x196.png`.
- The font called `Inter` is used for all text.
- The mongodb connection string is in the `.env` file in a variable called `MONGODB_CONNECTION_STRING`.
