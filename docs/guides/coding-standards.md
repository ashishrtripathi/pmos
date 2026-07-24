# Coding Standards

This document outlines the coding standards and best practices for PMOS.

---

## 📋 Table of Contents

- [TypeScript](#typescript)
- [React](#react)
- [CSS/Tailwind](#csstailwind)
- [API Design](#api-design)
- [Testing](#testing)
- [Git](#git)
- [Documentation](#documentation)

---

## 🔷 TypeScript

### General Rules

```typescript
// ✅ Good: Use explicit types
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Bad: Avoid `any`
function getUser(id: any): any {
  // ...
}
```

### Naming Conventions

```typescript
// Variables and functions: camelCase
const userName = 'John';
function getUser() {}

// Interfaces and types: PascalCase
interface UserProfile {}
type UserStatus = 'active' | 'inactive';

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// Classes: PascalCase
class UserService {}

// Enums: PascalCase
enum UserRole {
  Admin = 'admin',
  User = 'user',
}
```

### Type Definitions

```typescript
// ✅ Good: Prefer interfaces for object shapes
interface User {
  id: string;
  name: string;
}

// ✅ Good: Use type for unions and primitives
type UserID = string;
type UserStatus = 'active' | 'inactive';

// ✅ Good: Use readonly for immutable data
interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}
```

### Error Handling

```typescript
// ✅ Good: Use typed errors
class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

// ✅ Good: Use try-catch with specific types
async function getUser(id: string): Promise<User> {
  try {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User', id);
    }
    return user;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new Error('Failed to fetch user');
  }
}
```

---

## ⚛️ React

### Component Structure

```typescript
// ✅ Good: Functional components with TypeScript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Hooks

```typescript
// ✅ Good: Custom hooks for reusable logic
function useJourney(journeyId: string) {
  const { data, isLoading, error } = trpc.journey.getById.useQuery({
    id: journeyId,
  });

  const utils = trpc.useContext();

  const updateJourney = async (updates: Partial<Journey>) => {
    await trpc.journey.update.mutate({
      id: journeyId,
      ...updates,
    });
    utils.journey.getById.invalidate({ id: journeyId });
  };

  return {
    journey: data,
    isLoading,
    error,
    updateJourney,
  };
}

// ✅ Good: Use hooks in components
function JourneyPage({ params }: { params: { id: string } }) {
  const { journey, isLoading, updateJourney } = useJourney(params.id);

  if (isLoading) return <Loading />;

  return (
    <div>
      <h1>{journey.name}</h1>
      {/* ... */}
    </div>
  );
}
```

### State Management

```typescript
// ✅ Good: Local state for UI
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<string | null>(null);

// ✅ Good: Server state with React Query/tRPC
const { data: stories } = trpc.story.list.useQuery();

// ✅ Good: Global state with Zustand
const useStore = create((set) => ({
  theme: 'light',
  setTheme: (theme: 'light' | 'dark') => set({ theme }),
}));
```

### Performance

```typescript
// ✅ Good: Memoize expensive computations
const sortedStories = useMemo(() => {
  return stories.sort((a, b) => a.priority - b.priority);
}, [stories]);

// ✅ Good: Memoize callbacks
const handleSelect = useCallback((id: string) => {
  setSelected(id);
}, []);

// ✅ Good: Use React.memo for pure components
const StoryCard = React.memo(function StoryCard({ story }: StoryCardProps) {
  return <div>{story.title}</div>;
});
```

---

## 🎨 CSS/Tailwind

### Class Organization

```typescript
// ✅ Good: Organize classes logically
<div className={cn(
  // Layout
  'flex items-center justify-between',
  // Spacing
  'p-4 gap-4',
  // Colors
  'bg-white dark:bg-gray-800',
  // Borders
  'rounded-lg border border-gray-200',
  // Shadows
  'shadow-sm',
  // Custom classes
  className
)}>
```

### Responsive Design

```typescript
// ✅ Good: Mobile-first responsive design
<div className="
  w-full
  md:w-1/2
  lg:w-1/3
  p-4
  md:p-6
  lg:p-8
">
```

### Dark Mode

```typescript
// ✅ Good: Use Tailwind's dark mode
<div className="
  bg-white 
  dark:bg-gray-900
  text-gray-900
  dark:text-gray-100
">
```

### Custom Components

```typescript
// ✅ Good: Use cn() utility for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  isDisabled && 'disabled-classes'
)}>
```

---

## 🔌 API Design

### tRPC Procedures

```typescript
// ✅ Good: Use appropriate procedure types
export const storyRouter = router({
  // Public query
  list: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      // ...
    }),

  // Protected query
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      // ctx.user is available
    }),

  // Protected mutation
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // ...
    }),
});
```

### Input Validation

```typescript
// ✅ Good: Comprehensive validation
const createStoryInput = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  acceptanceCriteria: z.array(z.string()).min(1),
  tags: z.array(z.string()).optional(),
});

