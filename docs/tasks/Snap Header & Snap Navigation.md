# Snap Header & Snap Navigation — Implementation Specification

> **Audience:** AI coding agent implementing this feature.
> **Context:** WordPress plugin distributed on WordPress.org. Targets Block Themes (FSE).
> **Prior work:** Classic-menu rendering — including multi-level submenus and mega menu — is already implemented. Do NOT rebuild it. This spec covers the new two-tier container architecture, the hamburger toggle, sticky/scroll behaviour, and integration with the existing rendering engine.

---

## 1. Problem Statement

In WordPress Block Themes, the core `core/navigation` block has two limitations this plugin solves:

1. **No classic menu support.** Core uses the `wp_navigation` post type, not the classic `nav_menu` taxonomy (Appearance → Menus). Users migrating from classic themes lose their menu management workflow.
2. **No control over the mobile hamburger position.** When the viewport collapses below the breakpoint (core hardcodes `781px`), the hamburger renders at the DOM position of the Navigation block. A header like `Logo — Menu — Icons` therefore becomes `Logo — Hamburger — Icons` on mobile, while correct UX expects `Logo — Icons — Hamburger`.

Additionally, header-level concerns (sticky positioning, scroll effects, transparent-on-top) cannot live inside a navigation block — they apply to the entire header region.

## 2. Solution Overview

Build a **two-tier container architecture**:

- **Snap Header** (`your-plugin/snap-header`) — outer container. Owns sticky positioning, scroll effects, and the per-instance breakpoint value. Provides context to descendants.
- **Snap Navigation** (`your-plugin/snap-navigation`) — inner container. Owns flex layout, the mobile overlay/drawer, and the open/closed state. Consumes the breakpoint from context.
- **Menu Area** (`your-plugin/nav-menu-area`) — renders a selected classic menu via the existing rendering engine.
- **Nav Toggle** (`your-plugin/nav-toggle`) — the hamburger button. Placed freely anywhere inside Snap Header.

```
┌─ Snap Header (div, sticky + scroll effects) ──────────────────────┐
│  ┌─ Logo ──┐  ┌─ Snap Navigation (flex container) ─────────────┐  │
│  │         │  │  [Menu Area] [Search] [Minicart] [Hamburger ☰] │  │
│  └─────────┘  └────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

Logo and Snap Navigation sit as siblings inside Snap Header so users can build any header template (logo left / nav right, centered logo, logo right, multiple navs, etc.) without restrictions.

## 3. Block Architecture

### 3.1 Blocks to register

| Block | Name | Purpose |
|---|---|---|
| Snap Header | `your-plugin/snap-header` | Outer container. Sticky, scroll effects, breakpoint provider. |
| Snap Navigation | `your-plugin/snap-navigation` | Inner flex container. Overlay/drawer host. |
| Menu Area | `your-plugin/nav-menu-area` | Renders a classic menu via the existing engine. |
| Nav Toggle | `your-plugin/nav-toggle` | Hamburger button. |

All blocks are dynamic (PHP render). Use `apiVersion: 3` so they work inside the iframed Site Editor.

### 3.2 Parent / ancestor constraints

- `snap-navigation`: `"parent": ["your-plugin/snap-header"]` — must be a direct child of Snap Header.
- `nav-menu-area`: `"parent": ["your-plugin/snap-navigation"]` — direct child of Snap Navigation.
- `nav-toggle`: `"ancestor": ["your-plugin/snap-header"]` — may appear anywhere below Snap Header (in Snap Navigation, in a nested group, etc.). `ancestor` (not `parent`) is required because users place the toggle freely.

### 3.3 InnerBlocks policy — DESIGN DECISION (do not change)

**Neither Snap Header nor Snap Navigation sets `allowedBlocks`.** Both accept any block.

Rationale:
- Users need third-party blocks (WooCommerce minicart, login forms, language switchers) that cannot be predicted.
- Mirrors core container blocks (`core/group`, `core/cover`).
- Layout freedom is the product philosophy.

Provide a sensible default template via the `template` prop on `InnerBlocks`, with `templateLock: false`:

- Snap Header default template: `[ site-logo, snap-navigation ]`
- Snap Navigation default template: `[ nav-menu-area, search-placeholder, nav-toggle ]`

### 3.4 Container layout support

Expose core layout controls via `block.json`. Do not build custom layout UI.

```json
{
  "supports": {
    "layout": {
      "type": "flex",
      "allowJustification": true,
      "allowOrientation": false,
      "allowVerticalAlignment": true
    },
    "spacing": { "blockGap": true, "padding": true, "margin": false },
    "color": { "background": true, "text": true },
    "align": ["wide", "full"]
  }
}
```

`margin: false` for Snap Header — the wrapper sits against the viewport edge; margin causes hard-to-debug offsets when fixed positioning is active.

In the Inspector for both Snap Header and Snap Navigation, label the blockGap control unambiguously ("Header gap" vs "Navigation gap") to avoid user confusion since two nested flex containers each have their own gap.

## 4. Context Wiring

The two-tier design only works because descendants can read state defined at the Header level. Use the block context API.

### 4.1 What Snap Header provides

```json
"providesContext": {
  "your-plugin/instanceId":       "instanceId",
  "your-plugin/mobileBreakpoint": "mobileBreakpoint",
  "your-plugin/sticky":           "sticky"
}
```

### 4.2 What Snap Navigation consumes and re-provides

```json
"usesContext": [
  "your-plugin/instanceId",
  "your-plugin/mobileBreakpoint"
],
"providesContext": {
  "your-plugin/overlayId": "overlayId"
}
```

`overlayId` is derived as `overlay-{instanceId}` so it is stable and unique per Header instance.

### 4.3 What Nav Toggle consumes

```json
"usesContext": [
  "your-plugin/overlayId",
  "your-plugin/instanceId",
  "your-plugin/mobileBreakpoint"
]
```

This solves the cross-tier `aria-controls` problem: the toggle, no matter how deeply nested, can reference the overlay element by its stable ID.

### 4.4 Generating `instanceId`

In Snap Header's `edit.js`, generate `instanceId` once on first mount when the attribute is empty, then persist it:

```js
import { useEffect } from '@wordpress/element';

