# Fulling — Style Reference

> A dedicated AI workspace presented like a polished developer tool. The workspace configuration is the artwork; everything else is a clean white frame.

**Version:** 1.2

**Theme:** light

**Status:** active — global foundation migrated and live SST parity audited 2026-07-14

**Applies to:** public pages, authentication, creator workflows, recipient workflows, and shared product primitives

## Source and fidelity

Fulling's visual system is intentionally derived from [SST](https://sst.dev/) and the [SST Style Guide on Refero](https://styles.refero.design/style/19f92be1-65ac-4432-a82b-0aa1e685d97d). The live SST site is the authoritative upstream reference for rendered dimensions and responsive behavior; Refero supplies the broader style taxonomy. SST defines the visual language, layout density, typography, spacing, color, borders, radii, controls, navigation, and interaction patterns.

The implementation should reproduce SST's system as closely as possible. Adaptation is limited to Fulling's brand, copy, product model, accessibility requirements, and workspace workflows. Do not invent an additional visual language for Fulling.

When sources disagree, use this order:

1. `docs/architecture.md` for Fulling's product model and workflows.
2. This document for Fulling-specific adaptations and codified implementation values.
3. The live SST site for rendered visual details, exact dimensions, and responsive behavior.
4. The Refero SST Style Guide for upstream patterns not exposed by the live landing page.

Any intentional visual deviation from SST must be documented here before it becomes a reusable pattern. Existing code that conflicts with this document is migration work, not precedent.

`app/globals.css` is Fulling's only executable token source. Pages, CSS modules, and shared components must consume its custom properties or Tailwind semantic aliases; they must not redeclare palette, typography, shape, surface, elevation, or status values locally. This document is the human-readable specification and must be updated in the same change whenever the global source changes.

## Design language

Fulling reads like a developer's terminal wrapped in a polished workspace product. A monospaced configuration, file, log, or runtime surface should carry the visual identity instead of decorative illustration. Typography is strictly two-family: IBM Plex Mono carries code, technical labels, and identifiers, while Rubik Variable handles prose, navigation, and UI chrome.

The palette is austere and off-black. A signature dark indigo-violet (`#303055`) drives headings, body, and links on a pure white canvas, with a barely tinted lavender-gray (`#e8e8f2`) as the only soft surface accent. Code syntax uses four muted but distinct hues that do not bleed into the surrounding UI. Components are minimal and flat: small radii, hairline borders, text-first actions, and no decorative shadows.

The product should feel restrained, technical, dense, and scannable. It must not resemble a generic AI marketing site, chatbot builder, Kubernetes dashboard, or card-heavy SaaS template.

## Tokens — Colors

The values below intentionally match the SST reference. Fulling changes only the brand-specific token name from SST Ink to Fulling Ink.

| Name | Value | Token | Role |
|------|-------|-------|------|
| Fulling Ink | `#303055` | `--color-fulling-ink` | Headings, body text, links, and primary text. The dark indigo-violet replaces conventional near-black. |
| Code Plum | `#8844ae` | `--color-code-plum` | Code syntax for strings, property names, and keywords. Reserved for code and inline code. |
| Code Cobalt | `#3b61b0` | `--color-code-cobalt` | Code syntax for method names, object keys, and function calls. |
| Code Teal | `#096e72` | `--color-code-teal` | Code syntax for types, decorators, and selected technical tokens. |
| Code Rust | `#984e4d` | `--color-code-rust` | Code syntax for templates, literals, and low-frequency technical emphasis. |
| Slate | `#403f53` | `--color-slate` | Secondary technical text and code that should not compete with headings. |
| Fog | `#767682` | `--color-fog` | Helper text, icon fills, secondary actions, and navigation metadata. |
| Mist | `#a8a8b0` | `--color-mist` | Disabled text, quiet metadata, subtle icon outlines, and the lightest text role. |
| Obsidian | `#111111` | `--color-obsidian` | Occasional maximum-contrast text or borders where absolute contrast is required. |
| Lavender Mist | `#e8e8f2` | `--color-lavender-mist` | Hairline borders, code backgrounds, tag fills, inputs, and soft surfaces. |
| Paper | `#ffffff` | `--color-paper` | Page canvas and primary surfaces. It is not a filled CTA color. |
| Secondary Ink | `rgba(26, 26, 46, 0.60)` | `--color-secondary-ink` | Canonical landing-page supporting copy, navigation metadata, and utility text. |
| Quiet Ink | `rgba(26, 26, 46, 0.38)` | `--color-quiet-ink` | Canonical landing-page footer and low-priority metadata. |
| Announcement Blue | `#5196b3` | `--color-announcement-blue` | SST-matched `NEW` badge border and text only. |

