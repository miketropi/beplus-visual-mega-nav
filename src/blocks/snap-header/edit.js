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
	const disableCustomColors = ! useSetting('color.custom');

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
					title={__('Mobile Breakpoint', 'snap-megamenu-builder')}
				>
					<SelectControl
						label={__('Breakpoint', 'snap-megamenu-builder')}
						value={mobileBreakpoint}
						options={[
							{
								label: __(
									'Mobile (600px)',
									'snap-megamenu-builder'
								),
								value: 600,
							},
							{
								label: __(
									'Tablet (782px)',
									'snap-megamenu-builder'
								),
								value: 782,
							},
							{
								label: __(
									'Desktop (1024px)',
									'snap-megamenu-builder'
								),
								value: 1024,
							},
							{
								label: __('Custom', 'snap-megamenu-builder'),
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
								'snap-megamenu-builder'
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
				<PanelBody title={__('Sticky', 'snap-megamenu-builder')}>
					<ToggleControl
						label={__('Sticky header', 'snap-megamenu-builder')}
						checked={sticky}
						onChange={(value) => setAttributes({ sticky: value })}
					/>
					{sticky && (
						<SelectControl
							label={__('Scroll effect', 'snap-megamenu-builder')}
							value={scrollEffect}
							options={[
								{
									label: __('None', 'snap-megamenu-builder'),
									value: 'none',
								},
								{
									label: __(
										'Shrink',
										'snap-megamenu-builder'
									),
									value: 'shrink',
								},
								{
									label: __(
										'Hide on scroll',
										'snap-megamenu-builder'
									),
									value: 'hide-on-scroll',
								},
								{
									label: __(
										'Background on scroll',
										'snap-megamenu-builder'
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
								'snap-megamenu-builder'
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
							'snap-megamenu-builder'
						)}
						checked={transparentTop}
						onChange={(value) =>
							setAttributes({ transparentTop: value })
						}
						help={__(
							'Header has no background when at the top of the page.',
							'snap-megamenu-builder'
						)}
					/>
				</PanelBody>
				<PanelBody
					title={__('Grid Columns', 'snap-megamenu-builder')}
					initialOpen={false}
				>
					<TextControl
						label={__(
							'Grid template columns',
							'snap-megamenu-builder'
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
							'snap-megamenu-builder'
						)}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<InnerBlocks
					template={[['snap-megamenu/snap-navigation', {}]]}
					templateLock={false}
				/>
			</div>
		</>
	);
}