export default function Edit({ attributes, setAttributes, clientId }) {
  useEffect(() => {
    if (!attributes.instanceId) {
      setAttributes({ instanceId: clientId.slice(0, 8) });
    }
  }, []);
  // ...
}
```

Snap Navigation does the same for `overlayId` (default to `overlay-{instanceId}` when both are available).

On the server, render callbacks must NOT trust the persisted value blindly — fall back to `wp_unique_id('hdr-')` if empty, and always cast through `sanitize_html_class()` before output.

## 5. Wrapper Element — IMPORTANT

**Snap Header renders a `<div>`, NOT a `<header>` tag.**

Reason: In Block Themes, the `header` template part is already wrapped by WordPress in a `<header class="wp-block-template-part">` element with implicit `role="banner"`. Rendering another `<header>` (or adding `role="banner"`) inside it produces nested/duplicate landmarks that confuse screen readers.

**Do NOT add `role="banner"` to the Snap Header `<div>`.** The outer template part already supplies the banner landmark.

If a user places Snap Header outside a `header` template part (rare but possible), the lack of banner is acceptable — adding it conditionally would be unreliable across themes.

## 6. Sticky and Scroll Effects

### 6.1 Why CSS `position: sticky` does not work here

`position: sticky` requires that no ancestor have `overflow: hidden / clip / auto` that would clip the sticky element. In Block Themes, the `header` template part frequently has constraints that break sticky. Worse, applying sticky to the template part itself would force every other block inside it (top bars, announcement bars) to stick along with the navigation — which users do not want.

We therefore use `position: fixed` with a JS-generated spacer, scoped to the Snap Header `<div>` only. This isolates the sticky behaviour to the navigation region without touching the template part.

### 6.2 No-FOUC requirement

The fixed positioning must NOT be applied by CSS alone. If the stylesheet sets `position: fixed` before JS creates the spacer, content reflows under the header for one frame, causing a visible jump.

**Required sequence on page load:**

1. Snap Header renders in-flow (static, no spacer). CSS does NOT apply `position: fixed` yet.
2. JS runs, creates spacer immediately before the header in DOM, measures the header's natural height, sets the spacer to that height.
3. JS adds a class (e.g. `is-fixed-active`) to the header. The stylesheet only applies `position: fixed` when this class is present.

If JS fails to run, the header degrades to in-flow — content is still readable, nothing is hidden under a fixed bar.

```css
.wp-block-your-plugin-snap-header.is-sticky.is-fixed-active {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
```

### 6.3 Spacer rules

The spacer is a `<div>` inserted **before** the header in DOM, with `aria-hidden="true"`.

**Spacer height must match the header's RESTING height, not its current height.**

If the header has a `shrink` scroll effect, `offsetHeight` decreases when stuck. If the spacer syncs realtime, the page jumps as the spacer shrinks with the header.

```js
function initFixedHeader(header) {
  const spacer = document.createElement('div');
  spacer.className = 'snap-hdr-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  header.parentNode.insertBefore(spacer, header);

  const measure = () => {
    // Only re-measure when NOT stuck. The stuck state may include shrink,
    // and we don't want the spacer to shrink with the header.
    if (!header.classList.contains('is-stuck')) {
      spacer.style.height = header.offsetHeight + 'px';
    }
  };

  const ro = new ResizeObserver(measure);
  ro.observe(header);
  measure();

  // After spacer is correctly sized, enable fixed positioning.
  header.classList.add('is-fixed-active');

  return () => { ro.disconnect(); spacer.remove(); };
}
```

### 6.4 Detecting "stuck" state

Use `IntersectionObserver` on a sentinel `<div>` of height `1px` placed before the header. When the sentinel leaves the viewport, the header is stuck. This is significantly cheaper than a `scroll` listener and does not jank.

```js
function initStuckObserver(header) {
  const sentinel = document.createElement('div');
  sentinel.className = 'snap-hdr-sentinel';
  sentinel.style.cssText = 'height:1px;width:1px;';
  header.parentNode.insertBefore(sentinel, header);

  const io = new IntersectionObserver(([entry]) => {
    header.classList.toggle('is-stuck', !entry.isIntersecting);
  }, { threshold: 0 });

  io.observe(sentinel);
  return () => { io.disconnect(); sentinel.remove(); };
}
```

### 6.5 Scroll effects

`scrollEffect` attribute on Snap Header — enum: `none | shrink | hide-on-scroll | bg-on-scroll`.

Implementation outline:

- **shrink**: when `is-stuck`, reduce padding via CSS class. Wrap the transition in `@media (prefers-reduced-motion: no-preference)`.
- **hide-on-scroll**: track scroll direction. Add `is-hidden` class when scrolling down past a threshold, remove when scrolling up. Use `transform: translateY(-100%)` to slide out — never `display: none` (animates poorly and breaks focus).
- **bg-on-scroll**: when `is-stuck`, add `has-bg` class which applies the background color. Useful with `transparentTop`.
- **transparentTop**: when at the top of the page AND not stuck, the header has no background. This is a separate boolean attribute that may combine with any scroll effect.

### 6.6 WordPress admin bar offset

When the user is logged in and the admin bar is visible (`body.admin-bar`), `top: 0` puts the fixed header under the admin bar.

```css
body.admin-bar .wp-block-your-plugin-snap-header.is-fixed-active {
  top: 32px;
}
@media (max-width: 782px) {
  body.admin-bar .wp-block-your-plugin-snap-header.is-fixed-active {
    top: 46px;
  }
}
```

### 6.7 z-index

Default `z-index: 100`. The plugin must not exceed `99999` (admin bar). Document this so themes can override safely.

## 7. Per-Instance Breakpoint

### 7.1 Attribute

```json
"mobileBreakpoint": { "type": "number", "default": 782 }
```

Inspector presets: Mobile (600), Tablet (782), Desktop (1024), Custom (number input). On the server, clamp to a sensible range (e.g. 320–1200) via `absint()` + `max/min`.

### 7.2 Per-instance CSS

Emit a `<style>` block in the render callback, scoped to a unique class on the wrapper:

```php
$classes[] = 'snap-hdr-' . esc_attr( $instance_id );

$style = sprintf(
    '<style>'
  . '@media (max-width:%1$dpx){.snap-hdr-%2$s .is-desktop-only{display:none}}'
  . '@media (min-width:%3$dpx){.snap-hdr-%2$s .is-mobile-only{display:none}}'
  . '</style>',
    $breakpoint,
    esc_attr( $instance_id ),
    $breakpoint + 1
);
```

The toggle button uses `.is-mobile-only` so it is hidden on desktop purely via CSS — no FOUC, no JS dependency for visibility.

## 8. Snap Header — `block.json` and `render.php`

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "your-plugin/snap-header",
  "title": "Snap Header",
  "category": "header",
  "icon": "table-row-before",
  "textdomain": "your-plugin",
  "attributes": {
    "instanceId":       { "type": "string", "default": "" },
    "mobileBreakpoint": { "type": "number", "default": 782 },
    "sticky":           { "type": "boolean", "default": false },
    "scrollEffect":     { "type": "string", "default": "none" },
    "transparentTop":   { "type": "boolean", "default": false }
  },
  "providesContext": {
    "your-plugin/instanceId":       "instanceId",
    "your-plugin/mobileBreakpoint": "mobileBreakpoint",
    "your-plugin/sticky":           "sticky"
  },
  "supports": {
    "layout": {
      "type": "flex",
      "allowJustification": true,
      "allowOrientation": false,
      "allowVerticalAlignment": true
    },
    "spacing": { "blockGap": true, "padding": true, "margin": false },
    "color": { "background": true, "text": true },
    "align": ["wide", "full"]
  },
  "render":           "file:./render.php",
  "viewScriptModule": "file:./view.js",
  "style":            "file:./style.css",
  "editorStyle":      "file:./editor.css"
}
```

```php
<?php
function your_plugin_render_snap_header( $attributes, $content ) {
    $instance_id = ! empty( $attributes['instanceId'] )
        ? sanitize_html_class( $attributes['instanceId'] )
        : wp_unique_id( 'hdr-' );

    $breakpoint = isset( $attributes['mobileBreakpoint'] )
        ? absint( $attributes['mobileBreakpoint'] )
        : 782;
    $breakpoint = max( 320, min( 1200, $breakpoint ) );

    $effect = isset( $attributes['scrollEffect'] ) ? (string) $attributes['scrollEffect'] : 'none';
    $allowed_effects = [ 'none', 'shrink', 'hide-on-scroll', 'bg-on-scroll' ];
    if ( ! in_array( $effect, $allowed_effects, true ) ) {
        $effect = 'none';
    }

    $classes = [
        'wp-block-your-plugin-snap-header',
        'snap-hdr-' . $instance_id,
    ];
    if ( ! empty( $attributes['sticky'] ) )         { $classes[] = 'is-sticky'; }
    if ( ! empty( $attributes['transparentTop'] ) ) { $classes[] = 'is-transparent-top'; }
    if ( 'none' !== $effect ) {
        $classes[] = 'has-scroll-effect';
        $classes[] = 'scroll-' . $effect;
    }

    $wrapper = get_block_wrapper_attributes( [
        'class'           => implode( ' ', $classes ),
        'data-breakpoint' => $breakpoint,
        'data-instance'   => $instance_id,
    ] );

    $style = sprintf(
        '<style>'
      . '@media (max-width:%1$dpx){.snap-hdr-%2$s .is-desktop-only{display:none}}'
      . '@media (min-width:%3$dpx){.snap-hdr-%2$s .is-mobile-only{display:none}}'
      . '</style>',
        $breakpoint,
        $instance_id,
        $breakpoint + 1
    );

    return $style . sprintf( '<div %1$s>%2$s</div>', $wrapper, $content );
}
```

Note: NO `role="banner"`. NO `<header>` tag. The wrapping `<header>` from the template part already supplies the landmark.

## 9. Snap Navigation — `block.json` and `render.php`

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "your-plugin/snap-navigation",
  "title": "Snap Navigation",
  "category": "header",
  "parent": ["your-plugin/snap-header"],
  "textdomain": "your-plugin",
  "attributes": {
    "overlayId": { "type": "string", "default": "" }
  },
  "usesContext": [
    "your-plugin/instanceId",
    "your-plugin/mobileBreakpoint"
  ],
  "providesContext": {
    "your-plugin/overlayId": "overlayId"
  },
  "supports": {
    "layout": {
      "type": "flex",
      "allowJustification": true,
      "allowVerticalAlignment": true
    },
    "spacing": { "blockGap": true, "padding": true }
  },
  "render": "file:./render.php"
}
```

The render callback wraps inner blocks in a `<div>` and emits the overlay container (initially hidden via CSS) with the ID consumed by the toggle. The overlay's open/closed state is controlled by a `data-state` attribute that the view script toggles.

## 10. Nav Toggle — `block.json` and behaviour

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "your-plugin/nav-toggle",
  "title": "Nav Toggle",
  "category": "header",
  "ancestor": ["your-plugin/snap-header"],
  "textdomain": "your-plugin",
  "attributes": {
    "iconStyle":      { "type": "string",  "default": "lines-3" },
    "label":          { "type": "string",  "default": "" },
    "labelVisible":   { "type": "boolean", "default": false }
  },
  "usesContext": [
    "your-plugin/overlayId",
    "your-plugin/instanceId",
    "your-plugin/mobileBreakpoint"
  ],
  "render": "file:./render.php"
}
```

