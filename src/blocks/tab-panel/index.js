/**
 * Tab Panel block — registration.
 *
 * @package
 */

import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import metadata from '../../../blocks/tab-panel/block.json';
import Edit from './edit';

import '../../../blocks/tab-panel/editor.css';

registerBlockType(metadata.name, {
	...metadata,
	edit: Edit,
	save: () => <InnerBlocks.Content />,
});
