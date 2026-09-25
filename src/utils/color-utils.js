/**
 * Gutenberg Color Utility Helpers.
 *
 * Implements standard WordPress palette resolution, slug normalization,
 * and CSS variable mapping in accordance with gutenberg-block-standard.
 *
 * @package
 */

import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

export const FALLBACK_THEME_COLORS = [
	{ name: 'Base', slug: 'base', color: 'var(--wp--preset--color--base)' },
	{
		name: 'Contrast',
		slug: 'contrast',
		color: 'var(--wp--preset--color--contrast)',
	},
	{
		name: 'Primary',
		slug: 'primary',
		color: 'var(--wp--preset--color--primary)',
	},
	{
		name: 'Paragraph',
		slug: 'paragraph',
		color: 'var(--wp--preset--color--paragraph)',
	},
	{
		name: 'Secondary',
		slug: 'secondary',
		color: 'var(--wp--preset--color--secondary)',
	},
	{
		name: 'Surface',
		slug: 'surface',
		color: 'var(--wp--preset--color--surface)',
	},
	{ name: 'Transparent', slug: 'transparent', color: 'transparent' },
];

/**
 * Normalizes hex string (3, 4, 6, or 8 characters) to lower-case 6-digit hex without alpha.
 *
 * @param {string} hex Hex color.
 * @return {string} Normalized 6-digit hex string.
 */
export function normalizeHex(hex) {
	if (!hex || typeof hex !== 'string') return '';
	const value = hex.trim().toLowerCase();
	if (!value.startsWith('#')) return value;
	if (value.length === 4) {
		return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
	}
	if (value.length === 5) {
		return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
	}
	if (value.length === 9) {
		return value.slice(0, 7);
	}
	return value;
}

/**
 * Checks if a candidate color matches a theme palette entry.
 *
 * @param {Object} entry     Palette entry { name, slug, color }.
 * @param {string} candidate User-selected color string.
 * @return {boolean} Whether the candidate matches the palette entry.
 */
export function paletteColorMatches(entry, candidate) {
	if (!candidate || !entry) return false;
	const normCandidate = candidate.trim().toLowerCase();
	const normEntrySlug = (entry.slug || '').trim().toLowerCase();
	if (normEntrySlug === normCandidate) return true;

	const normEntryColor = (entry.color || '').trim().toLowerCase();
	if (normEntryColor === normCandidate) return true;

	const entryIsHex = /^#[0-9a-f]{3,8}$/i.test(entry.color);
	const candIsHex = /^#[0-9a-f]{3,8}$/i.test(candidate);

	if (entryIsHex && candIsHex) {
		return normalizeHex(entry.color) === normalizeHex(candidate);
	}

	return false;
}

/**
 * React hook to retrieve current theme palette from block editor settings or window globals.
 *
 * @return {Array<Object>} Palette items with { name, slug, color }.
 */
export function useThemeColorPalette() {
	const themeColors = useSelect((select) => {
		try {
			const settings = select('core/block-editor')?.getSettings?.() ?? {};
			if (Array.isArray(settings.colors) && settings.colors.length) {
				return settings.colors;
			}
			if (
				Array.isArray(
					settings.__experimentalFeatures?.color?.palette?.theme
				)
			) {
				return settings.__experimentalFeatures.color.palette.theme;
			}
			if (Array.isArray(settings.color?.palette)) {
				return settings.color.palette;
			}
		} catch {
			// Silently fallback.
		}

		const globalSettings = window.beplusVmn?.editorSettings ?? {};
		if (
			Array.isArray(
				globalSettings.__experimentalFeatures?.color?.palette?.theme
			)
		) {
			return globalSettings.__experimentalFeatures.color.palette.theme;
		}
		if (Array.isArray(globalSettings.colors)) {
			return globalSettings.colors;
		}

		return [];
	}, []);

	return useMemo(() => {
		if (!Array.isArray(themeColors) || !themeColors.length) {
			return FALLBACK_THEME_COLORS;
		}

		return themeColors
			.filter((entry) => entry && typeof entry === 'object' && entry.slug)
			.map((entry) => ({
				name: entry.name || entry.slug,
				slug: entry.slug.toLowerCase(),
				color:
					entry.color ||
					`var(--wp--preset--color--${entry.slug.toLowerCase()})`,
			}));
	}, [themeColors]);
}

