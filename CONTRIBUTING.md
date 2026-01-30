# Contributing to FullStack Agent

Thank you for your interest in contributing to FullStack Agent! We welcome contributions from the community and are grateful for any help you can provide.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please treat all contributors with respect and professionalism.

## How to Contribute

### Reporting Issues

- Check existing issues before creating a new one
- Use clear, descriptive titles
- Include steps to reproduce the issue
- Provide system information (OS, Node.js version, etc.)
- Include relevant error messages and logs

### Suggesting Features

- Check if the feature has already been suggested
- Provide a clear use case
- Explain how it benefits users
- Consider implementation complexity

### Pull Requests

1. **Fork the Repository**
   ```bash
   git clone https://github.com/FullstackAgent/FullstackAgent.git
   cd FullstackAgent
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   pnpm test
   pnpm run lint
   ```

5. **Commit Your Changes**
   - Use clear, descriptive commit messages
   - Follow conventional commit format:
     ```
     feat: add new feature
     fix: resolve bug in component
     docs: update README
     style: format code
     refactor: restructure module
     test: add unit tests
     chore: update dependencies
     ```

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   - Create pull request on GitHub
   - Link related issues
   - Provide detailed description

## Development Setup

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL database
- Kubernetes cluster access

### Local Development
```bash
# Install dependencies
cd fullstack-agent
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your settings

# Run database migrations
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

## Code Style Guidelines

### TypeScript
- Use TypeScript for all new code
- Enable strict mode
- Properly type all functions and variables
- Avoid `any` type unless absolutely necessary

### React Components
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

### File Organization
```
components/
  ComponentName/
    index.tsx         # Component implementation
    styles.module.css # Component styles (if needed)
    types.ts         # Type definitions
    utils.ts         # Helper functions
```

### Naming Conventions
- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **CSS Classes**: kebab-case (`user-profile-card`)

## Testing

### Unit Tests
```typescript
// Example test file: component.test.tsx
import { render, screen } from '@testing-library/react';
import { Component } from './component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Integration Tests
- Test API endpoints
- Test database operations
- Test Kubernetes service methods

### E2E Tests
- Test critical user flows
- Test authentication
- Test sandbox creation

## Documentation

### Code Documentation
- Add JSDoc comments for functions
- Document complex logic
- Include examples where helpful

```typescript
/**
 * Creates a new sandbox for the specified project
 * @param projectId - The project identifier
 * @param envVars - Environment variables to inject
 * @returns Promise<SandboxInfo> - Sandbox details including URLs
 * @throws {Error} If project doesn't exist or user lacks permission
 */
async function createSandbox(
  projectId: string,
  envVars: Record<string, string>
): Promise<SandboxInfo> {
  // Implementation
}
```

### README Updates
- Update README for new features
- Keep installation steps current
- Update API documentation

## Review Process

### What We Look For
- **Code Quality**: Clean, readable, maintainable
- **Testing**: Adequate test coverage
- **Documentation**: Clear comments and docs
- **Performance**: No unnecessary overhead
- **Security**: No security vulnerabilities

### Review Timeline
- Initial review within 3-5 days
- Follow-up reviews within 2-3 days
- Merge after approval from maintainer

## Release Process

### Version Numbering
We follow Semantic Versioning (SemVer):
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes

### Release Steps
1. Update version in package.json
2. Update CHANGELOG.md
3. Create release tag
4. Deploy to production

## Getting Help

### Resources
- [Documentation](https://github.com/FullstackAgent/FullstackAgent/wiki)
- [Issue Tracker](https://github.com/FullstackAgent/FullstackAgent/issues)
- [Discussions](https://github.com/FullstackAgent/FullstackAgent/discussions)

### Contact
- GitHub Issues for bugs and features
- Discussions for questions and ideas
- Email: contribute@fullstackagent.dev

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to FullStack Agent! Your efforts help make AI-powered development accessible to everyone.