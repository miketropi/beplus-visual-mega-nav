import { useEffect } from '@wordpress/element';
import {
	InspectorControls,
	useBlockProps,
	InnerBlocks,
	useSetting,
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	SelectControl,
	TextControl,
	ColorPalette,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, setAttributes, clientId }) {
	const {
		instanceId,
		mobileBreakpoint,
		sticky,
		scrollEffect,
		scrollBgColor,
		transparentTop,
		gridColumns,
	} = attributes;

	const themeColors = useSetting('color.palette') || [];
	const disableCustomColors = !useSetting('color.custom');

	useEffect(() => {
		if (!instanceId) {
			setAttributes({ instanceId: clientId.slice(0, 8) });
		}
	}, [instanceId, clientId, setAttributes]);

	const columns = (gridColumns || 'auto 1fr').trim() || 'auto 1fr';

	const blockProps = useBlockProps({
		className: 'is-layout-grid',
		style: {
			display: 'grid',
			gridTemplateColumns: columns,
		},
	});

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Mobile Breakpoint', 'beplus-visual-mega-nav')}
				>
					<SelectControl
						label={__('Breakpoint', 'beplus-visual-mega-nav')}
						value={mobileBreakpoint}
						options={[
							{
								label: __(
									'Mobile (600px)',
									'beplus-visual-mega-nav'
								),
								value: 600,
							},
							{
								label: __(
									'Tablet (782px)',
									'beplus-visual-mega-nav'
								),
								value: 782,
							},
							{
								label: __(
									'Desktop (1024px)',
									'beplus-visual-mega-nav'
								),
								value: 1024,
							},
							{
								label: __('Custom', 'beplus-visual-mega-nav'),
								value: -1,
							},
						]}
						onChange={(value) => {
							if (parseInt(value, 10) > 0) {
								setAttributes({
									mobileBreakpoint: parseInt(value, 10),
								});
							}
						}}
					/>
					{mobileBreakpoint < 0 && (
						<TextControl
							label={__(
								'Custom breakpoint (px)',
								'beplus-visual-mega-nav'
							)}
							type="number"
							value={(
								Math.abs(mobileBreakpoint) || 782
							).toString()}
							min={320}
							max={1200}
							onChange={(value) =>
								setAttributes({
									mobileBreakpoint:
										parseInt(value, 10) || 782,
								})
							}
						/>
					)}
				</PanelBody>
				<PanelBody title={__('Sticky', 'beplus-visual-mega-nav')}>
					<ToggleControl
						label={__('Sticky header', 'beplus-visual-mega-nav')}
						checked={sticky}
						onChange={(value) => setAttributes({ sticky: value })}
					/>
					{sticky && (
						<SelectControl
							label={__(
								'Scroll effect',
								'beplus-visual-mega-nav'
							)}
							value={scrollEffect}
							options={[
								{
									label: __('None', 'beplus-visual-mega-nav'),
									value: 'none',
								},
								{
									label: __(
										'Shrink',
										'beplus-visual-mega-nav'
									),
									value: 'shrink',
								},
								{
									label: __(
										'Hide on scroll',
										'beplus-visual-mega-nav'
									),
									value: 'hide-on-scroll',
								},
								{
									label: __(
										'Background on scroll',
										'beplus-visual-mega-nav'
									),
									value: 'bg-on-scroll',
								},
							]}
							onChange={(value) =>
								setAttributes({ scrollEffect: value })
							}
						/>
					)}
					{sticky && scrollEffect === 'bg-on-scroll' && (
						<ColorPalette
							label={__(
								'Scroll background color',
								'beplus-visual-mega-nav'
							)}
							colors={themeColors}
							disableCustomColors={disableCustomColors}
							value={scrollBgColor || ''}
							onChange={(value) =>
								setAttributes({
									scrollBgColor: value || '',
								})
							}
							clearable={true}
						/>
					)}
					<ToggleControl
						label={__(
							'Transparent at top',
							'beplus-visual-mega-nav'
						)}
						checked={transparentTop}
						onChange={(value) =>
							setAttributes({ transparentTop: value })
						}
						help={__(
							'Header has no background when at the top of the page.',
							'beplus-visual-mega-nav'
						)}
					/>
				</PanelBody>
				<PanelBody
					title={__('Grid Columns', 'beplus-visual-mega-nav')}
					initialOpen={false}
				>
					<TextControl
						label={__(
							'Grid template columns',
							'beplus-visual-mega-nav'
						)}
						value={gridColumns || 'auto 1fr'}
						onChange={(value) =>
							setAttributes({
								gridColumns: value || 'auto 1fr',
							})
						}
						placeholder="auto 1fr"
						help={__(
							'CSS grid-template-columns value, e.g. "auto 1fr", "auto 1fr auto", "1fr 2fr 1fr".',
							'beplus-visual-mega-nav'
						)}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<InnerBlocks
					template={[['beplus-visual-mega-nav/beplus-navigation', {}]]}
					templateLock={false}
				/>
			</div>
		</>
	);
}