### Color rules

- Use Fulling Ink as the single primary heading and link color.
- Use Secondary Ink for public-page supporting copy. Use Slate or Fog for product and technical secondary copy.
- Use Mist for disabled and deliberately quiet information, while maintaining accessible contrast for required content.
- Use Lavender Mist as the only general surface tint above white.
- Reserve Code Plum, Cobalt, Teal, and Rust for code blocks, terminal output, diffs, and inline `code` spans.
- Do not create a separate marketing accent color or filled CTA color.
- Do not use legacy green tokens in migrated Fulling surfaces.
- Destructive and status colors are functional exceptions and must be quiet, accessible, and confined to status semantics.

### Functional status colors

SST's public style reference does not define a complete application status palette. Fulling may use the following semantic roles only where status cannot be communicated clearly through text and iconography alone:

| Role | Value | Token | Usage |
|------|-------|-------|-------|
| Success | `#35654d` | `--color-status-success` | Completed, healthy, connected, or ready states. |
| Warning | `#755c16` | `--color-status-warning` | Degraded, pending attention, or expiring states. |
| Error | `#a13d3b` | `--color-status-error` | Failed, invalid, disconnected, or destructive states. |
| Info | `#405f88` | `--color-status-info` | Neutral progress or informational state. |

These values are the adopted light-theme status colors and are reserved for semantic feedback. Do not reuse code syntax colors as shortcuts for product status.

## Tokens — Typography

### IBM Plex Mono

The code and technical voice. Use it for code blocks, terminal output, logs, inline code, file names, paths, runtime identifiers, API identifiers, command lines, technical labels, and machine-readable values.

- **Token:** `--font-ibm-plex-mono`
- **Substitute:** JetBrains Mono, Fira Code, Space Mono
- **Weights:** 400, 600
- **Sizes:** 14, 16, 18, 48
- **Line height:** 1.00–1.80
- **Letter spacing:** `-0.021em`
- **Role:** Technical content only. Weight 600 highlights prompts, file names, and key tokens.

### Rubik Variable

The product and prose voice. Use it for navigation, product headings, body copy, labels, buttons, footer text, dialogs, forms, and UI metadata. The public landing display headline is the documented IBM Plex Mono exception.

- **Token:** `--font-rubik-variable`
- **Substitute:** Inter, IBM Plex Sans, Geist
- **Weights:** 400, 500, 600
- **Sizes:** 9, 12, 13, 14, 16, 18, 20
- **Line height:** 1.00–1.80
- **Letter spacing:** `0.016em–0.056em` for uppercase labels
- **Role:** Weight 400 is default body, 500 is navigation and action emphasis, and 600 is headings.

### Type scale

| Role | Size | Weight | Line height | Letter spacing | Token |
|------|------|--------|-------------|----------------|-------|
| micro | 9px | 500 | 1.78 | `0.056em` uppercase | `--text-micro` |
| caption | 12px | 400 | 1.5 | — | `--text-caption` |
| metadata | 13px | 400 | 1.2 | — | `--text-metadata` |
| body | 14px | 400 | 1.8 | — | `--text-body` |
| body-lg | 16px | 400 | 1.8 | — | `--text-body-lg` |
| heading-sm | 18px | 600 | 1.5 | — | `--text-heading-sm` |
| heading | 20px | 400–600 | 1.5 | — | `--text-heading` |
| display | 48px | 600 | 1.1 | `-1.01px` | `--text-display` |

### Typography rules

- Use Rubik Variable at 14px weight 400 and 1.8 line height for standard prose.
- Use IBM Plex Mono for every code surface and technical identifier.
- Do not mix the two families within one content role.
- Do not use monospaced type merely to make an interface look technical.
- Uppercase eyebrows and compact labels may use positive tracking; normal prose must not.
- Marketing display copy may use the monospaced display treatment only when directly reproducing an approved SST-derived composition. Product UI headings remain Rubik.

## Tokens — Spacing & Shapes

**Base unit:** 4px

**Density:** comfortable and compact

