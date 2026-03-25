---
paths: ["apps/web/**/*.tsx"]
---
# React Component Rules
- Server Components by default, 'use client' only when needed
- Tailwind CSS for styling, no CSS modules
- Radix UI for interactive primitives
- All props validated with TypeScript (no PropTypes)
- Colocate component tests as ComponentName.test.tsx
