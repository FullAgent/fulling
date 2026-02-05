# Design System

## Colors

Use the `.modern` theme defined in `globals.css`.

| Usage | CSS Variable | Value |
|-------|--------------|-------|
| Sidebar background | `--sidebar` | #18181b |
| Main background | `--background` | #09090b |
| Primary | `--primary` | #3b82f6 |
| Main text | `--foreground` | #fafafa |
| Muted text | `--muted-foreground` | #a1a1aa |
| Border | `--border` | #27272a |
| Hover/Accent | `--accent` | #27272a |

## Typography

| Usage | Font | Fallback |
|-------|------|----------|
| Headings | Space Grotesk | sans-serif |
| Body | Noto Sans | sans-serif |
| Code / Terminal | JetBrains Mono | monospace |

Font weights:
- Headings: 500-700
- Body: 400-500
- Code: 400

### Font Application Guidelines

Apply **Space Grotesk** (`font-[family-name:var(--font-heading)]`) for:
- Page headings (h1-h6)
- Sidebar titles and navigation items
- Search bar placeholder text
- Primary CTA buttons (e.g., "New Project")
- Important interactive elements

Apply **Noto Sans** (default, no extra class needed) for:
- Body text and descriptions
- Secondary buttons (e.g., "Import")
- Form labels and helper text
- General UI text

Apply **JetBrains Mono** (`font-[family-name:var(--font-mono)]` or `font-mono`) for:
- Code snippets
- Terminal output
- Keyboard shortcuts (e.g., "⌘K")
- Technical identifiers

## Components

Always use shadcn/ui components instead of native HTML elements.
