/**
 * Menu Item block registration.
 *
 * @package
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from '../../../blocks/menu-item/block.json';
import Edit from './edit';

import '../../../blocks/menu-item/style.css';
import '../../../blocks/menu-item/editor.css';

registerBlockType(metadata.name, {
	...metadata,
	edit: Edit,
	save: () => null,
});
