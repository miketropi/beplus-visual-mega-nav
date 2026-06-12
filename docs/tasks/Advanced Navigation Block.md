# Advanced Navigation Block — Implementation Specification

> **Audience:** AI coding agent / developer implementing this feature.
> **Context:** WordPress plugin distributed on WordPress.org. Must work with Block Themes (FSE).
> **Status of existing work:** Menu rendering from classic menus — including multi-level submenus/dropdowns and mega menu — is **already implemented**. Do NOT rebuild it. This spec covers the container architecture, the hamburger toggle, layout/responsive behavior, and integration.

---

## 1. Problem Statement

In WordPress Block Themes, the core `core/navigation` block has two major limitations:

1. **No classic menu support.** It uses the `wp_navigation` post type, not the classic `nav_menu` taxonomy (Appearance → Menus). Users migrating from classic themes lose their menu management workflow.
2. **No control over the mobile hamburger position.** When the viewport collapses below the breakpoint (core hardcodes `781px`), the hamburger button renders **at the DOM position of the Navigation block**. A typical header `Logo — Menu — Icons (search | minicart | login)` therefore becomes `Logo — Hamburger — Icons` on mobile, while correct UX expects `Logo — Icons — Hamburger`.

## 2. Solution Overview

Build a custom block: **Advanced Navigation** (`your-plugin/advanced-navigation`).

It is simultaneously:

- A **navigation block** that renders menu items selected from a **classic menu** (`nav_menu` taxonomy), reusing the already-built menu/submenu/mega-menu rendering engine.
- A **layout container** (InnerBlocks) into which the user can drag arbitrary blocks: search, minicart, login, social icons, spacers, or **any third-party block**.
- The mobile **hamburger toggle is a separate child block** the user places anywhere inside the container — this is what gives full control over its position.

