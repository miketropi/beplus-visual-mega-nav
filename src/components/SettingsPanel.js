/**
 * SettingsPanel — mega menu configuration controls.
 *
 * @package
 */

import {
	ToggleControl,
	SelectControl,
	TextControl,
	Panel,
	PanelBody,
	PanelRow,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function SettingsPanel({
	enabled,
	onEnabledChange,
	settings,
	onSettingsChange,
}) {
	const update = (key, value) => {
		onSettingsChange({ ...settings, [key]: value });
	};

	const panelClass = enabled
		? 'beplus-vmn-settings-panel'
		: 'beplus-vmn-settings-panel beplus-vmn-settings-panel--disabled';

	return (
		<Panel className={panelClass}>
			<PanelBody
				title={__('General', 'beplus-visual-mega-nav')}
				initialOpen={true}
			>
				<PanelRow>
					<ToggleControl
						label={__('Enable Mega Menu', 'beplus-visual-mega-nav')}
						help={
							enabled
								? __(
										'Mega menu is active for this item.',
										'beplus-visual-mega-nav'
									)
								: __(
										'Default sub-menu will be used.',
										'beplus-visual-mega-nav'
									)
						}
						checked={enabled}
						onChange={onEnabledChange}
					/>
				</PanelRow>
			</PanelBody>

			<PanelBody
				title={__('Appearance & Layout', 'beplus-visual-mega-nav')}
				initialOpen={true}
			>
				<SelectControl
					label={__('Panel Width', 'beplus-visual-mega-nav')}
					value={settings.width === 'custom' ? 'custom' : 'full'}
					options={[
						{
							label: __(
								'Fixed / Custom Width',
								'beplus-visual-mega-nav'
							),
							value: 'custom',
						},
						{
							label: __(
								'Full Width (100%)',
								'beplus-visual-mega-nav'
							),
							value: 'full',
						},
					]}
					onChange={(val) => update('width', val)}
					disabled={!enabled}
				/>

				{settings.width === 'custom' && (
					<>
						<TextControl
							label={__(
								'Custom Width (px)',
								'beplus-visual-mega-nav'
							)}
							type="number"
							min={200}
							max={2400}
							step={10}
							value={settings.customWidth || 780}
							onChange={(val) =>
								update('customWidth', parseInt(val, 10) || 780)
							}
							disabled={!enabled}
						/>

						<SelectControl
							label={__(
								'Panel Position',
								'beplus-visual-mega-nav'
							)}
							value={settings.position || 'item-left'}
							options={[
								{
									label: __(
										'Center of Screen',
										'beplus-visual-mega-nav'
									),
									value: 'screen-center',
								},
								{
									label: __(
										'Left Aligned with Menu Item',
										'beplus-visual-mega-nav'
									),
									value: 'item-left',
								},
								{
									label: __(
										'Centered with Menu Item',
										'beplus-visual-mega-nav'
									),
									value: 'item-center',
								},
							]}
							onChange={(val) => update('position', val)}
							disabled={!enabled}
						/>
					</>
				)}

				<SelectControl
					label={__('Open Animation', 'beplus-visual-mega-nav')}
					value={settings.animation || 'fade'}
					options={[
						{
							label: __('Fade', 'beplus-visual-mega-nav'),
							value: 'fade',
						},
						{
							label: __('Slide Down', 'beplus-visual-mega-nav'),
							value: 'slide',
						},
						{
							label: __('None', 'beplus-visual-mega-nav'),
							value: 'none',
						},
					]}
					onChange={(val) => update('animation', val)}
					disabled={!enabled}
				/>
			</PanelBody>
		</Panel>
	);
}
