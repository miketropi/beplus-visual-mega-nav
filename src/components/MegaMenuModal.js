/**
 * MegaMenuModal — full-screen modal with Settings and Builder tabs.
 *
 * @package Snap\MegaMenu
 */

import { useState, useEffect } from '@wordpress/element';
import { Modal, TabPanel, Button, Spinner, Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import SettingsPanel from './SettingsPanel';
import IsolatedEditor from './IsolatedEditor';
import TemplatePanel from './TemplatePanel';

const DEFAULT_SETTINGS = {
	width: 'full',
	customWidth: 1200,
	bgColor: '',
	animation: 'fade',
};

export default function MegaMenuModal( { menuItemId, onClose } ) {
	const [ enabled, setEnabled ] = useState( false );
	const [ settings, setSettings ] = useState( DEFAULT_SETTINGS );
	const [ content, setContent ] = useState( '' );
	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ notice, setNotice ] = useState( null );
	const [ contentRevision, setContentRevision ] = useState( 0 );

	useEffect( () => {
		setLoading( true );
		apiFetch( {
			path: `/snap-megamenu/v1/item/${ menuItemId }`,
		} )
			.then( ( data ) => {
				setEnabled( data.enabled || false );
				setSettings( { ...DEFAULT_SETTINGS, ...( data.settings || {} ) } );
				setContent( data.content || '' );
			} )
			.catch( () => {
				setNotice( {
					status: 'error',
					message: __(
						'Failed to load mega menu data.',
						'snap-megamenu-builder'
					),
				} );
			} )
			.finally( () => setLoading( false ) );
	}, [ menuItemId ] );

	const handleSave = async () => {
		setSaving( true );
		setNotice( null );

		try {
			await apiFetch( {
				path: `/snap-megamenu/v1/item/${ menuItemId }`,
				method: 'POST',
				data: { enabled, settings, content },
			} );

			setNotice( {
				status: 'success',
				message: __( 'Mega menu saved.', 'snap-megamenu-builder' ),
			} );

			setTimeout( onClose, 900 );
		} catch {
			setNotice( {
				status: 'error',
				message: __(
					'Failed to save. Please try again.',
					'snap-megamenu-builder'
				),
			} );
		} finally {
			setSaving( false );
		}
	};

	const handleApplyTemplate = ( { settings: templateSettings, content: templateContent } ) => {
		setSettings( { ...DEFAULT_SETTINGS, ...templateSettings } );
		setContent( templateContent );
		setContentRevision( ( revision ) => revision + 1 );
	};

	const headerActions = loading ? null : (
		<div className="snap-megamenu-modal__header-actions">
			<TemplatePanel
				settings={ settings }
				content={ content }
				onApplyTemplate={ handleApplyTemplate }
				onNotice={ setNotice }
			/>
			<span
				className="snap-megamenu-modal__header-divider"
				aria-hidden="true"
			/>
			<Button variant="tertiary" onClick={ onClose }>
				{ __( 'Cancel', 'snap-megamenu-builder' ) }
			</Button>
			<Button
				variant="primary"
				onClick={ handleSave }
				isBusy={ saving }
				disabled={ saving }
			>
				{ saving
					? __( 'Saving…', 'snap-megamenu-builder' )
					: __( 'Save', 'snap-megamenu-builder' ) }
			</Button>
		</div>
	);

	const tabs = [
		{
			name: 'settings',
			title: __( 'Settings', 'snap-megamenu-builder' ),
			className: 'snap-megamenu-tab-settings',
		},
		{
			name: 'builder',
			title: __( 'Content Builder', 'snap-megamenu-builder' ),
			className: 'snap-megamenu-tab-builder',
		},
	];

	return (
		<Modal
			title={ __( 'Mega Menu Builder', 'snap-megamenu-builder' ) }
			headerActions={ headerActions }
			onRequestClose={ onClose }
			isFullScreen={ true }
			className="snap-megamenu-modal"
		>
			{ loading ? (
				<div className="snap-megamenu-modal__loading">
					<Spinner />
					<p className="snap-megamenu-modal__loading-text">
						{ __(
							'Loading mega menu data…',
							'snap-megamenu-builder'
						) }
					</p>
				</div>
			) : (
				<div className="snap-megamenu-modal__shell admin-ui-page">
					<div className="snap-megamenu-modal__intro">
						<div className="snap-megamenu-modal__intro-text">
							<p className="admin-ui-page__header-subtitle">
								{ sprintf(
									/* translators: %s: menu item ID number */
									__(
										'Editing menu item #%s',
										'snap-megamenu-builder'
									),
									menuItemId
								) }
							</p>
							<p className="snap-megamenu-modal__intro-hint">
								{ enabled
									? __(
											'Changes apply to this menu item only.',
											'snap-megamenu-builder'
									  )
									: __(
											'Enable the mega menu to replace the default sub-menu.',
											'snap-megamenu-builder'
									  ) }
							</p>
						</div>
						<span
							className={
								enabled
									? 'snap-megamenu-status-pill snap-megamenu-status-pill--active'
									: 'snap-megamenu-status-pill'
							}
						>
							{ enabled
								? __( 'Enabled', 'snap-megamenu-builder' )
								: __( 'Disabled', 'snap-megamenu-builder' ) }
						</span>
					</div>

					{ notice && (
						<div className="snap-megamenu-modal__notice">
							<Notice
								status={ notice.status }
								isDismissible={ true }
								onDismiss={ () => setNotice( null ) }
							>
								{ notice.message }
							</Notice>
						</div>
					) }

					<TabPanel
						className="snap-megamenu-modal__tabs"
						tabs={ tabs }
					>
						{ ( tab ) => {
							if ( tab.name === 'settings' ) {
								return (
									<SettingsPanel
										enabled={ enabled }
										onEnabledChange={ setEnabled }
										settings={ settings }
										onSettingsChange={ setSettings }
									/>
								);
							}

							return (
								<IsolatedEditor
									key={ `${ menuItemId }-${ contentRevision }` }
									initialContent={ content }
									onChange={ setContent }
									disabled={ ! enabled }
								/>
							);
						} }
					</TabPanel>
				</div>
			) }
		</Modal>
	);
}
