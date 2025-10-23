# Copilot Instructions for BrowserBox

## Repository Overview

BrowserBox is an enterprise-grade Remote Browser Isolation (RBI) solution that provides secure, cross-platform web browsing. This is a commercial product that requires a license key for all usage.

## Key Technologies

- **Language**: JavaScript (ES2020+), with TypeScript type checking
- **Runtime**: Node.js with ESM modules
- **Build System**: Parcel bundler, esbuild
- **Package Manager**: npm
- **Process Manager**: PM2
- **Testing**: Custom test scripts in `scripts/` and `tests/`
- **Linting**: ESLint 9+ with flat config

## Repository Structure

- `src/` - Main source code including server and client components
- `src/server.js` - Main server entry point
- `src/public/` - Client-side public assets
- `src/zombie-lord/` - Browser automation and control layer
- `scripts/` - Build, deployment, and utility scripts
- `tests/` - Test suite
- `config/` - Configuration files
- `deploy-scripts/` - Deployment automation
- `docs/` - Documentation

## Development Workflow

### Building

```bash
npm run build        # Build only (scripts/only_build.sh)
npm run parcel       # Run Parcel bundler
npm run compile      # Full compile: parcel + build + package
```

### Testing

```bash
npm test             # Run test suite (scripts/run-test.sh)
npm run devtest      # Run development tests
npm run stop         # Stop test instances
```

### Linting

```bash
npm run lint         # Run linting (scripts/gglint.sh)
npm run check        # Run lint + TypeScript checking
npm run tsc-check    # TypeScript checking only
```

### Running Locally

```bash
npm run start        # Start BrowserBox (scripts/dstart.sh)
npm run dev          # Run with node-dev and inspector
```

## Coding Standards

### General Guidelines

1. **Module System**: Use ES6+ modules (import/export). The package.json is set to `"type": "module"`
2. **Target**: ES2020+ JavaScript features are supported
3. **Type Checking**: TypeScript is used for type checking (checkJs) but code is written in JavaScript
4. **Comments**: Follow existing comment style in the codebase - minimal but clear
5. **Error Handling**: Robust error handling is critical for security and reliability

### Code Style

- Follow the ESLint configuration in `eslint.config.js`
- Use consistent formatting with existing code
- Prefer const over let, avoid var
- Use async/await for asynchronous operations
- Follow existing naming conventions (camelCase for variables/functions, PascalCase for classes)

### Security Considerations

This is a security-critical application (RBI solution). Always consider:
- Input validation and sanitization
- Secure handling of credentials and tokens
- Protection against XSS, CSRF, and injection attacks
- Proper isolation between browser instances
- Secure WebSocket and HTTP communications

## Branching and Git Workflow

### Branch Naming Convention

**IMPORTANT**: Do NOT use slashes (/) in branch names. Use dashes (-) instead.

✅ **Correct:**
- `feature-add-new-api`
- `bugfix-memory-leak`
- `update-dependencies`

❌ **Incorrect:**
- `feature/add-new-api`
- `bugfix/memory-leak`
- `chore/update-dependencies`

**Reason**: Slashes don't work with the repository's scripting infrastructure.

### Commit Messages

- Use clear, descriptive commit messages
- Start with a verb in present tense (Add, Fix, Update, Remove, etc.)
- Reference issue numbers when applicable

## Testing Guidelines

1. Run tests before committing: `npm test`
2. Ensure build succeeds: `npm run build`
3. Run linting: `npm run lint`
4. Test any security-related changes thoroughly
5. For UI changes, test in multiple browsers

## Common Tasks

### Adding New Dependencies

1. Run security check before adding: use the `gh-advisory-database` tool
2. Install: `npm install <package>`
3. Verify build still works: `npm run build`
4. Update tests if needed

### Modifying Server Code

1. Main server logic is in `src/server.js`
2. Test changes with: `npm run dev`
3. Check TypeScript types: `npm run tsc-server`
4. Run full test suite: `npm test`

### Modifying Client Code

1. Client code is in `src/public/`
2. Rebuild with: `npm run parcel`
3. Check TypeScript types: `npm run tsc-public`
4. Test in browser

### Working with Scripts

- Most scripts are in `scripts/` directory
- Scripts are bash-based and use `exec.js` wrapper
- Always test script changes thoroughly
- Consider cross-platform compatibility (Linux, macOS, BSD)

## Special Considerations

### License Requirements

- All usage requires a valid product key/license
- This is a commercial product under Dosyago-Commercial-License
- Contributors must sign a CLA (see CONTRIBUTING.md)

### Platform Support

- Primary: Linux, macOS
- Also supports: Windows (via WSL), BSD variants
- Special: Windows 9x support in beta (for RBI client access)

### Environment Variables

Many configurations use environment variables:
- Check `config/` directory for env file templates
- `test.env`, `hosts.env`, `torbb.env` are common config files
- Never commit sensitive values (tokens, keys) to repository

## Documentation

- Keep README.md updated for user-facing changes
- Document new APIs and features
- Update help text for CLI commands
- Maintain code comments for complex logic

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `bbx-saga.yaml` - Main test suite
- `basic-install.yaml` - Installation tests
- `codeql-analysis.yml` - Security scanning

Ensure your changes don't break CI builds.

## Getting Help

- Review existing code for patterns and examples
- Check the README.md for setup and usage
- Reference the docs/ directory for detailed documentation
- For security concerns, be extra cautious and thorough

## Important Files

- `package.json` - Dependencies and scripts
- `eslint.config.js` - Linting configuration
- `src/server.js` - Main server entry point
- `branch-bbx.cjs` - CLI entry point (bbx-install command)
- `scripts/postinstall.sh` - Post-installation setup

## Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Build | `npm run build` |
| Test | `npm test` |
| Lint | `npm run lint` |
| Type check | `npm run tsc-check` |
| Start dev | `npm run dev` |
| Full check | `npm run check` |
