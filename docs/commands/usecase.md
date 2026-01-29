# Use Case Generation

Generate comprehensive use case documentation with detailed flows, edge cases, and technical specifications.

## Usage

Run `/usecase` and provide:

- Use case title (e.g., "Bind GitHub Repository to Project")
- Feature or component name
- Primary user action (e.g., "connecting GitHub repositories")

The command will generate a complete use case with all flows and edge cases.

## Use Case Structure

Generated use cases should include:

### **Overview**

- High-level description of the use case
- What it enables for users
- Primary actors and systems involved

### **Actors**

- **Primary Actor**: Main user performing the action
- **System**: Your application/platform
- **External Services**: Third-party APIs, databases
- **Secondary Actors**: Other systems or users that interact

### **Preconditions**

**1. User Authentication:**

- Login requirements
- OAuth connections needed
- Token/scope requirements
- Database dependencies

**2. Data Existence:**

- Required entities in database
- Initial state requirements
- Permission requirements

**3. External Dependencies:**

- Third-party service requirements
- API availability
- Network conditions

### **Start Point**

- Exact URL or navigation path
- How user initiates the use case
- Initial UI state

### **Main Flow**

Document step-by-step with:

**Server-Side Actions:**

- Database queries with SQL examples
- API endpoint calls
- Authentication/authorization checks
- Data validation

**Client-Side Actions:**

- Component lifecycle events
- State management changes
- User interactions
- API requests/responses

**API Processing:**

- Request/response formats (JSON examples)
- Error handling
- Rate limiting
- Caching strategies

**Database Operations:**

- SQL queries
- Transaction handling
- Data relationships
- Constraints

### **Alternative Flows**

**Common Alternatives:**

- User cancellation
- Editing existing data
- Different selection paths
- Account switching (organizations, teams)

**Edge Cases:**

- No data available
- Network failures
- Service timeouts
- Permission denied

### **Unexpected Outcomes**

For each potential failure:

**1. Missing/Invalid Data**

- **Cause**: Why it happens
- **Symptoms**: What user sees
- **UI Behavior**: Error states, messages
- **Resolution**: How to fix

**2. Authentication Failures**

- Token expiration
- Invalid credentials
- Insufficient permissions
- Session timeout

**3. API/Network Issues**

- Rate limiting
- Service unavailable
- Connection failures
- Timeouts

**4. Database Problems**

- Connection failures
- Constraint violations
- Data corruption
- Deadlocks

**5. Business Logic Errors**

- Validation failures
- Workflow violations
- State conflicts

### **Success Metrics**

- **Primary**: Main objective achieved
- **Secondary**: User experience indicators
- **Tertiary**: System performance metrics

### **Frequency**

- How often this use case occurs
- Peak usage patterns
- Seasonal variations

### **Related Components**

**Frontend:**

- React components, pages, hooks
- UI libraries, styling
- State management

**Backend:**

- API routes, services, middleware
- Database models, migrations
- External integrations

**Database:**

- Tables, relationships, indexes
- Queries, transactions
- Constraints, validations

**External Services:**

- Third-party APIs
- Webhooks, callbacks
- Authentication providers

### **Security Considerations**

- **Token Storage**: Encryption, rotation
- **Authorization**: Permission checks, role-based access
- **Input Validation**: SQL injection, XSS prevention
- **Rate Limiting**: API abuse prevention
- **Data Privacy**: PII handling, GDPR compliance

### **Future Enhancements**

Potential improvements discussed:

- Performance optimizations
- Additional features
- User experience improvements
- Architecture changes
- Integration opportunities

## File Organization

Save generated use cases to: `docs/usecases/{CATEGORY}/{USE-CASE-NAME}.md`

## Writing Guidelines

### **Be Technical and Precise**

- Include exact SQL queries with placeholders
- Show JSON request/response examples
- Document file paths and component names
- Specify HTTP methods, status codes, headers

### **Cover All Paths**

- Happy path, alternative flows, edge cases
- Error conditions and recovery procedures
- Performance considerations
- Security implications

### **User-Centric Documentation**

- Focus on user experience and feedback
- Document error messages and UI states
- Include accessibility considerations
- Mobile/responsive considerations

### **Code Examples**

**SQL Queries:**

```sql
SELECT * FROM Project WHERE id = {projectId} AND userId = {userId}
```

**JSON Responses:**

```json
{
  "accounts": [{ "login": "username", "type": "User", "avatarUrl": "..." }],
  "repositories": [
    { "name": "repo", "fullName": "owner/repo", "private": false }
  ]
}
```

**API Calls:**

```javascript
Promise.all([
  GET https://api.github.com/user,
  GET https://api.github.com/user/orgs,
  GET https://api.github.com/user/repos?affiliation=owner,organization_member
])
```

### **Flow Diagrams**

Use text-based flow diagrams to show complex interactions:

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1. Click button
       ▼
┌─────────────────┐
│  React Component│
└──────┬──────────┘
       │ 2. API call
       ▼
┌─────────────────┐
│  API Endpoint   │
└──────┬──────────┘
```

## Testing Scenarios

Generated use cases should inform test planning:

- Unit tests for individual functions
- Integration tests for API endpoints
- E2E tests for complete flows
- Error handling and edge case testing

Generate comprehensive documentation that serves developers, testers, and product stakeholders.
