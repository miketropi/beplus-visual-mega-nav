/**
 * TemplatePanel — import from store/file, export current layout.
 *
 * @package Snap\MegaMenu
 */

import { useState, useEffect, useRef } from '@wordpress/element';
import {
	Button,
	Dropdown,
	Icon,
	Modal,
	Spinner,
} from '@wordpress/components';
import { chevronDown, closeSmall, download, layout, upload } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

import {
	buildExportPayload,
	downloadTemplate,
	fetchTemplate,
	fetchTemplates,
	getTemplateSourceLabel,
	parseImportFile,
} from '../utils/templates';

export default function TemplatePanel( {
	settings,
	content,
	onApplyTemplate,
	onNotice,
} ) {
	const [ templates, setTemplates ] = useState( [] );
	const [ loadingTemplates, setLoadingTemplates ] = useState( false );
	const [ applyingSlug, setApplyingSlug ] = useState( null );
	const [ confirmTemplate, setConfirmTemplate ] = useState( null );
	const fileInputRef = useRef( null );

	useEffect( () => {
		let cancelled = false;

		setLoadingTemplates( true );
		fetchTemplates()
			.then( ( list ) => {
				if ( ! cancelled ) {
					setTemplates( list );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					onNotice( {
						status: 'error',
						message: __(
							'Could not load templates.',
							'snap-megamenu-builder'
						),
					} );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setLoadingTemplates( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ onNotice ] );

	const handleExport = () => {
		const payload = buildExportPayload( { settings, content } );
		downloadTemplate( payload, payload.title );
		onNotice( {
			status: 'success',
			message: __(
				'Template exported. You can share this JSON file or add it to your theme.',
				'snap-megamenu-builder'
			),
		} );
	};

	const handleImportFile = async ( event ) => {
		const file = event.target.files?.[ 0 ];
		event.target.value = '';

		if ( ! file ) {
			return;
		}

		try {
			const imported = await parseImportFile( file );
			setConfirmTemplate( imported );
		} catch ( error ) {
			const message =
				error?.message === 'missing_content'
					? __(
							'The file does not contain valid block content.',
							'snap-megamenu-builder'
					  )
					: __(
							'Could not read that file. Choose a valid JSON template.',
							'snap-megamenu-builder'
					  );

			onNotice( { status: 'error', message } );
		}
	};

	const handleApplyStoreTemplate = async ( slug ) => {
		setApplyingSlug( slug );

		try {
			const template = await fetchTemplate( slug );
			setConfirmTemplate( template );
		} catch {
			onNotice( {
				status: 'error',
				message: __(
					'Could not load that template.',
					'snap-megamenu-builder'
				),
			} );
		} finally {
			setApplyingSlug( null );
		}
	};

	const handleConfirmApply = () => {
		if ( ! confirmTemplate ) {
			return;
		}

		onApplyTemplate( {
			settings: confirmTemplate.settings,
			content: confirmTemplate.content,
			title: confirmTemplate.title,
		} );

		setConfirmTemplate( null );

		onNotice( {
			status: 'success',
			message: __(
				'Template applied. Save to keep these changes.',
				'snap-megamenu-builder'
			),
		} );
	};

	return (
		<div className="snap-megamenu-template-panel">
			<input
				ref={ fileInputRef }
				type="file"
				accept="application/json,.json"
				className="snap-megamenu-template-panel__file-input"
				onChange={ handleImportFile }
			/>

			<Dropdown
				className="snap-megamenu-template-import-dropdown"
				contentClassName="snap-megamenu-template-import-dropdown__popover"
				popoverProps={ {
					placement: 'bottom-end',
					offset: 4,
					shift: true,
				} }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						className="snap-megamenu-template-import-dropdown__toggle"
						variant="secondary"
						icon={ upload }
						onClick={ onToggle }
						aria-expanded={ isOpen }
						isPressed={ isOpen }
					>
						<span className="snap-megamenu-template-import-dropdown__toggle-label">
							{ __( 'Import', 'snap-megamenu-builder' ) }
						</span>
						<Icon
							className="snap-megamenu-template-import-dropdown__chevron"
							icon={ chevronDown }
							size={ 18 }
						/>
					</Button>
				) }
				renderContent={ ( { onClose } ) => (
					<div className="snap-megamenu-template-import-dropdown__panel">
						<div className="snap-megamenu-template-import-dropdown__header">
							<h3 className="snap-megamenu-template-import-dropdown__title">
								{ __( 'Import template', 'snap-megamenu-builder' ) }
							</h3>
							<Button
								className="snap-megamenu-template-import-dropdown__close"
								icon={ closeSmall }
								label={ __( 'Close', 'snap-megamenu-builder' ) }
								onClick={ onClose }
								size="small"
							/>
						</div>

						<div className="snap-megamenu-template-import-dropdown__body">
							<section className="snap-megamenu-template-import-dropdown__section">
								<h4 className="snap-megamenu-template-import-dropdown__section-title">
									{ __(
										'Template store',
										'snap-megamenu-builder'
									) }
								</h4>
								<p className="snap-megamenu-template-import-dropdown__section-hint">
									{ __(
										'Built-in layouts from the plugin or your theme.',
										'snap-megamenu-builder'
									) }
								</p>

								{ loadingTemplates && (
									<div className="snap-megamenu-template-import-dropdown__loading">
										<Spinner />
									</div>
								) }

								{ ! loadingTemplates && templates.length === 0 && (
									<p className="snap-megamenu-template-import-dropdown__empty">
										{ __(
											'No templates found. Add JSON files to the plugin templates/ folder or your theme mega-menu-templates/ folder.',
											'snap-megamenu-builder'
										) }
									</p>
								) }

								{ ! loadingTemplates && templates.length > 0 && (
									<ul className="snap-megamenu-template-import-dropdown__list">
										{ templates.map( ( template ) => (
											<li key={ template.slug }>
												<button
													type="button"
													className="snap-megamenu-template-import-dropdown__item"
													onClick={ () => {
														onClose();
														handleApplyStoreTemplate(
															template.slug
														);
													} }
													disabled={ !! applyingSlug }
												>
													<span className="snap-megamenu-template-import-dropdown__item-icon">
														<Icon icon={ layout } size={ 20 } />
													</span>
													<span className="snap-megamenu-template-import-dropdown__item-body">
														<span className="snap-megamenu-template-import-dropdown__item-title">
															{ template.title }
														</span>
														{ template.description && (
															<span className="snap-megamenu-template-import-dropdown__item-description">
																{
																	template.description
																}
															</span>
														) }
													</span>
													<span
														className={ `snap-megamenu-template-import-dropdown__badge snap-megamenu-template-import-dropdown__badge--${ template.source }` }
													>
														{ getTemplateSourceLabel(
															template.source
														) }
													</span>
													{ applyingSlug ===
														template.slug && (
														<Spinner />
													) }
												</button>
											</li>
										) ) }
									</ul>
								) }
							</section>

							<section className="snap-megamenu-template-import-dropdown__section snap-megamenu-template-import-dropdown__section--file">
								<h4 className="snap-megamenu-template-import-dropdown__section-title">
									{ __( 'From file', 'snap-megamenu-builder' ) }
								</h4>
								<Button
									className="snap-megamenu-template-import-dropdown__upload"
									variant="secondary"
									icon={ upload }
									onClick={ () => {
										onClose();
										fileInputRef.current?.click();
									} }
								>
									{ __(
										'Upload JSON file…',
										'snap-megamenu-builder'
									) }
								</Button>
							</section>
						</div>
					</div>
				) }
			/>

			<Button variant="secondary" icon={ download } onClick={ handleExport }>
				{ __( 'Export', 'snap-megamenu-builder' ) }
			</Button>

			{ confirmTemplate && (
				<Modal
					title={ __(
						'Apply template?',
						'snap-megamenu-builder'
					) }
					onRequestClose={ () => setConfirmTemplate( null ) }
					className="snap-megamenu-template-confirm-modal"
				>
					<p>
						{ __(
							'This will replace the current content and settings in the builder. Unsaved changes will be lost.',
							'snap-megamenu-builder'
						) }
					</p>
					{ confirmTemplate.title && (
						<p className="snap-megamenu-template-confirm-modal__title">
							<strong>{ confirmTemplate.title }</strong>
						</p>
					) }
					{ confirmTemplate.description && (
						<p className="snap-megamenu-template-confirm-modal__description">
							{ confirmTemplate.description }
						</p>
					) }
					<div className="snap-megamenu-template-confirm-modal__actions">
						<Button
							variant="tertiary"
							onClick={ () => setConfirmTemplate( null ) }
						>
							{ __( 'Cancel', 'snap-megamenu-builder' ) }
						</Button>
						<Button variant="primary" onClick={ handleConfirmApply }>
							{ __( 'Apply template', 'snap-megamenu-builder' ) }
						</Button>
					</div>
				</Modal>
			) }
		</div>
	);
}
