# Getting Started with PMOS

Welcome to PMOS! This guide will help you get up and running quickly.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **PostgreSQL** 14+
- **Redis** 7+
- **Git**
- **Docker** (optional, for easier setup)

---

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)

The easiest way to get started is with Docker Compose:

```bash
# Clone the repository
git clone https://github.com/your-username/pmos.git
cd pmos

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec api npm run db:migrate

# Seed sample data
docker-compose exec api npm run db:seed

# Open the application
open http://localhost:3000
```

### Option 2: Manual Setup

#### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-username/pmos.git
cd pmos

# Install dependencies
npm install
```

#### 2. Set Up Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
```

#### 3. Configure Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/pmos"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# AI Providers (at least one required)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# GitHub Integration (optional)
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

#### 4. Set Up Database

```bash
# Create database
createdb pmos

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

#### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 🎯 First-Time Setup

When you first open PMOS, you'll be guided through:

### 1. Create Account

- Sign up with email or OAuth (GitHub, Google)
- Verify your email address

### 2. Create Organization

- Enter your organization name
- Invite team members (optional)

### 3. Choose Your Mode

Select how you want to start:

| Mode | Description |
|------|-------------|
| **Existing Website** | Analyze and improve an existing website |
| **GitHub Repository** | Understand and extend an existing codebase |
| **Greenfield** | Build a new product from scratch |

### 4. Connect Integrations

Optional integrations to enhance your experience:

- **GitHub** - Repository access, issues, PRs
- **Figma** - Design imports
- **Slack** - Notifications
- **Analytics** - Amplitude, Mixpanel, PostHog

---

## 📚 Core Concepts

### Product Knowledge Graph

PMOS connects everything through a knowledge graph:

```
Customer → Persona → Journey → Story → Design → Code → Deploy → Analytics
```

Every artifact is linked, providing full traceability.

### AI Agents

PMOS uses specialized AI agents:

- **Product Manager** - Feature ownership
- **UX Researcher** - User understanding
- **UX Designer** - Design creation
- **Engineers** - Code implementation
- **QA** - Quality assurance

### Three Creation Modes

1. **Website Mode** - Analyze existing sites
2. **Repository Mode** - Understand existing code
3. **Greenfield Mode** - Build from scratch

---

## 🛠️ Development Workflow

### Working with Stories

1. **Create a Story**
   - From journey step, story map, or backlog
   - Add title, description, acceptance criteria

2. **Design the Story**
   - Generate wireframes with AI
   - Create mockups
   - Review and approve

3. **Implement the Story**
   - AI generates implementation plan
   - Agent creates branch and code
   - PR is created for review

4. **Review and Deploy**
   - Preview deployment
   - PM reviews functionality
   - Merge and release

### Using AI Agents

```typescript
// Example: Generate journey from website
const journey = await trpc.journey.generateFromWebsite.mutate({
  url: 'https://example.com'
});

// Example: Generate implementation plan
const plan = await trpc.implementation.generatePlan.mutate({
  storyId: 'story-123'
});

// Example: Assign agent to task
await trpc.implementation.assignAgent.mutate({
  implementationId: 'impl-123',
  agentRole: 'frontend-engineer'
});
```

---

## 📖 Useful Commands

### Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check
```

### Database

```bash
# Run migrations
npm run db:migrate

# Create migration
npm run db:migrate:create -- --name add_new_table

# Rollback migration
npm run db:migrate:rollback

# Seed database
npm run db:seed

# Reset database
npm run db:reset
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🤝 Getting Help

### Documentation

- [Architecture Overview](./architecture/overview.md)
- [System Design](./architecture/system-design.md)
- [Data Model](./architecture/data-model.md)
- [Module Documentation](./modules/)

### Community

- **GitHub Discussions** - Ask questions, share ideas
- **Discord** - Real-time chat with the community
- **Twitter** - Follow for updates @pmos_dev

### Reporting Issues

Found a bug? Please [open an issue](https://github.com/your-username/pmos/issues/new?template=bug_report.md) with:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

---

## 🎓 Next Steps

Once you're set up, explore:

1. [Customer Journey Engine](./modules/customer-journey.md) - Map your customer's journey
2. [Story Mapping](./modules/story-mapping.md) - Organize your backlog
3. [AI Agents](./agents/) - Learn about specialized agents
4. [Integrations](./integrations/) - Connect your tools

---

Welcome to PMOS! We're excited to have you. 🎉
