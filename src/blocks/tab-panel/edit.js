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
		className: 'snap-megamenu-tab-panel',
	});

	return (
		<div {...blockProps}>
			<div className="snap-megamenu-tab-panel__header">
				<TextControl
					label={__('Tab Label', 'snap-megamenu-builder')}
					value={tabLabel}
					onChange={(value) => setAttributes({ tabLabel: value })}
					placeholder={__(
						'Tab button text (e.g. Overview)',
						'snap-megamenu-builder'
					)}
					__nextHasNoMarginBottom
				/>
			</div>
			<div className="snap-megamenu-tab-panel__content">
				<InnerBlocks
					allowedBlocks={true}
					template={[
						[
							'core/heading',
							{
								level: 3,
								placeholder: __(
									'Tab heading',
									'snap-megamenu-builder'
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
