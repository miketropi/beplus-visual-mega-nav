/**
 * Tab Container block — editor UI.
 *
 * Single inspector: layout mode (vertical/horizontal) + accent indicator color.
 * Text and divider colors follow the active theme automatically.
 *
 * @package
 */

import { useSelect } from '@wordpress/data';
import {
	InnerBlocks,
	useBlockProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, ColorPalette } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const ALLOWED_BLOCKS = ['snap-megamenu/tab-panel'];

export default function Edit({ attributes, setAttributes, clientId }) {
	const { layoutMode = 'vertical', indicatorColor = '' } = attributes;

	const isHorizontal = layoutMode === 'horizontal';
	const blockProps = useBlockProps({
		className:
			'snap-megamenu-tab-container snap-megamenu-tab-container--' +
			layoutMode,
		style: indicatorColor
			? {
					'--snap-mm-tab-text-color': indicatorColor,
					'--snap-mm-tab-indicator-color': indicatorColor,
				}
			: undefined,
	});

	const innerBlocks = useSelect(
		(select) => select('core/block-editor').getBlocks(clientId),
		[clientId]
	);

	const tabPanels = innerBlocks.filter(
		(block) => block.name === 'snap-megamenu/tab-panel'
	);

	const tabLabels = tabPanels.map(
		(block) => block.attributes?.tabLabel || ''
	);

	const renderTabs = () => {
		if (tabPanels.length === 0) {
			return (
				<div className="snap-megamenu-tab-container__placeholder-tabs">
					<span className="snap-megamenu-tab-container__tab is-placeholder">
						{__('Tab 1', 'snap-megamenu-builder')}
					</span>
					<span className="snap-megamenu-tab-container__tab is-placeholder">
						{__('Tab 2', 'snap-megamenu-builder')}
					</span>
					<span className="snap-megamenu-tab-container__tab is-placeholder">
						{__('Tab 3', 'snap-megamenu-builder')}
					</span>
				</div>
			);
		}

		return tabLabels.map((label, i) => (
			<span
				key={i}
				className={`snap-megamenu-tab-container__tab${
					i === 0 ? ' is-active' : ''
				}`}
			>
				{label || __('Untitled', 'snap-megamenu-builder')}
			</span>
		));
	};

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Layout', 'snap-megamenu-builder')}
					initialOpen={true}
				>
					<SelectControl
						label={__('Navigation mode', 'snap-megamenu-builder')}
						value={layoutMode}
						options={[
							{
								label: __(
									'Vertical — sidebar on the left',
									'snap-megamenu-builder'
								),
								value: 'vertical',
							},
							{
								label: __(
									'Horizontal — tabs across the top',
									'snap-megamenu-builder'
								),
								value: 'horizontal',
							},
						]}
						onChange={(value) =>
							setAttributes({ layoutMode: value })
						}
					/>
				</PanelBody>

				<PanelBody
					title={__('Color', 'snap-megamenu-builder')}
					initialOpen={false}
				>
					<ColorPalette
						label={__('Indicator accent', 'snap-megamenu-builder')}
						value={indicatorColor}
						onChange={(value) =>
							setAttributes({ indicatorColor: value || '' })
						}
						clearable={true}
					/>
					<p className="components-base-control__help">
						{__(
							'Color of the sliding edge bar. Leave empty to use the theme primary color.',
							'snap-megamenu-builder'
						)}
					</p>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				{isHorizontal ? (
					<div className="snap-megamenu-tab-container__tablist">
						<span
							className="snap-megamenu-tab-container__indicator"
							aria-hidden="true"
						/>
						{renderTabs()}
					</div>
				) : (
					<div className="snap-megamenu-tab-container__sidebar">
						<div className="snap-megamenu-tab-container__tablist">
							<span
								className="snap-megamenu-tab-container__indicator"
								aria-hidden="true"
							/>
							{renderTabs()}
						</div>
					</div>
				)}
				<div className="snap-megamenu-tab-container__content">
					<InnerBlocks
						allowedBlocks={ALLOWED_BLOCKS}
						template={[
							[
								'snap-megamenu/tab-panel',
								{
									tabLabel: __(
										'Tab 1',
										'snap-megamenu-builder'
									),
								},
							],
							[
								'snap-megamenu/tab-panel',
								{
									tabLabel: __(
										'Tab 2',
										'snap-megamenu-builder'
									),
								},
							],
						]}
					/>
				</div>
			</div>
		</>
	);
}
