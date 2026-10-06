/**
 * SettingsPanel — mega menu configuration controls.
 *
 * @package
 */

import {
	ToggleControl,
	SelectControl,
	TextControl,
	RangeControl,
	ColorPalette,
	Dropdown,
	Button,
	Icon,
	Panel,
	PanelBody,
	PanelRow,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { link, linkOff, chevronDown, reset } from '@wordpress/icons';
import {
	useThemeColorPalette,
	normalizeColorForStorage,
	colorValueForPicker,
	resolveColorToCss,
} from '../utils/color-utils';

/**
 * Return human-readable label for current color value.
 *
 * @param {string}        color   Stored color string.
 * @param {Array<Object>} palette Theme palette array.
 * @return {string} Human-readable color label.
 */
function getColorLabel(color, palette = []) {
	if (!color) {
		return __('Default (None)', 'beplus-visual-mega-nav');
	}
	const norm = normalizeColorForStorage(color, palette);
	const match = palette.find(
		(entry) => entry.slug.toLowerCase() === norm.toLowerCase()
	);
	if (match) {
		return match.name || match.slug;
	}
	if (color.toLowerCase() === 'transparent') {
		return __('Transparent', 'beplus-visual-mega-nav');
	}
	return color;
}

export default function SettingsPanel({
	enabled,
	onEnabledChange,
	settings,
	onSettingsChange,
}) {
	const palette = useThemeColorPalette();

	const update = (key, value) => {
		onSettingsChange({ ...settings, [key]: value });
	};

	const isRadiusObject =
		typeof settings.borderRadius === 'object' &&
		settings.borderRadius !== null;

	const isLinked = !isRadiusObject;

	const parsedRadius =
		typeof settings.borderRadius === 'number'
			? settings.borderRadius
			: parseInt(settings.borderRadius, 10) || 0;

	const corners = isRadiusObject
		? {
				topLeft: settings.borderRadius.topLeft ?? 0,
				topRight: settings.borderRadius.topRight ?? 0,
				bottomRight: settings.borderRadius.bottomRight ?? 0,
				bottomLeft: settings.borderRadius.bottomLeft ?? 0,
			}
		: {
				topLeft: parsedRadius,
				topRight: parsedRadius,
				bottomRight: parsedRadius,
				bottomLeft: parsedRadius,
			};

	const handleToggleRadiusLink = () => {
		if (isLinked) {
			update('borderRadius', {
				topLeft: parsedRadius,
				topRight: parsedRadius,
				bottomRight: parsedRadius,
				bottomLeft: parsedRadius,
			});
		} else {
			const unified =
				parseInt(corners.topLeft, 10) ||
				parseInt(corners.topRight, 10) ||
				parseInt(corners.bottomRight, 10) ||
				parseInt(corners.bottomLeft, 10) ||
				0;
			update('borderRadius', unified);
		}
	};

	const updateCorner = (cornerKey, value) => {
		const parsed =
			value === ''
				? ''
				: Math.max(0, Math.min(100, parseInt(value, 10) || 0));
		update('borderRadius', {
			...corners,
			[cornerKey]: parsed,
		});
	};

	const resetAllCorners = () => {
		update('borderRadius', {
			topLeft: 0,
			topRight: 0,
			bottomRight: 0,
			bottomLeft: 0,
		});
	};

	const hasAnyCornerRadius = Boolean(
		corners.topLeft ||
		corners.topRight ||
		corners.bottomRight ||
		corners.bottomLeft
	);

	const panelClass = enabled
		? 'beplus-vmn-settings-panel'
		: 'beplus-vmn-settings-panel beplus-vmn-settings-panel--disabled';

	return (
		<Panel className={panelClass}>
			<PanelBody
				title={__('General', 'beplus-visual-mega-nav')}
				initialOpen={true}
			>
				<PanelRow>
					<ToggleControl
						label={__('Enable Mega Menu', 'beplus-visual-mega-nav')}
						help={
							enabled
								? __(
										'Mega menu is active for this item.',
										'beplus-visual-mega-nav'
									)
								: __(
										'Default sub-menu will be used.',
										'beplus-visual-mega-nav'
									)
						}
						checked={enabled}
						onChange={onEnabledChange}
					/>
				</PanelRow>
			</PanelBody>

			<PanelBody
				title={__('Appearance & Layout', 'beplus-visual-mega-nav')}
				initialOpen={true}
			>
				<SelectControl
					label={__('Panel Width', 'beplus-visual-mega-nav')}
					value={settings.width === 'custom' ? 'custom' : 'full'}
					options={[
						{
							label: __(
								'Fixed / Custom Width',
								'beplus-visual-mega-nav'
							),
							value: 'custom',
						},
						{
							label: __(
								'Full Width (100%)',
								'beplus-visual-mega-nav'
							),
							value: 'full',
						},
					]}
					onChange={(val) => update('width', val)}
					disabled={!enabled}
				/>

				{settings.width === 'custom' && (
					<>
						<TextControl
							label={__(
								'Custom Width (px)',
								'beplus-visual-mega-nav'
							)}
							type="number"
							min={200}
							max={2400}
							step={10}
							value={settings.customWidth || 780}
							onChange={(val) =>
								update('customWidth', parseInt(val, 10) || 780)
							}
							disabled={!enabled}
						/>

						<SelectControl
							label={__(
								'Panel Position',
								'beplus-visual-mega-nav'
							)}
							value={settings.position || 'item-left'}
							options={[
								{
									label: __(
										'Center of Screen',
										'beplus-visual-mega-nav'
									),
									value: 'screen-center',
								},
								{
									label: __(
										'Left Aligned with Menu Item',
										'beplus-visual-mega-nav'
									),
									value: 'item-left',
								},
								{
									label: __(
										'Centered with Menu Item',
										'beplus-visual-mega-nav'
									),
									value: 'item-center',
								},
							]}
							onChange={(val) => update('position', val)}
							disabled={!enabled}
						/>
					</>
				)}

				<div className="beplus-vmn-settings-field beplus-vmn-settings-field--color">
					<span className="beplus-vmn-settings-field__label">
						{__('Background Color', 'beplus-visual-mega-nav')}
					</span>
					<div className="beplus-vmn-color-row">
						<Dropdown
							popoverProps={{
								placement: 'bottom-start',
								className: 'beplus-vmn-color-popover',
							}}
							renderToggle={({ isOpen, onToggle }) => (
								<Button
									className={`beplus-vmn-color-trigger ${
										isOpen ? 'is-open' : ''
									}`}
									onClick={onToggle}
									aria-expanded={isOpen}
									aria-label={__(
										'Select background color',
										'beplus-visual-mega-nav'
									)}
									disabled={!enabled}
								>
									<span className="beplus-vmn-color-trigger__left">
										<span className="beplus-vmn-color-swatch-wrapper">
											<span
												className="beplus-vmn-color-swatch-fill"
												style={{
													backgroundColor:
														resolveColorToCss(
															settings.bgColor,
															'transparent'
														),
												}}
											/>
										</span>
										<span className="beplus-vmn-color-trigger__value">
											{getColorLabel(
												settings.bgColor,
												palette
											)}
										</span>
									</span>
									<Icon
										icon={chevronDown}
										size={18}
										className="beplus-vmn-color-trigger__chevron"
									/>
								</Button>
							)}
							renderContent={() => (
								<div className="beplus-vmn-color-popover__content">
									<div className="beplus-vmn-color-popover__header">
										<span className="beplus-vmn-color-popover__title">
											{__(
												'Background Color',
												'beplus-visual-mega-nav'
											)}
										</span>
										{Boolean(settings.bgColor) && (
											<Button
												variant="link"
												isDestructive
												size="small"
												onClick={() =>
													update('bgColor', '')
												}
											>
												{__(
													'Clear',
													'beplus-visual-mega-nav'
												)}
											</Button>
										)}
									</div>
									<ColorPalette
										colors={palette}
										value={colorValueForPicker(
											settings.bgColor,
											palette
										)}
										onChange={(val) =>
											update(
												'bgColor',
												normalizeColorForStorage(
													val,
													palette
												)
											)
										}
										clearable={true}
										enableAlpha={true}
									/>
								</div>
							)}
						/>
						{Boolean(settings.bgColor) && (
							<Button
								icon={reset}
								className="beplus-vmn-color-reset-btn"
								size="small"
								variant="tertiary"
								label={__(
									'Reset background color',
									'beplus-visual-mega-nav'
								)}
								onClick={() => update('bgColor', '')}
								disabled={!enabled}
							/>
						)}
					</div>
				</div>

				<div className="beplus-vmn-settings-field beplus-vmn-settings-field--radius">
					<div className="beplus-vmn-settings-header-row">
						<span className="beplus-vmn-settings-header-row__label">
							{__('Border Radius (px)', 'beplus-visual-mega-nav')}
						</span>
						<Button
							icon={isLinked ? link : linkOff}
							size="small"
							variant="tertiary"
							className={`beplus-vmn-link-toggle-btn ${
								isLinked ? 'is-linked' : 'is-unlinked'
							}`}
							label={
								isLinked
									? __(
											'Configure 4 corners individually',
											'beplus-visual-mega-nav'
										)
									: __(
											'Link all corners together',
											'beplus-visual-mega-nav'
										)
							}
							onClick={handleToggleRadiusLink}
							disabled={!enabled}
						/>
					</div>

					{isLinked ? (
						<RangeControl
							aria-label={__(
								'Border Radius (px)',
								'beplus-visual-mega-nav'
							)}
							value={parsedRadius}
							onChange={(val) =>
								update(
									'borderRadius',
									val !== undefined ? val : 0
								)
							}
							min={0}
							max={100}
							step={1}
							allowReset={true}
							disabled={!enabled}
						/>
					) : (
						<div className="beplus-vmn-radius-unlinked-wrap">
							<div className="beplus-vmn-radius-grid">
								<TextControl
									label={__(
										'Top Left',
										'beplus-visual-mega-nav'
									)}
									type="number"
									min={0}
									max={100}
									step={1}
									value={corners.topLeft}
									onChange={(val) =>
										updateCorner('topLeft', val)
									}
									disabled={!enabled}
								/>
								<TextControl
									label={__(
										'Top Right',
										'beplus-visual-mega-nav'
									)}
									type="number"
									min={0}
									max={100}
									step={1}
									value={corners.topRight}
									onChange={(val) =>
										updateCorner('topRight', val)
									}
									disabled={!enabled}
								/>
								<TextControl
									label={__(
										'Bottom Left',
										'beplus-visual-mega-nav'
									)}
									type="number"
									min={0}
									max={100}
									step={1}
									value={corners.bottomLeft}
									onChange={(val) =>
										updateCorner('bottomLeft', val)
									}
									disabled={!enabled}
								/>
								<TextControl
									label={__(
										'Bottom Right',
										'beplus-visual-mega-nav'
									)}
									type="number"
									min={0}
									max={100}
									step={1}
									value={corners.bottomRight}
									onChange={(val) =>
										updateCorner('bottomRight', val)
									}
									disabled={!enabled}
								/>
							</div>
							{hasAnyCornerRadius && (
								<div className="beplus-vmn-radius-reset-row">
									<Button
										size="small"
										variant="link"
										isDestructive
										onClick={resetAllCorners}
										disabled={!enabled}
									>
										{__(
											'Reset all corners',
											'beplus-visual-mega-nav'
										)}
									</Button>
								</div>
							)}
						</div>
					)}
				</div>

				<SelectControl
					label={__('Open Animation', 'beplus-visual-mega-nav')}
					value={settings.animation || 'fade'}
					options={[
						{
							label: __('Fade', 'beplus-visual-mega-nav'),
							value: 'fade',
						},
						{
							label: __('Slide Down', 'beplus-visual-mega-nav'),
							value: 'slide',
						},
						{
							label: __('None', 'beplus-visual-mega-nav'),
							value: 'none',
						},
					]}
					onChange={(val) => update('animation', val)}
					disabled={!enabled}
				/>
			</PanelBody>
		</Panel>
	);
}
