#!/usr/bin/env node
'use strict';
/* ---------------------------------------------------------------------------
   reasoning-suite CLI

   npx reasoning-suite install [--dir <skills-root>] [--only 1-general,2-debug] [--force]
   npx reasoning-suite visualizer [--port 8080] [--host 127.0.0.1] [--no-open]
   npx reasoning-suite tree validate <file-or-markdown|-> [--json]

   No dependencies, Node >= 18, works on Windows / macOS / Linux.
   ------------------------------------------------------------------------- */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { spawn } = require('child_process');

const PKG = require('../package.json');
const ROOT = path.resolve(__dirname, '..');
const SKILLS = ['1-general', '2-debug', '3-code', '4-web'];
const SCHEMA = 'tree.schema.json';

// `... | head` / `| less q` closes the pipe early; do not crash with a stack trace.
process.stdout.on('error', function (err) { if (err && err.code === 'EPIPE') process.exit(0); });
process.stderr.on('error', function (err) { if (err && err.code === 'EPIPE') process.exit(0); });

const HELP = `
${PKG.name} ${PKG.version} - reasoning skills + tree-json visualizer

Usage
  npx ${PKG.name} install      [--dir <skills-root>] [--only <list>] [--force] [--dry-run]
  npx ${PKG.name} visualizer   [--port 8080] [--host 127.0.0.1] [--no-open]
  npx ${PKG.name} tree validate <file|markdown|-> [--json]
  npx ${PKG.name} --help | --version

install
  Copies the four skills and ${SCHEMA} into the skills root (default:
  ~/.claude/skills). ${SCHEMA} is written next to the skill folders because
  1-general/references/tree-format.md links it as ../../${SCHEMA}.
  --only 1-general,web-reasoning   install a subset (folder names)
  --force                          overwrite existing skill folders
  --dry-run                        print what would be written, write nothing

visualizer
  Serves the static visualizer on localhost (no network calls from the page).
  --no-open                        do not launch a browser

tree validate
  Validates one tree-json object: a raw .json file, a markdown file containing a
  \`\`\`tree-json block, or stdin with "-". Exit code 1 when the tree is invalid.

After install
  Point your agent at the skills root, restart it, then ask a non-trivial
  question. The answer ends with a \`\`\`tree-json block; paste that block (or the
  whole answer) into the visualizer to validate, play DOWN/UP, edit and export.
`;

/* ------------------------------------------------------------------ utils */
function print(s) { process.stdout.write(String(s) + '\n'); }
function fail(msg, code) { process.stderr.write(String(msg) + '\n'); process.exit(code === undefined ? 2 : code); }

function parseArgs(args) {
  const flags = new Set();
  const opts = Object.create(null);
  const rest = [];
  const takesValue = ['dir', 'only', 'port', 'host'];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.slice(0, 2) === '--') {
      const eq = a.indexOf('=');
      const key = eq === -1 ? a.slice(2) : a.slice(2, eq);
      const inline = eq === -1 ? undefined : a.slice(eq + 1);
      if (inline !== undefined) opts[key] = inline;
      else if (takesValue.indexOf(key) !== -1 && args[i + 1] !== undefined && args[i + 1][0] !== '-') opts[key] = args[++i];
      else flags.add(key);
    } else if (a === '-f') {
      flags.add('force');
    } else {
      rest.push(a);
    }
  }
  return { flags: flags, opts: opts, rest: rest };
}

function cpDir(from, to, force) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) {
      cpDir(src, dst, force);
    } else {
      if (fs.existsSync(dst) && !force) throw new Error('refusing to overwrite ' + dst + ' (use --force)');
      fs.copyFileSync(src, dst);
    }
  }
}

function defaultSkillsRoot() {
  return path.join(os.homedir(), '.claude', 'skills');
}

function humanSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/* ---------------------------------------------------------------- install */
function cmdInstall(args) {
  const { flags, opts } = parseArgs(args);
  if (opts.only) {
    const wanted = String(opts.only).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    const unknown = wanted.filter(function (s) { return SKILLS.indexOf(s) === -1; });
    if (unknown.length) fail('unknown skill(s): ' + unknown.join(', ') + '\navailable: ' + SKILLS.join(', '));
    opts.only = wanted;
  }
  const dir = path.resolve(opts.dir ? String(opts.dir) : defaultSkillsRoot());
  const only = opts.only || SKILLS;
  const force = flags.has('force');
  const dry = flags.has('dry-run');

  const plan = [];
  only.forEach(function (skill) { plan.push({ from: path.join(ROOT, skill), to: path.join(dir, skill) }); });
  plan.push({ from: path.join(ROOT, SCHEMA), to: path.join(dir, SCHEMA) });

  print((dry ? 'dry run: ' : '') + 'installing ' + only.length + ' skill(s) into ' + dir);
  let files = 0, bytes = 0;
  for (const item of plan) {
    if (!fs.existsSync(item.from)) fail('missing source: ' + item.from);
    const stat = fs.statSync(item.from);
    if (fs.existsSync(item.to) && !force) {
      fail('already installed: ' + item.to + '\nuse --force to overwrite, or --dir to install elsewhere');
    }
    if (!dry) {
      if (stat.isDirectory()) {
        cpDir(item.from, item.to, force);
      } else {
        fs.mkdirSync(path.dirname(item.to), { recursive: true });
        fs.copyFileSync(item.from, item.to);
      }
    }
    const rel = path.relative(dir, item.to);
    bytes += stat.isDirectory() ? dirSize(item.from) : stat.size;
    files += stat.isDirectory() ? countFiles(item.from) : 1;
    print('  ' + (dry ? 'would write ' : 'wrote      ') + (rel || '.'));
  }
  print('');
  print('files: ' + files + ' (' + humanSize(bytes) + ')');
  print('');
  print('Next steps');
  print('  1. Make sure your agent reads skills from that root (Claude Code: ~/.claude/skills).');
  print('  2. Restart the agent so it re-indexes the skills.');
  print('  3. Ask a non-trivial question; the answer ends with a ```tree-json block.');
  print('  4. Run: npx ' + PKG.name + ' visualizer   and paste that block in.');
}

function countFiles(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) n += e.isDirectory() ? countFiles(path.join(dir, e.name)) : 1;
  return n;
}
function dirSize(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    n += e.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return n;
}

/* ------------------------------------------------------------- visualizer */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function cmdVisualizer(args) {
  const { flags, opts } = parseArgs(args);
  const host = opts.host ? String(opts.host) : '127.0.0.1';
  const port = opts.port ? Number(opts.port) : 8080;
  if (!Number.isInteger(port) || port < 0 || port > 65535) fail('invalid --port: ' + opts.port);
  const webRoot = path.join(ROOT, 'visualizer');
  if (!fs.existsSync(webRoot)) fail('visualizer/ is missing from this package');

  const server = http.createServer(function (req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end('method not allowed'); return; }
    let rel;
    try { rel = decodeURIComponent(String(req.url).split('?')[0]); } catch (e) { rel = '/'; }
    if (rel === '/' || rel === '') rel = '/index.html';
    const full = path.resolve(webRoot, '.' + rel);
    if (full !== webRoot && full.indexOf(webRoot + path.sep) !== 0) { res.writeHead(403); res.end('forbidden'); return; }
    fs.readFile(full, function (err, buf) {
      if (err) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('404 ' + rel); return; }
      res.writeHead(200, { 'content-type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : buf);
    });
  });

  server.on('error', function (err) {
    if (err && err.code === 'EADDRINUSE') fail('port ' + port + ' is busy - try: npx ' + PKG.name + ' visualizer --port 8081');
    fail(String(err && err.message ? err.message : err));
  });

  server.listen(port, host, function () {
    const url = 'http://' + host + ':' + port + '/';
    print('visualizer: ' + url);
    print('offline copy: ' + pathToFileUrl(path.join(webRoot, 'index.html')));
    print('press Ctrl+C to stop');
    if (!flags.has('no-open')) openBrowser(url);
  });
}

