/**
 * Menu List block registration.
 *
 * @package
 */

import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import metadata from '../../../blocks/menu-list/block.json';
import Edit from './edit';

import '../../../blocks/menu-list/style.css';
import '../../../blocks/menu-list/editor.css';

registerBlockType(metadata.name, {
	...metadata,
	edit: Edit,
	save: () => <InnerBlocks.Content />,
});
