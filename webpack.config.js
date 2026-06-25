/**
 * Webpack configuration — extends @wordpress/scripts default.
 *
 * @package Snap\MegaMenuBuilder
 */

const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		index: './src/index.js',
		blocks: './src/blocks.js',
	},
};
