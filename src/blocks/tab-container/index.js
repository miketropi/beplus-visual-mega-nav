/**
 * Tab Container block — registration.
 *
 * @package
 */

import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import metadata from '../../../blocks/tab-container/block.json';
import Edit from './edit';

import '../../../blocks/tab-container/style.css';
import '../../../blocks/tab-container/editor.css';

registerBlockType(metadata.name, {
	...metadata,
	edit: Edit,
	save: () => <InnerBlocks.Content />,
});
