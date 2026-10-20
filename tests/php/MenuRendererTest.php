<?php
/**
 * Mega panel eligibility, item classes and walker delegation.
 *
 * These units pin the contract that decides whether a top-level menu item is a
 * mega item. Getting it wrong is visible in two directions at once: an item the
 * walker suppresses a submenu for but the renderer draws no panel for loses its
 * whole menu tree, and an item the class filter marks mega while the renderer
 * refuses it is styled as a panel that never appears.
 *
 * @package Beplus\VisualMegaNav\Tests
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav\Tests;

use Beplus\VisualMegaNav\Core\MetaKeys;
use Beplus\VisualMegaNav\Frontend\MegaMenuPanelRenderer;
use Beplus\VisualMegaNav\Frontend\MegaMenuWalkerDelegator;
use Beplus\VisualMegaNav\Frontend\MenuRenderer;
use PHPUnit\Framework\TestCase;
use stdClass;
use WP_Post;
use Walker_Nav_Menu;

/**
 * Inner walker that writes recognisable markup for every element it is handed.
 */
final class RecordingNavMenuWalker extends Walker_Nav_Menu {

	/**
	 * Start a sub-menu level.
	 *
	 * @param string $output Passed by reference.
	 * @param int    $depth  Depth of the menu item.
	 * @param mixed  $args   Menu arguments.
	 * @return void
	 */
	public function start_lvl( &$output, $depth = 0, $args = null ): void {
		$output .= '<ul class="sub-menu">';
	}

	/**
	 * End a sub-menu level.
	 *
	 * @param string $output Passed by reference.
	 * @param int    $depth  Depth of the menu item.
	 * @param mixed  $args   Menu arguments.
	 * @return void
	 */
	public function end_lvl( &$output, $depth = 0, $args = null ): void {
		$output .= '</ul>';
	}

	/**
	 * Start a menu item.
	 *
	 * @param string $output            Passed by reference.
	 * @param mixed  $data_object       Menu item data object.
	 * @param int    $depth             Depth of the menu item.
	 * @param mixed  $args              Menu arguments.
	 * @param int    $current_object_id Current item id.
	 * @return void
	 */
	public function start_el( &$output, $data_object, $depth = 0, $args = null, $current_object_id = 0 ): void {
		$output .= '<li>';
	}

	/**
	 * End a menu item.
	 *
	 * @param string $output      Passed by reference.
	 * @param mixed  $data_object Menu item data object.
	 * @param int    $depth       Depth of the menu item.
	 * @param mixed  $args        Menu arguments.
	 * @return void
	 */
	public function end_el( &$output, $data_object, $depth = 0, $args = null ): void {
		$output .= '</li>';
	}
}

/**
 * Coverage for `MegaMenuPanelRenderer` and `MenuRenderer`.
 */
final class MenuRendererTest extends TestCase {

	/**
	 * Panel content used wherever a real panel is expected.
	 *
	 * @var string
	 */
	private const PANEL_CONTENT = '<!-- wp:heading --><h2>Studio work</h2><!-- /wp:heading -->';

	/**
	 * Start every case from empty meta.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();

		WpStubs::reset();
	}

	/**
	 * Eligibility: enabled item with panel content.
	 *
	 * @return void
	 */
	public function test_enabled_item_with_content_is_mega(): void {
		$this->assertTrue( MegaMenuPanelRenderer::is_mega_item( $this->item( self::PANEL_CONTENT, true ) ) );
	}

	/**
	 * Eligibility: the enable flag alone is not enough.
	 *
	 * @return void
	 */
	public function test_enabled_item_without_content_is_not_mega(): void {
		$this->assertFalse( MegaMenuPanelRenderer::is_mega_item( $this->item( '', true ) ) );
	}

	/**
	 * Eligibility: whitespace-only content is empty content, not a panel.
	 *
	 * @return void
	 */
	public function test_enabled_item_with_whitespace_content_is_not_mega(): void {
		$this->assertFalse( MegaMenuPanelRenderer::is_mega_item( $this->item( "  \n\t ", true ) ) );
	}

	/**
	 * Eligibility: content alone is not enough either.
	 *
	 * @return void
	 */
	public function test_disabled_item_with_content_is_not_mega(): void {
		$this->assertFalse( MegaMenuPanelRenderer::is_mega_item( $this->item( self::PANEL_CONTENT, false ) ) );
	}

	/**
	 * Eligibility: panels are root-level only.
	 *
	 * @return void
	 */
	public function test_nested_item_is_not_mega_at_depth(): void {
		$this->assertFalse( MegaMenuPanelRenderer::is_mega_item( $this->item( self::PANEL_CONTENT, true ), 1 ) );
	}

	/**
	 * Classes: an eligible item gets the mega classes and its width modifier.
	 *
	 * @return void
	 */
	public function test_mega_classes_are_added_for_an_eligible_item(): void {
		$classes = $this->renderer()->add_mega_menu_class(
			array( 'menu-item' ),
			$this->item( self::PANEL_CONTENT, true ),
			new stdClass(),
			0
		);

		$this->assertContains( 'has-mega-menu', $classes );
		$this->assertContains( 'menu-item-has-children', $classes );
		$this->assertContains( 'has-mega-menu--container', $classes );
	}

