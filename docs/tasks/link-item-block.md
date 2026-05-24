# Task: Link Item block

**Status:** Implemented  
**Plugin:** Snap Mega Menu Builder (`snap-megamenu-builder`)  
**Related:** [`../AGENT.md`](../AGENT.md), [`../../AGENTS.md`](../../AGENTS.md)

---

## Summary

Add a first-party dynamic block **`snap-megamenu/link-item`** for the Content Builder (isolated editor on **Appearance → Menus**). Editors use it to place navigation-style links inside mega menu panels with:

- Internal link picker (page, post, or other public post types exposed by core link UI)
- Custom URL entry
- Optional **badge** (e.g. “New”, “Sale”)
- Standard link options (label, open in new tab, `rel`, optional description)

The block replaces ad-hoc combinations of `core/button`, `core/paragraph`, and `core/navigation-link` for mega-menu link lists and matches how commercial mega menus present labeled links with badges.

---

## Goals

| Goal | Notes |
|------|--------|
| Purpose-built mega menu link | Single block for “label + URL + badge” rows |
| WordPress-native link picking | Reuse `@wordpress/block-editor` **LinkControl** (same UX as core blocks) |
| Stable internal URLs | Dynamic `render.php` resolves permalinks from post ID when slug/path changes |
| Project conventions | Namespace `Snap\MegaMenuBuilder\`, text domain `snap-megamenu-builder`, prefix `snap-megamenu-*` |
| Allowlist integration | Register in `AllowedBlocks` under Navigation |
| No front-end JS required | Static markup from PHP; style via block + theme CSS |

---

## Non-goals (this task)

- Nested sub-menus or accordion behavior inside the block
- Icon picker / image thumbnails (future task)
- WooCommerce product search in link picker (unless core LinkControl already exposes products)
- Block patterns or template library updates (optional follow-up)
- Changes to mega menu panel settings or REST API shape

---

## Block identity

| Property | Value |
|----------|--------|
| Name | `snap-megamenu/link-item` |
| Title | Link Item |
| Category | `widgets` or custom `snap-megamenu` category |
| Icon | `admin-links` (or `link` from `@wordpress/icons` in editor) |
| API version | `3` (`block.json`) |
| Text domain | `snap-megamenu-builder` |
| Render | Dynamic — `render.php` |
| Supports | `html: false`, `anchor: false`, `reusable: false`, `multiple: true` |

Parent blocks: none required initially; typical usage inside `core/column`, `core/group`, or `core/stack`.

Allowed child blocks: none (`allowedBlocks: []` if using InnerBlocks — prefer **no** InnerBlocks for v1).

---

## Attributes

Store everything needed to re-render after permalink changes. Align with core link attribute patterns where possible.

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | `string` | `""` | Visible link text |
| `url` | `string` | `""` | Resolved href (custom URL or cached permalink) |
| `id` | `number` | `0` | Post/term ID when link target is internal (`0` = custom only) |
| `kind` | `string` | `""` | Link kind from LinkControl (e.g. `post-type`, `taxonomy`) |
| `type` | `string` | `""` | Post type or taxonomy slug (e.g. `page`, `post`, `category`) |
| `opensInNewTab` | `boolean` | `false` | `target="_blank"` |
| `rel` | `string` | `""` | Extra `rel` tokens; merge with `noopener noreferrer` when new tab |
| `description` | `string` | `""` | Optional secondary line under label (plain text) |
| `badge` | `string` | `""` | Badge label; empty hides badge |
| `badgeVariant` | `string` | `"default"` | Style token: `default`, `accent`, `muted`, `outline` (filterable) |

**Serialization note:** Do not store HTML in attributes. Label, description, and badge are plain text; output is escaped in PHP.

**Link resolution (render time):**

```php
// Pseudocode — implement in render.php
if ( $id > 0 && 'custom' !== $type ) {
    $permalink = get_permalink( $id );
    if ( $permalink ) {
        $url = $permalink;
    }
}
```

If internal post is trashed/missing, render a non-link span or `#` with `aria-disabled` and optional editor notice pattern on next edit.

---

## Editor UX

### Inspector (sidebar)

