---
name: js-quality
description: Use when writing, editing, or reviewing JavaScript files in src/ or assets/. ALWAYS run build after src/ changes. Use ONLY for beplus-visual-mega-nav frontend/admin JS code — not for generic JS questions.
---

# JavaScript Quality & Build Pipeline

This project has **two distinct JS surfaces** with different rules.

## Admin React (`src/`)

Source is in `src/` and compiled to `build/` via `@wordpress/scripts`.

### After every `src/` change

1. **Lint the source:**
   ```bash
   npm run check:js
   ```
   This runs ESLint (`wp-scripts lint-js`) + Stylelint (`wp-scripts lint-style`).

2. **Rebuild the bundle:**
   ```bash
   npm run build
   ```
   This produces `build/index.js`, `build/index.css`, `build/index.asset.php`.

   For watch mode during development:
   ```bash
   npm run start
   ```

### Never edit build/ files directly
`build/index.js`, `build/index.css`, `build/index.asset.php` are generated. Only edit files under `src/`.

### Lint auto-fix
```bash
npm run lint:js:fix      # ESLint autofix
npm run lint:css:fix     # Stylelint autofix
npm run format           # Prettier format
```

### Dependencies
- All dependencies come from `@wordpress/*` packages (see `package.json`)
- Do NOT add new npm dependencies without checking `package.json` first
- Use `@wordpress/i18n` (`__()`, `_x()`, `sprintf()`) for translatable strings — textdomain `beplus-visual-mega-nav`

### Key files and their roles

| File | Role |
|------|------|
| `src/index.js` | Entry: `registerCoreBlocks()`, mount `MegaMenuApp` on `#beplus-vmn-root` |
| `src/components/MegaMenuApp.js` | MutationObserver on `#menu-to-edit`; injects "Mega Menu" buttons |
| `src/components/MegaMenuModal.js` | Full-screen modal: Settings + Content Builder tabs; REST load/save |
| `src/components/IsolatedEditor.js` | Standalone `BlockEditorProvider` with curated block list |
| `src/components/SettingsPanel.js` | Enable toggle, animation select |
| `src/components/TemplatePanel.js` | Import/export JSON templates |
| `src/utils/allowed-blocks.js` | `getAllowedBlocks()` — merges PHP list + JS filter |

### Block registration
- Core blocks registered via `registerCoreBlocks()` in `src/index.js`
- Custom `snap-megamenu/link-item` block registered in `src/blocks/link-item/index.js`
- Custom block is **server-rendered** (`save: () => null`) via `includes/Blocks/LinkItemRenderer.php`

### Extending allowed blocks
Use the JS filter `beplus-vmn.allowedBlocks` (admin only):
```js
import { addFilter } from '@wordpress/hooks';
addFilter('beplus-vmn.allowedBlocks', 'my-plugin', (blocks) => [...blocks, 'my-plugin/card']);
```

Prefer the PHP filter `beplus_vmn_allowed_blocks` for server+client parity.

## Frontend vanilla JS/JS (`assets/`)

No build step — these files are enqueued directly.

### Files
- `assets/js/frontend.js` — IIFE, vanilla JS. Handles hover/focus flyout, mobile accordion, ARIA, keyboard escape, Nextora portal compatibility.
- `assets/css/frontend.css` — Theme-overridable via CSS custom properties `--beplus-vmn-mega-*`.

### Conventions for frontend JS
- **No build step** — write vanilla JS (no JSX, no imports)
- **No jQuery** — use `document.querySelector`, `addEventListener`, etc.
- IIFE pattern to avoid global leaks
- Use existing CSS classes: `.has-mega-menu`, `.beplus-vmn-mega-panel`, `.is-open`

## Testing JS
```bash
npm run test:js
```

## Build webpack config
Entry is `src/index.js`. Webpack config extends `@wordpress/scripts` defaults via `webpack.config.js`.
