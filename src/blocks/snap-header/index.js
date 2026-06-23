import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import blockDef from '../../../blocks/snap-header/block.json';
import Edit from './edit';

registerBlockType(blockDef.name, {
	...blockDef,
	edit: Edit,
	save: () => <InnerBlocks.Content />,
});