### Spacing scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 40 | 40px | `--spacing-40` |
| 48 | 48px | `--spacing-48` |
| 64 | 64px | `--spacing-64` |
| 72 | 72px | `--spacing-72` |

Use only values on the 4px grid unless a source-matching optical adjustment is documented. Prefer 10–16px gaps inside compact controls only when matching the SST source precisely.

### Border radius

| Element | Value | Token |
|---------|-------|-------|
| hairline details | 1px | `--radius-sm` |
| tags | 4px | `--radius-tags` |
| inputs | 4px | `--radius-inputs` |
| buttons | 4px | `--radius-buttons` |
| cards | 8px | `--radius-cards` |
| code blocks | 8px | `--radius-code-blocks` |

Pill shapes are allowed only for compact utility controls whose SST reference is pill-shaped. Structural cards, panels, dialogs, and workspace surfaces must not use large radii.

### Layout

- **Product page max-width:** 1200px
- **Landing hero width:** 857px (`408px + 49px + 400px`)
- **Section gap:** 64px
- **Card padding:** 16px
- **Element gap:** 10–16px
- **Control height:** 36px for SST-matched header utilities; otherwise compact and source-matched within 32–40px
- **Border:** 1px hairline in Lavender Mist
- **Desktop:** dense, scannable panes with clear alignment
- **Mobile:** preserve hierarchy and behavior; stack panes instead of inventing a separate visual system

## Components

### Code Block

**Role:** Hero centerpiece, configuration preview, and content illustration

Use an 8px radius, SST's subtle `#fcfcfd` to `#f8f8fb` vertical surface treatment, and a 1px Lavender Mist border. Content uses IBM Plex Mono at 14.4px with a 23.76px line height and 16px horizontal padding. Prompts and commands use Fulling Ink, strings use Code Plum, object keys and functions use Code Cobalt, types use Code Teal, and literals may use Code Rust. The landing hero uses a source-matched low-contrast multi-stop shadow and the 16px SST dot mask behind the code surface; this is the only approved decorative texture.

### Ghost Nav Button

**Role:** Primary navigation

Transparent background and no default border. Use Rubik Variable 14px weight 500 in Fulling Ink. Inactive items use Fog. Hover and active states may use a 4px radius with a subtle Lavender Mist treatment.

### Text Link / Inline Action

**Role:** In-content navigation and primary calls to action

Use Rubik Variable 14–16px weight 500 in Fulling Ink with no default underline. Hover may underline or shift to a nearby neutral. Follow the label with the source-appropriate `>` chevron or `→`. Do not use a filled primary background.

### New Badge

**Role:** Feature announcement

Use a transparent fill, 1px Announcement Blue border, 4px radius, 18px total height, and 5px horizontal padding. The label uses Rubik Variable 9px weight 500, uppercase, `0.5px` tracking, and Announcement Blue.

### Search Bar

**Role:** Global search trigger

Use a 36px-high transparent trigger with a 1px Lavender Mist border and 4px radius. Placeholder text uses Rubik Variable 13–14px weight 400 in Secondary Ink. A keyboard shortcut hint uses IBM Plex Mono 12px in Mist. When paired with an adjacent utility, use joined 4px outer corners and square shared corners as SST does.

### Utility Button

**Role:** Header and shell utilities such as Dashboard, Share, Preview, or Console

Use a 36px-high transparent background with a 1px Lavender Mist border and 4px radius. Text uses Rubik Variable 13px weight 400 in Secondary Ink. Match SST's compact proportions and avoid a filled background.

### Brand Logo Mark

**Role:** Top-left identity anchor

Use the official Fulling mark followed by the Fulling wordmark in Rubik Variable, weight 600, Fulling Ink. Keep the lockup compact, unboxed, and flush-left in the header. Do not redraw or decorate the logo in CSS.

### Social Proof Strip

**Role:** Quiet trust signal on public pages

Use a horizontal row of grayscale logos or concise product capabilities at 60–80% opacity in Fog. Keep 24–32px gaps and no borders. The eyebrow uses Rubik Variable 9–12px uppercase with tracked lettering in Mist.

### Hero Text Block

**Role:** Primary public value proposition

Use a right-column composition at desktop. The canonical SST treatment is IBM Plex Mono 48px weight 600, `52.8px` line height, and `-1px` letter spacing in Fulling Ink. Supporting text uses Rubik Variable 20px weight 400 with a 30px line height in Secondary Ink. The text column is exactly 400px at tablet and desktop. Use no containing card, decorative background, or border.