Required output:

- A native `<button type="button">` — never `<a>` or `<div>`.
- `aria-expanded="false"` initial, toggled by JS.
- `aria-controls="{overlayId}"` — read from context.
- Accessible name: visible label if `labelVisible`, otherwise `aria-label="{label || 'Open menu'}"`. Localize the default with `__()`.
- A class `is-mobile-only` — visibility is purely CSS-driven by the breakpoint media query emitted by Snap Header. No JS controls show/hide.

## 11. Menu Area

Selection UX (editor): `ComboboxControl` listing all classic menus, fetched via `core-data` (`getEntityRecords('root', 'menu')`) — prefer this over manual REST fetch to inherit cache/invalidation. Store the term ID as `menuId: number`.

If no classic menus exist, render a `Notice` with a direct link to `admin_url('nav-menus.php')` and copy: "No menus found. Create one in Appearance → Menus."

Ensure `Appearance → Menus` is available in Block Themes:

```php
add_action( 'after_setup_theme', function () {
    if ( ! current_theme_supports( 'menus' ) ) {
        add_theme_support( 'menus' );
    }
}, 11 );
```

Frontend: `render_callback` resolves the menu by `menuId` (cast via `absint()`) and delegates to the existing menu rendering engine. If the menu is missing or empty, render nothing on the frontend (silent), and a Notice in the editor preview.

