=== Beplus Visual Mega Navigation ===
Contributors: bearsthemes, miketropi
Tags: mega-menu, gutenberg, navigation, block-editor, menu-builder
Requires at least: 6.0
Tested up to: 7.1
Requires PHP: 8.0
Stable tag: 0.0.25
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Build mega menu panels visually with the WordPress block editor: per-item settings, starter templates, and accessible front-end output.

== Description ==

Beplus Visual Mega Navigation adds a Gutenberg-powered mega menu builder to **Appearance → Menus**. A top-level (`depth-0`) menu item can get a visual panel designed with the block editor instead of a plain sub-menu, and the panel is rendered on the front end by a menu walker that keeps keyboard and screen-reader behaviour intact.

= Features =

* **Visual builder** — design panel content with the block editor: columns, headings, images, buttons, lists, and the plugin's navigation blocks.
* **Per-item settings** — enable or disable the panel, panel width, custom width, panel position, and open animation for each top-level menu item.
* **Starter templates** — apply a ready-made layout from the template store, import a JSON file, or export the current design.
* **Block patterns** — the **BePlus Header Inline — Logo / Menu / Toggle** pattern is available in the Site Editor for block themes.
* **Root-level only** — only top-level menu items can host a mega panel.
* **Accessible front end** — the front-end script manages `aria-haspopup`, `aria-expanded`, and `aria-controls`; Escape closes an open panel and moving focus out of the panel closes it.
* **Theme friendly** — panel markup uses `beplus-vmn-*` classes and `--beplus-vmn-mega-*` CSS custom properties, and the width mode is exposed as `has-mega-menu--{width}` on the menu item.
* **Nothing extra in the database** — settings and content are stored in `nav_menu_item` post meta, and the legacy `_jemented_megamenu_*` keys are still read on migrated sites.

= Requirements =

* WordPress 6.0 or higher.
* PHP 8.0 or higher.
* WooCommerce — optional, required by the **Product List** and **Product Card** blocks.
* Node.js — development builds only; the required version is pinned in `.nvmrc` (currently 24).

= Getting started =

1. Go to **Appearance → Menus** and open (or create) a menu.
2. Click **Mega Menu** on a top-level menu item. The **Mega Menu Builder** opens for that item only.
3. On the **Settings** tab, turn on **Enable Mega Menu** and choose the panel width, position, and open animation.
4. Switch to the **Content Builder** tab and build the panel with the block editor.
5. Use **Import** or **Export** in the modal header to apply a starter template or download the current design as JSON.
6. Click **Save**.

= Mega menu templates =

Templates are JSON files discovered from these locations. When the same slug exists in more than one place, the last location wins.

* **Plugin** — `beplus-visual-mega-nav/templates/*.json` (lowest priority).
* **Parent theme** — `{theme}/mega-menu-templates/*.json`.
* **Child theme** — `{child-theme}/mega-menu-templates/*.json` (highest priority).

Built-in templates:

* `featured-with-links` — Featured + Links.
* `mega-4-columns` — 4 Columns.
* `blog-and-quote-2-cols` — Quotes + blog list.
* `hero-artwork-3-cols` — Hero Artwork 3 cols.

A theme file with the same slug as a plugin template replaces the plugin version in the **Import** dropdown. Exported files use the same format, so you can drop an export into `mega-menu-templates/` and add a `slug` to publish it in the store.

= Template file format =

Each template is a single JSON object:

~~~
{
  "slug": "my-custom-menu",
  "title": "My Custom Menu",
  "description": "Optional short description shown in the Import dropdown.",
  "version": "1.0.0",
  "settings": {
    "width": "full",
    "customWidth": 1200,
    "position": "item-left",
    "bgColor": "",
    "animation": "fade"
  },
  "content": "Serialized block markup"
}
~~~

Fields:

* `slug` — used as the filename (`{slug}.json`); falls back to the filename without `.json`.
* `title` — label shown in the Import dropdown.
* `description` — optional text shown under the title.
* `version` — template metadata only.
* `settings` — optional panel settings applied with the template.
* `content` — **required**, serialized block markup in the same format that is saved to the menu item.

Panel settings keys:

