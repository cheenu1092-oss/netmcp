# Pull Request

## Description

<!-- Provide a clear summary of the changes in this PR -->

**Type of Change:**
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code quality improvement (refactoring, linting, etc.)

**Related Issue(s):**
<!-- Link to related issues (e.g., "Fixes #123", "Relates to #456") -->

---

## Changes Made

<!-- Describe what you changed and why. Use bullet points for clarity. -->

- 
- 
- 

---

## Testing

**Tests Added/Updated:**
- [ ] Added new tests for the feature/fix
- [ ] Updated existing tests
- [ ] No tests needed (documentation, code quality, etc.)

**Test Results:**
```bash
# Paste output of:
# bash test-all.sh
# npm run lint

All 19 smoke tests: PASS ✅
All 18 integration tests: PASS ✅
ESLint: 0 errors, 0 warnings ✅
```

---

## Checklist

Please confirm you have completed the following before submitting:

### Code Quality
- [ ] Code follows the existing style and conventions
- [ ] All new code has JSDoc type annotations (see CONTRIBUTING.md)
- [ ] ESLint passes with 0 errors, 0 warnings (`npm run lint`)
- [ ] No `console.log()` or debug statements left in code

### Testing
- [ ] All existing tests pass (`bash test-all.sh`)
- [ ] New tests added for new functionality (if applicable)
- [ ] Integration tests added for complex features (if applicable)
- [ ] Manually tested the changes

### Documentation
- [ ] README.md updated (if user-facing changes)
- [ ] CHANGELOG.md updated (see [Keep a Changelog](https://keepachangelog.com/))
- [ ] Code comments added for complex logic
- [ ] CONTRIBUTING.md updated (if process changes)

### Security & Validation
- [ ] Input validation added for all user inputs (max 1000 chars, format checks)
- [ ] Rate limiting implemented for new API calls (if applicable)
- [ ] Timeouts added to all network calls (10-15s)
- [ ] Error messages sanitized (no sensitive data exposed)

### Package Configuration (if new package)
- [ ] package.json has all required fields (`files`, `publishConfig`, etc.)
- [ ] jsconfig.json added for static type checking
- [ ] .npmignore added to exclude dev files
- [ ] test-all.sh updated with new tests
- [ ] README.md updated with new package

### Git Hygiene
- [ ] Commits follow [Conventional Commits](https://www.conventionalcommits.org/) format
- [ ] Commits are atomic (one logical change per commit)
- [ ] Commit messages are descriptive
- [ ] Branch is up to date with `main`

---

## Screenshots / Examples (if applicable)

<!-- Add screenshots, code examples, or output samples to illustrate the changes -->

```json
// Example input/output for new tool
{
  "input": {},
  "output": {}
}
```

---

## Breaking Changes (if applicable)

<!-- If this is a breaking change, describe:
  1. What breaks
  2. Migration path for users
  3. Why the breaking change is necessary
-->

---

## Additional Notes

<!-- Any other context, concerns, or questions for reviewers -->

---

## Reviewer Guidance

<!-- Optional: Help reviewers focus on specific areas -->

**Focus areas for review:**
- 
- 

**Questions for reviewers:**
- 
- 
