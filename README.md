# Iconic ChatGPT Frontend

This project recreates the small streaming chat app from the referenced Medium article and wraps it in a more polished ChatGPT-inspired interface.

## What was built

- Next.js app router setup
- `/api/chat` streaming proxy to OpenAI
- Responsive chat UI with sidebar, prompt starters, and live assistant streaming

## Setup

1. Create `.env.local` and add your API key:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

2. Install dependencies with a package manager available on your machine.

3. Start the dev server:

```bash
pnpm dev
```

If `pnpm` is not installed globally, you can usually enable it through Corepack:

```bash
corepack enable
corepack prepare pnpm@10.6.3 --activate
```