function pathToFileUrl(p) {
  let s = path.resolve(p).replace(/\\/g, '/');
  if (s[0] !== '/') s = '/' + s;
  return 'file://' + encodeURI(s).replace(/#/g, '%23').replace(/\?/g, '%3F');
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    else if (process.platform === 'darwin') spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    else spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  } catch (e) { /* headless is fine - the URL is printed */ }
}

/* ------------------------------------------------------- tree validation */
const DOMAINS = ['general', 'debug', 'code', 'web'];
const STATUSES = ['verified', 'unverified', 'failed'];
const RESULTS = ['pass', 'fail', 'gap'];

function validateTree(model) {
  const errors = [];
  const push = function (p, rule, message, warn) { errors.push({ path: p, rule: rule, message: message, warn: !!warn }); };
  if (!model || typeof model !== 'object' || Array.isArray(model)) { push('$', 'type', 'not an object'); return errors; }
  if (model.version !== 1) push('version', 'const', 'version must be the number 1');
  if (DOMAINS.indexOf(model.domain) === -1) push('domain', 'enum', 'domain must be general | debug | code | web');
  if (typeof model.title !== 'string' || !model.title.trim()) push('title', 'minLength', 'title must be a non-empty string');

  const ids = Object.create(null);
  const walk = function (node, p) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) { push(p, 'type', 'node must be an object'); return; }
    if (typeof node.id !== 'string' || !node.id.trim()) push(p + '.id', 'minLength', 'node id must be a non-empty string');
    else if (ids[node.id]) push(p + '.id', 'unique', 'duplicate id "' + node.id + '"');
    else ids[node.id] = true;
    if (typeof node.text !== 'string' || !node.text.trim()) push(p + '.text', 'minLength', 'node text must be a non-empty string');
    if (Object.prototype.hasOwnProperty.call(node, 'children')) {
      if (!Array.isArray(node.children)) push(p + '.children', 'type', 'children must be an array');
      else {
        if (node.children.length < 1) push(p + '.children', 'minItems', 'children must have 1-4 items (remove the key for a leaf)');
        if (node.children.length > 4) push(p + '.children', 'maxItems', 'children must have 1-4 items (split or merge branches)');
        node.children.forEach(function (c, i) { walk(c, p + '.children[' + i + ']'); });
      }
    } else {
      if (typeof node.evidence !== 'string' || !node.evidence.trim()) push(p, 'leafEvidence', 'leaf missing evidence (required on leaves)');
      if (STATUSES.indexOf(node.status) === -1) push(p, 'leafStatus', 'leaf missing status (verified | unverified | failed)');
    }
  };
  walk(model.root, 'root');

  if (!Array.isArray(model.reverse_check)) {
    push('reverse_check', 'type', 'reverse_check must be an array');
  } else {
    model.reverse_check.forEach(function (rc, i) {
      const p = 'reverse_check[' + i + ']';
      if (!rc || typeof rc !== 'object') { push(p, 'type', 'reverse_check item must be an object'); return; }
      if (typeof rc.target !== 'string' || !rc.target.trim()) push(p + '.target', 'minLength', 'target must be a non-empty node id');
      else if (ids[rc.target] === undefined) push(p + '.target', 'ref', 'target "' + rc.target + '" does not match any node id');
      if (typeof rc.question !== 'string' || !rc.question.trim()) push(p + '.question', 'minLength', 'question must be a non-empty string');
      if (RESULTS.indexOf(rc.result) === -1) push(p + '.result', 'enum', 'result must be pass | fail | gap');
    });
  }

  if (typeof model.conclusion !== 'string') {
    push('conclusion', 'type', 'conclusion must be a string');
  } else if (model.conclusion.trim() && Array.isArray(model.reverse_check) &&
             model.reverse_check.some(function (r) { return r && (r.result === 'fail' || r.result === 'gap'); })) {
    push('conclusion', 'semantic', 'conclusion is written while a check is fail/gap: fix the branch first', true);
  }
  return errors;
}

