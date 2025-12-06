# Copilot Instructions for Rikki Mobile Bar

## Project Overview
**Rikki Mobile Bar** is a React + TypeScript + Vite marketing website for a mobile beverage service. Single-page application (SPA) with scroll-based navigation and a service booking workflow powered by Formspree.

**Tech Stack:**
- **Frontend**: React 19, TypeScript 5.8, Vite 7 (fast rebuild)
- **Styling**: Tailwind CSS v4, custom brand color system
- **Components**: Custom UI primitives + Radix UI foundations
- **Forms**: Formspree (`@formspree/react` for contact submission)
- **Icons**: Lucide React (tree-shaken, `lucide-react` package)
- **Build**: `npm run build` runs TypeScript check + Vite build; `npm run dev` for HMR

## Architecture & Key Patterns

### 1. Component Structure
**Component organization** follows a UI-first pattern:
- `src/components/ui/` - Reusable UI primitives (Button, Badge, Card, Input, etc.)
- Each component uses **className variants** via `class-variance-authority` (CVA)
- All UI components export a `cn()` utility that merges Tailwind classes using `clsx` + `tailwind-merge`

**Example patterns in `button.tsx` and `badge.tsx`:**
- CVA for variant/size combinations (e.g., Button: `primary` | `secondary` | `ghost` variants)
- Forward refs for DOM access: `React.forwardRef<HTMLElement, Props>`
- `asChild` prop support (Radix pattern) for polymorphic components
- Custom `cn()` function filters falsy classname values before joining

### 2. Data Management
- **Centralized gallery data**: `src/data/gallery.ts` exports `galleryItems` array
- Each gallery item is typed (`GalleryItem` from Gallery component) with multi-resolution srcsets (WebP + JPG fallbacks)
- **Form state**: Managed via Formspree hook `useForm()` in `App.tsx`

### 3. Routing & Navigation
- **No external router** – single `App.tsx` with scroll-based section navigation
- `SectionId` type defines valid sections: `"about" | "menu" | "food" | "features" | "packages" | "coming-soon" | "gallery" | "book"`
- Menu state toggled via `menuOpen` boolean; responsive hamburger menu via Lucide icons
- Scroll state tracked to update navbar styling

### 4. Styling System
**Tailwind Color Brand System** (`tailwind.config.js`):
```
brand: {
  primary: "#EADFC6"    // parchment page bg
  parchment: "#EADFC6"  // re-export for clarity
  chrome: "#C9C9C9"     // light borders
  ink: "#141414"        // main text
  sea: "#2E9B8A"        // teal accent (primary action)
  rust: "#B96B4D"       // copper accent (hover/secondary)
}
```
Use these brand colors in Tailwind classnames, not hardcoded hex. Example: `bg-brand-sea`, `text-brand-rust`.

**Font families**: Playfair Display (headings), Inter (body) – Google Fonts in HTML or via CSS import.

## Conventions & Patterns

### File Naming
- `.tsx` for components, `.ts` for utilities/data
- Components: PascalCase (e.g., `TechFeatures.tsx`, `Gallery.tsx`)
- Utilities & data: camelCase (e.g., `gallery.ts`, `utils.ts`)

### Import Aliases
- Path alias configured: `@/*` resolves to `src/`
- Use `@/components`, `@/lib/utils`, `@/data/gallery` in imports (see `Card.tsx` for example)

### Type Conventions
- Use `React.ComponentProps<"div">` for HTML element prop spreading (see Card components)
- Extend Radix + CVA types: `VariantProps<typeof buttonVariants>` for variant/size props
- Export interfaces before component exports for IDE discoverability

### The `cn()` Utility
Always use `cn()` from `@/lib/utils` to merge Tailwind classes. It handles:
- Falsy value filtering (undefined, false, null)
- CVA integration
- Tailwind class conflict resolution (via `tailwind-merge`)

Example:
```tsx
className={cn("base-class", isActive && "active-class", customClass)}
```

### Form Handling
- Formspree form ID stored in App.tsx: `useForm("xgvgzrnn")`
- Submit via `formspreeSubmit()` hook – returns form state & handles loading/error
- No client-side validation library; use HTML5 attrs (required, type="email") + Formspree ValidationError component

## Development Workflow

### Commands
- `npm run dev` – Start Vite dev server with HMR (http://localhost:5173)
- `npm run build` – TypeScript check (`tsc -b`) + Vite build to `dist/`
- `npm run lint` – Run ESLint on all `.ts` and `.tsx` files
- `npm run preview` – Preview production build locally

### Deployment
- **Vercel config**: `vercel.json` present (auto-detected)
- **Base URL**: App uses `import.meta.env.BASE_URL` for asset paths (GitHub Pages compatibility)

### Asset Management
- Public assets: `public/` directory (copied to dist root on build)
- Gallery images: `public/gallery/` with multi-resolution srcsets (800w, 1200w, 1600w variants)
- WebP + JPG fallbacks in all srcsets for browser compatibility

## Common Tasks

### Adding a New UI Component
1. Create file in `src/components/ui/ComponentName.tsx`
2. Define CVA variants (reference `badge.tsx` structure)
3. Export typed interface extending `React.ComponentProps<"element">` + `VariantProps<typeof componentVariants>`
4. Use `React.forwardRef` and `cn()` utility in render
5. Re-export from `src/components/ui/` if needed elsewhere

### Updating Brand Colors
- Edit `tailwind.config.js` under `theme.extend.colors.brand`
- Use new color names in classnames (e.g., `bg-brand-sea`)
- No need to rebuild; Vite watches config files

### Adding Gallery Images
1. Place multi-resolution images in `public/gallery/` (name convention: `image-800.jpg`, `image-1200.jpg`, etc.)
2. Add entry to `galleryItems` array in `src/data/gallery.ts` with srcsets
3. Use both WebP and JPG srcsets for fallback support

## Linting & Type Safety
- ESLint config extends: `@eslint/js`, `typescript-eslint/recommended`, `react-hooks`, `react-refresh`
- TypeScript: strict mode not enabled (can be added via `tseslint.configs.strictTypeChecked`)
- Always run `npm run lint` before commits; fix with eslint auto-fix where possible
- TypeScript check is part of build pipeline

## Notes for AI Agents
- **No global state library** – React hooks + Formspree are sufficient for current scope
- **Scroll-based SPA** – adding new sections requires: (1) React component, (2) section entry in `SectionId` type, (3) menu link update
- **Responsive design** – Tailwind's default breakpoints used; no custom media queries detected
- **Performance**: Fast Refresh enabled; HMR works via Vite; no code splitting configured
