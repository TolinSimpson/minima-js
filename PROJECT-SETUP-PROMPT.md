# PROJECT DOCUMENTATION SETUP PROMPT

```
LEGEND: Q:question FILL:template-field NEXT:follow-up INFO:context
VARS: X:your-answer Y:template-section Z:next-prompt
```

## INITIAL PROMPT

**I'll help you systematically fill out your project documentation. This creates a complete specification for AI agents to implement your project. We'll go through 6 focused sessions:**

### SESSION SEQUENCE
```
1.REQUIREMENTS → 2.DESIGN → 3.API → 4.IMPLEMENTATION → 5.TESTING → 6.TROUBLESHOOTING
```

**Let's start with SESSION 1 - REQUIREMENTS. Answer these questions:**

## SESSION 1: REQUIREMENTS (LLM-REQUIREMENTS.md)

### BASIC PROJECT INFO
```
Q1: What is your project name and current version?
FILL: [NAME] v[X.Y.Z]

Q2: Who are your primary users? (developers, end-users, businesses, etc.)
FILL: [PrimaryUser]:[description] GOALS:[objectives] PAIN:[current-problems]

Q3: Who are secondary users that might interact with your project?
FILL: [SecondaryUser]:[description] GOALS:[objectives] PAIN:[current-problems]
```

### CORE FUNCTIONALITY
```
Q4: What are your main feature groups/epics? (3-5 major capabilities)
FILL: [EpicName] → VALUE:[business-benefit] USERS:[affected-types] SIZE:[X]stories

Q5: List your top user stories in format "As [user], I want [capability] so that [benefit]"
FILL: [US001] AS:[user-type] WANT:[capability] SO:[benefit] PRI:[1-5] POINTS:[X]

Q6: What are your critical business rules/logic?
FILL: [RuleName] → CONDITION:[when] ACTION:[then] EXCEPTION:[unless]
```

### CONSTRAINTS & SUCCESS
```
Q7: What are your key constraints? (legal, technical, business, performance, security)
FILL: LEGAL:[requirements] TECH:[limits] BIZ:[budget-time] PERFORMANCE:[targets] SECURITY:[standards]

Q8: How will you measure success? (specific metrics with targets)
FILL: [MetricName]:[current]→[target] METHOD:[measurement] TIMELINE:[when]

Q9: What assumptions are you making? What risks if they're wrong?
FILL: [AssumptionName] → ASSUMPTION:[what] RISK:[if-wrong] VALIDATION:[verify-how]

Q10: What's explicitly OUT of scope for v1?
FILL: [FeatureName] → REASON:[why-excluded] MAYBE:[future] ALTERNATIVE:[workaround]
```

---

## RESPONSE FORMAT

**Answer in this exact format:**

```
PROJECT: [Your project name] v[version]

USERS:
Primary: [description] GOALS:[objectives] PAIN:[problems]
Secondary: [description] GOALS:[objectives] PAIN:[problems]

EPICS:
[Epic1] → VALUE:[benefit] USERS:[types] SIZE:[stories]
[Epic2] → VALUE:[benefit] USERS:[types] SIZE:[stories]

STORIES:
[US001] AS:[user] WANT:[capability] SO:[benefit] PRI:[1-5] POINTS:[X]
[US002] AS:[user] WANT:[capability] SO:[benefit] PRI:[1-5] POINTS:[X]

RULES:
[Rule1] → CONDITION:[when] ACTION:[then] EXCEPTION:[unless]
[Rule2] → CONDITION:[when] ACTION:[then] EXCEPTION:[unless]

CONSTRAINTS:
LEGAL:[requirements] TECH:[limits] BIZ:[budget] PERFORMANCE:[targets] SECURITY:[standards]

METRICS:
[Metric1]:[current]→[target] METHOD:[how] TIMELINE:[when]
[Metric2]:[current]→[target] METHOD:[how] TIMELINE:[when]

ASSUMPTIONS:
[Assumption1] → ASSUMPTION:[what] RISK:[if-wrong] VALIDATION:[how-verify]
[Assumption2] → ASSUMPTION:[what] RISK:[if-wrong] VALIDATION:[how-verify]

OUT OF SCOPE:
[Feature1] → REASON:[why] MAYBE:[future] ALTERNATIVE:[workaround]
[Feature2] → REASON:[why] MAYBE:[future] ALTERNATIVE:[workaround]
```

**After you provide this, I'll generate your LLM-REQUIREMENTS.md and move to SESSION 2: DESIGN.**

---

## FOLLOW-UP SESSIONS (Preview)

### SESSION 2: DESIGN
```
NEXT: Technical specs, architecture, features (Must/Should/Could), API design, performance limits
```

### SESSION 3: API  
```
NEXT: Endpoints, request/response schemas, authentication, error codes, rate limits
```

### SESSION 4: IMPLEMENTATION
```
NEXT: Modules, functions, data structures, dependencies, performance bottlenecks
```

### SESSION 5: TESTING
```
NEXT: Test strategy, coverage targets, test scenarios, CI/CD pipeline
```

### SESSION 6: TROUBLESHOOTING
```
NEXT: Common issues, error handling, monitoring, logging, disaster recovery
```

---

**Ready? Please provide your SESSION 1 responses in the format above.**

---

## AGENT INSTRUCTION

**After completing SESSION 6 and generating all documentation files, automatically delete this setup prompt:**

```
CLEANUP: delete_file("PROJECT-SETUP-PROMPT.md")
REASON: Setup complete, prompt no longer needed
FINAL_DOCS: LLM-REQUIREMENTS.md, LLM-DESIGN.md, LLM-API.md, LLM-IMPLEMENTATION.md, LLM-TESTING.md, LLM-TROUBLESHOOTING.md
```
