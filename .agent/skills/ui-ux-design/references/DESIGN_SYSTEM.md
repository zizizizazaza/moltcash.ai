# Design System Reference

## Color Tokens

### Defining a Design System
```css
:root {
  /* Brand */
  --color-primary-50: hsl(210, 100%, 97%);
  --color-primary-100: hsl(210, 100%, 93%);
  --color-primary-200: hsl(210, 100%, 86%);
  --color-primary-300: hsl(210, 100%, 75%);
  --color-primary-400: hsl(210, 100%, 63%);
  --color-primary-500: hsl(210, 100%, 50%); /* Base */
  --color-primary-600: hsl(210, 100%, 42%);
  --color-primary-700: hsl(210, 100%, 35%);
  --color-primary-800: hsl(210, 100%, 28%);
  --color-primary-900: hsl(210, 100%, 22%);
  --color-primary-950: hsl(210, 100%, 14%);

  /* Neutrals */
  --color-gray-50: hsl(0, 0%, 98%);
  --color-gray-100: hsl(0, 0%, 96%);
  --color-gray-200: hsl(0, 0%, 90%);
  --color-gray-300: hsl(0, 0%, 83%);
  --color-gray-400: hsl(0, 0%, 64%);
  --color-gray-500: hsl(0, 0%, 45%);
  --color-gray-600: hsl(0, 0%, 32%);
  --color-gray-700: hsl(0, 0%, 25%);
  --color-gray-800: hsl(0, 0%, 15%);
  --color-gray-900: hsl(0, 0%, 9%);
  --color-gray-950: hsl(0, 0%, 4%);

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

## Tailwind Config Extension
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
}
```

## Component Design Tokens

### Z-Index Scale
```
z-0:    Base content
z-10:   Floating elements (dropdowns)
z-20:   Sticky headers
z-30:   Fixed nav
z-40:   Overlays/backdrops
z-50:   Modals/dialogs
z-[60]: Toasts/notifications
z-[70]: Tooltips
```

### Transition Defaults
```css
/* Standard transition */
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

/* Smooth enter */
transition: all 0.3s cubic-bezier(0, 0, 0.2, 1);

/* Bouncy */
transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
```

Last Updated: 2026-02-05
