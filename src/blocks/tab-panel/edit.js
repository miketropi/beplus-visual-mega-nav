/**
 * Tab Panel block — editor UI.
 *
 * @package
 */

import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, setAttributes }) {
	const { tabLabel } = attributes;
	const blockProps = useBlockProps({
		className: 'beplus-vmn-tab-panel',
	});

	return (
		<div {...blockProps}>
			<div className="beplus-vmn-tab-panel__header">
				<TextControl
					label={__('Tab Label', 'beplus-visual-mega-nav')}
					value={tabLabel}
					onChange={(value) => setAttributes({ tabLabel: value })}
					placeholder={__(
						'Tab button text (e.g. Overview)',
						'beplus-visual-mega-nav'
					)}
					__nextHasNoMarginBottom
				/>
			</div>
			<div className="beplus-vmn-tab-panel__content">
				<InnerBlocks
					allowedBlocks={true}
					template={[
						[
							'core/heading',
							{
								level: 3,
								placeholder: __(
									'Tab heading',
									'beplus-visual-mega-nav'
								),
							},
						],
					]}
					templateLock={false}
				/>
			</div>
		</div>
	);
}
