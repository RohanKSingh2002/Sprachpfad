// Prepare only the public website assets for Sites (default) or Cloudflare Pages.
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = process.argv[2] || 'sites';
if (!['sites', 'cloudflare'].includes(target) || process.argv.length > 3) {
  throw new Error('Usage: node tools/prepare_site.mjs [sites|cloudflare]');
}
const folder = target === 'cloudflare' ? 'cloudflare' : 'sprachpfad';
const checkout = path.join(root, 'hosting', folder);
const output = path.join(checkout, 'dist');
if (target === 'sites') {
  const manifest = JSON.parse(await readFile(path.join(root, '.openai', 'hosting.json'), 'utf8'));
  if (!manifest.project_id || manifest.static?.directory !== 'dist') throw new Error('Missing static hosting configuration.');
}
// Restrict cleanup to this generated directory; preserve the source and hosting Git history.
if (path.relative(root, output) !== path.join('hosting', folder, 'dist')) throw new Error('Invalid output directory.');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
if (target === 'sites') {
  await mkdir(path.join(checkout, '.openai'), { recursive: true });
  await cp(path.join(root, '.openai', 'hosting.json'), path.join(checkout, '.openai', 'hosting.json'));
}
for (const asset of ['index.html', 'about.html', 'privacy.html', 'terms.html', 'study-worker.js', 'manifest.webmanifest', 'app-icon.svg', 'css', 'js', 'data', 'audio']) {
  await cp(path.join(root, asset), path.join(output, asset), { recursive: true });
}
await cp(path.join(root, 'LICENSE'), path.join(output, 'LICENSE.txt'));

// Version the complete module graph together. Updating just main.js can leave
// returning visitors with cached views and a router from a previous release.
async function moduleFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'vendor') continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await moduleFiles(file));
    else if (entry.name.endsWith('.js')) files.push(file);
  }
  return files.sort();
}
const modules = await Promise.all((await moduleFiles(path.join(output, 'js')))
  .map(async file => ({ file, text: await readFile(file, 'utf8') })));
const staticAssets = (await Promise.all(['css', 'data'].map(async dir =>
  (await readdir(path.join(output, dir))).map(file => `${dir}/${file}`)))).flat();
const sources = await Promise.all(['index.html', 'audio/index.json', 'study-worker.js', 'manifest.webmanifest', 'app-icon.svg', ...staticAssets]
  .map(file => readFile(path.join(output, file))));
const hash = createHash('sha256');
for (const file of [...modules.map(item => item.text), ...sources]) hash.update(file);
const version = hash.digest('hex').slice(0, 12);
for (const { file, text } of modules) {
  const versioned = text.replace(/((?:from\s*|import\s*\()\s*["'])(\.\.?\/[^"'?#]+\.js)(?:\?[^"']*)?(["'])/g,
    (_, prefix, source, quote) => `${prefix}${source}?v=${version}${quote}`);
  await writeFile(file, versioned);
}
const indexFile = path.join(output, 'index.html');
const index = (await readFile(indexFile, 'utf8'))
  .replace(/((?:src|href)=")(js\/(?:main|theme-init)\.js|css\/[^"?]+\.css)(?:\?[^"]*)?"/g,
    (_, attribute, file) => `${attribute}${file}?v=${version}"`);
await writeFile(indexFile, index);
const entryAssets = [...index.matchAll(/(?:href|src)="((?:css|js)\/[^"]+)"/g)].map(match => match[1]);
const vendorFiles = (await readdir(path.join(output, 'js', 'vendor'))).filter(file => file.endsWith('.js'));
const offlineAssets = new Set(['./', 'audio/index.json', 'manifest.webmanifest', 'app-icon.svg', ...entryAssets,
  ...staticAssets.filter(file => file.startsWith('data/')),
  ...modules.map(({ file }) => `${path.relative(output, file).split(path.sep).join('/')}?v=${version}`),
  ...vendorFiles.map(file => `js/vendor/${file}?v=${version}`)]);
await writeFile(path.join(output, 'offline-assets.json'), JSON.stringify({ version, assets: [...offlineAssets] }));
async function measure(directory) {
  let files = 0, bytes = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const child = await measure(fullPath);
      files += child.files; bytes += child.bytes;
    } else {
      files++; bytes += (await stat(fullPath)).size;
    }
  }
  return { files, bytes };
}
console.log(JSON.stringify({ target, checkout, output, ...await measure(output) }, null, 2));
