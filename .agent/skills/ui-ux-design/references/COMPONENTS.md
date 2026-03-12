# Component Patterns Reference

## Buttons

### Button Variants (Tailwind)
```html
<!-- Primary -->
<button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
  active:scale-[0.98] transition-all font-medium">
  Primary Action
</button>

<!-- Secondary -->
<button class="px-4 py-2 bg-transparent border border-gray-300 text-gray-700 rounded-lg 
  hover:bg-gray-50 active:scale-[0.98] transition-all font-medium">
  Secondary
</button>

<!-- Ghost -->
<button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg 
  transition-all font-medium">
  Ghost
</button>

<!-- Danger -->
<button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
  active:scale-[0.98] transition-all font-medium">
  Delete
</button>

<!-- Icon Button -->
<button class="p-2 rounded-lg hover:bg-gray-100 transition-colors" 
  aria-label="Settings">
  <svg class="w-5 h-5">...</svg>
</button>
```

### Button Sizes
```
sm: h-8  px-3 text-sm
md: h-10 px-4 text-sm  (default)
lg: h-12 px-6 text-base
xl: h-14 px-8 text-lg
```

## Cards

### Basic Card
```html
<div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm 
  hover:shadow-md transition-shadow">
  <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">
    Category
  </span>
  <h3 class="mt-2 text-lg font-semibold text-gray-900">Card Title</h3>
  <p class="mt-2 text-sm text-gray-600 leading-relaxed">
    Description text that provides context.
  </p>
  <div class="mt-4 flex gap-2">
    <button class="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium">
      Action
    </button>
  </div>
</div>
```

### Interactive Card
```html
<div class="group rounded-2xl border border-gray-200 bg-white p-6 
  hover:border-gray-300 hover:shadow-lg transition-all cursor-pointer
  active:scale-[0.99]">
  <h3 class="font-semibold group-hover:text-primary-600 transition-colors">
    Clickable Card
  </h3>
</div>
```

## Forms

### Input Field
```html
<div class="space-y-1.5">
  <label class="text-sm font-medium text-gray-700" for="email">
    Email Address
  </label>
  <input 
    id="email"
    type="email"
    class="w-full h-10 px-3 rounded-lg border border-gray-300 
      focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 
      transition-all text-sm placeholder:text-gray-400"
    placeholder="you@example.com"
  />
  <p class="text-xs text-gray-500">We'll never share your email.</p>
</div>
```

### Error State
```html
<div class="space-y-1.5">
  <label class="text-sm font-medium text-gray-700">Email</label>
  <input class="w-full h-10 px-3 rounded-lg border border-red-300 
    focus:ring-2 focus:ring-red-500/20 focus:border-red-500 
    bg-red-50/50 transition-all text-sm" />
  <p class="text-xs text-red-600 flex items-center gap-1">
    <svg class="w-3 h-3">...</svg>
    Please enter a valid email address
  </p>
</div>
```

## Navigation

### Top Nav
```html
<nav class="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-gray-100">
  <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <div class="flex items-center gap-8">
      <a href="/" class="font-bold text-xl">Brand</a>
      <div class="hidden md:flex items-center gap-6">
        <a class="text-sm font-medium text-gray-600 hover:text-black transition-colors">
          Features
        </a>
      </div>
    </div>
  </div>
</nav>
```

## Modals / Dialogs

### Modal Pattern
```html
<!-- Backdrop -->
<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />

<!-- Dialog -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl 
    animate-in fade-in zoom-in-95 duration-200">
    <h2 class="text-lg font-semibold">Dialog Title</h2>
    <p class="mt-2 text-sm text-gray-600">Dialog content.</p>
    <div class="mt-6 flex justify-end gap-3">
      <button class="px-4 py-2 text-sm font-medium text-gray-700 
        hover:bg-gray-100 rounded-lg">Cancel</button>
      <button class="px-4 py-2 text-sm font-medium bg-black text-white 
        rounded-lg hover:bg-gray-800">Confirm</button>
    </div>
  </div>
</div>
```

## Loading States

### Skeleton
```html
<div class="animate-pulse space-y-4">
  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
  <div class="h-32 bg-gray-200 rounded-lg"></div>
</div>
```

### Spinner
```html
<div class="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
```

Last Updated: 2026-02-05