function treeStats(model) {
  const leaves = [];
  (function walk(n) { if (n.children && n.children.length) n.children.forEach(walk); else leaves.push(n); })(model.root);
  const counts = { verified: 0, unverified: 0, failed: 0 };
  leaves.forEach(function (l) { counts[l.status] = (counts[l.status] || 0) + 1; });
  const rcs = Array.isArray(model.reverse_check) ? model.reverse_check : [];
  const fail = rcs.filter(function (r) { return r.result === 'fail'; }).length;
  const gap = rcs.filter(function (r) { return r.result === 'gap'; }).length;
  let nodes = 0;
  (function count(n) { nodes++; if (n.children) n.children.forEach(count); })(model.root);
  return { leaves: leaves.length, counts: counts, fail: fail, gap: gap, nodes: nodes, ready: counts.verified === leaves.length && fail === 0 && gap === 0 };
}

function readInput(file) {
  if (file === '-') return fs.readFileSync(0, 'utf8');
  if (!fs.existsSync(file)) fail('no such file: ' + file);
  return fs.readFileSync(file, 'utf8');
}

function cmdTree(args) {
  const { flags, rest } = parseArgs(args);
  const sub = rest.shift();
  if (sub !== 'validate') fail('usage: npx ' + PKG.name + ' tree validate <file|markdown|-> [--json]');
  const file = rest.shift();
  if (!file) fail('usage: npx ' + PKG.name + ' tree validate <file|markdown|-> [--json]');

  const raw = readInput(file);
  const fence = raw.match(/```tree-json\s*([\s\S]*?)```/i);
  let payload;
  if (fence) {
    payload = fence[1].trim();
  } else {
    const trimmed = raw.trim();
    if (trimmed[0] !== '{' && trimmed[0] !== '[') {
      const err = { path: '$', rule: 'noBlock', message: 'no ```tree-json block found (and the content is not raw JSON)' };
      if (flags.has('json')) print(JSON.stringify({ ok: false, errors: [err] }));
      else print('INVALID  ' + file + '\n  $ - ' + err.message + ' [noBlock]');
      process.exit(1);
    }
    payload = trimmed;
  }
  let model;
  try {
    model = JSON.parse(payload);
  } catch (e) {
    if (flags.has('json')) print(JSON.stringify({ ok: false, errors: [{ path: '$', rule: 'json', message: e.message }] }));
    else print('INVALID  ' + file + '\n  $ - invalid JSON: ' + e.message + ' [json]');
    process.exit(1);
  }
  const errors = validateTree(model);
  const hard = errors.filter(function (e) { return !e.warn; });
  const stats = treeStats(model);

  if (flags.has('json')) {
    print(JSON.stringify({ ok: hard.length === 0, errors: errors, stats: stats }, null, 2));
    process.exit(hard.length ? 1 : 0);
    return;
  }
  errors.forEach(function (e) { print('  ' + e.path + ' - ' + e.message + ' [' + e.rule + ']' + (e.warn ? ' (warning)' : '')); });
  print((hard.length ? 'INVALID  ' : 'VALID    ') + file);
  print('  domain ' + model.domain + ' | ' + stats.nodes + ' nodes | ' + stats.leaves + ' leaves: ' +
        stats.counts.verified + ' verified, ' + stats.counts.unverified + ' unverified, ' + stats.counts.failed + ' failed' +
        ' | checks: ' + stats.fail + ' fail, ' + stats.gap + ' gap');
  print('  verdict ' + (stats.ready && hard.length === 0 ? 'READY' : 'NOT READY'));
  process.exit(hard.length ? 1 : 0);
}

/* ----------------------------------------------------------------- entry */
function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const args = argv.slice(1);
  switch (cmd) {
    case undefined: case '-h': case '--help': case 'help': print(HELP.trim()); break;
    case '-v': case '--version': case 'version': print(PKG.name + ' ' + PKG.version); break;
    case 'install': case 'add': cmdInstall(args); break;
    case 'visualizer': case 'viz': case 'serve': cmdVisualizer(args); break;
    case 'tree': cmdTree(args); break;
    default: fail('unknown command: ' + cmd + '\n\n' + HELP.trim());
  }
}

main();
