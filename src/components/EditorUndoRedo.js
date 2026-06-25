/**
 * EditorUndoRedo — undo/redo toolbar controls for the Content Builder.
 *
 * @package
 */

import { useCallback } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { useKeyboardShortcut } from '@wordpress/compose';
import { isAppleOS } from '@wordpress/keycodes';
import { redo, undo } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

function isEditingTextField() {
	const element = document.activeElement;

	if (!element) {
		return false;
	}

	if (
		element.isContentEditable ||
		element.tagName === 'INPUT' ||
		element.tagName === 'TEXTAREA'
	) {
		return true;
	}

	return !!element.closest('[contenteditable="true"]');
}

export default function EditorUndoRedo({
	hasUndo,
	hasRedo,
	onUndo,
	onRedo,
	disabled = false,
}) {
	const handleUndo = useCallback(() => {
		if (hasUndo && !disabled) {
			onUndo();
		}
	}, [disabled, hasUndo, onUndo]);

	const handleRedo = useCallback(() => {
		if (hasRedo && !disabled) {
			onRedo();
		}
	}, [disabled, hasRedo, onRedo]);

	useKeyboardShortcut(
		isAppleOS() ? 'meta+z' : 'ctrl+z',
		(event) => {
			if (isEditingTextField()) {
				return;
			}

			event.preventDefault();
			handleUndo();
		},
		{
			bindGlobal: true,
			isDisabled: disabled || !hasUndo,
		}
	);

	useKeyboardShortcut(
		isAppleOS() ? 'meta+shift+z' : 'ctrl+shift+z',
		(event) => {
			if (isEditingTextField()) {
				return;
			}

			event.preventDefault();
			handleRedo();
		},
		{
			bindGlobal: true,
			isDisabled: disabled || !hasRedo,
		}
	);

	useKeyboardShortcut(
		'ctrl+y',
		(event) => {
			if (isEditingTextField()) {
				return;
			}

			event.preventDefault();
			handleRedo();
		},
		{
			bindGlobal: true,
			isDisabled: disabled || !hasRedo || isAppleOS(),
		}
	);

	return (
		<div className="snap-megamenu-editor-undo-redo">
			<Button
				className="snap-megamenu-editor-undo-redo__button"
				icon={undo}
				label={__('Undo', 'snap-megamenu-builder')}
				onClick={handleUndo}
				disabled={disabled || !hasUndo}
				showTooltip
			/>
			<Button
				className="snap-megamenu-editor-undo-redo__button"
				icon={redo}
				label={__('Redo', 'snap-megamenu-builder')}
				onClick={handleRedo}
				disabled={disabled || !hasRedo}
				showTooltip
			/>
		</div>
	);
}
