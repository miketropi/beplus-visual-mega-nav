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
	const overlayId = context['beplus-visual-mega-nav/overlayId'] || '';

	const blockProps = useBlockProps({
		className: 'is-mobile-only beplus-nav-toggle-preview',
	});

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Toggle Settings', 'beplus-visual-mega-nav')}
				>
					<SelectControl
						label={__('Icon style', 'beplus-visual-mega-nav')}
						value={iconStyle}
						options={[
							{
								label: __('3 lines', 'beplus-visual-mega-nav'),
								value: 'lines-3',
							},
							{
								label: __('2 lines', 'beplus-visual-mega-nav'),
								value: 'lines-2',
							},
						]}
						onChange={(value) =>
							setAttributes({ iconStyle: value })
						}
					/>
					<ToggleControl
						label={__('Show label', 'beplus-visual-mega-nav')}
						checked={labelVisible}
						onChange={(value) =>
							setAttributes({ labelVisible: value })
						}
					/>
					{labelVisible && (
						<TextControl
							label={__('Label', 'beplus-visual-mega-nav')}
							value={label}
							onChange={(value) =>
								setAttributes({ label: value })
							}
							placeholder={__('Menu', 'beplus-visual-mega-nav')}
						/>
					)}
				</PanelBody>
			</InspectorControls>
			<button
				type="button"
				{...blockProps}
				aria-expanded="false"
				aria-controls={overlayId || undefined}
				aria-label={label || __('Open menu', 'beplus-visual-mega-nav')}
			>
				<span
					className={`beplus-nav-toggle__icon beplus-nav-toggle__icon--${iconStyle}`}
					aria-hidden="true"
				>
					<span></span>
					<span></span>
					<span></span>
				</span>
				{labelVisible && label && (
					<span className="beplus-nav-toggle__label">{label}</span>
				)}
			</button>
		</>
	);
}