type CreateStoryInput = z.infer<typeof createStoryInput>;
```

### Error Responses

```typescript
// ✅ Good: Consistent error format
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Story not found',
});

throw new TRPCError({
  code: 'BAD_REQUEST',
  message: 'Invalid input',
  cause: validationError,
});
```

---

## 🧪 Testing

### Unit Tests

```typescript
// ✅ Good: Descriptive test names
describe('JourneyService', () => {
  describe('create', () => {
    it('should create a journey with valid input', async () => {
      // Arrange
      const input = { name: 'Test Journey' };

      // Act
      const result = await service.create(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Journey');
    });

    it('should throw error for invalid input', async () => {
      // Arrange
      const input = { name: '' };

      // Act & Assert
      await expect(service.create(input)).rejects.toThrow('Name is required');
    });
  });
});
```

### Integration Tests

```typescript
// ✅ Good: Test API endpoints
describe('Story API', () => {
  it('should create and retrieve a story', async () => {
    // Create
    const created = await caller.story.create({
      title: 'Test Story',
      priority: 'medium',
    });

    // Retrieve
    const retrieved = await caller.story.getById({ id: created.id });

    expect(retrieved.title).toBe('Test Story');
  });
});
```

---

## 🔀 Git

### Commit Messages

```
# ✅ Good: Conventional commits
feat(journey): add drag-and-drop reordering

fix(auth): resolve session expiration issue

docs(readme): update installation instructions

test(api): add story endpoint tests

refactor(services): extract common logic
```

### Branch Names

```
# ✅ Good: Descriptive branch names
feature/journey-editor
bugfix/login-redirect
docs/api-documentation
refactor/story-service
```

### PR Descriptions

```markdown
## Description

Brief description of changes.

## Changes

- Added drag-and-drop to journey editor
- Implemented undo/redo functionality

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots

[If applicable]

Closes #123
```

---

## 📚 Documentation

### Code Comments

```typescript
// ✅ Good: Explain why, not what
// We cache for 5 minutes to reduce API calls to the analytics service
const CACHE_TTL = 5 * 60 * 1000;

// ✅ Good: Document complex logic
/**
 * Generates a customer journey from a website by:
 * 1. Crawling all pages
 * 2. Identifying navigation structure
 * 3. Extracting customer flows
 * 4. Generating journey steps
 */
async function generateJourneyFromWebsite(url: string): Promise<Journey> {
  // ...
}
```

### JSDoc

```typescript
// ✅ Good: Document public APIs
/**
 * Creates a new story in the system.
 *
 * @param input - The story creation input
 * @param input.title - The story title (1-500 characters)
 * @param input.description - Optional description
 * @param input.priority - Story priority
 * @returns The created story
 *
 * @example
 * ```ts
 * const story = await createStory({
 *   title: 'User Login',
 *   priority: 'high',
 * });
 * ```
 */
async function createStory(input: CreateStoryInput): Promise<Story> {
  // ...
}
```

---

## 📏 Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows TypeScript standards
- [ ] Components are properly typed
- [ ] No `any` types used
- [ ] Tests are included
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] Error handling is proper
- [ ] Performance considerations addressed
- [ ] Accessibility considered
- [ ] Responsive design tested

---

Following these standards ensures consistency and maintainability across the PMOS codebase.
