import { useEffect } from '@wordpress/element';
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function Edit({ attributes, setAttributes, context }) {
	const { overlayId, layout, style } = attributes;
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
		<div {...blockProps}>
			<InnerBlocks
				template={[
					['beplus-visual-mega-nav/nav-menu-area', {}],
					['beplus-visual-mega-nav/nav-toggle', {}],
				]}
				templateLock={false}
			/>
		</div>
	);
}
