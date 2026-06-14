This is the [assistant-ui](https://github.com/Yonom/assistant-ui) starter project with **GitLab Project Management Assistant** and **chat persistence**.

## Features

- 🤖 **AI Assistant**: Xmasih - GitLab project management assistant
- 💬 **Chat Persistence**: All conversations saved to database
- 🎨 **Modern UI**: Beautiful chat interface with assistant-ui
- 🔧 **GitLab Integration**: List and create projects via natural language
- 📱 **Responsive Design**: Works on desktop and mobile
- 🌙 **Dark Mode**: Built-in theme support

## Getting Started

### 1. Environment Setup

Create a `.env.local` file with your API keys:

```bash
# Database
DATABASE_URL="file:./dev.db"

# AI Provider (Cerebras)
CEREBRAS_API_KEY="your-cerebras-api-key"

# GitLab Integration
GITLAB_TOKEN="your-gitlab-token"
GITLAB_URL="https://gitlab.com/api/v4"
```

### 2. Database Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma db push
```

### 3. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. **Start a new chat**: Visit the homepage to automatically create a new chat
2. **Manage GitLab projects**: Ask Xmasih to:
   - "List all my projects"
   - "Create a new project called 'my-app' in group 123"
   - "Show me project details"
3. **Chat history**: All conversations are automatically saved and persisted

## Production Deployment

This application is production-ready and can be deployed to:
- Vercel (recommended)
- Railway
- Render
- Any platform supporting Next.js

For production, use a proper database like PostgreSQL instead of SQLite.
