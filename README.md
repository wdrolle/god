This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Next.js on 3000 (fallback to 3001)
Twilio webhook server on 3002
ngrok tunneling to 3002

```bash
npm run dev        # Terminal 1 - Next.js
npm run server     # Terminal 2 - Twilio Server
npm run tunnel     # Terminal 3 - ngrok

# OR

npm run start-all # Start all services
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



# Daily Bible Verses SMS Application
## Database Setup with Prisma, PostgreSQL, and Supabase
### 1. Prisma Setup
1. Install Prisma dependencies:
```bash
npm install prisma @prisma/client
npm install -D prisma
```

2. Initialize Prisma:
```bash
npx prisma init
```

3. Configure schema.prisma:
```prisma
datasource db {
provider = "postgresql"
url = env("DATABASE_URL")
directUrl = env("DIRECT_URL")
extensions = [uuid_ossp(map: "uuid-ossp", schema: "extensions")]
schemas = ["god"]
}
```

4. Generate Prisma client:
``` bash
npx prisma generate
```

### 2. PostgreSQL/Supabase Configuration

1. Set up environment variables (.env):
```env
Connect to Supabase via connection pooling with Supavisor
DATABASE_URL="postgresql://postgres.fquqnvtknptzdycxyzug:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
Direct connection to the database (for migrations)
DIRECT_URL="postgresql://postgres.fquqnvtknptzdycxyzug:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

2. Check existing tables:
```bash
psql "${DIRECT_URL}?sslmode=require" -c "\dt god."
```

3. Force sync database schema:
```bash
# Create force_sync.sql
psql "${DIRECT_URL}?sslmode=require" -f prisma/migrations/force_sync.sql
Push schema changes
npx prisma db push
```

### 3. Supabase Integration

1. Install Supabase client:
```bash
npm install @supabase/auth-helpers-nextjs @supabase/supabase-js
```

2. Set up Prisma client (lib/prisma.ts):
```typescript
import { PrismaClient } from '@prisma/client'
declare global {
var prisma: PrismaClient | undefined
}
export const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') {
global.prisma = prisma
}
```
3. Database Schema Migration Steps:
```bash
Create migrations directory
mkdir -p prisma/migrations
Generate baseline SQL
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > baseline.sql
Apply migrations
npx prisma migrate dev --name init
Push schema changes
npx prisma db push
```

### Important Notes

- Use port 6543 for pooled connections (DATABASE_URL)
- Use port 5432 for direct connections (DIRECT_URL)
- Always use sslmode=require for Supabase connections
- Schema name prefix: 'god_' for all tables
- Enable Row Level Security (RLS) for all tables
- Set up proper indexes for performance
- Use EST timezone for all timestamps

### Common Commands

```bash
Check database tables
psql "${DIRECT_URL}?sslmode=require" -c "\dt god."
Reset database schema
npx prisma db push --force-reset
Generate Prisma client
npx prisma generate
Create new migration
npx prisma migrate dev --name <migration_name>
```

### Troubleshooting

If you encounter connection issues:
1. Verify SSL mode is enabled
2. Check correct port usage (6543 vs 5432)
3. Ensure proper schema permissions
4. Verify environment variables are loaded

### API Routes:
app/api/chat/conversations/route.ts             - Handles conversation creation (404 error here)
app/api/chat/conversations/[id]/route.ts        - Handles individual conversation updates
app/api/chat/messages/[conversationId]/route.ts - Handles messages for a conversation
app/api/bible-chat/route.ts                     - Handles AI responses
app/api/generate-message/route.ts               - Handles message generation

### Page Components:
app/(main)/(routes)/bible-chat/page.tsx         - Main chat interface

### Middleware and Config:
middleware.ts                                   - Handles API route protection
next.config.js                                  - Next.js configuration

### Types and Utils:
types/chat.ts                                   - Type definitions for chat features
lib/prisma.ts                                   - Prisma client setup
lib/utils/ollama.ts                             - AI integration

### Database Schema:      
prisma/schema.prisma                            - Database schema definitions

