# Frontend Structure - InvestEase

## Current Implementation

### ✅ Completed
- **Authentication Pages**: Login and Register pages at `/auth/login` and `/auth/register`
- **Form Validation**: Zod schemas for form validation with React Hook Form
- **Form Components**: Reusable LoginForm and RegisterForm components
- **Home Page**: Welcome page with links to auth pages
- **Type System**: TypeScript interfaces for User and Auth responses
- **API Client**: Ready-to-use API client (commented backend integration)

## Folder Structure

```
frontend/
├── app/
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── register/
│   │       └── page.tsx          # Register page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Home page
├── components/
│   ├── LoginForm.tsx             # Login form component
│   └── RegisterForm.tsx          # Register form component
├── lib/
│   ├── validations.ts            # Zod validation schemas
│   └── api.ts                    # API client (TODO: implement)
├── types/
│   └── index.ts                  # TypeScript interfaces
└── tsconfig.json                 # Path alias: @/*
```

## How to Run

```bash
cd frontend
npm run dev
```

Visit: `http://localhost:3000`

## Next Steps

1. **Uncomment API calls** in `components/LoginForm.tsx` and `components/RegisterForm.tsx`
2. **Set NEXT_PUBLIC_API_URL** in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
3. **Test auth endpoints** with the backend

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Welcome page with feature overview |
| `/auth/login` | User login form |
| `/auth/register` | User registration form |

## Key Files

- **lib/validations.ts** - Zod schemas matching backend requirements
- **types/index.ts** - TypeScript interfaces (User, AuthResponse)
- **lib/api.ts** - API client for backend communication
- **components/LoginForm.tsx** - Login form with validation
- **components/RegisterForm.tsx** - Register form with validation

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Zod (validation)
- React Hook Form (form handling)
- Tailwind CSS (styling)

## Validation Rules

### Register
- Email: Valid email format required
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
- Confirm Password: Must match password
- Full Name: Min 2 characters

### Login
- Email: Valid email format required
- Password: Required field

## Backend Integration

The API client is ready in `lib/api.ts`. To enable backend calls:

1. Uncomment the fetch calls in form components
2. Implement error handling
3. Add token storage (localStorage/cookies)
4. Add protected routes middleware
