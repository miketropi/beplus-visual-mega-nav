/**
 * SettingsPanel — mega menu configuration controls.
 *
 * @package Snap\MegaMenu
 */

import {
	ToggleControl,
	SelectControl,
	Panel,
	PanelBody,
	PanelRow,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function SettingsPanel( {
	enabled,
	onEnabledChange,
	settings,
	onSettingsChange,
} ) {
	const update = ( key, value ) => {
		onSettingsChange( { ...settings, [ key ]: value } );
	};

	const panelClass = enabled
		? 'snap-megamenu-settings-panel'
		: 'snap-megamenu-settings-panel snap-megamenu-settings-panel--disabled';

	return (
		<Panel className={ panelClass }>
			<PanelBody
				title={ __( 'General', 'snap-megamenu-builder' ) }
				initialOpen={ true }
			>
				<PanelRow>
					<ToggleControl
						label={ __(
							'Enable Mega Menu',
							'snap-megamenu-builder'
						) }
						help={
							enabled
								? __(
										'Mega menu is active for this item.',
										'snap-megamenu-builder'
								  )
								: __(
										'Default sub-menu will be used.',
										'snap-megamenu-builder'
								  )
						}
						checked={ enabled }
						onChange={ onEnabledChange }
					/>
				</PanelRow>
			</PanelBody>

			<PanelBody
				title={ __( 'Appearance', 'snap-megamenu-builder' ) }
				initialOpen={ false }
			>
				<SelectControl
					label={ __( 'Open Animation', 'snap-megamenu-builder' ) }
					value={ settings.animation }
					options={ [
						{
							label: __( 'Fade', 'snap-megamenu-builder' ),
							value: 'fade',
						},
						{
							label: __( 'Slide Down', 'snap-megamenu-builder' ),
							value: 'slide',
						},
						{
							label: __( 'None', 'snap-megamenu-builder' ),
							value: 'none',
						},
					] }
					onChange={ ( val ) => update( 'animation', val ) }
					disabled={ ! enabled }
				/>
			</PanelBody>
		</Panel>
	);
}
