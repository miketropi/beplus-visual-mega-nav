/**
 * IsolatedEditor — standalone Gutenberg block editor.
 *
 * @package Snap\MegaMenu
 */

import { useEffect, useMemo, useRef } from '@wordpress/element';
import { useStateWithHistory } from '@wordpress/compose';
import {
	BlockEditorProvider,
	BlockList,
	BlockInspector,
	BlockToolbar,
	WritingFlow,
	ObserveTyping,
	BlockEditorKeyboardShortcuts,
	__unstableEditorStyles as EditorStyles,
} from '@wordpress/block-editor';
import { serialize, parse } from '@wordpress/blocks';
import { SlotFillProvider, Popover, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { ALLOWED_BLOCKS } from '../utils/allowed-blocks';
import { getMergedEditorSettings } from '../utils/editor-settings';
import EditorListViewToggle from './EditorListViewToggle';
import EditorUndoRedo from './EditorUndoRedo';

export default function IsolatedEditor( {
	initialContent,
	onChange,
	disabled = false,
} ) {
	const initialBlocks = useMemo(
		() => ( initialContent ? parse( initialContent ) : [] ),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	const { value, setValue, hasUndo, hasRedo, undo, redo } =
		useStateWithHistory( initialBlocks );

	const skipParentSync = useRef( true );

	useEffect( () => {
		if ( skipParentSync.current ) {
			skipParentSync.current = false;
			return;
		}

		if ( onChange ) {
			onChange( serialize( value ) );
		}
	}, [ value, onChange ] );

	const editorSettings = useMemo(
		() =>
			getMergedEditorSettings( {
				allowedBlockTypes: ALLOWED_BLOCKS,
				hasFixedToolbar: true,
				mediaUpload: ( { onFileChange, allowedTypes } ) => {
					const frame = wp.media( {
						title: __(
							'Select or Upload Media',
							'snap-megamenu-builder'
						),
						multiple: false,
						library: { type: allowedTypes },
					} );

					frame.on( 'select', () => {
						const attachment = frame
							.state()
							.get( 'selection' )
							.first()
							.toJSON();
						onFileChange( [
							{
								id: attachment.id,
								url: attachment.url,
								alt: attachment.alt,
								caption: attachment.caption,
							},
						] );
					} );

					frame.open();
				},
			} ),
		[]
	);

	const editorClass = disabled
		? 'snap-megamenu-isolated-editor snap-megamenu-isolated-editor--disabled'
		: 'snap-megamenu-isolated-editor';

	return (
		<div className={ editorClass }>
			{ disabled && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'Enable the mega menu in Settings to show this content on the front end.',
						'snap-megamenu-builder'
					) }
				</Notice>
			) }

			<div className="snap-megamenu-isolated-editor__workspace">
				<SlotFillProvider>
					<BlockEditorProvider
						value={ value }
						onInput={ ( newBlocks ) => setValue( newBlocks, true ) }
						onChange={ ( newBlocks ) =>
							setValue( newBlocks, false )
						}
						settings={ editorSettings }
					>
						<BlockEditorKeyboardShortcuts.Register />

						<EditorStyles
							styles={ editorSettings.styles }
							scope=".editor-styles-wrapper"
						/>

						<div className="snap-megamenu-editor-layout interface-interface-skeleton__editor">
							<div className="snap-megamenu-editor-toolbar">
								<div className="snap-megamenu-editor-toolbar__controls">
									<EditorUndoRedo
										hasUndo={ hasUndo }
										hasRedo={ hasRedo }
										onUndo={ undo }
										onRedo={ redo }
										disabled={ disabled }
									/>
									<EditorListViewToggle />
								</div>
								<div className="snap-megamenu-editor-toolbar__blocks">
									<BlockToolbar hideDragHandle />
								</div>
							</div>

							<div className="snap-megamenu-editor-main">
								<div className="snap-megamenu-editor-canvas">
									<WritingFlow className="editor-styles-wrapper">
										<ObserveTyping>
											<BlockList />
										</ObserveTyping>
									</WritingFlow>
								</div>

								<aside className="snap-megamenu-editor-sidebar interface-complementary-area">
									<div className="interface-complementary-area-header">
										<h2 className="interface-complementary-area-header__title">
											{ __(
												'Block',
												'snap-megamenu-builder'
											) }
										</h2>
									</div>
									<div className="snap-megamenu-editor-sidebar__content">
										<BlockInspector />
									</div>
								</aside>
							</div>
						</div>
					</BlockEditorProvider>
					<Popover.Slot />
				</SlotFillProvider>
			</div>
		</div>
	);
}
