import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, setAttributes, context }) {
	const { iconStyle, label, labelVisible } = attributes;
	const overlayId = context['snap-megamenu/overlayId'] || '';

	const blockProps = useBlockProps({
		className: 'is-mobile-only snap-nav-toggle-preview',
	});

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Toggle Settings', 'snap-megamenu-builder')}
				>
					<SelectControl
						label={__('Icon style', 'snap-megamenu-builder')}
						value={iconStyle}
						options={[
							{
								label: __('3 lines', 'snap-megamenu-builder'),
								value: 'lines-3',
							},
							{
								label: __('2 lines', 'snap-megamenu-builder'),
								value: 'lines-2',
							},
						]}
						onChange={(value) =>
							setAttributes({ iconStyle: value })
						}
					/>
					<ToggleControl
						label={__('Show label', 'snap-megamenu-builder')}
						checked={labelVisible}
						onChange={(value) =>
							setAttributes({ labelVisible: value })
						}
					/>
					{labelVisible && (
						<TextControl
							label={__('Label', 'snap-megamenu-builder')}
							value={label}
							onChange={(value) =>
								setAttributes({ label: value })
							}
							placeholder={__('Menu', 'snap-megamenu-builder')}
						/>
					)}
				</PanelBody>
			</InspectorControls>
			<button
				type="button"
				{...blockProps}
				aria-expanded="false"
				aria-controls={overlayId || undefined}
				aria-label={label || __('Open menu', 'snap-megamenu-builder')}
			>
				<span
					className={`snap-nav-toggle__icon snap-nav-toggle__icon--${iconStyle}`}
					aria-hidden="true"
				>
					<span></span>
					<span></span>
					<span></span>
				</span>
				{labelVisible && label && (
					<span className="snap-nav-toggle__label">{label}</span>
				)}
			</button>
		</>
	);
}
