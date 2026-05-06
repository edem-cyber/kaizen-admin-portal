# API Setup Guide

This project uses **Orval** to generate type-safe API clients and React Query hooks from OpenAPI/Swagger specifications.

## Setup

### 1. Generate API Code

**Option A: Using Remote API (Requires Auth Token)**

If the OpenAPI endpoints require authentication, set the auth token:

```bash
export API_AUTH_TOKEN=your_token_here
npm run generate:api
```

Or create a `.env` file:
```
API_AUTH_TOKEN=your_token_here
```

**Option B: Using Local OpenAPI Files**

If you have the OpenAPI spec files locally, update `orval.config.ts` to use local paths:

```typescript
input: {
  target: './openapi-specs/requisition.json', // instead of URL
}
```

Then run:
```bash
npm run generate:api
```

This will:
- Fetch OpenAPI specs from the three services (or use local files)
- Generate TypeScript models and types
- Generate React Query hooks for all endpoints
- Output everything to `src/lib/generated/`

### 2. Watch Mode (Optional)

During development, you can watch for API spec changes:

```bash
npm run generate:api:watch
```

## Usage

### Using Generated Hooks

```tsx
'use client';

import { useListKaizen Admins } from '@/lib/generated/requisition/requisitions';

export function Kaizen AdminsList() {
  const { data, isLoading, error } = useListKaizen Admins({
    status: 'pending',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map((req) => (
        <div key={req.id}>{req.title}</div>
      ))}
    </div>
  );
}
```

### Using Mutations

```tsx
'use client';

import { useCreateKaizen Admin } from '@/lib/generated/requisition/requisitions';

export function CreateKaizen AdminForm() {
  const mutation = useCreateKaizen Admin();

  const handleSubmit = async (data: Kaizen AdminCreate) => {
    try {
      await mutation.mutateAsync({ data: { body: data } });
      // Success!
    } catch (error) {
      // Handle error
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Project Structure

```
src/
  lib/
    api-client.ts          # Base axios client with interceptors
    react-query-provider.tsx  # React Query provider wrapper
    generated/             # Generated code (gitignored)
      requisition/         # Kaizen Admin service API
      org/                 # Org service API
      user/                # User service API
```

## Configuration

The Orval configuration is in `orval.config.ts`. It's set up to:
- Generate React Query hooks
- Use axios for HTTP requests
- Use custom mutator for base URL handling
- Split by tags for better organization

## Notes

- Generated files are in `.gitignore` - regenerate after cloning
- API base URLs are configured in `src/lib/api-client.ts`
- Auth tokens should be added to the request interceptor in `api-client.ts`

