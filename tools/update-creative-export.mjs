import { cp, lstat, mkdir, readFile, realpath, rename, rm } from 'node:fs/promises';
import { isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.argv.length !== 3) {
  throw new Error('Usage: node tools/update-creative-export.mjs <path to Giats static export>');
}

const repo = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const destination = join(repo, 'dist', 'startup');
const source = await realpath(process.argv[2]);
const directories = ['_next', 'sharon', 'fonts', 'other', 'about', 'projects'];
const pages = ['404.html', 'index.html'];
const paths = [...directories, ...pages];

function isInside(parent, child) {
  const path = relative(parent, child);
  return path === '' || (path.split(/[\\/]/)[0] !== '..' && !isAbsolute(path));
}

async function assertRealPath(path) {
  if (await realpath(path) !== path) {
    throw new Error(`Expected a real workspace path: ${path}`);
  }
}

async function existing(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return null;
  }
}

await assertRealPath(destination);
if (isInside(source, destination) || isInside(destination, source)) {
  throw new Error('The export and dist/startup must be separate directories.');
}

for (const name of directories) {
  if (!(await lstat(join(source, name))).isDirectory()) {
    throw new Error(`Expected an exported directory: ${name}`);
  }
}
for (const name of [...pages, 'about/index.html', 'projects/index.html']) {
  if (!(await lstat(join(source, name))).isFile()) {
    throw new Error(`Expected an exported page: ${name}`);
  }
}
const homepage = await readFile(join(source, 'index.html'), 'utf8');
if (!homepage.includes('<title>Sharon</title>') || !homepage.includes('name="portfolio-version" content="giats"')) {
  throw new Error('The exported homepage must have the Sharon title and Giats portfolio marker.');
}

// Stage every file before replacing anything. Keep the original generated
// entries available to restore if installing one of the new entries fails.
const stage = join(repo, '.creative-export-stage');
if (isInside(source, stage) || isInside(stage, source)) {
  throw new Error('The export cannot overlap the staging directory.');
}
await mkdir(stage);
const incoming = join(stage, 'incoming');
const backup = join(stage, 'backup');
const changes = [];
let retainStage = false;
try {
  await mkdir(incoming);
  await mkdir(backup);
  for (const name of paths) {
    await cp(join(source, name), join(incoming, name), {
      recursive: true,
      filter: async (path) => {
        const info = await lstat(path);
        if (!info.isFile() && !info.isDirectory()) {
          throw new Error(`Unexpected entry in static export: ${path}`);
        }
        return true;
      },
    });
  }
  for (const name of paths) {
    const previousPath = join(destination, name);
    const change = { previousPath, backupPath: join(backup, name), incomingPath: join(incoming, name) };
    changes.push(change);
    if (await existing(previousPath)) {
      await assertRealPath(previousPath);
      await rename(previousPath, change.backupPath);
      change.backedUp = true;
    }
    await assertRealPath(change.incomingPath);
    await rename(change.incomingPath, previousPath);
    change.installed = true;
  }
} catch (error) {
  try {
    for (const change of changes.reverse()) {
      if (change.installed) await rename(change.previousPath, change.incomingPath);
      if (change.backedUp) await rename(change.backupPath, change.previousPath);
    }
  } catch (restoreError) {
    retainStage = true;
    throw new AggregateError([error, restoreError], `Restore failed. Recovery files are in ${stage}.`);
  }
  throw error;
} finally {
  if (!retainStage) {
    await assertRealPath(stage);
    await rm(stage, { recursive: true, force: true });
  }
}

console.log('Refreshed the Giats export in dist/startup. Legacy assets and resume downloads were preserved.');
