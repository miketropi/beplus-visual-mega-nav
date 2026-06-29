/**
 * Merge PHP-provided block editor settings with Content Builder overrides.
 *
 * @package
 */

/**
 * Theme.json uses `null` for spacing flags to mean "enabled", but parts of the
 * block editor treat only strict `true` as enabled (e.g. layout blockGap CSS).
 *
 * @param {Object|null|undefined} spacing Spacing feature flags from theme.json.
 * @return {Object} Normalized spacing settings.
 */
function normalizeSpacingFeatures(spacing = {}) {
	const normalized = { ...spacing };

	['blockGap', 'padding', 'margin'].forEach((key) => {
		if (normalized[key] === null || normalized[key] === undefined) {
			normalized[key] = true;
		}
	});

	return normalized;
}

/**
 * @param {Object} overrides Settings to apply on top of the merged result.
 * @return {Object} Block editor settings for BlockEditorProvider.
 */
export function getMergedEditorSettings(overrides = {}) {
	const baseSettings = window.beplusVmn?.editorSettings ?? {};
	const features = baseSettings.__experimentalFeatures ?? {};

	return {
		...baseSettings,
		...overrides,
		disableLayoutStyles: false,
		__experimentalFeatures: {
			...features,
			spacing: normalizeSpacingFeatures(features.spacing),
		},
	};
}
