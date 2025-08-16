# Project Context for Claude Code

## Project Overview
[Brief description of your project, its purpose, and main goals]

## Project Structure
```
project-root/
├── src/                 # Source code
├── tests/              # Test files
├── docs/               # Documentation
└── scripts/            # Build and utility scripts
```

## Key Technologies
- **Language**: [Primary language]
- **Framework**: [Main framework]
- **Database**: [Database system]
- **Testing**: [Testing framework]
- **Build Tools**: [Build system]

## Development Guidelines

### Code Style
- Follow [specific style guide]
- Use consistent indentation (spaces/tabs)
- Prefer descriptive variable names
- Keep functions small and focused
- Add type annotations where applicable

### Git Workflow
- Commit messages should be descriptive
- Use conventional commits format: `type(scope): description`
- Create feature branches from main
- Squash commits before merging

### Testing Requirements
- Write tests for new features
- Maintain test coverage above [X]%
- Run tests before committing: `[test command]`
- Use meaningful test descriptions

## Common Commands
```bash
# Development
npm run dev             # Start development server
npm run build          # Build for production
npm run test           # Run tests
npm run lint           # Run linter
npm run typecheck      # Run type checking

# Git
git status             # Check status
git diff              # View changes
git add .             # Stage changes
git commit -m "msg"   # Commit changes
```

## Important Files and Locations
- **Configuration**: `config/settings.json`
- **Environment Variables**: `.env`
- **Main Entry Point**: `src/index.js`
- **API Routes**: `src/routes/`
- **Database Models**: `src/models/`
- **Utilities**: `src/utils/`

## Current Focus Areas
- [List current development priorities]
- [Known issues to address]
- [Features in progress]

## Architecture Decisions
- **Pattern**: [MVC, microservices, etc.]
- **State Management**: [Redux, Context, etc.]
- **API Design**: [REST, GraphQL, etc.]
- **Authentication**: [JWT, OAuth, etc.]

## Dependencies to Avoid
- Don't add [specific packages] without discussion
- Prefer built-in solutions over external libraries
- Check existing utilities before adding new dependencies

## Performance Considerations
- Optimize database queries
- Implement caching where appropriate
- Lazy load heavy components
- Monitor bundle size

## Security Guidelines
- Never commit secrets or API keys
- Sanitize user inputs
- Use parameterized queries
- Follow OWASP guidelines
- Regular dependency updates

## Documentation Standards
- Update README for significant changes
- Document complex functions
- Keep API documentation current
- Add inline comments for complex logic

## Error Handling
- Use consistent error formats
- Log errors appropriately
- Provide meaningful error messages
- Handle edge cases gracefully

## Deployment Notes
- **Production URL**: [URL]
- **Staging URL**: [URL]
- **CI/CD Pipeline**: [Tool/Platform]
- **Deployment Command**: `[command]`

## Team Conventions
- **Code Reviews**: Required for all PRs
- **Branch Protection**: Main branch protected
- **Meeting Schedule**: [Schedule]
- **Communication**: [Slack/Discord/etc.]

## External Resources
- [Project Documentation](link)
- [API Documentation](link)
- [Design System](link)
- [Issue Tracker](link)

## Claude Code Specific Instructions

### Preferred Behaviors
- Always run tests after making changes
- Check for existing implementations before creating new ones
- Follow established patterns in the codebase
- Ask for clarification when requirements are ambiguous
- Provide concise, actionable responses

### Task Approach
1. Understand the requirement fully
2. Check existing code for similar patterns
3. Implement the solution
4. Write/update tests
5. Run linter and type checker
6. Verify the solution works

### Output Preferences
- Use code blocks with syntax highlighting
- Provide brief explanations for complex changes
- Suggest multiple approaches when appropriate
- Include relevant file paths in responses

### Restrictions
- Don't modify [protected files/folders]
- Don't remove existing functionality without confirmation
- Don't commit directly to main branch
- Don't expose sensitive information

## Notes
[Any additional project-specific information or context]