/**
 * Store theme preset slugs (e.g. "primary", "secondary") so CSS vars follow style variations.
 * Custom hex / rgb values or 8-digit hex with alpha are kept as-is.
 *
 * @param {string|undefined} value   Color value from color picker.
 * @param {Array<Object>}    palette Theme palette array.
 * @return {string} Normalized value for block attribute storage (slug or custom hex).
 */
export function normalizeColorForStorage(value, palette = []) {
	if (!value) return '';

	const trimmed = value.trim();
	if (!trimmed) return '';

	// 1. Check var:preset|color|slug pattern
	const presetMatch = trimmed.match(/^var:preset\|color\|([a-z0-9_-]+)$/i);
	if (presetMatch) {
		return presetMatch[1].toLowerCase();
	}

	// 2. Check var(--wp--preset--color--slug) pattern
	const varMatch = trimmed.match(
		/^var\(\s*--wp--preset--color--([a-z0-9_-]+)\s*\)$/i
	);
	if (varMatch) {
		return varMatch[1].toLowerCase();
	}

	// 3. If already a slug matching palette
	if (/^[a-z0-9-]+$/i.test(trimmed)) {
		const slug = trimmed.toLowerCase();
		if (palette.some((entry) => entry.slug.toLowerCase() === slug)) {
			return slug;
		}
	}

	// 4. Check if hex/color matches any palette entry
	const matchedPreset = palette.find((entry) =>
		paletteColorMatches(entry, trimmed)
	);
	if (matchedPreset) {
		// If it's a partial-alpha hex that isn't full opacity, keep custom hex
		const isPartialHexAlpha =
			/^#[0-9a-f]{8}$/i.test(trimmed) &&
			!trimmed.toLowerCase().endsWith('ff');
		if (isPartialHexAlpha) {
			return trimmed;
		}
		return matchedPreset.slug;
	}

	return trimmed;
}

/**
 * Return the raw hex/CSS color for Gutenberg ColorPalette / PanelColorSettings value prop.
 *
 * @param {string|undefined} storedValue Value from block attributes.
 * @param {Array<Object>}    palette     Theme palette array.
 * @return {string} Color value for color picker.
 */
export function colorValueForPicker(storedValue, palette = []) {
	if (!storedValue) return '';

	const normalized = normalizeColorForStorage(storedValue, palette);
	const match = palette.find(
		(entry) => entry.slug.toLowerCase() === normalized.toLowerCase()
	);
	if (match) {
		if (/^#[0-9a-f]{3,8}$/i.test(match.color)) {
			return match.color;
		}
		return match.slug;
	}

	return storedValue;
}

/**
 * Resolves a stored color (slug or hex) into a valid CSS value (var(...) or hex).
 *
 * @param {string|undefined} storedValue Value from block attributes.
 * @param {string}           fallback    Default fallback value if unset.
 * @return {string} CSS color string.
 */
export function resolveColorToCss(storedValue, fallback = '') {
	if (!storedValue) return fallback;

	const trimmed = storedValue.trim();
	if (!trimmed) return fallback;

	const presetMatch = trimmed.match(/^var:preset\|color\|([a-z0-9_-]+)$/i);
	if (presetMatch) {
		return `var(--wp--preset--color--${presetMatch[1].toLowerCase()})`;
	}

	const varMatch = trimmed.match(
		/^var\(\s*--wp--preset--color--([a-z0-9_-]+)\s*\)$/i
	);
	if (varMatch) {
		return `var(--wp--preset--color--${varMatch[1].toLowerCase()})`;
	}

	if (/^[a-z0-9-]+$/i.test(trimmed) && !/^[0-9a-f]{3,8}$/i.test(trimmed)) {
		return `var(--wp--preset--color--${trimmed.toLowerCase()})`;
	}

	return trimmed;
}
