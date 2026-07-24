# Contributing to PMOS

Thank you for your interest in contributing to PMOS! This guide will help you get started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Documentation](#documentation)
- [Community](#community)

---

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 7+
- Git
- Docker (optional, for local development)

### Setup

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone
   git clone https://github.com/YOUR_USERNAME/pmos.git
   cd pmos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

---

## 🤝 How to Contribute

### Types of Contributions

We welcome various types of contributions:

| Type | Description |
|------|-------------|
| 🐛 **Bug Fixes** | Fix issues in existing code |
| ✨ **Features** | Implement new features |
| 📖 **Documentation** | Improve docs, add examples |
| 🧪 **Tests** | Add or improve test coverage |
| 🎨 **Design** | UI/UX improvements |
| 🔧 **Tooling** | Developer experience improvements |
| 🤖 **AI Skills** | Create or improve AI agent skills |
| 💡 **Ideas** | Propose new features or improvements |

### Finding Issues

- Look for issues labeled `good first issue` for beginners
- Check `help wanted` for areas where we need assistance
- Browse `enhancement` for feature requests

---

## 🔄 Development Process

### Branching Strategy

We use a simplified Git flow:

```
main (production)
├── develop (development)
│   ├── feature/xxx
│   ├── bugfix/xxx
│   └── docs/xxx
```

### Creating a Branch

```bash
# Update your local main
git checkout main
git pull origin main

# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b bugfix/issue-number-description
```

### Commit Messages

Use conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(journey): add drag-and-drop journey editor

fix(auth): resolve login redirect loop

docs(readme): update installation instructions

test(api): add integration tests for story endpoints
```

---

## 📬 Pull Request Process

### Before Submitting

1. **Ensure your code follows our standards**
   ```bash
   npm run lint
   npm run type-check
   ```

2. **Run tests**
   ```bash
   npm test
   ```

3. **Update documentation** if needed

4. **Sync with main**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

### Submitting a PR

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub

3. **Fill out the PR template**
   - Description of changes
   - Related issues
   - Testing performed
   - Screenshots (if UI changes)

4. **Request review** from maintainers

### PR Review Process

- At least one maintainer approval required
- All CI checks must pass
- Address review feedback promptly
- Squash and merge when approved

---

## 📏 Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful variable/function names

### React/Frontend

- Use functional components with hooks
- Follow component naming conventions
- Keep components small and focused
- Use proper TypeScript types

### API/Backend

- Follow RESTful conventions
- Use proper HTTP status codes
- Validate all inputs
- Handle errors gracefully

### Testing

- Write unit tests for business logic
- Write integration tests for APIs
- Aim for 80%+ code coverage
- Test edge cases

---

## 📚 Documentation

### Writing Docs

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep docs up-to-date with code changes

### Documentation Types

- **README**: Project overview and quick start
- **API Docs**: Endpoints, request/response examples
- **Module Docs**: Detailed module documentation
- **Guides**: Step-by-step tutorials
- **ADRs**: Architecture Decision Records

---

## 🏷️ Labels

| Label | Description |
|-------|-------------|
| `good first issue` | Perfect for beginners |
| `help wanted` | We need assistance |
| `bug` | Something is broken |
| `enhancement` | New feature request |
| `documentation` | Docs improvement |
| `question` | Need more info |
| `wontfix` | Not planned |
| `duplicate` | Already exists |

---

## 🌟 Recognition

Contributors will be recognized in:
- README Contributors section
- Release notes
- Annual contributor highlights

---

## ❓ Questions?

- 💬 [GitHub Discussions](https://github.com/YOUR_USERNAME/pmos/discussions)
- 📧 Email: contribute@pmos.dev
- 💻 Discord: [Join our server](https://discord.gg/pmos)

---

Thank you for contributing to PMOS! 🎉
