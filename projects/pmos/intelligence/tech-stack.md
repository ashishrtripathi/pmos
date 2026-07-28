# PMOS — Technology Stack

## Core Framework

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | Next.js | ^14.2.0 | React SSR/SSG with App Router |
| **Language** | TypeScript | ^5.4.0 | Type-safe development |
| **UI Library** | React | ^18.3.0 | Component rendering |
| **Styling** | Tailwind CSS | ^3.4.0 | Utility-first CSS |
| **CSS Processing** | PostCSS | ^8.4.0 | CSS transformations |
| **Auto Prefixing** | Autoprefixer | ^10.4.0 | Vendor prefix automation |

## UI Component Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **shadcn/ui** | (copied components) | Radix UI primitives + Tailwind styling |
| **Lucide React** | ^0.400.0 | Icon library (200+ icons) |
| **Class Variance Authority** | ^0.7.0 | Component variant management |
| **clsx** | ^2.1.0 | Conditional class composition |
| **Tailwind Merge** | ^2.3.0 | Intelligent Tailwind class deduplication |

## Drag & Drop

| Library | Version | Purpose |
|---------|---------|---------|
| **@dnd-kit/core** | ^6.1.0 | Core drag-and-drop engine |
| **@dnd-kit/sortable** | ^8.0.0 | Sortable containers and items |
| **@dnd-kit/utilities** | ^3.2.2 | CSS transform utilities |

## Data & Parsing

| Library | Version | Purpose |
|---------|---------|---------|
| **gray-matter** | ^4.0.3 | YAML frontmatter parsing from markdown |
| **marked** | ^12.0.0 | Markdown to HTML rendering |
| **Zod** | ^3.23.0 | Runtime schema validation |

## Testing & Quality

| Library | Version | Purpose |
|---------|---------|---------|
| **Playwright** | ^1.61.1 | Browser automation (planned) |
| **ESLint** | ^8.57.0 | Code linting |
| **ESLint Config Next** | ^14.2.0 | Next.js linting rules |

## Development Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev --port 3100` | Development server on port 3100 |
| `build` | `next build` | Production build |
| `start` | `next start --port 3100` | Production server |
| `lint` | `next lint` | Run ESLint |

## Runtime Environment

- **Node.js**: ^18.0.0 (implied by Next.js 14)
- **Package Manager**: npm
- **OS**: Windows (primary development)
- **Shell**: PowerShell

## Architecture Decisions

### Why File-Based Storage?
PMOS uses the filesystem (`~/.pmos/`) instead of a database because:
1. **AI-native**: AI agents read/write markdown files directly
2. **Git-friendly**: All product artifacts version-controlled
3. **Zero infrastructure**: No database server needed
4. **Human-readable**: Product managers can edit files directly
5. **Portable**: Copy `~/.pmos/` to migrate everything

### Why Next.js 14 App Router?
1. **Server Components**: File reads happen at request time (no caching stale data)
2. **API Routes**: Built-in REST API for CRUD operations
3. **Type Safety**: End-to-end TypeScript with shared types
4. **File System Routing**: Clean URL structure matching project hierarchy

### Why shadcn/ui?
1. **Owned code**: Components are copied into the project, not imported
2. **Tailwind-native**: No CSS-in-JS runtime overhead
3. **Radix UI primitives**: Accessible, unstyled components
4. **Customizable**: Full control over component styling
