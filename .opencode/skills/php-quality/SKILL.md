---
name: php-quality
description: Use when writing, editing, or reviewing PHP files (*.php) in includes/ or snap-megamenu-builder.php. Run after every PHP change to verify no lint/CS/Stan errors were introduced. Do NOT skip.
---

# PHP Quality Enforcement

This project enforces **strict PHP quality**. Every `.php` change in `includes/` or the main plugin file must pass all three checks before being considered done.

## Mandatory workflow

After **every** PHP change, run all checks. Never skip this step.

```bash
composer check
```

This runs three tools in sequence:

| Tool | Command (standalone) | Config | What it catches |
|------|---------------------|--------|-----------------|
| Parallel Lint | `composer lint:php` | — | Syntax errors (parse failures) |
| PHPCS | `composer phpcs` | `phpcs.xml.dist` | Coding standards violations |
| PHPStan | `composer phpstan` | `phpstan.neon` (level 8) | Type errors, undefined calls, dead code |

If any fail, fix the errors and re-run `composer check` until clean.

## PHPCS auto-fix (when applicable)

When PHPCS reports fixable errors (whitespace, formatting), use:

```bash
composer phpcbf
```

This auto-fixes and then re-run `composer phpcs` to confirm remaining issues are zero.

## Coding standards reference

All rules come from `phpcs.xml.dist` and `phpstan.neon`. Key conventions:

### Required in every file
- `declare(strict_types=1);` as the first line after `<?php`
- Namespace: `Snap\MegaMenuBuilder\` (matches directory under `includes/`)
- Text domain: `snap-megamenu-builder` for all translatable strings

### Class conventions
- **`final` classes** preferred — only remove `final` if there's a real extension use case
- One class per file, filename matches class name
- PSR-4: `Snap\MegaMenuBuilder\Foo\Bar` lives in `includes/Foo/Bar.php`

### WordPress conventions
- **Prefix all globals:** hooks use `snap_megamenu_*`, constants use `SNAP_MEGAMENU_*`, handles use `snap-megamenu-*`
- **Escape output:** `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses_post()` — never echo raw data
- **Capability checks:** `current_user_can('edit_theme_options')` for admin operations
- **Nonce verification:** Always verify nonces on POST endpoints
- **Use WordPress APIs** (WP_Query, WP_Post, get_post_meta) — never raw SQL
- **I18n:** `__()`, `_e()`, `esc_html__()`, etc. with `snap-megamenu-builder` textdomain

### Naming map (from AGENTS.md)
| Context | Value |
|---------|-------|
| Plugin folder / text domain | `snap-megamenu-builder` |
| PHP namespace | `Snap\MegaMenuBuilder\` |
| PHP constants | `SNAP_MEGAMENU_*` |
| Post meta keys | `_snap_megamenu_*` |
| REST namespace | `snap-megamenu/v1` |
| PHP filters | `snap_megamenu_*` |

### Legacy compatibility
`MetaKeys::get()` falls back to `_jemented_megamenu_*` meta when new keys are empty. Do NOT remove this fallback.

### Block content safety
Use `BlockContentSanitizer::sanitize()` (not `wp_kses_post()`) when storing block HTML — `wp_kses_post()` destroys Gutenberg block delimiter comments.

## PHPStan level 8 notes

The project runs at PHPStan **level 8** (the strictest). This means:
- All method parameters and return types must be declared
- Arrays must have documented value types (`@param array<string, mixed>`)
- No `mixed` unless genuinely untyped input
- `isset()` on undefined array keys is flagged — use `array_key_exists` or null coalesce

Common PHPStan false-positives suppressed in `phpstan.neon`:
- `apply_filters` calls (WordPress dynamic return types)

## Test files

- Test scaffold: `tests/php/bootstrap.php`
- PHPUnit config: `phpunit.xml.dist`
- Run with: `composer test:php`

When adding new PHP classes, consider adding corresponding tests in `tests/php/`.
