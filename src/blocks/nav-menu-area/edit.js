import { useSelect } from '@wordpress/data';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { SelectControl, Notice, PanelBody } from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, setAttributes }) {
	const { menuId } = attributes;
	const blockProps = useBlockProps();

	const menus = useSelect((select) => {
		const { getEntityRecords } = select('core');
		return getEntityRecords('root', 'menu', { per_page: 100 }) || [];
	}, []);

	const menuOptions = [
		{ label: __('— Select a menu —', 'snap-megamenu-builder'), value: 0 },
		...menus.map((menu) => ({
			label: menu.name,
			value: menu.id,
		})),
	];

	if (menus.length === 0) {
		return (
			<div {...blockProps}>
				<Notice status="warning" isDismissible={false}>
					{__(
						'No menus found. Create one in Appearance → Menus.',
						'snap-megamenu-builder'
					)}
				</Notice>
			</div>
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Menu Settings', 'snap-megamenu-builder')}>
					<SelectControl
						label={__('Select menu', 'snap-megamenu-builder')}
						value={menuId}
						options={menuOptions}
						onChange={(value) =>
							setAttributes({ menuId: parseInt(value, 10) })
						}
					/>
				</PanelBody>
			</InspectorControls>
			<div {...blockProps}>
				{menuId > 0 ? (
					<ServerSideRender
						block="snap-megamenu/nav-menu-area"
						attributes={attributes}
					/>
				) : (
					<Notice status="info" isDismissible={false}>
						{__(
							'Select a menu to display.',
							'snap-megamenu-builder'
						)}
					</Notice>
				)}
			</div>
		</>
	);
}
