<?php
/**
 * CSS value sanitization helpers.
 *
 * @package Beplus\VisualMegaNav\Core
 */

declare(strict_types=1);

namespace Beplus\VisualMegaNav\Core;

/**
 * Static helpers to sanitize CSS values used in inline styles.
 */
final class CssSanitizer {

	/**
	 * Allowed CSS length units.
	 *
	 * @var string[]
	 */
	private const LENGTH_UNITS = [ 'px', 'em', 'rem', '%', 'vw', 'vh', 'vmin', 'vmax', 'ch', 'ex', 'cm', 'mm', 'in', 'pt', 'pc' ];

	/**
	 * Sanitize a grid-template-columns value.
	 *
	 * Only allows characters valid in CSS grid track listings.
	 * Rejects values containing CSS terminators.
	 *
	 * @param string $value Raw attribute value.
	 * @return string Sanitized value, or the default 'auto 1fr'.
	 */
	public static function sanitizeGridColumns( string $value ): string {
		$value = trim( $value );

		if ( '' === $value ) {
			return 'auto 1fr';
		}

		if ( 1 !== preg_match( '/^[a-zA-Z0-9\s\-_.%(),\/\[\]]+$/', $value ) ) {
			return 'auto 1fr';
		}

		return $value;
	}

	/**
	 * Sanitize a spacing/padding/gap CSS value.
	 *
	 * Accepts:
	 *  - Preset references (var:preset|category|slug)
	 *  - CSS var() references
	 *  - Numeric values with valid length units
	 *  - calc() / clamp() function calls
	 *  - Zero without unit
	 *
	 * @param string $value Raw spacing value.
	 * @return string Sanitized CSS value, or empty string on rejection.
	 */
	public static function sanitizeSpacingValue( string $value ): string {
		$value = trim( $value );

		if ( '' === $value ) {
			return '';
		}

		// Preset reference: var:preset|category|slug.
		if ( str_starts_with( $value, 'var:preset|' ) ) {
			$parts = explode( '|', $value );
			$cat   = $parts[1] ?? '';
			$slug  = $parts[2] ?? '';

			if ( '' === $cat || '' === $slug ) {
				return '';
			}

			$cat  = sanitize_key( $cat );
			$slug = sanitize_key( $slug );

			if ( '' === $cat || '' === $slug ) {
				return '';
			}

			return 'var(--wp--preset--' . $cat . '--' . $slug . ')';
		}

		// CSS var() reference.
		if ( str_starts_with( $value, 'var(' ) && str_ends_with( $value, ')' ) ) {
			$inner = substr( $value, 4, -1 );

			if ( 1 === preg_match( '/^[\w\-,\s().%#]+$/', $inner ) ) {
				return $value;
			}

			return '';
		}

		// calc() / clamp() / min() / max().
		if ( preg_match( '/^(calc|clamp|min|max)\(.+\)$/', $value ) ) {
			$inner = substr( $value, strpos( $value, '(' ) + 1, -1 );

			if ( 1 === preg_match( '/^[\d\s+\-*\/.(),%a-z]+$/i', $inner ) ) {
				return $value;
			}

			return '';
		}

		// Numeric with valid unit.
		$unit_pattern = implode( '|', array_map( 'preg_quote', self::LENGTH_UNITS, array_fill( 0, count( self::LENGTH_UNITS ), '/' ) ) );

		if ( 1 === preg_match( '/^\d+(?:\.\d+)?(?:' . $unit_pattern . ')$/', $value ) ) {
			return $value;
		}

		// Zero without unit.
		if ( '0' === $value ) {
			return $value;
		}

		return '';
	}
}
