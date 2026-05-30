/**
 * Build a production-ready zip archive of the plugin.
 *
 * Uses archiver with explicit glob patterns — no shell escaping issues,
 * and `node_modules` is guaranteed excluded.
 *
 * Usage: node scripts/build-zip.js
 */

const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

const pluginDir = process.cwd();
const pluginName = path.basename(pluginDir);
const zipName = `${pluginName}.zip`;
const zipPath = path.join(pluginDir, zipName);

const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
	console.log(`Created ${zipName} (${archive.pointer()} bytes)`);
});

archive.on('error', (err) => {
	throw err;
});

archive.pipe(output);

// Include everything except dev/build files.
// Patterns are relative to cwd and follow .gitignore-style syntax.
archive.glob('**/*', {
	cwd: pluginDir,
	ignore: [
		// Dependencies (not needed at runtime).
		'node_modules/**',

		// Source JS/CSS (compiled to build/).
		'src/**',

		// Dev tooling & config.
		'tests/**',
		'docs/**',
		'scripts/**',
		'vendor/bin/**',
		'.github/**',
		'.git/**',
		'.claude/**',
		'.codegraph/**',
		'.cursor/**',
		'.opencode/**',

		// Root dev files.
		'.gitignore',
		'.mcp.json',
		'.nvmrc',
		'AGENTS.md',
		'composer.json',
		'composer.lock',
		'opencode.jsonc',
		'package.json',
		'package-lock.json',
		'phpstan.neon',
		'phpcs.xml.dist',
		'phpunit.xml.dist',
		'webpack.config.js',
		'preview.jpg',

		// OS junk.
		'.DS_Store',
		'**/.DS_Store',
		'**/._*',

		// The zip file itself.
		zipName,
	],
});

archive.finalize();
