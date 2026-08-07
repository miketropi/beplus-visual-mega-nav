/**
 * Blog List block — client registration.
 *
 * @package
 */

import { registerBlockType } from '@wordpress/blocks';
import metadata from '../../../blocks/blog-list/block.json';
import Edit from './edit';

import '../../../blocks/blog-list/style.css';
import '../../../blocks/blog-list/editor.css';

registerBlockType(metadata.name, {
	...metadata,
	edit: Edit,
	save: () => null,
});
