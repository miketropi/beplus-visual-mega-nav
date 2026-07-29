# How to Create a Block in Beplus Visual Mega Navigation

## Overview

This plugin is a **WordPress Gutenberg block plugin** with a dual-purpose architecture:

1. **Block editor** (`src/blocks.js` → `build/blocks.js`) — registers blocks for the post/page editor (via `editorScript` in `block.json`).
2. **Mega menu Content Builder** (`src/index.js` → `build/index.js`) — registers blocks for the isolated editor inside the mega menu modal on `nav-menus.php`.

Because the mega menu builder is a **separate React app** from the standard block editor, every new block must register in **both** entry points plus three PHP registries. Missing any one means the block silently doesn't appear.

---

## Step-by-step checklist

### 1. Create `blocks/{block-name}/block.json`

The block registration metadata. Use `apiVersion: 3`.

```json
{
    "$schema": "https://schemas.wp.org/trunk/block.json",
    "apiVersion": 3,
    "name": "beplus-visual-mega-nav/my-block",
    "title": "My Block",
    "category": "beplus-vmn",
    "icon": "block-default",
    "description": "Short description.",
    "keywords": ["keyword1", "mega menu"],
    "textdomain": "beplus-visual-mega-nav",
    "attributes": {
        "myAttr": { "type": "string", "default": "" }
    },
    "supports": {
        "html": false,
        "anchor": false,
        "reusable": false,
        "multiple": true,
        "className": false,
        "spacing": { "padding": true, "margin": true }
    },
    "style": "file:./style.css",
    "editorStyle": ["file:./editor.css", "file:./style.css"],
    "render": "file:./render.php",
    "editorScript": "file:../../build/blocks.js"
}
```

- `category` must be `"beplus-vmn"` for the mega menu inserter category.
- `editorScript` points to the shared `build/blocks.js` bundle.
- If your block needs **frontend JS**, add `"viewScript": "file:./view.js"`.

### 2. Create `blocks/{block-name}/render.php`

Server-side dynamic rendering. Use `get_block_wrapper_attributes()` for the root element.

```php
<?php
declare(strict_types=1);

if (!defined('ABSPATH')) { exit; }

$attr = $attributes ?? [];
$my_value = sanitize_text_field((string)($attr['myAttr'] ?? ''));

$wrapper = get_block_wrapper_attributes(['class' => 'beplus-vmn-my-block']);
printf('<div %s>%s</div>', $wrapper, esc_html($my_value));
```

- Always sanitize attributes with the appropriate WP function (`absint`, `sanitize_text_field`, `esc_url`, etc.).
- Use `wp_kses_post($content)` for `InnerBlocks` content.
- Escape everything in HTML output.

### 3. Create `blocks/{block-name}/style.css` and `editor.css`

**style.css** — frontend styles:

```css
.beplus-vmn-my-block {
    /* ... */
}
```

**editor.css** — editor-only overrides:

```css
.wp-block-beplus-visual-mega-nav-my-block {
    min-height: 40px;
    outline: 1px dashed rgba(0, 0, 0, 0.12);
}
```

### 4. Create `src/blocks/{block-name}/index.js`

JS registration for the build system:

```js
import { registerBlockType } from '@wordpress/blocks';
import metadata from '../../../blocks/my-block/block.json';
import Edit from './edit';

import '../../../blocks/my-block/style.css';
import '../../../blocks/my-block/editor.css';

registerBlockType(metadata.name, {
    ...metadata,
    edit: Edit,
    save: () => null, // Dynamic block — PHP handles rendering
});
```

### 5. Create `src/blocks/{block-name}/edit.js`

Editor component. Use `ServerSideRender` for live preview, `InspectorControls` for sidebar settings.

```js
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';

export default function Edit({ attributes, setAttributes }) {
    const { myAttr = '' } = attributes;
    const blockProps = useBlockProps();

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Settings', 'beplus-visual-mega-nav')}>
                    <TextControl
                        label={__('My attribute', 'beplus-visual-mega-nav')}
                        value={myAttr}
                        onChange={(v) => setAttributes({ myAttr: v })}
                    />
                </PanelBody>
            </InspectorControls>
            <div {...blockProps}>
                <ServerSideRender
                    block="beplus-visual-mega-nav/my-block"
                    attributes={attributes}
                />
            </div>
        </>
    );
}
```

> **Tip:** If your preview doesn't update when attributes change, add a `key` prop:
> ```jsx
> <ServerSideRender key={myAttr} ... />
> ```