Editor preview: prefer `<ServerSideRender />` for fidelity with the existing engine. A lightweight React preview is acceptable if the engine's markup can be mirrored faithfully.

## 12. Mobile Activation Overview

When the user activates the toggle below the breakpoint, a mobile menu surface opens. **Implementation: portal-to-body via clone** — see §12.1 for the full lifecycle. This section lists the user-facing requirements regardless of implementation.

**Required behaviour:**

- Initial state: closed. Closed state must be pure CSS (`display: none` or off-screen transform) — no FOUC.
- On open: focus moves into the surface; focus is trapped while open.
- `Esc` closes; backdrop click closes.
- Body scroll lock while open.
- On close: focus returns to the toggle button that opened it.
- Resize across the breakpoint while open: the surface closes and resets state.

The toggle's `aria-expanded` mirrors the open state. The mobile surface carries `id="{overlayId}"` (from context) so the toggle's `aria-controls` matches.

Multiple Snap Header instances on a page each maintain independent state — see §12.1.8.

## 12.1 Mobile Portal — Clone-to-Body

When the viewport drops below the breakpoint, the Snap Navigation's content is presented in a cloned subtree appended to `document.body` (a "portal"), rather than displayed in place. This isolates mobile styling from any cascade or stacking-context issue inherited from the header region.

