# Beplus Visual Mega Navigation — agent briefing

Use this file when changing code under `wp-content/plugins/beplus-visual-mega-nav/`. Full architecture: [`docs/AGENT.md`](./docs/AGENT.md). User-facing overview: `README.md`.

## Codex project rules and skills

Before working in this plugin, read and follow [plan/build rules](.agents/rules/plan-build.md) and [task logging rules](.agents/rules/task-log.md). These are project instructions linked from this entrypoint, not shell execution-policy files. Keep task logs in this plugin's `TASK_LOG.md`.

Project skills live in `.agents/skills/`. Read the matching `SKILL.md` when its workflow applies; do not load every skill for every task. If a skill is not listed in the current session's skill catalog, read its linked file directly.

| Skill | When to use |
|-------|-------------|
| [plan](.agents/skills/plan/SKILL.md) | `/plan` or explicit discussion before implementation; read-only |
| [build](.agents/skills/build/SKILL.md) | `/build`, an approved plan, or a direct implementation request |
| [gutenberg-block-standard](.agents/skills/gutenberg-block-standard/SKILL.md) | Plugin block, template, Global Styles, or editor/frontend consistency changes |
| [browser-use](.agents/skills/browser-use/SKILL.md) | Explicitly requested browser automation, screenshots, or browser verification |
| [sync-live-home-content](.agents/skills/sync-live-home-content/SKILL.md) | Explicit AlonePro homepage image sync or text comparison; not routine plugin work |

These workflows are adapted from the parent workspace's `.agents` for this plugin. Use this project's paths and available commands. Keep code and repository documentation in English; respond in the user's language. Direct implementation requests authorize execution without requiring a separate `/plan` turn.

## What this plugin is

A WordPress plugin that adds a **Gutenberg-powered mega menu builder** to **Appearance → Menus**. Top-level (`depth-0`) menu items can get a visual block-editor panel instead of a standard sub-menu.

**Stack:** PHP 8.0+ (`declare(strict_types=1);`), PSR-4 autoload, React admin UI via `@wordpress/scripts`, vanilla JS + CSS on the frontend.

## Naming

| Context | Value |
|---------|--------|
| Plugin folder / text domain | `beplus-visual-mega-nav` |
| Main file | `beplus-visual-mega-nav.php` |
| PHP namespace | `Snap\MegaMenuBuilder\` |
| PHP constants | `BEPLUS_VISUAL_MEGA_NAV_*` |
| Post meta keys | `_beplus_vmn_*` (see `MetaKeys`) |
| REST namespace | `beplus-visual-mega-nav/v1` |
| PHP filters | `beplus_vmn_*` |
| Script handles / CSS classes | `beplus-vmn-*` |
| Localized JS global | `window.beplusVmn` |

**Legacy compatibility:** `MetaKeys::get()` falls back to `_jemented_megamenu_*` meta when new keys are empty (sites upgraded from the old plugin slug).

## Architecture overview

```
beplus-visual-mega-nav.php          Entry point, constants, autoload, hooks
includes/Core/Bootstrap.php       Meta registration, wires Admin / REST / Frontend
includes/Core/MetaKeys.php        Meta key constants + legacy read fallback
includes/Admin/NavMenuPage.php    Enqueues build/ assets on nav-menus.php
includes/Rest/MegaMenuController.php   GET/POST /beplus-visual-mega-nav/v1/item/{id}
includes/Frontend/MenuRenderer.php     Walker override, CSS class, frontend assets
includes/Frontend/MegaMenuPanelRenderer.php   Panel HTML output
src/                                Admin React app (wp-scripts → build/)
assets/                             Frontend CSS/JS (no build step)
```

### Data flow

1. **Admin:** React app on `nav-menus.php` injects "Mega Menu" buttons on depth-0 items → opens modal → loads/saves via REST.
2. **Storage:** Three `nav_menu_item` post meta fields (registered in `Bootstrap::register_meta()`):
   - `_beplus_vmn_enabled` — boolean
   - `_beplus_vmn_settings` — JSON string (width, customWidth, bgColor, animation, …)
   - `_beplus_vmn_content` — block HTML (serialized Gutenberg content)
3. **Frontend:** `MenuRenderer` swaps in `MegaMenuWalker` for configured theme locations; walker outputs panel HTML; `assets/js/frontend.js` handles open/close + a11y.

## Files you usually touch

| Area | Edit (source) | Do not edit as source |
|------|----------------|------------------------|
| Admin React UI | `src/**/*.js`, `src/css/admin.css` | `build/index.js`, `build/index.css` |
| PHP behavior | `includes/**/*.php`, `beplus-visual-mega-nav.php` | — |
| Frontend presentation | `assets/css/frontend.css`, `assets/js/frontend.js` | — |
| Allowed blocks in editor | `includes/Core/AllowedBlocks.php`, `src/utils/allowed-blocks.js` | — |

After changing `src/`, run **`npm run build`** (or **`npm run start`** for watch).

## Admin UI (`src/`)

| File | Role |
|------|------|
| `index.js` | Entry: `registerCoreBlocks()`, mount `MegaMenuApp` on `#beplus-vmn-root` |
| `components/MegaMenuApp.js` | MutationObserver on `#menu-to-edit`; injects buttons on `.menu-item-depth-0` |
| `components/MegaMenuModal.js` | Full-screen modal; Settings + Content Builder tabs; REST load/save |
| `components/SettingsPanel.js` | Enable toggle, width/animation |
| `components/IsolatedEditor.js` | Standalone `BlockEditorProvider` with curated block list |
| `utils/allowed-blocks.js` | `getAllowedBlocks()` — merges PHP list + `beplus-vmn.allowedBlocks` JS filter |