| Control | Component | Behavior |
|---------|-----------|----------|
| Link | `LinkControl` | Page/post/custom URL; sets `url`, `id`, `kind`, `type`, `opensInNewTab` |
| Label | `TextControl` | Required for accessible name; default from link title when picker selects internal link |
| Description | `TextControl` | Optional; multiline optional in v2 |
| Badge text | `TextControl` | Optional |
| Badge style | `SelectControl` | Maps to `badgeVariant` |
| Open in new tab | Via LinkControl | Synced to `opensInNewTab` |

### Canvas (edit)

- Preview resembles frontend: `<a>` or placeholder when URL empty
- Badge visible next to label when `badge` is set
- Use `useBlockProps()` on wrapper `div.snap-megamenu-link-item`
- Block appender: not applicable (leaf block)

### LinkControl settings

Restrict to public post types suitable for mega menus:

```js
// Pseudocode — settings passed to LinkControl
settings={ [
    {
        title: __( 'Content', 'snap-megamenu-builder' ),
        icon: page,
        id: 'post-type-page',
    },
    {
        title: __( 'Posts', 'snap-megamenu-builder' ),
        icon: post,
        id: 'post-type-post',
    },
] }
```

Expose post types via filter `snap_megamenu_link_item_link_settings` so themes can add CPTs.

---

## Frontend markup

Semantic, theme-overridable structure:

```html
<div class="snap-megamenu-link-item snap-megamenu-link-item--badge-accent">
  <a class="snap-megamenu-link-item__link" href="…" rel="…" target="…">
    <span class="snap-megamenu-link-item__label">Shop all</span>
    <span class="snap-megamenu-link-item__badge">New</span>
  </a>
  <p class="snap-megamenu-link-item__description">Optional subtitle</p>
</div>
```

If `url` is empty in the editor preview only; on frontend omit `<a>` or render `<span class="…__label">` with no href.

**CSS**

- Base styles in `blocks/link-item/style.css` (loaded via `block.json`)
- Minimal layout: flex row for label + badge; badge as pill
- CSS custom properties for theme overrides, e.g. `--snap-megamenu-link-item-badge-bg`
- Mobile accordion panel: no extra JS; inherit width from `.snap-megamenu-mega-panel__inner`

**Accessibility**

- Link text must not rely on badge alone; `label` is the accessible name
- `opensInNewTab`: append visually hidden “(opens in a new tab)” or use `aria-label` if label is truncated
- Badge: `span` with `aria-hidden="true"` when decorative, or include in accessible name if it conveys meaning (document in implementation)

---

## Proposed file layout

```
blocks/link-item/
├── block.json          # metadata, attributes, asset handles
├── index.js            # registerBlockType( metadata, { edit } )
├── edit.js             # Inspector + canvas
├── render.php          # dynamic frontend output
├── style.css           # frontend
└── editor.css          # editor-only tweaks (optional)

includes/Blocks/
├── BlockRegistry.php   # registers all plugin blocks on init (new)
└── LinkItemBlock.php   # optional thin wrapper / render callback helpers

src/blocks/link-item/   # alternative: keep JS next to src/ and point block.json editorScript to build
```

**Recommended approach for this repo:** colocate under `blocks/link-item/` at plugin root (matches Nextora theme pattern), register PHP from `includes/Blocks/BlockRegistry.php`, import and register JS from `src/index.js` **or** add a webpack entry `link-item` enqueued by `block.json`.

### Build pipeline changes (implementation phase)

| Step | Action |
|------|--------|
| 1 | Add webpack entry `link-item: './blocks/link-item/index.js'` **or** `import './blocks/link-item'` from `src/index.js` |
| 2 | Register block server-side: `register_block_type( SNAP_MEGAMENU_DIR . 'blocks/link-item' )` on `init` |
| 3 | Add `snap-megamenu/link-item` to `AllowedBlocks::defaults()` and `DEFAULT_ALLOWED_BLOCKS` in JS |
| 4 | Call custom block register in admin after `registerCoreBlocks()` in `src/index.js` |
| 5 | Run `npm run build`; verify block appears in **Add block** inserter |

### Bootstrap wiring

In `includes/Core/Bootstrap.php`:

```php
// Pseudocode
( new BlockRegistry() )->register();
```

`BlockRegistry::register()` hooks `init` → `register_block_type()` for each block folder.

---

## PHP standards

Follow existing plugin rules (`phpcs.xml.dist`, WPCS, `declare(strict_types=1);`):