### Terminal Command Line

**Role:** Technical inline action or example

Use IBM Plex Mono 14px. The prompt is Mist and the command is Fulling Ink at weight 600. Use this only for real commands. Fulling is a web application, so public calls to action must not be presented as fictional CLI commands.

### Footer Link Group

**Role:** Secondary public navigation

Place copyright at the left in Rubik Variable 12–13px weight 400 and Mist. Place text links and monochrome social icons at the right in Fog with 16–24px gaps and no separators. Stack cleanly on narrow screens.

## Product components

These components extend the SST language to Fulling's workspace product model. They must use the same tokens, density, shapes, and interaction behavior rather than introducing a parallel application style.

### Application Shell

**Role:** Persistent creator and recipient navigation

Use a white canvas, hairline dividers, compact navigation, and flat panes. The Fulling brand anchors the top-left. Workspace identity and primary navigation must remain scannable. Avoid oversized sidebars, floating navigation cards, gradients, and decorative backgrounds.

### Workspace Row

**Role:** Workspace lists, search results, and recents

Prefer aligned rows over marketing cards. Show name, concise metadata, status, owner or recipient context, and the primary action. Use 16px padding, 1px Lavender Mist dividers, Rubik for labels, and IBM Plex Mono only for identifiers or timestamps that benefit from fixed-width alignment.

### Workspace Configuration Panel

**Role:** Mission, knowledge, memory, skills, scripts, and runtime configuration

Use a flat white surface with a small Rubik heading, concise helper copy, and compact controls. Group related settings with spacing and hairline separators, not nested cards. Technical values, file paths, and runtime identifiers use IBM Plex Mono.

### Workspace Navigation

**Role:** Movement between Mission, Knowledge, Memory, Skills, Scripts, Runtime, Test, and Share

Use compact text-first navigation. Active state is expressed with Fulling Ink, weight, and a restrained border or Lavender Mist surface. Inactive items use Fog. Preserve the same order and labels across desktop and mobile.

### Runtime Status

**Role:** Runtime readiness and lifecycle feedback

Pair a concise text label with an icon and optional semantic status color. Do not rely on color alone. Runtime IDs, image references, ports, and timestamps use IBM Plex Mono. Actions remain ghost or outlined unless destructive.

### File, Knowledge, Skill, and Script Row

**Role:** Dense capability management

Use aligned rows with a leading type icon, primary label, concise metadata, status, and trailing actions. Prefer hairline separators over individual cards. Names and paths may use IBM Plex Mono when they are technical identifiers; explanatory text remains Rubik.

### Editor and Terminal Surface

**Role:** Mission editing, scripts, logs, files, and test console output

Use IBM Plex Mono inside the technical surface, 1px Lavender Mist borders, 4–8px radius, white or Lavender Mist background, and restrained syntax color. Provide visible focus, selection, empty, loading, and error states. Do not add fake terminal chrome where it does not clarify function.

### Form Control

**Role:** Text fields, textareas, selects, checkboxes, and switches

Use a 4px radius, 1px Lavender Mist border, white background, Rubik 14px labels, and compact height. Focus must be visible without using code syntax colors as decoration. Helper and validation text sits directly below the field. Disabled controls use Mist but remain legible.

### Dialog

**Role:** Focused creation, confirmation, sharing, and destructive actions

Use a white surface, 8px radius, hairline border, minimal elevation, and 16–24px internal spacing. Headings and copy use Rubik. Technical names may use IBM Plex Mono. Primary actions remain restrained; destructive confirmation is the only place where a functional error treatment may dominate.

### Empty State

**Role:** First use and zero-data guidance

Use concise copy and one clear text or ghost action. An approved product icon may be used, but no decorative illustration is required. Explain what the missing object enables rather than filling the surface with marketing language.

### Artifact Row

**Role:** Generated files, reports, tables, images, logs, and approval records

Use an aligned row with type, title, creator or run context, timestamp, and open or download action. Keep preview imagery subordinate to the information structure. Use IBM Plex Mono for file names and machine identifiers.

## Interaction states

Every reusable control and workflow must define the following where applicable:

### Hover

Use small changes in text color, underline, border, or Lavender Mist surface. Avoid movement, scale, glow, and dramatic elevation.

### Focus

Provide a clearly visible keyboard focus indicator with sufficient contrast and at least a 2px effective outline. Focus order must follow reading order. Do not remove outlines without a replacement.