`NavMenuPage` localizes `window.beplusVmn` with `restBase`, `nonce`, `version`.

## REST API

Namespace: `beplus-visual-mega-nav/v1`

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/item/{id}` | Returns `{ id, enabled, settings, content }` |
| POST | `/item/{id}` | Saves `{ enabled, settings, content }` |
| GET | `/templates` | List template summaries |
| GET | `/templates/{slug}` | Load full template |

Permission: `edit_theme_options`.

## Frontend integration

- **Walker:** Applied only when `theme_location` is in the filtered list (default: `primary`, `main-menu`, `header`).
- **Filter:** `beplus_vmn_locations` — themes must add their menu location slug here.
- **CSS class:** `has-mega-menu` on enabled depth-0 `<li>` elements.
- **Panel markup:** `.beplus-vmn-mega-panel` > `.beplus-vmn-mega-panel__inner` with block content via `apply_filters( 'the_content', … )`.
- **Theme overrides:** CSS custom properties in `assets/css/frontend.css` (`--beplus-vmn-mega-*`).

## Commands

```bash
npm run start       # Watch admin assets
npm run build       # Production build → build/
composer check      # PHP lint + PHPCS + PHPStan
npm run check:js    # ESLint + Stylelint
```

Node 18+ (see `.nvmrc`). Requires `composer install` and `npm install` before building.

## Conventions

- **PHP:** WPCS, strict types, final classes where appropriate, `Snap\MegaMenuBuilder\` namespace under `includes/`.
- **JS:** WordPress `@wordpress/*` packages, `@wordpress/i18n` for strings, text domain `beplus-visual-mega-nav`.
- **Scope:** Mega menu is **root-level only** — do not add depth-1+ support without explicit product decision.
- **Blocks:** Keep defaults curated in `AllowedBlocks.php`; extend via `beplus_vmn_allowed_blocks` rather than forking the array.

## Known gaps / watch-outs

- Sub-menus are hidden via CSS (`.has-mega-menu > .sub-menu { display: none }`), not skipped in the walker.
- Frontend assets enqueue on every front-end page, not only when a mega menu exists.

## Tests & quality

- PHP tests scaffold: `tests/php/bootstrap.php` (PHPUnit config: `phpunit.xml.dist`).
- PHPStan: `phpstan.neon`. PHPCS: `phpcs.xml.dist`.
