# Fulling Design Specification

This document defines the visual design standards for the Fulling project. All pages and components must adhere to this specification.

---

## Design Philosophy

### Core Principles

1. **VS Code-Inspired Dark Theme** — Familiar interface for developers
2. **Two-Section Sidebar Architecture** — Visual separation between navigation and project areas
3. **Semantic Naming** — CSS variables named by purpose for easy maintenance
4. **WCAG Accessibility** — Contrast ratios meet accessibility standards

### Visual Hierarchy

| Level | Background | Usage |
|-------|------------|-------|
| Main Background | `#1E1E1E` | Editor/content area |
| Panel Background | `#252526` | Cards, modals, tab containers |
| Sidebar Navigation | `#333333` | Primary navigation area |
| Sidebar Project | `#242426` | Project list area |

---

## Color System

### Primary Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--primary` | `#10639D` | Brand color (buttons, links, accents) |
| `--primary-hover` | `#155a8a` | Primary hover state |
| `--primary-foreground` | `#FFFFFF` | Text on primary elements |

### Functional Colors

| Variable | Usage |
|----------|-------|
| `--destructive` | Delete actions, error states (red spectrum) |
| `--accent` | Hover states, highlights (`#2B2D2E`) |
| `--muted` | Supporting element backgrounds |
| `--muted-foreground` | Secondary text (`#808080`) |

### Text Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--foreground` | `#CCCCCC` | Primary text |
| `--muted-foreground` | `oklch(0.72 0 0)` | Secondary text, descriptions |
| `--card-foreground` | `#FFFFFF` | Card titles only |

### Borders

| Variable | Value | Usage |
|----------|-------|-------|
| `--border` | `#3E3E3E` | General borders |
| `--input` | `oklch(0.37 0 0)` | Input field borders |
| `--ring` | `oklch(0.62 0.19 259.76)` | Focus ring |

---

## Theme Configuration

The project supports two dark themes, switched via CSS class:

### `.dark` (Default)
- Primary: `#10639D` (deep blue)
- Suitable for: General use

### `.stealth` (Alternate)
- Primary: `#007acc` (VS Code blue)
- Suitable for: Pure VS Code experience

> **Note**: Light theme (`:root`) definitions exist but are incomplete. Do not use.

---

## Typography

| Variable | Font | Usage |
|----------|------|-------|
| `--font-mono` | JetBrains Mono, monospace | Code, terminal |
| `--font-serif` | Source Serif 4, serif | Headings, emphasis |

---

## Border Radius System

| Variable | Computed Value | Usage |
|----------|---------------|-------|
| `--radius` | `0.375rem` | Base radius |
| `--radius-sm` | `calc(var(--radius) - 4px)` | Small elements |
| `--radius-md` | `calc(var(--radius) - 2px)` | Medium elements |
| `--radius-lg` | `var(--radius)` | Large elements |
| `--radius-xl` | `calc(var(--radius) + 4px)` | Cards, modals |

---

## Shadow System

Multi-level shadows optimized for dark theme:

| Variable | Usage |
|----------|-------|
| `--shadow-xs` | Minimal shadow |
| `--shadow-sm` | Small shadow (default buttons) |
| `--shadow-md` | Medium shadow |
| `--shadow-lg` | Large shadow (modals) |
| `--shadow-xl` | Extra large shadow |

---

## Component Specifications

### Button

**Variants:**

| Variant | Style | Usage |
|---------|-------|-------|
| `default` | Primary background + white text | Primary actions |
| `secondary` | Secondary background + border | Secondary actions |
| `outline` | Transparent + border | Neutral actions |
| `ghost` | Transparent | Toolbar buttons |
| `destructive` | Red background | Dangerous actions |
| `link` | Link style | Text links |

**Sizes:**

| Size | Height | Usage |
|------|--------|-------|
| `sm` | `h-8` | Compact contexts |
| `default` | `h-9` | Standard buttons |
| `lg` | `h-10` | Emphasized buttons |
| `icon` | `size-9` | Icon buttons |
| `icon-sm` | `size-8` | Small icon buttons |
| `icon-lg` | `size-10` | Large icon buttons |

### Card

- Background: `bg-card`
- Border Radius: `rounded-xl`
- Padding: `py-6 px-6`
- Shadow: `shadow-sm`
- Border: `border`

### Tabs

| State | Background | Text |
|-------|------------|------|
| Container | `#252526` | — |
| Inactive | `#292929` | `#A0A0A0` |
| Active | `#1E1E1E` | `#FFFFFF` |
| Hover | `#363637` | — |

---

## Sidebar Specifications

### Primary Navigation

| Variable | Value |
|----------|-------|
| `--sidebar-background` | `#333333` |
| `--sidebar-primary-foreground` | `#808080` |
| `--sidebar-primary-active` | `#FFFFFF` |
| `--sidebar-primary-hover` | `#2B2D2E` |

### Project Section

| Variable | Value |
|----------|-------|
| `--sidebar-project-background` | `#242426` |
| `--sidebar-project-foreground` | `#CCCCCC` |
| `--sidebar-project-active-background` | `#3A3D41` |

---

## Chart Colors

Sequential color palette for data visualization (blue-purple spectrum):

| Variable | Usage |
|----------|-------|
| `--chart-1` | Primary chart color |
| `--chart-2` | Secondary chart color |
| `--chart-3` | Tertiary chart color |
| `--chart-4` | Quaternary chart color |
| `--chart-5` | Quinary chart color |

---

## Related Files

- [globals.css](file:///Users/che/Documents/GitHub/fulling/app/globals.css) — CSS variable definitions
- [style.md](file:///Users/che/Documents/GitHub/fulling/docs/style.md) — Detailed color reference