	/**
	 * Classes: the stored width setting becomes the width modifier.
	 *
	 * @return void
	 */
	public function test_mega_classes_use_the_stored_width(): void {
		$item = $this->item( self::PANEL_CONTENT, true, array( 'width' => 'custom' ) );

		$classes = $this->renderer()->add_mega_menu_class( array(), $item, new stdClass(), 0 );

		$this->assertContains( 'has-mega-menu--custom', $classes );
	}

	/**
	 * Classes: an enabled item without content keeps its ordinary submenu.
	 *
	 * @return void
	 */
	public function test_no_mega_classes_without_content(): void {
		$item = $this->item( '', true );

		$this->assertSame(
			array( 'menu-item' ),
			$this->renderer()->add_mega_menu_class( array( 'menu-item' ), $item, new stdClass(), 0 )
		);
	}

	/**
	 * Classes: a disabled item is never marked as a mega item.
	 *
	 * @return void
	 */
	public function test_no_mega_classes_when_disabled(): void {
		$item = $this->item( self::PANEL_CONTENT, false );

		$this->assertSame(
			array( 'menu-item' ),
			$this->renderer()->add_mega_menu_class( array( 'menu-item' ), $item, new stdClass(), 0 )
		);
	}

	/**
	 * Classes: nested items are never marked as mega items.
	 *
	 * @return void
	 */
	public function test_no_mega_classes_below_the_root_level(): void {
		$item = $this->item( self::PANEL_CONTENT, true );

		$this->assertSame(
			array( 'menu-item' ),
			$this->renderer()->add_mega_menu_class( array( 'menu-item' ), $item, new stdClass(), 1 )
		);
	}

	/**
	 * Delegation: an eligible item gets a panel and loses its ordinary submenu.
	 *
	 * @return void
	 */
	public function test_delegator_suppresses_the_submenu_and_appends_the_panel(): void {
		$item = $this->item( self::PANEL_CONTENT, true );

		$output = $this->walk_item( $item );

		$this->assertStringContainsString( 'beplus-vmn-mega-panel', $output );
		$this->assertStringContainsString( 'role="region"', $output );
		$this->assertStringNotContainsString( '<ul class="sub-menu">', $output );
		$this->assertStringNotContainsString( '</ul>', $output );
	}

	/**
	 * Delegation: without panel content the ordinary submenu survives.
	 *
	 * @return void
	 */
	public function test_delegator_keeps_the_submenu_without_content(): void {
		$output = $this->walk_item( $this->item( '', true ) );

		$this->assertStringNotContainsString( 'beplus-vmn-mega-panel', $output );
		$this->assertStringContainsString( '<ul class="sub-menu">', $output );
		$this->assertStringContainsString( '</ul>', $output );
	}

	/**
	 * Delegation: a disabled item keeps its ordinary submenu.
	 *
	 * @return void
	 */
	public function test_delegator_keeps_the_submenu_when_disabled(): void {
		$output = $this->walk_item( $this->item( self::PANEL_CONTENT, false ) );

		$this->assertStringNotContainsString( 'beplus-vmn-mega-panel', $output );
		$this->assertStringContainsString( '<ul class="sub-menu">', $output );
	}

	/**
	 * Run one top-level item plus its submenu through the delegator.
	 *
	 * @param WP_Post $item Menu item.
	 * @return string Markup produced by the walker pair.
	 */
	private function walk_item( WP_Post $item ): string {
		$walker = new MegaMenuWalkerDelegator( new RecordingNavMenuWalker() );
		$args   = new stdClass();
		$output = '';

		$walker->start_el( $output, $item, 0, $args, 0 );
		$walker->start_lvl( $output, 0, $args );
		$walker->end_lvl( $output, 0, $args );
		$walker->end_el( $output, $item, 0, $args );

		return $output;
	}

	/**
	 * Build one menu item with its meta written.
	 *
	 * @param string                       $content  Panel content.
	 * @param bool                         $enabled  Whether the panel is enabled.
	 * @param array<string, mixed>         $settings Panel settings.
	 * @return WP_Post Menu item.
	 */
	private function item( string $content, bool $enabled, array $settings = array() ): WP_Post {
		$id = wp_insert_post( array( 'post_type' => 'nav_menu_item' ) );

		update_post_meta( $id, MetaKeys::ENABLED, $enabled ? '1' : '0' );
		update_post_meta( $id, MetaKeys::CONTENT, $content );

		if ( array() !== $settings ) {
			update_post_meta( $id, MetaKeys::SETTINGS, (string) wp_json_encode( $settings ) );
		}

		return new WP_Post(
			(object) array(
				'ID'    => $id,
				'title' => 'Studio',
				'url'   => 'https://example.test/studio/',
			)
		);
	}

	/**
	 * Renderer under test.
	 *
	 * @return MenuRenderer
	 */
	private function renderer(): MenuRenderer {
		return new MenuRenderer();
	}
}