### The flow of operations:
#### User submits message → bible-chat/page.tsx
#### Page tries to create conversation → POST /api/chat/conversations
#### 404 error suggests route isn't registered → Check route.ts file location
#### If conversation exists, sends message → POST /api/bible-chat
#### Message saved to database → Uses Prisma schema
#### AI response generated → Uses Ollama integration

### Common issues to check:
1. File naming: Ensure route.ts is correctly named
2. File location: Verify path structure matches Next.js conventions
3. Export configuration: Check dynamic and runtime exports
4. Middleware: Verify it's not blocking requests
5. Database schema: Confirm tables exist and match Prisma schema

# Reverting Authentication Changes

If you need to revert to the previous working version using NextAuth.js, follow these steps:

1. Restore the original auth files:

```bash
# Restore NextAuth configuration
git checkout god-chat/12-23-2024-15-56 -- lib/auth.ts
git checkout god-chat/12-23-2024-15-56 -- app/api/auth/[...nextauth]/route.ts
git checkout god-chat/12-23-2024-15-56 -- app/(auth)/login/page.tsx
```

2. Remove Supabase auth files:

```bash
rm -f app/api/auth/session/route.ts
```

3. Update middleware.ts to use NextAuth:

```typescript
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/codes/:path*',
    '/stakeholders/:path*',
    '/server/:path*',
    '/protected-route/:path*',
    '/bible-chat/:path*',
  ]
}
```

4. Ensure your .env.local has the correct NextAuth configuration:

```env
NEXTAUTH_URL=http://172.29.38.191:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

5. Update dependencies:

```bash
# Remove Supabase auth dependencies
npm uninstall @supabase/auth-helpers-nextjs

# Ensure NextAuth dependencies are installed
npm install next-auth@latest @next-auth/prisma-adapter bcryptjs
```

6. Clear browser data:
- Clear your browser's cookies and local storage
- Clear your browser cache

7. Restart your development server:

```bash
npm run dev
```

## Note
This reversion will:
- Restore NextAuth.js authentication
- Remove Supabase authentication
- Keep your existing UI and components
- Maintain your existing database connections
- Preserve your protected routes

## Troubleshooting

If you encounter issues after reverting:

1. Clear Next.js cache:
```bash
rm -rf .next
```

2. Reset node modules:
```bash
rm -rf node_modules
npm install
```

3. Verify your database connection:
```bash
npx prisma generate
```

4. Check your session:
```bash
# Visit this endpoint in your browser
http://localhost:3000/api/auth/session
```

For more information about the previous implementation, refer to the commit at `god-chat/12-23-2024-15-56`.

# Git Restoration Guide

### 1. Check Available References
```bash
# List all branches
git branch -a

# List all tags
git tag -l
```

### 2. Safeguard Current Work
```bash
# Check status
git status

# Stash changes if needed
git stash save "Saving changes before restoration"
```

### 3. Restoration Commands

#### Option 1: Direct Checkout
```bash
# Checkout specific commit
git checkout god-chat/12-23-2024-15-56

# Create new branch from this point
git checkout -b restore-branch
```

#### Option 2: Reset Current Branch
```bash
# Hard reset (warning: destructive)
git reset --hard god-chat/12-23-2024-15-56

# Force push if needed
git push origin main --force
```

#### Option 3: Revert Changes
```bash
# Revert specific commits
git revert <commit-sha>
```

### 4. Verify Restoration
```bash
# Check status
git status

# View current position
git log --oneline --graph --decorate
```

### 5. Recovery Options
```bash
# Recover stashed changes
git stash list
git stash apply

# Undo hard reset
git reset --hard ORIG_HEAD
```

## Common Issues and Solutions

### Reference Not Found
```bash
# Fetch all remote references
git fetch --all

# Check remote references
git ls-remote origin
```

### Merge Conflicts
```bash
# Abort current merge
git merge --abort

# Start fresh
git reset --hard HEAD
```

### Detached HEAD State
```bash
# Create new branch
git checkout -b recovery-branch

# Or return to main branch
git checkout main
```

## Best Practices

1. Always create a backup branch before major changes
2. Use `git stash` to save uncommitted work
3. Verify the target reference before restoration
4. Test the application after restoration
5. Document the restoration process

For more detailed Git operations and recovery procedures, refer to the [Git documentation](https://git-scm.com/doc).