### Active and selected

Use Fulling Ink, weight, a restrained border, or Lavender Mist surface. Do not introduce a new selection color.

### Disabled

Use Mist and reduced emphasis while retaining the label and reason where useful. Disabled controls are non-interactive and must not masquerade as loading controls.

### Loading

Preserve layout to avoid shifts. Use compact progress text, a restrained spinner, or skeletons built from Lavender Mist. Do not replace an entire workspace with decorative animation.

### Empty

State what is absent, why it matters, and the single next action. Match surrounding density.

### Error

Place the error near its cause. Use direct language, an icon where helpful, and a recovery action. Never rely on color alone.

### Destructive

Require explicit labels and confirmation proportional to the consequence. Name the affected workspace or object. Do not use vague labels such as “Continue.”

## Do's and Don'ts

### Do

- Reproduce SST's typography, palette, spacing, density, borders, radii, and interaction restraint.
- Use IBM Plex Mono for code, terminal output, file names, paths, runtime IDs, and technical identifiers.
- Use Rubik Variable for product UI, prose, headings, buttons, labels, and navigation.
- Use Fulling Ink as the single heading and link color.
- Use Lavender Mist as the only general surface tint above white.
- Use 4px radii for buttons, tags, and inputs, and 8px for cards and code blocks.
- Keep navigation and calls to action text-first or ghost-style.
- Prefer aligned rows, panes, and separators over collections of cards.
- Keep desktop and mobile behavior consistent.
- Meet WCAG AA contrast and provide complete keyboard interaction.

### Don't

- Do not create a filled primary CTA color.
- Do not apply code syntax colors to ordinary UI, icons, badges, focus rings, or marketing decoration.
- Do not add drop shadows to cards, buttons, navigation, or routine product panels.
- Do not mix Rubik and IBM Plex Mono within the same content role.
- Do not use black or generic neutral gray when Fulling Ink, Slate, Fog, or Mist is appropriate.
- Do not introduce gradients, textures, glass effects, glow, or decorative backgrounds outside the exact SST-derived code-surface treatment and dot mask documented here.
- Do not use large radii on structural elements.
- Do not use generic marketing cards, oversized metrics, or decorative AI imagery.
- Do not let existing legacy UI define new patterns.
- Do not invent dark mode until it has a separate approved reference and complete token set.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Paper | `#ffffff` | Page canvas and primary card or pane surfaces. |
| 1 | Lavender Mist | `#e8e8f2` | Code backgrounds, subtle tags, inputs, selected rows, and soft separation. |

Use borders and spacing before adding another surface level. Additional elevations or tinted surfaces require a documented product need and an approved SST-aligned reference.

## Elevation

- **Code block:** use the source-matched `--shadow-code-block` token from `app/globals.css`
- **Dialog:** use `--shadow-dialog` only to separate the modal plane from its backdrop
- **Cards, buttons, navigation, rows, and routine panels:** no shadow

## Imagery

Fulling is essentially imageless. Public pages use syntax-highlighted workspace configuration as the hero visual instead of photography, illustration, 3D rendering, abstract graphics, or fake product screenshots. The SST-derived 16px dot mask behind the hero code surface is a layout texture, not brand imagery. Product surfaces use real files, artifacts, logs, output previews, and approved icons only when they communicate function.

The official Fulling mark, monochrome proof logos, and small social icons are the only default brand graphics. The visual identity is the workspace itself.

Do not use lifestyle photography, robots, brains, sparkles, glowing orbs, gradients, abstract AI waves, or decorative Kubernetes imagery.

## Layout

### Public pages

Use the measured SST landing composition:

- At `1024px` and wider, use a centered `408px / 400px` two-column grid with a `49px` gap. The code surface is `408 × 499px`; the display headline and supporting copy occupy the 400px right column. Align both the top and bottom edges of the two content columns. When an announcement precedes the headline, the code surface aligns with the announcement rather than the headline; adjust the proof-strip spacing so its final row aligns with the code surface bottom.
- Between `640px` and `1023px`, use a 56px fixed header, 48px top offset, a centered `408 × 499px` code surface first, then the 400px copy column after a 48px gap.
- Below `640px`, use 16px page gutters and 24px top offset. Put the copy first and the code surface second. At a 390px viewport the code surface is `358 × 600px`.
- Use a fixed translucent white header: 64px high on desktop and 56px below 1024px, with a 1px Lavender Mist bottom border. Desktop padding is `12px 12px 12px 16px`; narrower padding is `12px 16px`.
- Hide desktop-only star and Dashboard/Console utilities below 1024px, matching SST. Preserve the compact text navigation that still fits.
- Use a 48px footer on desktop and tablet. Below 640px, use a 144px stacked footer with 24px vertical and 16px horizontal padding.