```
┌─ Advanced Navigation (container, flex) ─────────────────────────┐
│  [Site Logo] [Menu Area (classic menu)] [Search] [Minicart] [☰] │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Block Architecture

### 3.1 Blocks to register

| Block | Name | Type | Purpose |
|---|---|---|---|
| Advanced Navigation | `your-plugin/advanced-navigation` | Dynamic (PHP render) | Container + orchestrates responsive behavior |
| Menu Area | `your-plugin/nav-menu-area` | Dynamic (PHP render) | Renders the selected classic menu via the existing rendering engine |
| Nav Toggle (Hamburger) | `your-plugin/nav-toggle` | Dynamic or static | The hamburger button; user positions it freely inside the container |

`nav-menu-area` and `nav-toggle` must declare `"parent": ["your-plugin/advanced-navigation"]` in `block.json` so they only appear inside the container.

### 3.2 InnerBlocks policy — IMPORTANT DESIGN DECISION

**Do NOT set `allowedBlocks`. The container accepts ANY block.**

Rationale (decided by the product owner — do not change):

- Users may need blocks from third-party plugins (WooCommerce minicart, membership login, language switchers, etc.) that cannot be predicted in advance.
- Freedom of composition is the product philosophy. If a user breaks their layout with an exotic block, that is their responsibility.
- This mirrors core container blocks (`core/group`, `core/cover`) which are also unrestricted.

Provide a sensible **default template** (logo placeholder → menu area → search → toggle) via `template` on InnerBlocks, with `templateLock: false`.

### 3.3 Container layout

Expose core layout controls via `block.json` instead of building custom controls:

```json
{
  "supports": {
    "layout": {
      "type": "flex",
      "allowJustification": true,
      "allowOrientation": false,
      "allowVerticalAlignment": true
    },
    "spacing": {
      "blockGap": true,
      "padding": true,
      "margin": true
    },
    "color": {
      "background": true,
      "text": true
    },
    "align": ["wide", "full"]
  }
}
```

This gives users the familiar justify/gap UI and inherits theme.json layout behavior automatically.

## 4. Classic Menu Support

### 4.1 Admin availability

On block themes, Appearance → Menus is hidden by default. The plugin must ensure it is available:

```php
add_action( 'after_setup_theme', function () {
    if ( ! current_theme_supports( 'menus' ) ) {
        add_theme_support( 'menus' );
    }
}, 11 );
```

Note: `register_nav_menus()` is NOT required by this plugin. The Menu Area block selects a menu **by ID** (stored as a block attribute), not by theme location. Theme locations remain the theme's concern.

### 4.2 Menu selection UX (editor)

In the Menu Area block Inspector:

- A `SelectControl`/`ComboboxControl` listing all classic menus. Fetch via REST: `GET /wp/v2/menus` (available since WP 5.9, requires `edit_theme_options`-level permissions in editor context — this is fine, the user is in the Site Editor).
- If **no classic menus exist**, render a `Notice` with a direct link to `admin_url( 'nav-menus.php' )` and short copy: "No menus found. Create one in Appearance → Menus."
- Store the selected menu **term ID** in attributes (`menuId: number`). Do not store by slug/name (renaming would break it).

### 4.3 Frontend rendering

The Menu Area block's `render_callback` delegates to the **existing menu rendering engine** (submenus + mega menu already implemented). Requirements:

- Resolve menu by `menuId`; if the menu was deleted, render nothing on the frontend and a warning only in the editor preview.
- All output must be escaped (`esc_url`, `esc_attr`, `esc_html`) — menu item titles/URLs are user input. (The existing engine should already do this; verify.)

### 4.4 Editor preview

Prefer fetching menu items via REST (`/wp/v2/menu-items?menus={id}&per_page=100`) and rendering a lightweight React preview. Fall back to `<ServerSideRender />` if the existing engine's markup is too complex to mirror in JS. Either is acceptable; React preview is smoother.

## 5. Hamburger Toggle & Mobile Behavior

This is the area where core does the heavy lifting for its own block — here we own all of it.

### 5.1 Nav Toggle block

- Renders a `<button>` (never an `<a>` or `<div>`).
- Attributes: icon style (e.g., 3-line / 2-line / dots), optional label text, label visibility.
- Required ARIA:
  - `aria-expanded="false|true"` (synced with overlay state)
  - `aria-controls="{overlay-element-id}"`
  - Accessible name: visible label or `aria-label="Open menu"` / localized.
- Visibility is breakpoint-driven **by CSS only** (see 5.3) — hidden on desktop, visible below the breakpoint. No JS involved in showing/hiding the button itself (prevents FOUC).

### 5.2 Overlay / drawer

When the toggle is activated below the breakpoint:

- The Menu Area content is presented in an overlay/drawer (implementation may reuse what the mega-menu engine provides if applicable).
- **Focus management is mandatory:**
  - Focus moves into the overlay on open.
  - Focus is trapped inside the overlay while open.
  - `Esc` closes the overlay.
  - On close, focus returns to the toggle button.
- Body scroll lock while open.
- Clicking outside / on a backdrop closes it.

### 5.3 Breakpoint — configurable

Unlike core (hardcoded 781px), expose a setting on the **Advanced Navigation container**:

- Attribute `mobileBreakpoint: number` (default `782`), presented as presets (Mobile 600 / Tablet 782 / Custom px).
- Implementation: the container's `render_callback` outputs a per-instance `<style>` with a media query, or a CSS custom property consumed by enqueued styles. Per-instance unique class (e.g., `adv-nav-{hash}`) to scope it.
- Everything breakpoint-dependent (toggle visibility, menu collapse, optional child ordering) keys off this single value.

### 5.4 Frontend JS

- **Use the Interactivity API** (`@wordpress/interactivity`) if the plugin's minimum WP version is ≥ 6.5. Core's own Navigation block runs on it; it is light and standard.
- If minimum WP < 6.5, use dependency-free vanilla JS.
- Declare via `viewScriptModule` (Interactivity API) or `viewScript` in `block.json` so it loads **only when the block is present on the page**.
- No FOUC: initial collapsed/expanded visual state must be pure CSS; JS only handles interaction.

## 6. Responsive Ordering (Bonus Feature)

Users may want a different child order on desktop vs mobile (the original motivating case). Implement as an optional per-child setting:

- Extend direct children of Advanced Navigation with an Inspector control "Order on mobile" (integer, optional). Implementation options: a block filter (`blocks.registerBlockType` + `editor.BlockEdit` + `blocks.getSaveContent.extraProps` adding a class/inline custom property) scoped to blocks whose parent is the container.
- Output: below the container's breakpoint, apply `order: <value>` to that child. Children without a value keep `order: 0` (DOM order).
- This lets one DOM structure serve both layouts with zero duplication. Document the minor a11y caveat (visual order vs tab order may diverge) in the readme.

## 7. Patterns

Ship at least one Block Pattern using the container, registered under the `header` category:

- "Header — Logo / Menu / Icons / Hamburger (mobile-ready)"
- Pre-arranged in the correct order with the toggle at the end; `templateLock: false` so users can rearrange freely.
- Pattern content must not depend on any specific theme.

## 8. WordPress.org Compliance Checklist

- [ ] All assets conditionally loaded: use `block.json` (`style`, `editorStyle`, `viewScript`/`viewScriptModule`) — never enqueue globally on every page.
- [ ] Do not modify, filter, or deregister `core/navigation` or any core block.
- [ ] Escape all dynamic output in render callbacks (`esc_url`, `esc_attr`, `esc_html`, `wp_kses_post` where rich content is intended).
- [ ] All user-facing strings translatable, single text domain matching the plugin slug.
- [ ] No external HTTP requests on the frontend.
- [ ] Sanitize all attributes server-side in render callbacks (never trust serialized attributes: cast `menuId` to `absint`, `mobileBreakpoint` to bounded int, etc.).
- [ ] Prefix everything (functions, classes, handles, block namespace).

## 9. Testing Matrix

| Area | Cases |
|---|---|
| Themes | Twenty Twenty-Four, Twenty Twenty-Five, Astra, Kadence (different theme.json spacing/breakpoints; header is where conflicts surface) |
| Menus | No menus exist; menu deleted after selection; deep nesting (3+ levels); mega menu items; very long item labels |
| Container | Empty container; only menu area; 10+ children; third-party blocks inside (e.g., WooCommerce blocks); nested groups inside |
| Responsive | Breakpoint presets and custom values; resize across the breakpoint with overlay open; toggle position at start/middle/end |
| A11y | Keyboard-only full traversal; screen reader announces expanded state; Esc/outside-click close; focus return |
| Editor | Preview matches frontend; pattern insertion; undo/redo of menu selection |

## 10. Out of Scope (already done — do not rebuild)

- Classic menu item traversal and markup generation
- Multi-level submenu/dropdown behavior (desktop hover + mobile tap-to-expand)
- Mega menu rendering

The agent integrates with these via the existing engine's public API; if the API shape is unclear, ask before refactoring it.