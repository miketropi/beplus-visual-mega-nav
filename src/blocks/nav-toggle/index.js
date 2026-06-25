import { registerBlockType } from '@wordpress/blocks';
import blockDef from '../../../blocks/nav-toggle/block.json';
import Edit from './edit';

registerBlockType(blockDef.name, {
	...blockDef,
	edit: Edit,
	save: () => null,
});
