import { useEffect } from '@wordpress/element';
import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
import {
	PanelBody,
	__experimentalNumberControl as NumberControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, setAttributes, context }) {
	const { overlayId, mobileBreakpoint, layout, style } = attributes;
	const instanceId = context['beplus-visual-mega-nav/instanceId'] || '';

	useEffect(() => {
		if (!overlayId && instanceId) {
			setAttributes({ overlayId: `overlay-${instanceId}` });
		}
	}, [overlayId, instanceId, setAttributes]);

	// Build inline flex style from layout attribute (matches server render).
	const flexStyle = {
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'wrap',
	};
	if (layout) {
		if (layout.orientation === 'vertical') {
			flexStyle.flexDirection = 'column';
		}
		if (layout.flexWrap) {
			flexStyle.flexWrap = layout.flexWrap;
		}
		if (layout.justifyContent) {
			flexStyle.justifyContent = layout.justifyContent;
		} else {
			flexStyle.justifyContent = 'right';
		}
		if (layout.verticalAlignment) {
			const alignMap = {
				top: 'flex-start',
				center: 'center',
				bottom: 'flex-end',
			};
			flexStyle.alignItems =
				alignMap[layout.verticalAlignment] || layout.verticalAlignment;
		}
	} else {
		flexStyle.justifyContent = 'right';
	}

	// Resolve WordPress preset reference ("var:preset|spacing|50") to CSS var().
	const resolvePreset = (value) => {
		if (typeof value === 'string' && value.startsWith('var:preset|')) {
			const [, cat, slug] = value.split('|');
			if (cat && slug) {
				return `var(--wp--preset--${cat}--${slug})`;
			}
		}
		return value;
	};

	// Merge spacing (padding per-side) from style attribute.
	if (style && style.spacing) {
		const { padding, blockGap } = style.spacing;
		if (padding) {
			if (padding.top) {
				flexStyle.paddingTop = resolvePreset(padding.top);
			}
			if (padding.right) {
				flexStyle.paddingRight = resolvePreset(padding.right);
			}
			if (padding.bottom) {
				flexStyle.paddingBottom = resolvePreset(padding.bottom);
			}
			if (padding.left) {
				flexStyle.paddingLeft = resolvePreset(padding.left);
			}
		}
		if (blockGap) {
			flexStyle.gap = resolvePreset(blockGap);
		}
	}

	const blockProps = useBlockProps({ style: flexStyle });

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Mobile Breakpoint', 'beplus-visual-mega-nav')}
				>
					<NumberControl
						label={__('Breakpoint (px)', 'beplus-visual-mega-nav')}
						value={mobileBreakpoint}
						onChange={(value) =>
							setAttributes({
								mobileBreakpoint: parseInt(value, 10) || 782,
							})
						}
						min={320}
						max={1200}
						step={1}
						help={__(
							'Viewport width below which the mobile toggle and portal activate.',
							'beplus-visual-mega-nav'
						)}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				<InnerBlocks
					template={[
						['beplus-visual-mega-nav/nav-menu-area', {}],
						['beplus-visual-mega-nav/nav-toggle', {}],
					]}
					templateLock={false}
				/>
			</div>
		</>
	);
}
