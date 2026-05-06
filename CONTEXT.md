# Kaizen Admin Web - Project Context

## 🎯 Project Goal

Build a **Next.js web application** for requisition management that:
- Connects to 3 backend API services (Kaizen Admin, Org, User)
- Uses **React Query (TanStack Query)** for data fetching
- Uses **Zustand** for client-side state management
- Has a **shadcn/ui sidebar** navigation
- Uses **localStorage** for authentication tokens
- Generates type-safe API clients from OpenAPI/Swagger specs using **Orval**

## 🏗️ Architecture Overview

### Tech Stack
- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **React Query** (@tanstack/react-query) - Server state
- **Zustand** - Client state management
- **shadcn/ui** - UI component library
- **Orval** - API code generation from OpenAPI specs
- **Axios** - HTTP client
- **localStorage** - Auth token storage

### API Services
1. **Kaizen Admin Service** - Main requisition management
   - Base URL: `https://api.sandbox.kaizen-aceit.com/requisition`
   - OpenAPI: `/requisition/openapi.json` (public, no auth)
   - ✅ **Generated and working**

2. **Org Service** - Organization management
   - Base URL: `https://api.sandbox.kaizen-aceit.com/org`
   - OpenAPI: `/org/docs/swagger.json` (requires auth)
   - ✅ **Generated and working**

3. **User Service** - User management & auth
   - Base URL: `https://api.sandbox.kaizen-aceit.com/user`
   - OpenAPI: `/user/docs/swagger.json` (requires auth)
   - ✅ **Generated and working**

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/              # Protected routes with sidebar
│   │   ├── layout.tsx            # Dashboard layout wrapper
│   │   └── dashboard/
│   │       └── page.tsx          # Dashboard page
│   └── layout.tsx                # Root layout (React Query provider)
│
├── components/
│   ├── auth/
│   │   └── protected-route.tsx   # Auth guard component
│   ├── layout/
│   │   ├── app-sidebar.tsx       # Sidebar navigation
│   │   └── dashboard-layout.tsx  # Main dashboard layout
│   └── ui/                       # shadcn/ui components
│
├── hooks/
│   └── use-auth.ts               # Auth hook (wraps Zustand store)
│
├── lib/
│   ├── auth/
│   │   └── token-storage.ts      # localStorage token utilities
│   ├── api-client.ts             # Axios client with interceptors
│   ├── generated/                # Auto-generated API code (gitignored)
│   │   ├── requisition/         # Kaizen Admin service hooks
│   │   ├── org/                 # Org service hooks
│   │   └── user/                # User service hooks
│   └── utils.ts                  # Utility functions
│
└── stores/
    └── auth-store.ts            # Zustand auth store
```

## ✅ What's Been Completed

### 1. API Code Generation (Orval)
- ✅ Orval configured for all 3 services
- ✅ TypeScript types and React Query hooks generated
- ✅ 700+ models and 100+ service hooks available
- ✅ Command: `npm run generate:api`

### 2. Authentication System
- ✅ Zustand auth store with localStorage persistence
- ✅ Token storage utilities
- ✅ `useAuth()` hook for easy access
- ✅ Protected route wrapper
- ✅ API client auto-injects auth tokens
- ✅ Auto-logout on 401 errors

### 3. UI & Layout
- ✅ shadcn/ui sidebar component installed
- ✅ Dashboard layout with sidebar navigation
- ✅ Breadcrumb navigation (auto-generated from pathname)
- ✅ Header with user info and logout button
- ✅ Base UI components (Button, Input, etc.)

### 4. State Management
- ✅ Zustand stores setup
- ✅ React Query provider configured
- ✅ Auth state persisted to localStorage

## 🔌 API Integration Pattern

### How to Use Generated Hooks

**Example: Login (User Service)**
```typescript
import { useLogin } from '@/lib/generated/user/auth/auth';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

function LoginForm() {
  const loginMutation = useLogin();
  const { setAuth } = useAuth();
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await loginMutation.mutateAsync({
        data: { username: email, password }
      });
      
      // Store auth token and user
      setAuth(response.access_token, response.user);
      
      // Redirect to dashboard
      router.push('/admin');
    } catch (error) {
      // Handle error
    }
  };
}
```

**Example: List Kaizen Admins**
```typescript
import { useListKaizen AdminsApiV1Kaizen AdminsGet } from '@/lib/generated/requisition/requisitions-v1';

function Kaizen AdminsList() {
  const { data, isLoading, error } = useListKaizen AdminsApiV1Kaizen AdminsGet({
    status: 'pending',
    limit: 10,
  });

  // data is fully typed as Kaizen Admin[]
  return <div>{/* render */}</div>;
}
```

**Example: Create Kaizen Admin**
```typescript
import { useCreateKaizen AdminApiV1Kaizen AdminsPost } from '@/lib/generated/requisition/requisitions-v1';
import type { Kaizen AdminCreate } from '@/lib/generated/requisition/models';