* `width` — `full` or `custom`.
* `customWidth` — panel width in pixels when `width` is `custom` (200–2400, default 780).
* `position` — `item-left`, `item-center`, or `screen-center` (used with a custom width).
* `bgColor` — panel background color as a hex value.
* `animation` — `fade`, `slide`, or `none`.

Template content is sanitized on load with the same rules as saved mega menu content, so only blocks from the allowed list below are kept.

= Included blocks =

Core blocks available in the Content Builder: Columns, Column, Group, Row, Stack, Heading, Paragraph, List, List item, Image, Buttons, Button, Separator, Spacer, Cover, Page List, Shortcode, and Custom HTML.

Blocks added by this plugin:

* **Menu List** and **Menu Item** — navigation lists with current-page detection, active state styling, and badges.
* **Link Item** — single navigation link with an optional description and badge.
* **Tab Container** and **Tab Panel** — tabbed mega menu content, vertical sidebar or horizontal top bar.
* **BePlus Header** and **BePlus Navigation** — header container with sticky and scroll effects, plus a classic menu with hamburger toggle.
* **Menu Area** — renders a classic WordPress menu inside the panel using the mega menu engine.
* **Nav Toggle** — hamburger button that opens the mobile navigation overlay.
* **Hero Artwork Dock**, **Blog List**, **Quote**, **Product List**, and **Product Card** — content blocks for promotional panels.

Third-party blocks appear in the Content Builder once they are registered, and you can allow them with the `beplus_vmn_allowed_blocks` filter.

= REST API =

The admin screen uses these routes. All of them require the `edit_theme_options` capability.

* `GET /wp-json/beplus-visual-mega-nav/v1/item/{id}` — read `enabled`, `settings`, and `content` for a menu item.
* `POST /wp-json/beplus-visual-mega-nav/v1/item/{id}` — save `enabled`, `settings`, and `content`.
* `GET /wp-json/beplus-visual-mega-nav/v1/templates` — list template summaries (slug, title, description, source).
* `GET /wp-json/beplus-visual-mega-nav/v1/templates/{slug}` — load one template, including `settings` and `content`.

= Developer hooks =

Filters provided by the plugin:

* `beplus_vmn_locations` — theme locations that use the mega menu walker (default `primary`, `main-menu`, `header`).
* `beplus_vmn_apply_walker` — force the walker on or off for a given `wp_nav_menu()` call; return `true` or `false`.
* `beplus_vmn_allowed_blocks` — block names allowed in the Content Builder.
* `beplus_vmn_template_directories` — template scan directories, keyed by source label.
* `beplus_vmn_templates` — template list returned to the admin UI, keyed by slug.
* `beplus_vmn_template_data` — a single template before it is returned by the REST API.
* `beplus_vmn_template_part_content` — markup of a bundled block pattern before it is registered.
* `beplus_vmn_link_item_attributes` — Link Item block attributes before rendering.
* `beplus_vmn_link_item_render_markup` — rendered Link Item HTML.
* `beplus_vmn_link_item_badge_variants` — allowed badge variant slugs.

Example: adding a custom block to the Content Builder.

~~~
add_filter( 'beplus_vmn_allowed_blocks', function ( array $blocks ): array {
    $blocks[] = 'my-plugin/featured-card';
    return $blocks;
} );
~~~

Example: adding a template directory.

~~~
add_filter( 'beplus_vmn_template_directories', function ( array $directories ): array {
    $directories['my-plugin'] = plugin_dir_path( __FILE__ ) . 'mega-menu-templates';
    return $directories;
} );
~~~

= Data storage =

Each menu item stores three meta values on the `nav_menu_item` post:

* `_beplus_vmn_enabled` — whether the item renders a mega panel.
* `_beplus_vmn_settings` — JSON string with the panel settings listed above.
* `_beplus_vmn_content` — serialized block markup.

= Development =

* `npm run start` — watch admin assets.
* `npm run build` — production build into `build/`.
* `composer check` — PHP lint, PHPCS, PHPStan.
* `npm run check:js` — ESLint and Stylelint.

== Installation ==

