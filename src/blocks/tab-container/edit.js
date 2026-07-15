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

const ALLOWED_BLOCKS = ['beplus-visual-mega-nav/tab-panel'];

export default function Edit({ attributes, setAttributes, clientId }) {
	const { layoutMode = 'vertical', indicatorColor = '' } = attributes;

	const isHorizontal = layoutMode === 'horizontal';
	const blockProps = useBlockProps({
		className:
			'beplus-vmn-tab-container beplus-vmn-tab-container--' + layoutMode,
		style: indicatorColor
			? {
					'--beplus-vmn-tab-text-color': indicatorColor,
					'--beplus-vmn-tab-indicator-color': indicatorColor,
				}
			: undefined,
	});

	const innerBlocks = useSelect(
		(select) => select('core/block-editor').getBlocks(clientId),
		[clientId]
	);

	const tabPanels = innerBlocks.filter(
		(block) => block.name === 'beplus-visual-mega-nav/tab-panel'
	);

	const tabLabels = tabPanels.map(
		(block) => block.attributes?.tabLabel || ''
	);

	const renderTabs = () => {
		if (tabPanels.length === 0) {
			return (
				<div className="beplus-vmn-tab-container__placeholder-tabs">
					<span className="beplus-vmn-tab-container__tab is-placeholder">
						{__('Tab 1', 'beplus-visual-mega-nav')}
					</span>
					<span className="beplus-vmn-tab-container__tab is-placeholder">
						{__('Tab 2', 'beplus-visual-mega-nav')}
					</span>
					<span className="beplus-vmn-tab-container__tab is-placeholder">
						{__('Tab 3', 'beplus-visual-mega-nav')}
					</span>
				</div>
			);
		}

		return tabLabels.map((label, i) => (
			<span
				key={i}
				className={`beplus-vmn-tab-container__tab${
					i === 0 ? ' is-active' : ''
				}`}
			>
				{label || __('Untitled', 'beplus-visual-mega-nav')}
			</span>
		));
	};

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={__('Layout', 'beplus-visual-mega-nav')}
					initialOpen={true}
				>
					<SelectControl
						label={__('Navigation mode', 'beplus-visual-mega-nav')}
						value={layoutMode}
						options={[
							{
								label: __(
									'Vertical — sidebar on the left',
									'beplus-visual-mega-nav'
								),
								value: 'vertical',
							},
							{
								label: __(
									'Horizontal — tabs across the top',
									'beplus-visual-mega-nav'
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
					title={__('Color', 'beplus-visual-mega-nav')}
					initialOpen={false}
				>
					<ColorPalette
						label={__('Indicator accent', 'beplus-visual-mega-nav')}
						value={indicatorColor}
						onChange={(value) =>
							setAttributes({ indicatorColor: value || '' })
						}
						clearable={true}
					/>
					<p className="components-base-control__help">
						{__(
							'Color of the sliding edge bar. Leave empty to use the theme primary color.',
							'beplus-visual-mega-nav'
						)}
					</p>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				{isHorizontal ? (
					<div className="beplus-vmn-tab-container__tablist">
						<span
							className="beplus-vmn-tab-container__indicator"
							aria-hidden="true"
						/>
						{renderTabs()}
					</div>
				) : (
					<div className="beplus-vmn-tab-container__sidebar">
						<div className="beplus-vmn-tab-container__tablist">
							<span
								className="beplus-vmn-tab-container__indicator"
								aria-hidden="true"
							/>
							{renderTabs()}
						</div>
					</div>
				)}
				<div className="beplus-vmn-tab-container__content">
					<InnerBlocks
						allowedBlocks={ALLOWED_BLOCKS}
						template={[
							[
								'beplus-visual-mega-nav/tab-panel',
								{
									tabLabel: __(
										'Tab 1',
										'beplus-visual-mega-nav'
									),
								},
							],
							[
								'beplus-visual-mega-nav/tab-panel',
								{
									tabLabel: __(
										'Tab 2',
										'beplus-visual-mega-nav'
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
