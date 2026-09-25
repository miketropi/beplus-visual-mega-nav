/**
 * Menu List block — editor UI (InnerBlocks container for Menu Items).
 *
 * @package
 */

import { useState } from '@wordpress/element';
import {
	InnerBlocks,
	useBlockProps,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	ToggleControl,
	SelectControl,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import {
	useThemeColorPalette,
	normalizeColorForStorage,
	colorValueForPicker,
	resolveColorToCss,
} from '../../utils/color-utils';

const ALLOWED_BLOCKS = ['beplus-visual-mega-nav/menu-item'];

const ACTIVE_STYLES = [
	{
		label: __('Background Fill', 'beplus-visual-mega-nav'),
		value: 'background',
	},
	{ label: __('Rounded Pill', 'beplus-visual-mega-nav'), value: 'pill' },
	{ label: __('Text Color Only', 'beplus-visual-mega-nav'), value: 'text' },
	{
		label: __('Left Border Accent', 'beplus-visual-mega-nav'),
		value: 'left-border',
	},
];

const FONT_WEIGHTS = [
	{ label: __('Normal (400)', 'beplus-visual-mega-nav'), value: '400' },
	{ label: __('Medium (500)', 'beplus-visual-mega-nav'), value: '500' },
	{ label: __('Semi Bold (600)', 'beplus-visual-mega-nav'), value: '600' },
	{ label: __('Bold (700)', 'beplus-visual-mega-nav'), value: '700' },
];

const TEMPLATE = [
	[
		'beplus-visual-mega-nav/menu-item',
		{ label: __('Menu Item 1', 'beplus-visual-mega-nav') },
	],
	[
		'beplus-visual-mega-nav/menu-item',
		{ label: __('Menu Item 2', 'beplus-visual-mega-nav') },
	],
];

export default function Edit({ attributes, setAttributes }) {
	const {
		itemGap = 4,
		paddingVertical = 0,
		paddingHorizontal = 0,
		itemPaddingVertical = 7,
		itemPaddingHorizontal = 12,
		enableAnimation = false,
		animationStyle = 'sequential',
		scrollAnimationStyle = 'sequential',
		highlightCurrent = true,
		activeStyle = 'background',
		activeBgColor = '',
		activeTextColor = '',
		activeFontWeight = '700',
		hoverBgColor = '',
		hoverTextColor = '',
		previewActive = false,
	} = attributes;

	const palette = useThemeColorPalette();

	const [animKey, setAnimKey] = useState(0);
	const triggerEditorPreview = () => setAnimKey((k) => k + 1);

	const resolvedActiveBg = resolveColorToCss(
		activeBgColor,
		'var(--nextora-header-button-bg, var(--nextora-button-bg, var(--wp--preset--color--primary, #FFE600)))'
	);
	const resolvedActiveColor = resolveColorToCss(
		activeTextColor,
		'var(--nextora-header-button-color, var(--nextora-button-color, var(--wp--preset--color--base, #ffffff)))'
	);
	const resolvedHoverBg = resolveColorToCss(hoverBgColor, '');
	const resolvedHoverColor = resolveColorToCss(hoverTextColor, '');

	const inlineStyles = {
		'--beplus-vmn-list-gap': `${itemGap}px`,
		'--beplus-vmn-list-active-bg': resolvedActiveBg,
		'--beplus-vmn-list-active-color': resolvedActiveColor,
		'--beplus-vmn-list-active-weight': activeFontWeight || '700',
		...(paddingVertical !== undefined && paddingVertical > 0
			? { '--beplus-vmn-list-padding-v': `${paddingVertical}px` }
			: {}),
		...(paddingHorizontal !== undefined && paddingHorizontal > 0
			? { '--beplus-vmn-list-padding-h': `${paddingHorizontal}px` }
			: {}),
		...(itemPaddingVertical !== undefined
			? { '--beplus-vmn-list-item-padding-v': `${itemPaddingVertical}px` }
			: {}),
		...(itemPaddingHorizontal !== undefined
			? {
					'--beplus-vmn-list-item-padding-h': `${itemPaddingHorizontal}px`,
				}
			: {}),
		...(paddingVertical || paddingHorizontal
			? {
					padding: `${paddingVertical || 0}px ${paddingHorizontal || 0}px`,
				}
			: {}),
		...(resolvedHoverBg
			? { '--beplus-vmn-list-hover-bg': resolvedHoverBg }
			: {}),
		...(resolvedHoverColor
			? { '--beplus-vmn-list-hover-color': resolvedHoverColor }
			: {}),
	};

	const blockProps = useBlockProps({
		className: [
			'beplus-vmn-menu-list',
			`beplus-vmn-menu-list--active-${activeStyle || 'background'}`,
			enableAnimation
				? `beplus-vmn-menu-list--animation-${animationStyle || scrollAnimationStyle || 'sequential'}`
				: '',
			previewActive ? 'is-previewing-active' : '',
		]
			.filter(Boolean)
			.join(' '),
		style: inlineStyles,
	});

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__(
						'List Layout & Spacing',
						'beplus-visual-mega-nav'
					)}
					initialOpen={true}
				>
					<RangeControl
						label={__('Item Gap (px)', 'beplus-visual-mega-nav')}
						value={itemGap}
						onChange={(val) => setAttributes({ itemGap: val })}
						min={0}
						max={40}
					/>

					<RangeControl
						label={__(
							'List Padding Top / Bottom (px)',
							'beplus-visual-mega-nav'
						)}
						value={paddingVertical ?? 0}
						onChange={(val) =>
							setAttributes({ paddingVertical: val })
						}
						min={0}
						max={100}
					/>

					<RangeControl
						label={__(
							'List Padding Left / Right (px)',
							'beplus-visual-mega-nav'
						)}
						value={paddingHorizontal ?? 0}
						onChange={(val) =>
							setAttributes({ paddingHorizontal: val })
						}
						min={0}
						max={100}
					/>

					<RangeControl
						label={__(
							'Item Padding Top / Bottom (px)',
							'beplus-visual-mega-nav'
						)}
						value={itemPaddingVertical ?? 7}
						onChange={(val) =>
							setAttributes({ itemPaddingVertical: val })
						}
						min={0}
						max={30}
					/>

					<RangeControl
						label={__(
							'Item Padding Left / Right (px)',
							'beplus-visual-mega-nav'
						)}
						value={itemPaddingHorizontal ?? 12}
						onChange={(val) =>
							setAttributes({ itemPaddingHorizontal: val })
						}
						min={0}
						max={40}
					/>
				</PanelBody>

				<PanelBody
					title={__(
						'Active State (Current Page)',
						'beplus-visual-mega-nav'
					)}
					initialOpen={true}
				>
					<ToggleControl
						label={__(
							'Highlight Current Page',
							'beplus-visual-mega-nav'
						)}
						help={__(
							'Automatically highlights active items when visitor views their page.',
							'beplus-visual-mega-nav'
						)}
						checked={highlightCurrent}
						onChange={(val) =>
							setAttributes({ highlightCurrent: val })
						}
					/>

					{highlightCurrent && (
						<>
							<SelectControl
								label={__(
									'Active Style',
									'beplus-visual-mega-nav'
								)}
								value={activeStyle}
								options={ACTIVE_STYLES}
								onChange={(val) =>
									setAttributes({ activeStyle: val })
								}
							/>

							<SelectControl
								label={__(
									'Active Font Weight',
									'beplus-visual-mega-nav'
								)}
								value={activeFontWeight}
								options={FONT_WEIGHTS}
								onChange={(val) =>
									setAttributes({ activeFontWeight: val })
								}
							/>

							<ToggleControl
								label={__(
									'Preview Active State in Editor',
									'beplus-visual-mega-nav'
								)}
								help={__(
									'Previews the active highlight styling directly in the editor canvas.',
									'beplus-visual-mega-nav'
								)}
								checked={previewActive}
								onChange={(val) =>
									setAttributes({ previewActive: val })
								}
							/>
						</>
					)}
				</PanelBody>

				<PanelColorSettings
					title={__('Color Settings', 'beplus-visual-mega-nav')}
					initialOpen={true}
					enableAlpha={true}
					colorSettings={[
						{
							value: colorValueForPicker(activeBgColor, palette),
							onChange: (val) =>
								setAttributes({
									activeBgColor: normalizeColorForStorage(
										val,
										palette
									),
								}),
							label: __(
								'Active Background (Default: Theme Button)',
								'beplus-visual-mega-nav'
							),
						},
						{
							value: colorValueForPicker(
								activeTextColor,
								palette
							),
							onChange: (val) =>
								setAttributes({
									activeTextColor: normalizeColorForStorage(
										val,
										palette
									),
								}),
							label: __(
								'Active Text (Default: Theme Button)',
								'beplus-visual-mega-nav'
							),
						},
						{
							value: colorValueForPicker(hoverBgColor, palette),
							onChange: (val) =>
								setAttributes({
									hoverBgColor: normalizeColorForStorage(
										val,
										palette
									),
								}),
							label: __(
								'Hover Background',
								'beplus-visual-mega-nav'
							),
						},
						{
							value: colorValueForPicker(hoverTextColor, palette),
							onChange: (val) =>
								setAttributes({
									hoverTextColor: normalizeColorForStorage(
										val,
										palette
									),
								}),
							label: __('Hover Text', 'beplus-visual-mega-nav'),
						},
					]}
				/>
				<PanelBody
					title={__('Animation', 'beplus-visual-mega-nav')}
					initialOpen={Boolean(enableAnimation)}
				>
					<ToggleControl
						label={__(
							'Enable Sequential Animation',
							'beplus-visual-mega-nav'
						)}
						help={__(
							'Sequential: cards appear one by one with a gentle upward motion.',
							'beplus-visual-mega-nav'
						)}
						checked={Boolean(enableAnimation)}
						onChange={(val) => {
							setAttributes({ enableAnimation: val });
							if (val) {
								triggerEditorPreview();
							}
						}}
					/>

					{enableAnimation && (
						<>
							<SelectControl
								label={__(
									'Animation Style',
									'beplus-visual-mega-nav'
								)}
								value={
									animationStyle ||
									scrollAnimationStyle ||
									'sequential'
								}
								options={[
									{
										label: __(
											'Sequential (Cards appear one by one)',
											'beplus-visual-mega-nav'
										),
										value: 'sequential',
									},
									{
										label: __(
											'Fade Up (All items together)',
											'beplus-visual-mega-nav'
										),
										value: 'default',
									},
								]}
								onChange={(val) => {
									setAttributes({
										animationStyle: val,
										scrollAnimationStyle: val,
									});
									triggerEditorPreview();
								}}
								help={__(
									'Default: the whole section fades up together. Sequential: cards appear one by one with a gentle upward motion.',
									'beplus-visual-mega-nav'
								)}
							/>

							<Button
								variant="secondary"
								onClick={triggerEditorPreview}
								style={{
									width: '100%',
									justifyContent: 'center',
									marginTop: '8px',
								}}
							>
								{__(
									'▶ Replay Animation',
									'beplus-visual-mega-nav'
								)}
							</Button>
						</>
					)}
				</PanelBody>
			</InspectorControls>

			<div {...blockProps} key={animKey}>
				<InnerBlocks
					allowedBlocks={ALLOWED_BLOCKS}
					template={TEMPLATE}
					renderAppender={InnerBlocks.ButtonBlockAppender}
				/>
			</div>
		</>
	);
}