1. Go to **Plugins → Add New Plugin**, search for **Beplus Visual Mega Navigation**, then click **Install Now** and **Activate**.
2. Alternatively, download the plugin ZIP, go to **Plugins → Add New Plugin → Upload Plugin**, choose the file, and click **Install Now**, then **Activate**.
3. Open **Appearance → Menus**, add or edit a top-level menu item, and click **Mega Menu**.

From a source checkout, run `composer install`, `npm install`, and `npm run build` inside the plugin folder before activating it.

== Frequently Asked Questions ==

= Does the mega menu work on sub-menu items? =

No. Mega panels are root-level only — the **Mega Menu** button is added to top-level (`depth-0`) menu items.

= How do I add my theme's menu location? =

The panel walker runs for the `primary`, `main-menu`, and `header` theme locations. Add your own location with the `beplus_vmn_locations` filter:

~~~
add_filter( 'beplus_vmn_locations', function ( array $locations ): array {
    $locations[] = 'your-theme-location';
    return $locations;
} );
~~~

= Can I use my own blocks in the Content Builder? =

Yes. Register the block, then allow it with the `beplus_vmn_allowed_blocks` filter:

~~~
add_filter( 'beplus_vmn_allowed_blocks', function ( array $blocks ): array {
    $blocks[] = 'my-plugin/featured-card';
    return $blocks;
} );
~~~

= Where is the mega menu content stored? =

In post meta on the menu item itself: `_beplus_vmn_enabled`, `_beplus_vmn_settings`, and `_beplus_vmn_content`. Nothing is copied into other posts or options.

= What happens to my mega menus if I deactivate the plugin? =

Nothing is deleted. Deactivating removes the editor and the front-end panel rendering; reactivating restores them with the saved content.

= Do I need a block theme? =

No. The builder works with classic themes and block themes. Block themes additionally get the **BePlus Header Inline** pattern in the Site Editor.

= Why is the Product List or Product Card block empty? =

Those two blocks read WooCommerce data and show a notice when WooCommerce is not active. Install and activate WooCommerce, then add products to the panel.

== Screenshots ==

1. A mega menu panel with four navigation columns, opened on the front end.
2. A store panel with a featured column and a links column, including badges for support and address details.
3. The **Mega Menu** link added to the actions of a top-level menu item on **Appearance → Menus**.
4. The **Content Builder** tab with the Import template popover, listing built-in templates and the JSON file upload.
5. Building panel content in the block editor, with the block settings sidebar.
6. The **BePlus Header Inline — Logo / Menu / Toggle** pattern in the Site Editor.

== Changelog ==

= 0.0.25 =

* New **Menu List** and **Menu Item** blocks with current-page detection, active states, and badges.
* New panel settings: default and custom panel width, plus panel position (aligned with the menu item, centered on the menu item, or centered on the screen).
* Panel markup now exposes `data-width`, `data-custom-width`, `data-position`, and width modifier classes for theme styling.
* Fixed mega menu panels not loading correctly on some menus.

= 0.0.13 =

* New starter templates: **Quotes + blog list** and **Hero Artwork 3 cols**.
* Added GitHub contribution and release automation.

= 0.0.12 =

* New **Product List** and **Product Card** blocks for WooCommerce, using GSAP for the stacked deck animation.
* Updated the Quote block.

= 0.0.11 =

* New **Hero Artwork Dock** and **Blog List** blocks; reworked **BePlus Navigation** and **BePlus Header**.
* Fixed the ordering of the Hero Artwork block.
* Resolved JavaScript, CSS, and PHP lint errors in the Quote block.

= 0.0.10 =

* Fixed some PHP issues.
* Improved the backend editor.
* Fixed the theme header hover mega menu and menu walker handling when a `WP_Term` object is passed.

= 0.0.9 =

* New **Block** tab in the mega menu modal for improved block management.

= 0.0.7 =

* Fixed WordPress.org review feedback and classic menu rendering in the **Menu Area** block.

= 0.0.6 =

* New **BePlus Header** block and the **BePlus Header Inline** pattern.
* WordPress.org plugin check fixes and code quality tooling.

= 0.0.5 =

* Initial release.

== Upgrade Notice ==

= 0.0.25 =

Adds the Menu List and Menu Item blocks plus new panel width and position settings. Existing mega menus keep working without changes.
