# Design System: Fulling v3 — Ethereal Glass

## 1. Visual Theme & Atmosphere

A deep-space, gallery-airy interface with confident asymmetric layouts and fluid spring-physics motion. The atmosphere is **clinical yet warm** — like a well-lit architecture studio floating in void.

- **Density:** 4/10 — Art Gallery Airy. Generous whitespace, breathable layouts
- **Variance:** 7/10 — Offset Asymmetric. Split-screen heroes, staggered grids
- **Motion:** 6/10 — Fluid CSS. Spring-physics transitions, perpetual micro-loops

The design philosophy centers on **"Double Bezel" (Doppelrand)** architecture — nested containers that create a sense of depth through an outer shell and an inner core. Combined with true glass morphism (inner borders + inner shadows for edge refraction), the interface feels like a layered holographic surface suspended in deep space.

## 2. Color Palette & Roles

### Core Neutrals
- **Void Black** (#050505) — Deepest background, the canvas of deep space
- **Abyss** (#0a0a0a) — Secondary background, terminal panels
- **Surface** (#0f0f0f) — Card fills, elevated containers
- **Surface Raised** (#141414) — Hover states, active panels
- **Ink** (#e8e8e8) — Primary text, maximum contrast on dark
- **Ink Dim** (#737373) — Secondary text, descriptions, metadata
- **Ink Faint** (#404040) — Tertiary text, disabled states, borders

### Structural Borders
- **Border Default** (rgba(255,255,255,0.06)) — 1px structural lines, card outlines
- **Border Hover** (rgba(255,255,255,0.12)) — Elevated border on interaction

### Accent Colors
- **Teal Accent** (#14b8a6) — Primary accent for CTAs, active states, focus rings, success indicators
- **Teal Glow** (#2dd4bf) — Hover state for teal elements, lighter variant
- **Teal Dim** (#0d9488) — Pressed/active state for teal elements
- **Amber Warm** (#f59e0b) — Secondary accent for warnings, highlights, warm metadata
- **Amber Glow** (#fbbf24) — Hover state for amber elements
- **Amber Dim** (#d97706) — Pressed/active state for amber elements

### Background Effects
- Deep space gradient with teal/amber ambient orbs:
  - Radial gradient at 15% 30%: rgba(20,184,166,0.08) — teal ambient glow
  - Radial gradient at 85% 70%: rgba(245,158,11,0.05) — amber ambient glow
  - Radial gradient at center: rgba(20,184,166,0.03) — subtle central haze

### Color Rules
- Maximum 2 accent colors (teal primary, amber secondary). Both saturation below 80%
- The "AI Purple/Blue Neon" aesthetic is strictly BANNED
- Never use pure black (#000000) — Void Black (#050505) is the darkest allowed
- No neon/outer glow shadows on text or containers

## 3. Typography Rules

### Font Stack
- **Display / Headlines:** Geist — Track-tight, controlled scale, weight-driven hierarchy
- **Body:** Geist — Relaxed leading, max 65 characters per line
- **Mono:** Geist Mono — For code, metadata, timestamps, terminal output, status indicators

### Type Scale
- Hero headlines: 5xl–7xl (48px–72px), font-bold, tracking-tight, leading-[1.05]
- Section titles: 2xl (24px), font-bold, tracking-tight
- Card titles: text-[15px], font-semibold
- Body text: text-lg (18px) / text-sm (14px), leading-relaxed
- Metadata / timestamps: text-[11px], font-mono
- Eyebrow tags: text-[10px], uppercase, letter-spacing 0.2em, font-weight 500

### Typography Patterns
- Headlines use weight and color contrast for hierarchy, not just massive size
- Gradient text (teal → amber) allowed only on hero headlines, never on body
- Glow text effects: teal glow (0 0 40px rgba(20,184,166,0.25)) for hero emphasis
- Mono font mandatory for all code blocks, terminal output, and numerical metadata

### Banned
- Inter font (too generic for premium contexts)
- Generic serif fonts (Times New Roman, Georgia, Garamond)
- Serif fonts in dashboard or software UIs

## 4. Component Stylings

### Buttons
- **Primary:** Teal fill (#14b8a6), dark text (#050505), rounded-full, font-semibold
  - Hover: Teal Glow (#2dd4bf), enhanced shadow
  - Active: scale(0.98) tactile push feedback
  - Shadow: 0 0 30px rgba(20,184,166,0.2) — subtle ambient glow, not neon
- **Secondary / Ghost:** Glass morphism (rgba(255,255,255,0.02) + blur), 1px border, rounded-full
  - Hover: Background lightens to rgba(255,255,255,0.035), border shifts to teal/15
- **Icon buttons:** 44px minimum touch target, rounded-full, glass morphism base

### Cards
- **Glass Card:** background: rgba(255,255,255,0.02), backdrop-filter: blur(24px) saturate(1.2), border: 1px solid rgba(255,255,255,0.06), box-shadow: 0 8px 32px rgba(0,0,0,0.4) + inset 0 1px 0 rgba(255,255,255,0.04)
  - Hover: Background lightens, border shifts to teal/15, shadow adds teal tint
- **Double Bezel Card:** Outer shell (padding: 2px, background: rgba(255,255,255,0.03), border: 1px solid rgba(255,255,255,0.06), border-radius: 1.5rem) + Inner core (background: rgba(10,10,10,0.8), border-radius: calc(1.5rem - 2px), box-shadow: inset 0 1px 1px rgba(255,255,255,0.06))
  - Used for: Stats counters, feature highlights, terminal containers
- **Spotlight Card:** Glass card with cursor-tracking radial gradient border
  - Pseudo-element with radial-gradient(400px circle at mouse position, rgba(20,184,166,0.15), transparent 50%)
  - Opacity transitions on hover (0 → 1 over 0.4s)

### Navigation
- **Floating Nav Pill:** Glass morphism, rounded-full, px-2 py-2, centered fixed top
  - Logo: Teal-accented icon (w-7 h-7, rounded-lg, bg-accent/15, border border-accent/20) + "Fulling" text
  - Links: px-4 py-2, rounded-full, text-ink-dim, hover: text-ink + bg-white/5
  - CTA: Teal ghost button inside pill
- **Sidebar:** Glass panel, w-60, border-r border-white/5
  - Section headers: eyebrow style (text-[10px], uppercase, letter-spacing 0.2em)
  - Active item: bg-accent/8, border border-accent/15, text-accent
  - Inactive item: text-ink-dim, hover: text-ink + bg-white/5

### Terminal / Code Blocks
- Background: Abyss (#0a0a0a)
- Window chrome: Three dots (amber/teal/faint), mono font label
- Prompt: $ prefix in ink-dim, command in ink
- Output: Teal diamond (◆) for info, amber diamond for warnings
- Success banner: bg-accent/5, border border-accent/10, rounded-xl
- Cursor: Blinking underscore

### Inputs / Forms
- Label above input, helper text optional, error text below
- Focus ring in teal accent color
- No floating labels
- Glass morphism background for input fields

### Loading States
- Skeletal shimmer matching exact layout dimensions
- No generic circular spinners
- Pulse animation for status indicators (animate-pulse)

### Empty States
- Composed compositions indicating how to populate data
- Not just "No data" text

## 5. Layout Principles

### Grid System
- CSS Grid over Flexbox math — never use calc() percentage hacks
- Contain layouts using max-width constraints (max-w-6xl for landing, max-w-5xl for dashboard)
- Generous internal padding (p-8 for dashboard content)

### Hero Section
- **Asymmetric Split:** Left-aligned content (60%) + Right floating visual (40%)
- Left: Eyebrow tag → Headline → Subhead → CTA buttons → Stats row
- Right: Floating terminal with double bezel + floating status badges
- Centered Hero layouts are BANNED — always use split or left-aligned

### Feature Rows
- The generic "3 equal cards horizontally" is BANNED
- Use: 2-column staggered grid, asymmetric splits, or horizontal scroll
- Cards should have varied heights and visual weights

### Dashboard Layout
- Top bar: Glass header, logo left, status + avatar right
- Sidebar: Glass panel, collapsible sections with eyebrow headers
- Main content: Scrollable area with max-width containment
- Filter tabs: Glass pill container with segmented buttons

### Spacing Philosophy
- Section gaps: clamp(3rem, 8vw, 6rem)
- Card internal padding: p-5 (20px)
- Element gaps: gap-4 (16px) standard, gap-3 (12px) for dense areas
- Border radius: rounded-2xl (1rem) for cards, rounded-full for buttons/pills

### Responsive Rules
- Mobile-First Collapse (< 768px): All multi-column layouts collapse to single column
- No horizontal scroll on mobile — critical failure if present
- Headlines scale via clamp() or responsive prefixes (text-5xl lg:text-7xl)
- Body text minimum 1rem / 14px
- Touch targets: 44px minimum for all interactive elements
- Navigation: Desktop horizontal nav collapses to clean mobile menu

## 6. Motion & Interaction

### Animation Engine
- **Spring Physics default:** cubic-bezier(0.32, 0.72, 0, 1) for UI transitions
- **Reveal animation:** opacity 0 → 1, translateY(20px) → 0, blur(4px) → 0, duration 0.8s, easing cubic-bezier(0.16, 1, 0.3, 1)
- **Staggered cascade:** reveal-d1 (0.1s delay), reveal-d2 (0.2s), reveal-d3 (0.3s), reveal-d4 (0.4s)

### Perpetual Micro-Interactions
- **Float animation:** translateY(0) → translateY(-8px) rotate(0.5deg), 7s ease-in-out infinite
  - Applied to: Terminal container, floating badges
- **Pulse glow:** box-shadow oscillates between rgba(20,184,166,0.15) and rgba(20,184,166,0.3), 3s ease-in-out infinite
  - Applied to: Status indicators, active elements
- **Cursor tracking:** Spotlight border follows mouse position within card bounds

### Interaction States
- Hover: -translate-y-0.5 lift, border color shift, background lighten
- Active: scale(0.98) tactile push
- Focus: Teal accent ring

### Performance Rules
- Animate exclusively via transform and opacity
- Never animate top, left, width, height
- Grain/noise filters on fixed pseudo-elements only (isolated from scroll)
- Backdrop-filter blur used sparingly — only on glass cards and nav

## 7. Anti-Patterns (Banned)

### Visual Bans
- No emojis anywhere in the interface
- No pure black (#000000) — use Void Black (#050505)
- No neon/outer glow shadows — only subtle ambient glow
- No oversaturated accents — keep saturation below 80%
- No excessive gradient text on large headers — only hero headline
- No custom mouse cursors

### Layout Bans
- No overlapping elements — every element occupies its own clear spatial zone
- No centered Hero sections (for this high-variance project)
- No 3-column equal card layouts — use asymmetric grids
- No flexbox percentage math — use CSS Grid
- No h-screen — use min-h-[100dvh] for full-height sections

### Typography Bans
- No Inter font
- No generic serif fonts (Times New Roman, Georgia, Garamond, Palatino)
- No serif fonts in dashboard or software UIs

### Content Bans
- No generic names ("John Doe", "Acme", "Nexus")
- No fake round numbers ("99.99%", "50%")
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen")
- No filler UI text: "Scroll to explore", "Swipe down", scroll arrows, bouncing chevrons
- No broken Unsplash links — use picsum.photos or SVG avatars

## 8. File Structure & Implementation Notes

### Key Files
- `design/style-ethereal.html` — Reference implementation (landing + dashboard)
- Tailwind CSS v4 via CDN for rapid prototyping
- Geist + Geist Mono via Google Fonts CDN

### Tailwind Config Extensions
```javascript
colors: {
  void: '#050505',
  abyss: '#0a0a0a',
  surface: '#0f0f0f',
  'surface-raised': '#141414',
  ink: '#e8e8e8',
  'ink-dim': '#737373',
  'ink-faint': '#404040',
  accent: '#14b8a6',
  'accent-glow': '#2dd4bf',
  'accent-dim': '#0d9488',
  warm: '#f59e0b',
  'warm-glow': '#fbbf24',
  'warm-dim': '#d97706',
  border: 'rgba(255,255,255,0.06)',
  'border-hover': 'rgba(255,255,255,0.12)',
},
fontFamily: {
  sans: ['"Geist"', 'sans-serif'],
  mono: ['"Geist Mono"', 'monospace'],
}
```

### CSS Custom Properties for Spotlight
```css
.spotlight::before {
  background: radial-gradient(
    400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(20,184,166,0.15),
    transparent 50%
  );
}
```

### JavaScript for Cursor Tracking
```javascript
document.addEventListener('mousemove', (e) => {
  document.querySelectorAll('.spotlight').forEach(card => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  });
});
```

## 9. Design Tokens Summary

| Token | Value | Usage |
|-------|-------|-------|
| Background | #050505 | Page canvas |
| Card Fill | rgba(255,255,255,0.02) | Glass card background |
| Card Border | rgba(255,255,255,0.06) | 1px structural border |
| Primary Text | #e8e8e8 | Headlines, body |
| Secondary Text | #737373 | Descriptions, metadata |
| Accent | #14b8a6 | CTAs, active states, focus |
| Secondary Accent | #f59e0b | Warnings, warm highlights |
| Font Sans | Geist | All UI text |
| Font Mono | Geist Mono | Code, terminal, numbers |
| Border Radius (Cards) | 1rem (rounded-2xl) | Containers |
| Border Radius (Pills) | 9999px (rounded-full) | Buttons, nav |
| Shadow | 0 8px 32px rgba(0,0,0,0.4) | Card elevation |
| Transition | 0.5s cubic-bezier(0.32, 0.72, 0, 1) | UI interactions |
