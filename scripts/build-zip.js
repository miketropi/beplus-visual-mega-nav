/**
 * Build a production-ready zip archive of the plugin.
 *
 * Copies plugin to a temp directory, installs production-only
 * Composer dependencies (--no-dev), then creates the zip.
 *
 * Usage: node scripts/build-zip.js
 */

const { execSync } = require('child_process');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const os = require('os');

const pluginDir = process.cwd();
const pluginName = path.basename(pluginDir);
const zipName = `${pluginName}.zip`;
const zipPath = path.join(pluginDir, zipName);

// Top-level directories and files to exclude from the build.
const excludeTops = new Set([
	'node_modules',
	'tests',
	'docs',
	'scripts',
	'.github',
	'.git',
	'.claude',
	'.codegraph',
	'.cursor',
	'.opencode',
	'.husky',
	'.gitignore',
	'.mcp.json',
	'.nvmrc',
	'.stylelintrc.json',
	'.env-example',
	'.eslintrc.json',
	'AGENTS.md',
	'opencode.jsonc',
	'package.json',
	'package-lock.json',
	'phpstan.neon',
	'phpcs.xml.dist',
	'phpunit.xml.dist',
	'webpack.config.js',
	'preview.jpg',
	zipName,
]);

// Create temp build directory.
const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), `${pluginName}-`));
const targetDir = path.join(buildDir, pluginName);

console.log(`Building in ${targetDir}…`);

// Copy plugin files, excluding dev-only items.
fs.cpSync(pluginDir, targetDir, {
	recursive: true,
	filter: (src) => {
		const rel = path.relative(pluginDir, src);
		if (rel === '') return true;
		const parts = rel.split(path.sep);
		const top = parts[0];

		if (excludeTops.has(top)) return false;

		// Recursive exclusions (match at any depth).
		if (parts.some((p) => p === '.DS_Store' || p.startsWith('._'))) return false;

		return true;
	},
});

// Install production-only Composer dependencies.
execSync('composer install --no-dev --no-scripts -o', {
	cwd: targetDir,
	stdio: 'inherit',
});

// Remove the lock file — not needed at runtime.
// composer.json is kept; Plugin Check requires it when vendor/ is present.
const composerLockPath = path.join(targetDir, 'composer.lock');
if (fs.existsSync(composerLockPath)) fs.rmSync(composerLockPath);

// Create zip.
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
	console.log(`Created ${zipName} (${(archive.pointer() / 1024).toFixed(1)} KB)`);
	fs.rmSync(buildDir, { recursive: true, force: true });
});

archive.on('error', (err) => {
	fs.rmSync(buildDir, { recursive: true, force: true });
	throw err;
});

archive.pipe(output);
archive.directory(targetDir, pluginName);
archive.finalize();