- Namespace: `Snap\MegaMenuBuilder\Blocks`
- Escape output: `esc_url()`, `esc_html()`, `esc_attr()`
- Build `rel` with `wp_rel_uristring()` when opening in new tab
- No direct `$_POST` in render; attributes only from block parser
- Docblocks on public methods; `@package Snap\MegaMenuBuilder\Blocks`

Example render callback signature:

```php
/**
 * Render the Link Item block.
 *
 * @param array<string, mixed> $attributes Block attributes.
 * @param string               $content    Inner blocks (unused).
 * @param WP_Block             $block      Block instance.
 * @return string
 */
function snap_megamenu_render_link_item( array $attributes, string $content, WP_Block $block ): string
```

Prefer `render.php` + `register_block_type` `render` key over inline closure for testability.

---

## JavaScript standards

- ESLint: `@wordpress/eslint-plugin` (existing `npm run lint:js`)
- `@wordpress/i18n` for all user-visible strings; text domain `snap-megamenu-builder`
- `useBlockProps`, `InspectorControls`, `LinkControl` from `@wordpress/block-editor`
- No jQuery; no global leaks except block registration

---

## Security & storage

Mega menu content is stored as serialized block HTML in `_snap_megamenu_content` and sanitized by `BlockContentSanitizer::sanitize()`:

- Custom block must be registered **before** content is parsed on frontend (`init` priority ≤ default)
- Attributes are JSON inside block comment; escaping happens at render
- Users without `unfiltered_html` rely on `filter_block_content()` — dynamic block with PHP render is supported

---

## Extensibility hooks (plan)

| Hook | Type | Purpose |
|------|------|---------|
| `snap_megamenu_allowed_blocks` | filter | Already exists; add `snap-megamenu/link-item` in core defaults |
| `snap_megamenu_link_item_attributes` | filter | Adjust attributes before render |
| `snap_megamenu_link_item_link_settings` | filter | LinkControl post-type settings in editor |
| `snap_megamenu_link_item_badge_variants` | filter | Badge style options |
| `snap_megamenu_link_item_render_markup` | filter | Optional HTML override |

Document hooks in `README.md` when implemented.

---

## Acceptance criteria

- [ ] Block `snap-megamenu/link-item` registers on `init` without PHP notices
- [ ] Block appears in Content Builder inserter and respect allowlist / filters
- [ ] Editor: pick page, post, and custom URL; label and badge editable
- [ ] Editor: open-in-new-tab and description persist after save/reload
- [ ] Frontend: correct permalink when internal post slug changes (dynamic render)
- [ ] Frontend: badge and description match editor; responsive inside mega panel
- [ ] PHPCS + ESLint pass; `composer check` and `npm run check:js` clean for touched files
- [ ] Keyboard accessible in editor and frontend link focus order
- [ ] Block survives export/import JSON templates (template `content` string includes block comment)

---

## Test plan (manual)

1. Enable mega menu on a depth-0 item → Content Builder → insert Link Item
2. Link to a **Page** → save → view frontend mega panel → click link
3. Change page slug → reload frontend → href updates (dynamic render)
4. Set **custom URL** + badge “Sale” + open in new tab → verify `target` and `rel`
5. Add description → verify typography in column layout
6. Import existing template JSON → editor parses block (after implementation added to samples)
7. Mobile drawer accordion → link row tappable, badge not clipped

---

## Implementation phases

| Phase | Scope |
|-------|--------|
| **1** | `block.json`, `render.php`, PHP registration, allowlist, minimal `edit.js` + LinkControl |
| **2** | Badge variants, description, editor preview polish, `style.css` |
| **3** | Filters, sample template entries, README / AGENT.md update |

---

## Reference: core alternatives

| Block | Why not sufficient alone |
|-------|---------------------------|
| `core/navigation-link` | Tied to Navigation block context; badge/description not first-class |
| `core/button` | CTA styling; no badge; awkward in link lists |
| `core/list` + `core/list-item` | No structured link picker per row |

Link Item is the dedicated primitive for mega menu navigation columns.

---

## Open questions (resolve before Phase 1)

1. **Badge variants** — fixed set (`default`, `accent`, …) or theme.json color slugs?
2. **Description** — single line only or `TextareaControl`?
3. **Webpack** — second entry vs import from main `index.js` (second entry keeps admin bundle smaller)
4. **Category** — register custom block category `snap-megamenu` in inserter for all future plugin blocks?

---

*Last updated: task spec created for implementation planning.*