### 12.1.1 Why portal and why clone (not move)

- **Why portal:** moving the menu out of the header subtree escapes `overflow`, `transform`, `filter`, and stacking-context constraints that commonly affect a fixed/sticky header. A full-screen overlay rendered inside the header div can be clipped or rendered behind sibling content; a portal under `<body>` cannot.
- **Why clone, not move:** child blocks (search inputs, minicart, login widgets, third-party blocks) may carry their own state — input values, open dropdowns, live counts. Moving the live node breaks editor preview, SSR semantic position, and any state two-way sync between desktop/mobile views. Clone keeps the desktop subtree authoritative; the portal is a render-only mirror for mobile UX.

### 12.1.2 Lifecycle

**Lazy creation.** Do NOT clone on page load. Clone the first time the toggle is activated below the breakpoint. The cloned subtree persists in the body for the rest of the session (subsequent opens reuse it).

```
First tap on toggle (below breakpoint):
  1. Locate the Snap Navigation source subtree.
  2. Deep-clone the subtree (`cloneNode(true)`).
  3. Sanitize the clone (see 12.1.3).
  4. Wrap in a portal root: <div class="snap-nav-portal" id="{overlayId}">
  5. Append portal root to document.body.
  6. Re-bind interactive behaviour (see 12.1.4).
  7. Open the portal (set data-state="open"), focus first focusable element.

Subsequent taps:
  - Just toggle data-state on the existing portal root.

On resize above breakpoint:
  - Close portal (data-state="closed"). Do NOT destroy.
  - The original in-header subtree is the one shown on desktop (via CSS).

On Snap Header teardown (rare — SPA navigation):
  - Remove portal root from body.
```

