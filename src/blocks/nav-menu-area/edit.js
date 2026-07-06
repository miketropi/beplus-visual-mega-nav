import { useState, useEffect } from '@wordpress/element';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	SelectControl,
	Notice,
	PanelBody,
	Spinner,
} from '@wordpress/components';
import ServerSideRender from '@wordpress/server-side-render';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, setAttributes }) {
	const { menuId } = attributes;
	const blockProps = useBlockProps();

	const [menus, setMenus] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		setIsLoading(true);
		setError(null);

		apiFetch({ path: '/wp/v2/menus' })
			.then((data) => {
				setMenus(Array.isArray(data) ? data : []);
			})
			.catch(() => {
				setError(
					__(
						'Unable to load menus. Check that the REST API is available.',
						'beplus-visual-mega-nav'
					)
				);
				setMenus([]);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	if (isLoading) {
		return (
			<div {...blockProps}>
				<div className="beplus-vmn-menu-area-loading">
					<Spinner />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div {...blockProps}>
				<Notice status="error" isDismissible={false}>
					{error}
				</Notice>
			</div>
		);
	}

	if (menus.length === 0) {
		return (
			<div {...blockProps}>
				<Notice status="warning" isDismissible={false}>
					{__(
						'No menus found. Create one in Appearance → Menus.',
						'beplus-visual-mega-nav'
					)}
				</Notice>
			</div>
		);
	}

	const menuOptions = [
		{ label: __('— Select a menu —', 'beplus-visual-mega-nav'), value: 0 },
		...menus.map((menu) => ({
			label: menu.name,
			value: menu.id,
		})),
	];

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Menu Settings', 'beplus-visual-mega-nav')}
				>
					<SelectControl
						label={__('Select menu', 'beplus-visual-mega-nav')}
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
						block="beplus-visual-mega-nav/nav-menu-area"
						attributes={attributes}
					/>
				) : (
					<Notice status="info" isDismissible={false}>
						{__(
							'Select a menu to display.',
							'beplus-visual-mega-nav'
						)}
					</Notice>
				)}
			</div>
		</>
	);
}
