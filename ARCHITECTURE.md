# Kaizen Admin Web - Architecture Setup

## ✅ Completed Setup

### 1. **State Management**
- ✅ **Zustand** installed and configured
- ✅ **Auth Store** (`src/stores/auth-store.ts`)
  - Persists to localStorage automatically
  - Manages user, token, and auth state
  - Actions: `setAuth`, `setUser`, `logout`, `setLoading`

### 2. **Authentication**
- ✅ **Token Storage** (`src/lib/auth/token-storage.ts`)
  - localStorage-based token management
  - User data storage
  - Clear all auth data
- ✅ **Auth Hook** (`src/hooks/use-auth.ts`)
  - Easy access to auth state and actions
- ✅ **Protected Routes** (`src/components/auth/protected-route.tsx`)
  - Redirects unauthenticated users to login
  - Loading state handling

### 3. **API Integration**
- ✅ **API Client** updated (`src/lib/api-client.ts`)
  - Automatically adds auth token from localStorage
  - Handles 401 errors (auto-logout)
  - Base URL selection for 3 services

### 4. **UI Components (shadcn/ui)**
- ✅ **Sidebar** component installed
- ✅ **Base UI components**: Button, Input, Separator, Sheet, Tooltip, Skeleton
- ✅ **Icons**: lucide-react installed

### 5. **Layout Structure**
- ✅ **Dashboard Layout** (`src/components/layout/admin-layout.tsx`)
  - Sidebar navigation
  - Header with user info and logout
  - Main content area
- ✅ **App Sidebar** (`src/components/layout/app-sidebar.tsx`)
  - Navigation menu items
  - Active route highlighting
  - Icons for each section

### 6. **Routing**
- ✅ **Route Groups**:
  - `(dashboard)` - Protected routes with sidebar
  - Dashboard page created at `/admin`

## 📁 Folder Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected routes
│   │   ├── layout.tsx        # Dashboard layout wrapper
│   │   └── dashboard/
│   │       └── page.tsx      # Dashboard page
│   └── layout.tsx            # Root layout
│
├── components/
│   ├── auth/
│   │   └── protected-route.tsx
│   ├── layout/
│   │   ├── app-sidebar.tsx
│   │   └── dashboard-layout.tsx
│   └── ui/                   # shadcn/ui components
│
├── hooks/
│   └── use-auth.ts
│
├── lib/
│   ├── auth/
│   │   └── token-storage.ts
│   ├── api-client.ts
│   ├── generated/            # Auto-generated API code
│   └── utils.ts
│
└── stores/
    └── auth-store.ts
```

## 🚀 Usage Examples

### Using Auth

```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) return <div>Not logged in</div>;
  
  return <div>Welcome, {user?.name}</div>;
}
```

### Using API Hooks

```typescript
import { useListKaizen AdminsApiV1Kaizen AdminsGet } from '@/lib/generated/requisition/requisitions-v1';

function Kaizen AdminsList() {
  const { data, isLoading } = useListKaizen AdminsApiV1Kaizen AdminsGet({
    status: 'pending',
  });
  
  // data is fully typed!
}
```

### Protected Routes

All routes in `app/(dashboard)/` are automatically protected. The layout handles:
- Authentication check
- Sidebar navigation
- User info display
- Logout functionality

## 🎯 Next Steps

1. **Create Login Page** (`app/(auth)/login/page.tsx`)
2. **Add more dashboard pages** (requisitions, approvals, etc.)
3. **Create form components** for requisition creation
4. **Add error boundaries** and loading states
5. **Implement real-time updates** (if needed)

## 📦 Installed Packages

- `zustand` - State management
- `lucide-react` - Icons
- `@tanstack/react-query` - Data fetching (already installed)
- `shadcn/ui` components - UI library

