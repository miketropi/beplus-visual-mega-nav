/**
 * SettingsPanel — mega menu configuration controls.
 *
 * @package
 */

import {
	ToggleControl,
	SelectControl,
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
				title={__('Appearance', 'beplus-visual-mega-nav')}
				initialOpen={false}
			>
				<SelectControl
					label={__('Open Animation', 'beplus-visual-mega-nav')}
					value={settings.animation}
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