The landing page reads as a single document, not a collection of marketing sections. Fulling copy and information architecture may differ from SST, but rendered typography, controls, borders, radii, gutters, breakpoints, and density must follow these measurements.

### Product pages

Use a stable application shell with compact navigation and aligned content panes. Prioritize information hierarchy, scanning, and direct manipulation. Workspace pages may use split panes where configuration and output need simultaneous visibility. Avoid a dashboard made of unrelated floating cards.

At narrow widths, collapse navigation intentionally, stack panes in task order, preserve labels, and keep primary actions reachable. Do not hide required workflow steps solely to simplify the mobile layout.

## Accessibility

- Meet WCAG AA contrast for text, controls, focus, and status communication.
- Support keyboard navigation for all interactive elements.
- Use semantic HTML before adding ARIA.
- Provide visible focus and logical focus order.
- Do not communicate status or validation through color alone.
- Respect reduced motion.
- Keep touch targets usable even when visual controls are compact.
- Preserve zoom and text resizing without clipping or horizontal document overflow.

## Agent Prompt Guide

When generating or implementing Fulling UI, begin with:

> Reproduce the SST design language for Fulling as faithfully as possible. Use a pure white canvas, dark indigo-violet Fulling Ink, Rubik Variable for product UI and prose, IBM Plex Mono for technical content and the public display headline, a 4px spacing grid, 4–8px radii, hairline Lavender Mist borders, flat surfaces, and text-first actions. Use the documented SST code-surface treatment only where specified. Do not invent decorative AI visuals, filled CTA colors, large radii, gradients, or card-heavy layouts. Preserve Fulling's workspace product model from `docs/architecture.md`.

### Quick color reference

- Text and heading: `#303055`
- Secondary body text: `#403f53`
- Muted and helper text: `#767682`
- Disabled and quiet metadata: `#a8a8b0`
- Surface tint and border: `#e8e8f2`
- Canvas: `#ffffff`
- Code syntax only: `#8844ae`, `#3b61b0`, `#096e72`, `#984e4d`
- Primary action: no distinct CTA color

### Example component prompts

1. **Code Block:** Create an 8px-radius code block with the documented SST soft surface, 1px Lavender Mist border, and 16px horizontal padding. Use IBM Plex Mono 14.4px/23.76px. Render strings in Code Plum, object keys in Code Cobalt, types in Code Teal, literals in Code Rust, and ordinary code in Fulling Ink.
2. **Hero Text Block:** Create a 400px right-column hero with a 48px IBM Plex Mono heading at weight 600, 52.8px line height, and `-1px` tracking in Fulling Ink. Use Rubik 20px/30px in Secondary Ink for supporting copy. Add no background or containing card.
3. **New Badge:** Create an 18px-high transparent badge with a 1px Announcement Blue border, 4px radius, and 5px horizontal padding. Use Rubik 9px weight 500, uppercase, `0.5px` tracked, in Announcement Blue.
4. **Search Bar:** Create a 36px-high transparent search trigger with a 1px Lavender Mist border and 4px radius. Use Rubik 13–14px in Secondary Ink and an IBM Plex Mono 12px shortcut hint in Mist.
5. **Workspace Row:** Create a flat 16px-padded row with a Lavender Mist divider. Use Rubik for the workspace name and metadata, IBM Plex Mono only for technical identifiers, a concise text status, and a trailing ghost action.
6. **Configuration Panel:** Create a white workspace configuration pane with a Rubik heading, compact helper copy, 4px-radius controls, hairline separators, and no shadow. Use IBM Plex Mono only for paths, code, and runtime values.

## Similar brands

- **SST:** Authoritative visual and interaction reference.
- **Vercel:** Comparable developer-first restraint, white canvas, and monospaced technical surfaces.
- **Railway:** Comparable two-font system and terminal-oriented product language.
- **Astro:** Comparable documentation-led marketing and code-as-visual identity.
- **Linear:** Comparable density and small-radius discipline, though Fulling should remain flatter.

These brands are context only. SST remains the source to match.

