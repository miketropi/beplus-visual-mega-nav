---
name: wp-security
description: Use when writing WordPress PHP that handles user input, output, REST endpoints, or database queries. Applies on EVERY new PHP file. Use ONLY for WordPress plugin security — not for generic security questions.
---

# WordPress Security Conventions

Every new PHP file in `includes/` or `blocks/` must follow these rules. Violations are plugin-rejection-level bugs.

## Output escaping

**Never echo raw data.** Always use the correct escape function for the context:

| Context | Function |
|---------|----------|
| HTML text content | `esc_html( $var )` |
| HTML attribute value | `esc_attr( $var )` |
| URL attribute (`href`, `src`) | `esc_url( $var )` |
| Rich HTML from editor | `wp_kses_post( $var )` |
| Block HTML (Gutenberg) | `BlockContentSanitizer::sanitize( $var )` — preserves `<!-- wp:... -->` comments |
| Textarea content | `esc_textarea( $var )` |
| Inline JS in `wp_add_inline_script` | `wp_json_encode()` for data, never string-concat user input |

**Special case: `wp_kses_post()` DESTROYS block HTML.** For storing mega menu content, always use `BlockContentSanitizer::sanitize()` which preserves Gutenberg block delimiter comments.

## Input sanitization

| What | Function |
|------|----------|
| Integer from request | `absint( $_GET['id'] )` |
| Text string | `sanitize_text_field( $_POST['name'] )` |
| Textarea / multiline | `sanitize_textarea_field( $_POST['bio'] )` |
| HTML from editor | `wp_kses_post( wp_unslash( $_POST['content'] ) )` |
| Email | `sanitize_email( $_POST['email'] )` |
| Key/slug | `sanitize_key( $_POST['slug'] )` |
| JSON string | `json_decode( wp_unslash( $_POST['data'] ), true )` then validate |
| URL | `esc_url_raw( $_POST['url'] )` |

## Capability checks

All admin and REST operations require capability verification:

```php
// In REST endpoints
'permission_callback' => function () {
    return current_user_can( 'edit_theme_options' );
},

// In admin pages
if ( ! current_user_can( 'edit_theme_options' ) ) {
    wp_die( esc_html__( 'You do not have sufficient permissions.', 'beplus-visual-mega-nav' ) );
}
```

This plugin uses `edit_theme_options` (Appearance → Menus capability).

## Nonce verification

Every form submission and REST request that modifies data must verify a nonce:

```php
// Admin POST
check_admin_referer( 'beplus_vmn_action', 'beplus_vmn_nonce' );

// REST API — WordPress handles nonce via X-WP-Nonce header automatically
// when using apiFetch with `nonce` from wpApiSettings
```

## SQL / Database

- **Never write raw SQL.** Use `WP_Query`, `get_posts()`, `get_post_meta()`, `update_post_meta()`.
- Meta keys use the `_beplus_vmn_*` prefix (defined in `MetaKeys` constants).
- If raw SQL is unavoidable (it shouldn't be), use `$wpdb->prepare()`.

## File operations

- **Never use user input** in file paths without sanitizing with `sanitize_file_name()`.
- JSON file templates in `templates/` are validated via `json_decode()` before use.

## REST API response

Always return properly shaped data:
```php
return rest_ensure_response( [
    'id'       => $item_id,
    'enabled'  => (bool) $enabled,
    'settings' => $settings,   // already decoded from JSON
    'content'  => $content,
] );
```

Use `WP_REST_Response` or `rest_ensure_response()`, never `wp_send_json()` in REST endpoints.

## Common mistakes to avoid

1. `echo $_GET['foo']` → missing escaping AND sanitization
2. `get_post_meta( $id, $_POST['key'] )` → unsanitized meta key from user input
3. `wp_kses_post()` on Gutenberg block HTML → destroys `<!-- wp:... -->` comments
4. `include $path` with user-controlled `$path` → path traversal
5. Storing raw `$_POST` / `$_GET` in database without sanitization
