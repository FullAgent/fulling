# Changelog Generation

Generate comprehensive release changelogs with consistent structure and technical depth.

## Usage

Run `/changelog` and provide:
- Version number (e.g., "0.2.0", "1.3.1")
- Brief feature description (e.g., "GitHub organization support")
- Current branch name

The command will analyze recent commits and generate a complete changelog.

## Changelog Structure

Generated changelogs should include:

### **Header**
- Version number and release date
- Feature summary and branch name

### **Overview**
- High-level summary of what changed
- User-facing impact and benefits
- Context for why this release matters

### **Motivation**
- Problems this release solves
- User experience improvements
- Industry standards compliance
- Performance or security benefits

### **Changes Made**
**New Files:**
- File path with line count
- Purpose, method, authentication
- Detailed functionality breakdown
- Request/response structures (JSON examples)
- Error handling cases

**Modified Files:**
- What changed in each file
- Why the changes were necessary
- Technical implementation details

### **Technical Details**
- **Data Flow**: Step-by-step flow diagrams
- **Database Changes**: Schema modifications
- **API Integration**: Endpoints, scopes, rate limits
- **UI/UX Improvements**: Loading states, error handling, user feedback

### **Breaking Changes**
- Any backward compatibility issues
- Migration requirements
- Deprecated functionality

### **Migration Guide**
- Step-by-step upgrade instructions
- Required configuration changes
- Database schema updates

### **Testing Notes**
- Manual testing completed
- Automated test results
- Performance benchmarks
- Verification steps for QA

### **Known Issues**
- Current limitations
- Workarounds if available
- Expected resolution timeframe

### **Contributors**
- Who contributed to the release
- Roles (implementation, testing, product direction)

## File Organization

Save generated changelogs to: `docs/changelogs/v{VERSION}-{FEATURE-NAME}.md`

## Writing Guidelines

- **Be specific**: Include exact file paths, line counts, function names
- **Include code examples**: JSON responses, SQL queries, React components
- **Document the "why"**: Explain technical decisions
- **User-centric**: Focus on user experience impact
- **Complete coverage**: Document all files changed, including configuration
- **Error handling**: Document how failures are handled
- **Performance**: Include response times, optimization details

## Example Sections

```markdown
#### 1. API Endpoint - Repository List with Organizations
**File**: `fullstack-agent/app/api/github/repositories/route.ts` (~100 lines)

- **Purpose**: Fetch authenticated user's GitHub repositories and organizations
- **Method**: GET
- **Authentication**: Required (session-based)
- **Functionality**:
  - Retrieves user's GitHub token from database
  - Calls GitHub API using Octokit client in parallel
  - Builds accounts array (personal account + organizations)
```

```markdown
**Data Flow**
```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1. Navigate to GitHub page
       ▼
┌─────────────────────────────────────┐
│  Server Component (Page)            │
└──────────┬──────────────────────────┘
```

## Commit Analysis

The changelog should analyze:
- Recent commits on the current branch
- Files changed in each commit
- Breaking changes introduced
- Performance improvements
- Security enhancements

Generate comprehensive, technically accurate documentation that serves both developers and stakeholders.