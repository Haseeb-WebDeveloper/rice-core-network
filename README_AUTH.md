# Supabase Authentication Setup

## Environment Variables Required

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database (already configured)
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
```

## How It Works

1. **Signup Flow**:
   - User fills out signup form (email, username, password)
   - Creates Supabase Auth user
   - Creates Prisma User record with auto-generated referral code
   - Redirects to `/user` page

2. **Login Flow**:
   - User enters email and password
   - Authenticates via Supabase
   - Redirects to `/user` page

3. **Route Protection**:
   - Middleware protects all routes except `/signup` and `/login`
   - Unauthenticated users are redirected to `/signup`
   - Authenticated users accessing auth pages are redirected to `/user`

4. **Root Page**:
   - Checks authentication status
   - Redirects to `/signup` if not authenticated
   - Redirects to `/user` if authenticated

## File Structure

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── middleware.ts      # Middleware client
│   └── auth/
│       ├── get-session.ts     # Get current session
│       ├── get-user.ts        # Get current user from Prisma
│       └── generate-referral-code.ts  # Generate unique referral codes
├── actions/
│   └── auth/
│       ├── signup.ts          # Signup server action
│       ├── login.ts           # Login server action
│       └── logout.ts         # Logout server action
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx         # Auth pages layout
│   │   ├── signup/
│   │   │   └── page.tsx       # Signup page
│   │   └── login/
│   │       └── page.tsx       # Login page
│   ├── user/
│   │   └── page.tsx           # Protected user page
│   └── page.tsx               # Root page with redirect logic
└── middleware.ts               # Route protection middleware
```

## Usage

### Get Current User (Server Component)

```typescript
import { getCurrentUser } from '@/lib/auth/get-user'

export default async function Page() {
  const user = await getCurrentUser()
  
  if (!user) {
    return <div>Not authenticated</div>
  }
  
  return <div>Welcome, {user.username}!</div>
}
```

### Get Session (Server Component)

```typescript
import { getSession } from '@/lib/auth/get-session'

export default async function Page() {
  const session = await getSession()
  
  if (!session) {
    redirect('/signup')
  }
  
  return <div>Authenticated</div>
}
```

### Logout (Client Component)

```typescript
'use client'

import { logout } from '@/actions/auth/logout'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  
  async function handleLogout() {
    await logout()
    router.push('/signup')
    router.refresh()
  }
  
  return <button onClick={handleLogout}>Logout</button>
}
```

## Notes

- Referral codes are auto-generated as 8-character alphanumeric strings (uppercase)
- Username and email must be unique (enforced by Prisma schema)
- Password minimum length is 6 characters
- All authentication is handled by Supabase Auth
- User data is stored in Prisma User table with extended fields

