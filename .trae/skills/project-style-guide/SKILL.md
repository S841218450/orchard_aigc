---
name: "project-style-guide"
description: "Enforces project UI style conventions: lucide-react icons only, no emoji, no gradients unless explicitly requested, minimal color palette, no purple gradients. Invoke when generating any UI component, page, or styling code."
---

# Project Style Guide

Mandatory style conventions for all UI code in this project.

## Rules

1. **Icon Library**: Use `lucide-react` exclusively. Never use emoji characters as icons.
2. **No Emoji**: Do not use emoji anywhere in UI components (no 💡📝🔍🎨 etc.).
3. **No Gradients by Default**: Do not generate gradient styles unless the user explicitly requests them.
4. **No Purple Gradients**: Purple/violet gradients are strictly forbidden under any circumstance.
5. **Minimal Color Palette**: Use a clean, minimal color scheme. Prefer neutral grays (zinc/slate/gray) with a single accent color (e.g. blue). Avoid loud or saturated multi-color designs.

## Icon Usage

```tsx
// Correct
import { Search, Send, Paperclip } from "lucide-react";
<Search className="icon" />

// Wrong - never use emoji
<span>💡</span>
```

## Color Guidelines

```scss
// Correct - minimal, clean
background: #fff;
color: #18181b;
border: 1px solid #e4e4e7;
accent: #2563eb;

// Wrong - gradient (unless explicitly requested)
background: linear-gradient(135deg, #3b82f6, #9333ea);

// Wrong - purple gradient (never allowed)
background: linear-gradient(to bottom right, #8b5cf6, #ec4899);
```

## When Generating UI Code

- Always import icons from `lucide-react`
- Use simple solid colors for backgrounds, borders, and text
- Default accent color: blue (`#2563eb`)
- Default text: dark gray (`#18181b` light / `#f4f4f5` dark)
- Default border: light gray (`#e4e4e7` light / `#27272a` dark)
- Use SCSS nesting for styles, not TailwindCSS utility classes
