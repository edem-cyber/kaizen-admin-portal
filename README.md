# Kaizen Admin Web

A Next.js web application for requisition management with type-safe API integration.

## Quick Start

```bash
# Install dependencies
npm install

# Generate API code from OpenAPI specs
npm run generate:api

# Start development server
npm run dev
```

## 📖 Documentation

- **[CONTEXT.md](./CONTEXT.md)** - Full project context for LLMs/developers
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture overview
- **[API_SETUP.md](./API_SETUP.md)** - API code generation guide
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - File structure details

## 🎯 For New LLM Sessions

**Read [CONTEXT.md](./CONTEXT.md) first** - it contains everything needed to understand:
- Project goals and architecture
- What's been built
- How to use the generated API hooks
- Next steps to continue development

## Key Features

- ✅ Type-safe API clients (auto-generated from OpenAPI)
- ✅ React Query for data fetching
- ✅ Zustand for state management
- ✅ shadcn/ui sidebar navigation
- ✅ Protected routes with auth
- ✅ localStorage-based authentication

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- React Query (TanStack Query)
- Zustand
- shadcn/ui
- Tailwind CSS
- Orval (API code generation)