### 12.1.3 Sanitizing the clone

After `cloneNode(true)`, walk the cloned subtree and:

- **Strip or rewrite all `id` attributes** to avoid duplicates with the original subtree. Recommended: replace `id="foo"` with `id="foo--portal-{instanceId}"` and rewrite all `for="foo"` and `aria-labelledby="foo"` references in the same subtree to match. If a referenced ID is not present in the clone (e.g. label points to something outside the menu), strip the attribute.
- **Strip `name` attributes on form inputs** only if they would clash with a form outside the menu. If the navigation contains a standalone search form with its own `<form>` element, names are safe (forms scope by element). Default to keeping names; rewrite only on confirmed conflict.
- **Remove `data-block-id`, `data-clientid`** and any editor-only attributes the renderer leaked. These are harmless on the frontend but confuse devtools.
- **Preserve `data-` attributes used by the menu engine** (submenu state, mega-menu config). The existing engine's behaviour depends on them.

### 12.1.4 Re-binding interactive behaviour

`cloneNode` does NOT copy listeners attached via `addEventListener`. Three options for the cloned subtree, in order of preference:

1. **Re-initialize the existing menu engine on the portal root.** If the engine exposes a public `init(rootElement)`, call it on the portal root after append. This is the cleanest path and the agent SHOULD use this if available. Coordinate with the engine's maintainer if the API is unclear (see §18).
2. **Event delegation from the portal root.** If the engine uses delegated listeners on a single root, the clone inherits nothing — re-attach the same delegated listeners on the portal root.
3. **Manual re-wiring** for third-party blocks the engine does not own (e.g. WooCommerce minicart). For these, we cannot guarantee functionality after clone. Document this limitation: third-party interactive blocks may render in the portal but their interactions may not work. Users wanting full interactivity should keep those blocks outside the navigation (e.g. as siblings in Snap Header).

### 12.1.5 Style scoping

The portal root sits under `<body>` and does NOT inherit CSS custom properties, color, or font from Snap Header. To keep mobile styling consistent and isolated:

- Apply a dedicated class `snap-nav-portal` to the portal root. All mobile-specific CSS targets this class.
- Mirror critical CSS variables from Snap Header onto the portal root at clone time (read computed values from the source and set them as inline `--vars` on the portal). This preserves theme.json-driven colors.
- Tag the portal with `data-instance="{instanceId}"` so multiple Snap Headers' portals do not cross-style.
- The portal's stacking context is independent of the header. Use a defined `z-index` (e.g. 9998 — below admin bar's 99999, above typical content). Document this.

### 12.1.6 Hiding the in-header copy on mobile

The original Snap Navigation subtree must be hidden below the breakpoint so it does not double-render. Use the per-instance breakpoint CSS already emitted by Snap Header:

```css
/* Already scoped by .snap-hdr-{instanceId} via per-instance <style> */
@media (max-width: {breakpoint}px) {
  .snap-hdr-{instanceId} .wp-block-your-plugin-snap-navigation {
    display: none;
  }
}
```

Above the breakpoint, the portal root is hidden:

```css
@media (min-width: {breakpoint + 1}px) {
  .snap-nav-portal[data-instance="{instanceId}"] {
    display: none;
  }
}
```

Both rules must be in the per-instance `<style>` block so they key off the same breakpoint as everything else.

### 12.1.7 Accessibility for the portal

- Portal root: `role="dialog"`, `aria-modal="true"`, `aria-label` (localized, e.g. "Site navigation").
- Toggle's `aria-controls` already references the portal's ID (set to `overlayId` — same value used everywhere via context).
- Focus trap is on the portal root, not the in-header copy.
- Body scroll lock applied to `<html>` or `<body>` while portal is open. Restore on close.
- On close, focus returns to the toggle that opened it. Track this — multiple toggles may exist (rare but possible).