## Token inventory

The following snippets show the selected canonical values for documentation and prompt context. They are not a second implementation source and must not be copied into page or component styles. Production code imports `app/globals.css` through the root layout and consumes those global tokens directly. Tailwind's active spacing, type, weight, radius, color, and font utilities are aliased back to the same root tokens there.

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-fulling-ink: #303055;
  --color-code-plum: #8844ae;
  --color-code-cobalt: #3b61b0;
  --color-code-teal: #096e72;
  --color-code-rust: #984e4d;
  --color-slate: #403f53;
  --color-fog: #767682;
  --color-mist: #a8a8b0;
  --color-obsidian: #111111;
  --color-lavender-mist: #e8e8f2;
  --color-paper: #ffffff;
  --color-secondary-ink: rgba(26, 26, 46, 0.6);
  --color-quiet-ink: rgba(26, 26, 46, 0.38);
  --color-announcement-blue: #5196b3;
  --color-status-success: #35654d;
  --color-status-warning: #755c16;
  --color-status-error: #a13d3b;
  --color-status-info: #405f88;

  /* Typography — Font Families */
  --font-ibm-plex-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  --font-rubik-variable: "Rubik Variable", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Typography — Scale */
  --text-micro: 9px;
  --leading-micro: 1.78;
  --text-caption: 12px;
  --leading-caption: 1.5;
  --text-metadata: 13px;
  --leading-metadata: 1.2;
  --text-body: 14px;
  --leading-body: 1.8;
  --text-body-lg: 16px;
  --leading-body-lg: 1.8;
  --text-heading-sm: 18px;
  --leading-heading-sm: 1.5;
  --text-heading: 20px;
  --leading-heading: 1.5;
  --text-display: 48px;
  --leading-display: 1.1;
  --tracking-display: -1.01px;

  /* Typography — Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Spacing */
  --spacing-unit: 4px;
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-64: 64px;
  --spacing-72: 72px;

  /* Layout */
  --page-max-width: 1200px;
  --landing-hero-width: 857px;
  --landing-code-width: 408px;
  --landing-copy-width: 400px;
  --landing-column-gap: 49px;
  --landing-header-height: 64px;
  --landing-header-height-compact: 56px;
  --landing-footer-height: 48px;
  --header-utility-height: 36px;
  --section-gap: 64px;
  --card-padding: 16px;
  --element-gap-min: 10px;
  --element-gap-max: 16px;

  /* Border Radius */
  --radius-sm: 1px;
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-tags: 4px;
  --radius-cards: 8px;
  --radius-inputs: 4px;
  --radius-buttons: 4px;
  --radius-code-blocks: 8px;

  /* Surfaces */
  --surface-paper: var(--color-paper);
  --surface-lavender-mist: var(--color-lavender-mist);

  /* Elevation */
  --shadow-code-block:
    rgba(199, 199, 199, 0.04) 0 1px 1.5px,
    rgba(199, 199, 199, 0.08) 0.1px 12px 18px,
    rgba(199, 199, 199, 0.08) 0.3px 26px 39px,
    rgba(199, 199, 199, 0.1) 0.6px 55px 82.5px,
    rgba(255, 255, 255, 0.9) 0 0 2px 1px inset;
}
```

### Tailwind v4

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --font-sans: var(--font-rubik-variable);
  --font-mono: var(--font-ibm-plex-mono);
}
```

## Implementation requirements

- Use `app/globals.css` as the one versioned executable token source for every Fulling surface.
- Map shared components to semantic tokens; do not duplicate literal hex values across pages.
- Load only Rubik Variable and IBM Plex Mono at the root; do not retain legacy font aliases.
- Treat a hard-coded design color outside `app/globals.css` as a regression.
- Remove legacy tokens and components after their migration is complete.
- Review representative desktop and mobile screens against the SST source.
- Add visual regression coverage for the application shell, workspace list, builder, runtime state, dialog, empty state, and public landing page.
- Treat loading, empty, error, focus, disabled, and destructive states as required component states.
- Keep remaining migration work explicit in linked issues.

## Migration rule

This document describes the target system. A page is migrated only when its typography, colors, spacing, borders, radii, controls, states, and responsive behavior use this shared foundation. Partial visual resemblance is not completion.

There is no compatibility layer for the retired design system. When an old component conflicts with the global foundation, migrate or replace it rather than adding fallback tokens, aliases, or page-specific exceptions.
