# UI/UX Master Guide

## Comprehensive Design Reference

### 1. Mobile-First Responsive Design

#### Breakpoint System
```
320px  → Base (smallest phone)
576px  → Small phone landscape
768px  → Tablet
992px  → Laptop
1200px → Desktop
1440px → Large desktop
```

#### Responsive Grid Pattern
```css
/* Auto-responsive grid - no media queries needed */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Manual responsive grid */
.grid-responsive {
  display: grid;
  grid-template-columns: 1fr;          /* Mobile: single column */
}
@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
  }
}
@media (min-width: 1200px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr); /* Desktop: 3 columns */
  }
}
```

### 2. Color System Deep Dive

#### Building a Color Scale
```
50  → Lightest (backgrounds, subtle fills)
100 → Light (hover backgrounds)
200 → Light accent (borders, dividers)
300 → Medium light (disabled text)
400 → Medium (placeholder text)
500 → Base (primary brand color)
600 → Medium dark (hover state of primary)
700 → Dark (active/pressed state)
800 → Darker (headings, strong text)
900 → Darkest (near-black, high contrast)
950 → Near black
```

#### Semantic Colors
```
Success: Green (hsl(142, 76%, 36%))
Warning: Amber (hsl(38, 92%, 50%))
Error:   Red (hsl(0, 72%, 51%))
Info:    Blue (hsl(217, 91%, 60%))
```

#### Dark Mode Strategy
- Background: Gray 900-950
- Surface: Gray 800-850
- Text primary: Gray 50-100
- Text secondary: Gray 400
- Borders: Gray 700-800

### 3. Typography System

#### Font Loading Best Practice
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

#### Type Scale (Modular)
```
12px  → Captions, labels, metadata
14px  → Small body text, secondary info
16px  → Default body text
18px  → Large body, card titles
20px  → Section subtitles
24px  → Section headers
30px  → Page titles
36px  → Large titles
48px  → Hero headlines
60px+ → Display text (landing pages)
```

#### Font Weight Usage
- 400 Regular → Body text
- 500 Medium → Emphasized text, labels
- 600 Semi-bold → Subheadings, buttons
- 700 Bold → Headings, important elements

### 4. Layout & Spacing

#### 8px Grid System
```
4px  → Tight spacing (icon gaps)
8px  → Compact elements
12px → Small gaps
16px → Default spacing
24px → Medium spacing (card padding)
32px → Large spacing (section gaps)
48px → Extra large (section separation)
64px → Page-level spacing
96px → Hero section padding
```

#### Container Widths
```css
.container-sm  { max-width: 640px; }   /* Blog, article */
.container-md  { max-width: 768px; }   /* Forms, auth */
.container-lg  { max-width: 1024px; }  /* Dashboard */
.container-xl  { max-width: 1280px; }  /* Full app */
.container-2xl { max-width: 1536px; }  /* Wide layouts */
```

### 5. Component Patterns

#### Button Variants
```
Primary   → Solid background, high contrast (main CTA)
Secondary → Outlined/ghost, lower emphasis
Tertiary  → Text only, minimal emphasis
Danger    → Red variant for destructive actions
Sizes     → sm (32px), md (40px), lg (48px), xl (56px)
```

#### Card Anatomy
```
┌─────────────────────────┐
│ [Image/Media]           │  ← Optional media
├─────────────────────────┤
│ Eyebrow text            │  ← Category/label (text-xs, uppercase)
│ Card Title              │  ← Heading (text-lg, font-semibold)
│ Description text that   │  ← Body (text-sm, text-gray-600)
│ wraps to multiple lines │
│                         │
│ ┌─────────┐ ┌────────┐ │  ← Actions (buttons, links)
│ │ Primary │ │ Ghost  │ │
│ └─────────┘ └────────┘ │
└─────────────────────────┘
Padding: 24px all sides
Border-radius: 12-16px
Shadow: sm or md
```

#### Form Patterns
```
Labels    → Above inputs (not beside), font-medium
Inputs    → 40-48px height, rounded-lg, clear focus ring
Errors    → Below input, text-sm, text-red-500
Hints     → Below input, text-xs, text-gray-500
Spacing   → 16-24px between form groups
```

### 6. Animation & Micro-Interactions

#### Timing Functions
```css
/* Smooth enters */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Bouncy */
transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Quick decel */
transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
```

#### Common Animations
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Scale in */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Staggered children */
.stagger > * {
  animation: slideUp 0.4s ease-out both;
}
.stagger > *:nth-child(1) { animation-delay: 0ms; }
.stagger > *:nth-child(2) { animation-delay: 50ms; }
.stagger > *:nth-child(3) { animation-delay: 100ms; }
```

#### Performance Rules
- Only animate `transform` and `opacity` (composited properties)
- Use `will-change: transform` sparingly for known animations
- Respect `prefers-reduced-motion`: disable non-essential animations

### 7. Accessibility Checklist

#### Keyboard Navigation
- All interactive elements reachable via Tab
- Visible focus indicators (2px ring, 3:1 contrast)
- Escape closes modals/dropdowns
- Arrow keys for menus and selects
- Enter/Space activates buttons

#### Screen Readers
- Semantic HTML (`nav`, `main`, `article`, `aside`)
- Alt text for meaningful images
- `aria-label` for icon-only buttons
- `aria-expanded` for dropdowns
- `aria-live` for dynamic content updates

#### Color & Contrast
- Normal text: 4.5:1 contrast ratio
- Large text (18px+ bold, 24px+ regular): 3:1
- Interactive components: 3:1
- Never use color alone to convey meaning

### 8. 2026 Design Trends

1. **Glassmorphism 2.0** — Frosted glass with blur, subtle borders
2. **Bento grids** — Asymmetric dashboard layouts
3. **AI-native interfaces** — Chat-first, contextual sidebars
4. **Microinteractions** — Purposeful, minimal motion
5. **Dark mode default** — Design dark first, derive light
6. **Variable fonts** — Width, weight, optical-size axes
7. **Spatial design** — Depth via shadows and layers
8. **Brutalist accents** — Bold typography mixed with minimal UI

Last Updated: 2026-02-05