### 6. Register in `src/blocks.js`

**This makes the block available in the post/page editor.**

```js
// Add this line alphabetically among the other imports:
import './blocks/my-block';
```

### 7. Register in `src/index.js` ⚠️ OFTEN MISSED

**This makes the block available in the mega menu Content Builder.** Without this, the block will appear in posts/pages but not in the mega menu editor.

```js
// Add this line alphabetically among the other imports:
import './blocks/my-block';
```

### 8. Register in `includes/Blocks/BlockRegistry.php`

**Server-side `register_block_type()` call.** Without this, WordPress doesn't parse `block.json`, doesn't register the render template, and the block won't appear in the inserter or REST API.

```php
register_block_type( BEPLUS_VISUAL_MEGA_NAV_DIR . 'blocks/my-block' );
```

### 9. Add to `includes/Core/AllowedBlocks.php`

**PHP allowlist** for the mega menu Content Builder. This list is served to the JS via `window.beplusVmn.allowedBlocks`.

```php
'beplus-visual-mega-nav/my-block',
```

Add it in the appropriate category section (Layout, Content, Navigation, etc.) or under the "Plugin blocks" group.

### 10. Add to `src/utils/allowed-blocks.js`

**JS fallback allowlist** — used when `window.beplusVmn` is unavailable (rare, but serves as documentation).

```js
'beplus-visual-mega-nav/my-block',
```

---

## Optional: viewScript for frontend JS

If your block needs client-side behavior:

1. Add to `block.json`:
   ```json
   "viewScript": "file:./view.js"
   ```

2. Create `blocks/{block-name}/view.js` as a vanilla JS IIFE:
   ```js
   (function () {
       'use strict';
       function init() {
           // Query and initialize elements.
       }
       if (document.readyState === 'loading') {
           document.addEventListener('DOMContentLoaded', init);
       } else {
           init();
       }
   })();
   ```

`viewScript` is **not bundled by webpack** — WordPress loads it as a standalone file. Only use vanilla JS (no JSX, no imports).

---

## Common pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| **Forgot `src/index.js`** | Block works in post editor but not in mega menu builder | Add `import './blocks/my-block'` to `src/index.js` |
| **Forgot `BlockRegistry.php`** | Block doesn't appear anywhere, not in inserter, not in REST | Add `register_block_type(...)` to `BlockRegistry::register_blocks()` |
| **Forgot `AllowedBlocks.php`** | Block registered but not selectable in mega menu Content Builder | Add to `AllowedBlocks::defaults()` |
| **`mouseenter`/`mouseleave` in event delegation** | Events never fire for child elements | Use `mouseover`/`mouseout` (which bubble); add `relatedTarget` checks to filter internal moves |
| **`ServerSideRender` shows stale preview** | Changing attributes doesn't update preview | Add a `key` prop that changes with the attribute: `key={myAttr}` |
| **Inline style specificity blocks CSS** | CSS animations invisible after JS sets inline styles | Clear `style.transform = ''` before re-adding CSS animation classes |
| **`loading="lazy"` on `position: fixed` elements** | Floating elements may flash on first render | Use `loading="eager"` for fixed-position images |

---

## Build and verify

```bash
npm run build
```

After building, verify the block appears in the compiled bundles:

```bash
# Block should appear in both entry points:
grep 'my-block' build/index.js   # Mega menu builder
grep 'my-block' build/blocks.js  # Post/page editor
```

Also check the CSS bundles:
```bash
grep 'my-block' build/style-index.css
```

---

## Quick reference: which file for which purpose

| Purpose | File(s) |
|---|---|
| Block metadata & attributes | `blocks/{name}/block.json` |
| Frontend HTML output | `blocks/{name}/render.php` |
| Frontend styles | `blocks/{name}/style.css` |
| Editor-only styles | `blocks/{name}/editor.css` |
| Frontend JS (vanilla) | `blocks/{name}/view.js` |
| Editor React component | `src/blocks/{name}/edit.js` |
| JS block registration | `src/blocks/{name}/index.js` |
| **Mega menu entry point** | `src/index.js` ← **often missed** |
| Post editor entry point | `src/blocks.js` |
| Server-side registration | `includes/Blocks/BlockRegistry.php` |
| Mega menu PHP allowlist | `includes/Core/AllowedBlocks.php` |
| Mega menu JS allowlist | `src/utils/allowed-blocks.js` |