### 12.1.8 Multi-instance

Each Snap Header instance has its own portal root, distinguished by `data-instance="{instanceId}"` and unique `id="{overlayId}"`. They are completely independent — opening one does not affect another. If two Snap Headers share the same breakpoint and the user opens both portals (would require two toggles), document the visual result as undefined but ensure no JS errors.

### 12.1.9 Teardown rules

The portal is cheap to keep around — do NOT destroy on close, only on full page teardown (SPA navigation, block re-render in the editor). Re-cloning on every open wastes work and re-runs engine init unnecessarily.

If the source navigation subtree changes (rare — only in the editor when the user edits live), the portal must be rebuilt. In the editor, detect via a `MutationObserver` on the source subtree. On the frontend, the source is static — no observer needed.

### 12.1.10 Editor preview behaviour

In the Site Editor, the portal pattern is frontend-only. The editor preview should NOT clone to `document.body` (the editor iframe has its own body, and cluttering it confuses the canvas). In the editor:

- Show the Snap Navigation in place at all viewport sizes.
- The toggle button is visible/clickable but does NOT open a portal. Optionally show a Notice in the toggle's Inspector explaining that portal behaviour activates only on the frontend below the breakpoint.

This keeps WYSIWYG roughly true at desktop sizes and avoids editor-canvas corruption.

---

## 13. Responsive Ordering (optional, per-child)

Direct children of Snap Navigation may declare an "Order on mobile" integer via a block filter (`blocks.registerBlockType` + `editor.BlockEdit` + `blocks.getSaveContent.extraProps`). Below the breakpoint, apply `order: <value>` to that child.

This lets one DOM structure serve both desktop and mobile orderings without duplication. Document the a11y caveat: visual order vs tab order may diverge — keep DOM order logical.

## 14. Patterns

Ship at least one Block Pattern under the `header` category:

- "Snap Header — Logo / Menu / Icons / Hamburger (mobile-ready)"
- Pre-arranged in the correct order with the toggle at the end; `templateLock: false` so users can rearrange.
- Pattern content must not depend on any specific theme.

## 15. Frontend JS — `view.js` outline

Use the Interactivity API (`@wordpress/interactivity`) if the plugin's minimum WP version is ≥ 6.5 (declare via `viewScriptModule`). Otherwise use dependency-free vanilla JS via `viewScript`.

The view script must:

1. Find every `.wp-block-your-plugin-snap-header.is-sticky` on the page.
2. For each: create sentinel + spacer, attach `IntersectionObserver` for `is-stuck`, attach `ResizeObserver` for spacer sizing, add `is-fixed-active` AFTER spacer is sized.
3. For each Nav Toggle: attach click handler.
   - On first activation below breakpoint: clone Snap Navigation subtree, sanitize (rewrite `id`s, strip editor-only attrs), wrap in portal root with `role="dialog"` + `aria-modal="true"` + `id={overlayId}` + `data-instance={instanceId}`, mirror CSS variables from source Snap Header, append to `document.body`, re-init menu engine on the portal root.
   - On subsequent activations: just flip `data-state` on the existing portal root.
   - Manage `aria-expanded` on toggle, focus trap inside portal, body scroll lock, Esc handler, focus restore on close.
4. On `resize`: if viewport crosses the breakpoint while portal is open, close it (do NOT destroy portal).
5. On page unload / SPA navigation: remove portal root from body.

Each instance must be independent — never use global state. Use `WeakMap` keyed by Snap Header element if per-instance state must be tracked.

## 16. WordPress.org Compliance

- [ ] All assets conditionally loaded via `block.json` (`style`, `editorStyle`, `viewScript`/`viewScriptModule`). No global enqueue on every page.
- [ ] Do not modify, filter, or deregister `core/navigation` or any core block.
- [ ] Escape all dynamic output in render callbacks (`esc_url`, `esc_attr`, `esc_html`, `wp_kses_post` where rich content is intended).
- [ ] Single text domain matching the plugin slug. All user-facing strings translatable.
- [ ] No external HTTP requests on the frontend.
- [ ] Sanitize all attributes server-side: `absint()` for numerics, `sanitize_html_class()` for `instanceId`/`overlayId`, enum whitelist for `scrollEffect`.
- [ ] Prefix all functions, classes, handles, and the block namespace.
- [ ] Use `apiVersion: 3` on all blocks (iframed editor compatibility).