function CreateKaizen Admin() {
  const mutation = useCreateKaizen AdminApiV1Kaizen AdminsPost({
    mutation: {
      onSuccess: () => {
        // Invalidate and refetch list
        queryClient.invalidateQueries(['/api/v1/requisitions/']);
      },
    },
  });
  
  const handleSubmit = async (formData: Kaizen AdminCreate) => {
    await mutation.mutateAsync({ data: formData });
  };
}
```

### Available Services

**Kaizen Admin Service** (`src/lib/generated/requisition/`)
- `requisitions-v1` - Main requisition operations
- `approvals-v1` - Approval workflows
- `budget-v1` - Budget management
- `vendors-v1` - Vendor management
- `committees-v1` - Committee reviews
- `documents-v1` - File management
- `discussions-v1` - Comments & discussions
- `notifications-v1` - Real-time notifications
- `workflow-v1` - Workflow engine
- `configuration-v1` - Settings
- Plus 5 more service modules

**Org Service** (`src/lib/generated/org/`)
- `organizations` - Organization CRUD
- `projects` - Project management
- `countries` - Country management
- `organization-groups` - Group management
- `organization-types` - Type management
- `organization-configs` - Configuration
- `system` - System endpoints

**User Service** (`src/lib/generated/user/`)
- `auth` - Authentication endpoints
- `users` - User management
- `permissions` - Permission management
- `permission-groups` - Permission groups
- `organization-roles` - Role management
- `password-policies` - Password policies
- `user-statuses` - Status management
- `system` - System endpoints

## 🚧 What Needs to Be Built

### Priority 1: Authentication Flow
- [ ] Login page (`app/(auth)/login/page.tsx`)
- [ ] Signup page (if needed)
- [ ] Use generated auth hooks from `user/auth` service
- [ ] Handle login response and store token/user

### Priority 2: Core Features
- [ ] Kaizen Admins list page (`app/(dashboard)/requisitions/page.tsx`)
- [ ] Kaizen Admin detail page
- [ ] Create requisition form
- [ ] Approvals page
- [ ] Vendors page
- [ ] Dashboard with stats (use counts endpoints)

### Priority 3: UI Components
- [ ] Kaizen Admin card/list item component
- [ ] Kaizen Admin form components
- [ ] Filter/search components
- [ ] Status badges
- [ ] Loading states
- [ ] Error states

## 🔑 Key Files to Know

### Auth
- `src/stores/auth-store.ts` - Auth state (Zustand)
- `src/lib/auth/token-storage.ts` - Token utilities
- `src/hooks/use-auth.ts` - Auth hook
- `src/components/auth/protected-route.tsx` - Route guard

### API
- `src/lib/api-client.ts` - Axios instance with interceptors
- `src/lib/generated/` - All generated API code (don't edit manually)
- `orval.config.ts` - Code generator config

### Layout
- `src/components/layout/admin-layout.tsx` - Main layout
- `src/components/layout/app-sidebar.tsx` - Sidebar nav
- `src/app/(dashboard)/layout.tsx` - Route group layout

## 📝 Important Notes

1. **Generated Code**: Never edit files in `src/lib/generated/` - regenerate with `npm run generate:api`

2. **Auth Token**: Automatically added to API requests via axios interceptor from localStorage

3. **Type Safety**: All API calls are fully typed - use TypeScript autocomplete

4. **React Query**: All hooks use React Query - automatic caching, refetching, error handling

5. **Route Protection**: All routes in `app/(dashboard)/` are automatically protected

6. **State Management**:
   - Server state → React Query (use generated hooks)
   - Client state → Zustand (use stores)

## 🎯 Next Steps for LLM

When continuing development:

1. **Start with Login Page**
   - Use `useLogin` from `@/lib/generated/user/auth/auth`
   - Hook: `const loginMutation = useLogin()`
   - On success: `useAuth().setAuth(response.access_token, response.user)`
   - Redirect to `/admin`
   - Example:
     ```typescript
     import { useLogin } from '@/lib/generated/user/auth/auth';
     import { useAuth } from '@/hooks/use-auth';
     
     const loginMutation = useLogin();
     const { setAuth } = useAuth();
     
     await loginMutation.mutateAsync({
       data: { email, password }
     });
     // Then: setAuth(response.access_token, response.user)
     ```

2. **Build Kaizen Admins List**
   - Use `useListKaizen AdminsApiV1Kaizen AdminsGet`
   - Create card/list components
   - Add filters and pagination

3. **Follow the Pattern**
   - Import generated hooks
   - Use React Query hooks for data
   - Use Zustand for UI state
   - Use shadcn/ui for components

## 🔄 Regenerating API Code

If API specs change:
```bash
npm run generate:api
```

This will regenerate all TypeScript types and React Query hooks from the OpenAPI specs.

## 📚 Key Commands

```bash
npm run dev              # Start dev server
npm run generate:api     # Regenerate API code
npm run build            # Build for production
```

---

**Current Status**: Base architecture complete. Ready to build features connecting to the APIs using the generated hooks.

