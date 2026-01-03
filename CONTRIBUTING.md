# Contributing to Bugdet

Thank you for your interest in contributing to Bugdet! This document provides guidelines and information for contributors.

## Table of Contents

- [How We Work](#how-we-work)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Issue Guidelines](#issue-guidelines)

## How We Work

We heavily use **GitHub Issues** to manage our tasks and backlog. Before starting any work:

1. **Check existing issues** - Look for an issue that describes what you want to work on
2. **Create an issue if needed** - If no issue exists, create one describing your proposed change
3. **Wait for assignment** - Comment on the issue to express interest and wait for maintainer feedback
4. **Get assigned** - Once assigned, you can start working on the issue

### Issue Labels

We use labels to categorize and prioritize issues:

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working correctly |
| `enhancement` | New feature or improvement request |
| `documentation` | Documentation improvements |
| `good first issue` | Good for newcomers to the project |
| `help wanted` | Extra attention is needed |
| `priority: high` | High priority items |
| `priority: low` | Lower priority items |

## Getting Started

### Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/)
- [Docker](https://www.docker.com/)
- Git

### Setting Up Your Development Environment

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/bugdet.git
   cd bugdet
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/joaopcm/bugdet.git
   ```

4. **Install dependencies**

   ```bash
   pnpm install
   ```

5. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   See the [README](README.md#environment-variables) for required variables.

6. **Start the database**

   ```bash
   pnpm db:start
   ```

7. **Run migrations**

   ```bash
   pnpm db:migrate
   ```

8. **Start the development server**

   ```bash
   pnpm dev
   ```

## Development Workflow

### Creating a Branch

Always create a new branch for your work:

```bash
# Sync with upstream first
git fetch upstream
git checkout main
git merge upstream/main

# Create your feature branch
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Convention

- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

### Running Tests and Linting

Before submitting your changes, make sure the code passes linting:

```bash
pnpm lint
```

The project uses [Biome](https://biomejs.dev/) for linting and formatting. Pre-commit hooks will automatically check your staged files.

### Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Run linter |
| `pnpm email` | Preview email templates |
| `pnpm db:start` | Start database containers |
| `pnpm db:stop` | Stop database containers |
| `pnpm db:generate` | Generate new migrations |
| `pnpm db:migrate` | Run pending migrations |

## Pull Request Process

### Before Submitting

1. **Ensure your code follows the style guidelines**
2. **Update documentation** if needed
3. **Test your changes** thoroughly
4. **Sync with upstream** to avoid merge conflicts

### Submitting a Pull Request

1. **Push your branch**

   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request**

   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

3. **PR Title Format**

   Use conventional commit format:
   - `feat: add new transaction filter`
   - `fix: resolve category deletion bug`
   - `docs: update API documentation`
   - `refactor: simplify auth logic`
   - `chore: update dependencies`

4. **PR Description**

   Include:
   - Summary of changes
   - Related issue number (e.g., "Closes #123")
   - Screenshots for UI changes
   - Testing instructions

### After Submitting

- **Respond to feedback** promptly
- **Make requested changes** in new commits
- **Keep your branch updated** with the base branch

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-reviewed the code
- [ ] Added/updated documentation as needed
- [ ] No new warnings introduced
- [ ] Related issue is linked

## Code Style

We use [Biome](https://biomejs.dev/) for consistent code formatting and linting.

### Key Style Rules

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for JavaScript/TypeScript
- **Semicolons**: No semicolons
- **Trailing commas**: Always
- **JSX quotes**: Double quotes

### Import Ordering

Imports should be organized as:
1. External dependencies
2. Internal aliases (`@/`)
3. Relative imports

### TypeScript

- Use explicit types when inference isn't clear
- Prefer `interface` over `type` for object shapes
- Use strict null checks

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Changes that don't affect code meaning |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding missing tests |
| `chore` | Changes to build process or tools |

### Examples

```bash
feat(transactions): add bulk delete functionality

fix(auth): resolve session timeout issue

docs(readme): update installation instructions

refactor(api): simplify error handling in tRPC routers
```

## Issue Guidelines

### Creating a Bug Report

Include:
- Clear, descriptive title
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, browser, Node version)
- Screenshots if applicable

### Creating a Feature Request

Include:
- Clear description of the feature
- Use case / motivation
- Proposed solution (if you have one)
- Alternative solutions considered

### Issue Templates

When creating issues, please use the appropriate template if available.

## Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Open a new issue with the `question` label
3. Be patient - maintainers are often volunteers

## Code of Conduct

Be respectful and inclusive. We want Bugdet to be a welcoming community for everyone.

---

Thank you for contributing to Bugdet!
