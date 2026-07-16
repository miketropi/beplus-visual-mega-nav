/**
 * IsolatedEditor — standalone Gutenberg block editor.
 *
 * @package
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
import { SlotFillProvider, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { getAllowedBlocks } from '../utils/allowed-blocks';
import { getMergedEditorSettings } from '../utils/editor-settings';
import EditorListViewToggle from './EditorListViewToggle';
import EditorBlockInserterToggle from './EditorBlockInserterToggle';
import EditorUndoRedo from './EditorUndoRedo';

export default function IsolatedEditor({
	initialContent,
	onChange,
	disabled = false,
}) {
	const initialBlocks = useMemo(
		() => (initialContent ? parse(initialContent) : []),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	const { value, setValue, hasUndo, hasRedo, undo, redo } =
		useStateWithHistory(initialBlocks);

	const skipParentSync = useRef(true);

	useEffect(() => {
		if (skipParentSync.current) {
			skipParentSync.current = false;
			return;
		}

		if (onChange) {
			onChange(serialize(value));
		}
	}, [value, onChange]);

	const allowedBlockTypes = useMemo(() => getAllowedBlocks(), []);

	const editorSettings = useMemo(
		() =>
			getMergedEditorSettings({
				allowedBlockTypes,
				hasFixedToolbar: true,
				mediaUpload: ({ onFileChange, allowedTypes }) => {
					const frame = wp.media({
						title: __(
							'Select or Upload Media',
							'beplus-visual-mega-nav'
						),
						multiple: false,
						library: { type: allowedTypes },
					});

					frame.on('select', () => {
						const attachment = frame
							.state()
							.get('selection')
							.first()
							.toJSON();
						onFileChange([
							{
								id: attachment.id,
								url: attachment.url,
								alt: attachment.alt,
								caption: attachment.caption,
							},
						]);
					});

					frame.open();
				},
			}),
		[allowedBlockTypes]
	);

	const editorClass = disabled
		? 'beplus-vmn-isolated-editor beplus-vmn-isolated-editor--disabled'
		: 'beplus-vmn-isolated-editor';

	return (
		<div className={editorClass}>
			{disabled && (
				<Notice status="warning" isDismissible={false}>
					{__(
						'Enable the mega menu in Settings to show this content on the front end.',
						'beplus-visual-mega-nav'
					)}
				</Notice>
			)}

			<div className="beplus-vmn-isolated-editor__workspace">
				<SlotFillProvider>
					<BlockEditorProvider
						value={value}
						onInput={(newBlocks) => setValue(newBlocks, true)}
						onChange={(newBlocks) => setValue(newBlocks, false)}
						settings={editorSettings}
					>
						<BlockEditorKeyboardShortcuts.Register />

						<EditorStyles
							styles={editorSettings.styles}
							scope=".editor-styles-wrapper"
						/>

						<div className="beplus-vmn-editor-layout interface-interface-skeleton__editor">
							<div className="beplus-vmn-editor-toolbar">
								<div className="beplus-vmn-editor-toolbar__controls">
									<EditorUndoRedo
										hasUndo={hasUndo}
										hasRedo={hasRedo}
										onUndo={undo}
										onRedo={redo}
										disabled={disabled}
									/>
									<EditorBlockInserterToggle
										disabled={disabled}
									/>
									<EditorListViewToggle />
								</div>
								<div className="beplus-vmn-editor-toolbar__blocks">
									<BlockToolbar hideDragHandle />
								</div>
							</div>

							<div className="beplus-vmn-editor-main">
								<div className="beplus-vmn-editor-canvas">
									<WritingFlow className="editor-styles-wrapper">
										<ObserveTyping>
											<BlockList />
										</ObserveTyping>
									</WritingFlow>
								</div>

								<aside className="beplus-vmn-editor-sidebar interface-complementary-area">
									<div className="interface-complementary-area-header">
										<h2 className="interface-complementary-area-header__title">
											{__(
												'Block',
												'beplus-visual-mega-nav'
											)}
										</h2>
									</div>
									<div className="beplus-vmn-editor-sidebar__content">
										<BlockInspector />
									</div>
								</aside>
							</div>
						</div>
					</BlockEditorProvider>
				</SlotFillProvider>
			</div>
		</div>
	);
}
