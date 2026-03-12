# Accessibility Reference (WCAG 2.2)

## Contrast Requirements

### Text Contrast
- **Normal text** (under 18px bold / 24px regular): **4.5:1** minimum
- **Large text** (18px+ bold / 24px+ regular): **3:1** minimum
- **Incidental text** (decorative, disabled): No requirement

### Non-Text Contrast
- **UI components** (buttons, inputs, icons): **3:1** minimum
- **Focus indicators**: **3:1** against adjacent colors
- **Graphical objects** (charts, icons conveying meaning): **3:1**

## Keyboard Navigation

### Focus Management
```css
/* Visible focus ring */
*:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Remove default outline for mouse users */
*:focus:not(:focus-visible) {
  outline: none;
}
```

### Key Bindings
| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift+Tab | Move to previous focusable element |
| Enter | Activate buttons, links |
| Space | Toggle checkboxes, activate buttons |
| Escape | Close modals, dropdowns, popovers |
| Arrow keys | Navigate within menus, tabs, radio groups |

## ARIA Patterns

### Common ARIA Attributes
```html
<!-- Icon button -->
<button aria-label="Close dialog">
  <svg>...</svg>
</button>

<!-- Expandable section -->
<button aria-expanded="false" aria-controls="section-1">
  Toggle Section
</button>
<div id="section-1" hidden>Content</div>

<!-- Loading state -->
<div aria-live="polite" aria-busy="true">
  Loading results...
</div>

<!-- Required field -->
<input aria-required="true" aria-describedby="email-help">
<span id="email-help">We'll never share your email</span>
```

### Semantic HTML
```html
<header>  → Site/page header
<nav>     → Navigation links
<main>    → Main content (one per page)
<article> → Self-contained content
<section> → Grouped content with heading
<aside>   → Supplementary content
<footer>  → Site/section footer
```

## Motion & Animation

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Testing Tools
- **axe DevTools** — Browser extension for automated checks
- **WAVE** — Web accessibility evaluation tool
- **Lighthouse** — Built into Chrome DevTools
- **WebAIM Contrast Checker** — Quick contrast ratio checks
- **NVDA / VoiceOver** — Screen reader testing

Last Updated: 2026-02-05
