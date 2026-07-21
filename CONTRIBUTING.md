# Contributing to SkillNova

Thank you for your interest in contributing to SkillNova! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 20 LTS (use `nvm use`)
- PostgreSQL database (Neon free tier works)
- Git 2.30+

### Setup

```bash
git clone https://github.com/rajat-wyrm/Skillnova.git
cd Skillnova

# Install dependencies
npm install
npm run server:install

# Set up environment
cp .env.example .env
cp server/.env.example server/.env
# Edit server/.env with your database URL and secrets

# Run database migrations
cd server
npm run prisma:generate
npm run prisma:push
npm run seed
cd ..

# Start development
npm start
```

## Development Workflow

### Branch Naming

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: resolve bug in login flow
docs: update API documentation
refactor: improve error handling
test: add unit tests for auth
chore: update dependencies
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run lint and tests: `npm run lint && npm test`
4. Push to your fork
5. Create a PR with a clear description
6. Wait for CI to pass
7. Request review

## Code Style

### Backend (Server)

- Use ES modules (`import/export`)
- Follow ESLint configuration
- Add JSDoc comments for public functions
- Use async/await for async operations

### Frontend

- Use functional components with hooks
- Follow React best practices
- Use Tailwind CSS for styling
- Add proper TypeScript types when applicable

## Testing

```bash
# Run all tests
npm test

# Run server tests
cd server && npm test

# Run lint
npm run lint
```

## Reporting Issues

When reporting issues, please include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Environment details
5. Screenshots if applicable

## Code of Conduct

Please be respectful and inclusive in all interactions.

## Questions?

Feel free to open an issue for any questions about contributing!
