# Implementation Plan Template

## 📋 Overview

| Field | Value |
|-------|-------|
| **Story ID** | [STORY-XXX] |
| **Story Title** | [Title] |
| **Author** | [Name] |
| **Status** | Draft / In Progress / Complete |
| **Estimated Time** | [X hours/days] |

---

## 🎯 Goal

[What are we implementing and why]

---

## 📝 Tasks

### Task 1: [Task Name]

**Description**: [What needs to be done]

**Files to Modify**:
- `path/to/file1.ts` - [What to change]
- `path/to/file2.ts` - [What to change]

**Dependencies**: [None / Task X]

**Estimated Time**: [X hours]

---

### Task 2: [Task Name]

**Description**: [What needs to be done]

**Files to Modify**:
- `path/to/file1.ts` - [What to change]

**Dependencies**: Task 1

**Estimated Time**: [X hours]

---

### Task 3: [Task Name]

**Description**: [What needs to be done]

**Files to Create**:
- `path/to/new-file.ts` - [What to create]

**Dependencies**: Task 2

**Estimated Time**: [X hours]

---

## 🗄️ Database Changes

### New Tables

```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY,
  column1 TYPE NOT NULL,
  column2 TYPE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Modified Tables

```sql
ALTER TABLE table_name ADD COLUMN new_column TYPE;
```

### Migrations

| Migration | Description |
|-----------|-------------|
| [Migration Name] | [What it does] |

---

## 🔌 API Changes

### New Endpoints

```typescript
// [Endpoint Name]
router.[method]('[path]')
  .input([Schema])
  .mutation/query(async ({ input, ctx }) => {
    // Implementation
  });
```

### Modified Endpoints

```typescript
// [Endpoint Name] - Changes: [What changed]
```

---

## 🎨 Frontend Changes

### New Components

| Component | Description | Location |
|-----------|-------------|----------|
| [ComponentName] | [What it does] | `src/components/[path]` |

### Modified Components

| Component | Changes |
|-----------|---------|
| [ComponentName] | [What changed] |

---

## 🧪 Testing Plan

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| `path/to/test.ts` | [What to test] |

### Integration Tests

| Test | Description |
|------|-------------|
| [Test Name] | [What to test] |

### E2E Tests

| Test | Description |
|------|-------------|
| [Test Name] | [What to test] |

---

## ⚠️ Risks & Considerations

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk 1] | High | [How to mitigate] |
| [Risk 2] | Medium | [How to mitigate] |

---

## 📎 Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| [Dependency] | Blocking | ✅ Ready / ⏳ Pending |

---

## 📅 Timeline

| Task | Start | End | Status |
|------|-------|-----|--------|
| Task 1 | [Date] | [Date] | ⬜ |
| Task 2 | [Date] | [Date] | ⬜ |
| Task 3 | [Date] | [Date] | ⬜ |

---

## 🔗 Related Documents

- [Link to Feature Spec]
- [Link to Design]
- [Link to API Docs]

---

## ✍️ Approval

- [ ] Tech Lead Approved
- [ ] Architect Approved