## 17. Testing Matrix

| Area | Cases |
|---|---|
| Themes | Twenty Twenty-Four, Twenty Twenty-Five, Astra, Kadence — verify the wrapping template part `<header>` does not cause sticky/fixed conflicts |
| Menus | No menus exist; menu deleted after selection; deep nesting (3+ levels); mega menu items; empty menu; menu items pointing to trashed posts; very long labels |
| Container | Empty Snap Header; only logo; only Snap Navigation; 10+ children; third-party blocks (WooCommerce); nested groups |
| Sticky | Sticky with shrink, hide-on-scroll, bg-on-scroll, transparentTop; resize while stuck; admin bar visible (logged-in user, desktop AND mobile breakpoint of admin bar at 783px) |
| Responsive | Breakpoint presets and custom values; resize across breakpoint with overlay open; toggle position at start/middle/end |
| Multi-instance | Two Snap Headers on one page — each with independent state, breakpoint, overlay ID, and independent portal under body |
| Portal | First-tap creates portal; subsequent taps reuse it; resize above breakpoint closes but does not destroy; menu engine behaviour works in portal (submenus, mega menu, keyboard); third-party block degradation is graceful (no JS errors); no duplicate `id` in DOM after clone; CSS variables from Snap Header carry over visibly |
| A11y | Keyboard-only traversal; screen reader announces expanded state; Esc and backdrop close; focus return to toggle; verify NO duplicate `banner` landmark (template part `<header>` + Snap Header `<div>` should yield exactly one banner) |
| Editor | Preview matches frontend; pattern insertion; undo/redo of menu selection; instanceId persists across save/reload |
| Degradation | JS disabled — header falls back to in-flow, no content hidden; no console errors |
| Reduced motion | `prefers-reduced-motion: reduce` disables shrink/slide transitions |

## 18. Out of Scope (do not rebuild)

- Classic menu item traversal and markup generation
- Multi-level submenu/dropdown behaviour (desktop hover + mobile tap-to-expand)
- Mega menu rendering

Integrate with these via the existing engine's public API. If the API shape is unclear, ASK before refactoring.

## 19. Decision Log (do not relitigate)

These were resolved during spec design. Do not change without consultation:

1. **Two-tier container** (Snap Header + Snap Navigation), not one block. Sticky/scroll belong at the Header tier; layout/overlay at the Navigation tier.
2. **Logo and Snap Navigation are siblings** inside Snap Header, both as free InnerBlocks — to allow any header template (logo left, centered, right, multiple navs).
3. **Snap Header wraps with `<div>`**, not `<header>`. The template part already supplies `<header>` + `role="banner"`.
4. **No CSS-only sticky.** Block themes' template part wrappers break `position: sticky`, and applying sticky to the template part would drag along unrelated blocks (top bars). We use `position: fixed` + JS spacer, scoped to the Snap Header div.
5. **`is-fixed-active` is added by JS after the spacer is sized**, never by CSS alone. This prevents FOUC and ensures no-JS degradation is safe.
6. **Spacer height = header's resting height, not realtime height**, so `shrink` scroll effect does not cause the page to jump.
7. **Context API for cross-tier wiring** (`instanceId`, `mobileBreakpoint`, `overlayId`). Solves the `aria-controls` problem for a freely-placed hamburger toggle.
8. **InnerBlocks unrestricted.** No `allowedBlocks` on either container. Third-party blocks are allowed by design.
9. **Mobile uses portal-to-body via clone, not move.** Below the breakpoint, the Snap Navigation subtree is deep-cloned and the clone is appended to `document.body` as a `dialog` portal. The source subtree is hidden via the per-instance media query. Rationale: escapes header `overflow`/`transform`/stacking-context issues; cloning (vs moving) keeps child block state in the desktop view authoritative and avoids two-way sync.
10. **Clone is lazy** — created on first toggle activation below the breakpoint, persists for the session, hidden via CSS thereafter. Not re-cloned on every open.
11. **Cloned subtree requires re-init.** `cloneNode(true)` does not copy event listeners. The existing menu engine must be re-initialized on the portal root. Third-party interactive blocks may not function after clone — this is a documented limitation.