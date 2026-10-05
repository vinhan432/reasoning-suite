'use strict';
/* ============================================================================
   tree-json visualizer
   Plain HTML/CSS/JS. No build step, no framework, no network calls.
   Sections: i18n, state, DOM helpers, parsing, validation, status,
             layout, render, details + editing, playback, zoom/pan,
             export, storage, keyboard, init.
   ========================================================================== */

/* ---------------------------------------------------------------- 1. i18n */
const I18N = {
  en: {
    appTitle: 'tree-json visualizer',
    skipToTree: 'Skip to tree',
    theme: 'Theme', themeAuto: 'Auto', themeLight: 'Light', themeDark: 'Dark',
    language: 'Language',
    inputTitle: 'Input',
    inputLabel: 'tree-json or markdown containing a tree-json block',
    inputPlaceholder: 'Paste tree-json here, or a whole markdown answer containing a ```tree-json block...',
    render: 'Render', upload: 'Upload file', example: 'Example', chooseExample: 'Load example...',
    treeTitle: 'Tree', detailsTitle: 'Node details',
    verified: 'verified', unverified: 'unverified', failed: 'failed', rcIssues: 'check fails/gaps',
    verdictReady: 'READY', verdictNotReady: 'NOT READY',
    blockingTitle: 'Blocking:', blockLeaf: 'leaf {status}', blockRc: 'check {result}',
    blockInvalid: 'tree invalid: {n} validation errors',
    modeDown: 'DOWN', modeUp: 'UP', showAll: 'Show all', play: 'Play', pause: 'Pause',
    stepBack: 'Step -', stepForward: 'Step +', speed: 'Speed', fit: 'Fit',
    expandAll: 'Expand all', copyJson: 'Copy JSON', downloadJson: 'Download JSON',
    exportSvg: 'Export SVG', exportPng: 'Export PNG',
    emptyState: 'Paste tree-json and press Render, or load an example.',
    noSelection: 'Click a node to see its text, evidence, status and reverse checks.',
    legendGreen: 'verified leaf / all children green',
    legendAmber: 'unverified leaf / mixed children',
    legendRed: 'failed leaf / any child red',
    legendShape: 'Amber is dashed, red is dotted, so colour is never the only signal.',
    privacyHint: 'Everything stays in this page: no network calls, no upload.',
    edit: 'Edit', save: 'Save', cancel: 'Cancel', addChild: 'Add child',
    deleteNode: 'Delete node', text: 'Text', evidence: 'Evidence', status: 'Status',
    reverseChecks: 'Reverse checks targeting this node', none: 'none',
    copied: 'Copied', copyFailed: 'Copy failed - select and copy manually',
    newNodeText: 'new sub-problem', newEvidence: 'TODO - replace with real evidence',
    playbackIdle: 'idle', playbackAll: 'full tree', playbackStep: 'step {i}/{n}',
    errEmpty: 'Nothing to parse: paste tree-json or a markdown block.',
    errJson: 'Invalid JSON: {msg}',
    errNotObject: 'The parsed value is not an object.',
    errRoot: 'Missing "root" node.',
    errVersion: 'version must be the number 1.',
    errDomain: 'domain must be one of general | debug | code | web.',
    errTitle: 'title must be a non-empty string.',
    errNodeType: 'node must be an object.',
    errId: 'node id must be a non-empty string.',
    errDuplicateId: 'duplicate id "{id}" - ids must be unique.',
    errText: 'node text must be a non-empty string.',
    errLeafEvidence: 'leaf missing evidence (required on leaves, min length 1).',
    errLeafStatus: 'leaf missing status (verified | unverified | failed).',
    errChildrenType: 'children must be an array.',
    errChildrenMin: 'children must have 1-4 items: remove the key for a leaf.',
    errChildrenMax: 'children must have 1-4 items: split or merge branches.',
    errRcType: 'reverse_check must be an array.',
    errRcItem: 'reverse_check item must be an object.',
    errRcTarget: 'reverse_check.target must be a non-empty node id.',
    errRcUnknownTarget: 'reverse_check.target "{id}" does not match any node id.',
    errRcQuestion: 'reverse_check.question must be a non-empty string.',
    errRcResult: 'reverse_check.result must be pass | fail | gap.',
    errConclusion: 'conclusion must be a string.',
    errConclusionEarly: 'conclusion is written while a check is fail/gap: fix the branch first.',
    rootLabel: 'root'
  },
  vi: {
    appTitle: 'tr&#7921;c quan ho&#225; tree-json',
    skipToTree: 'T&#7899;i c&#226;y l&#253; lu&#7853;n',
    theme: 'Giao di&#7879;n', themeAuto: 'T&#7921; &#273;&#7897;ng', themeLight: 'S&#225;ng', themeDark: 'T&#7889;i',
    language: 'Ng&#244;n ng&#7919;',
    inputTitle: 'D&#7919; li&#7879;u v&#224;o',
    inputLabel: 'tree-json ho&#7863;c markdown ch&#7913;a kh&#7889;i tree-json',
    inputPlaceholder: 'D&#225;n tree-json v&#224;o &#273;&#226;y, ho&#7863;c d&#225;n c&#7843; c&#226;u tr&#7843; l&#7901;i markdown c&#243; kh&#7889;i ```tree-json...',
    render: 'Hi&#7875;n th&#7883;', upload: 'T&#7843;i t&#7879;p', example: 'V&#237; d&#7909;', chooseExample: 'Ch&#7885;n v&#237; d&#7909;...',
    treeTitle: 'C&#226;y', detailsTitle: 'Chi ti&#7871;t n&#250;t',
    verified: '&#273;&#227; x&#225;c minh', unverified: 'ch&#432;a x&#225;c minh', failed: 'th&#7845;t b&#7841;i', rcIssues: 'l&#7895;i/thi&#7871;u ki&#7875;m tra',
    verdictReady: 'S&#7860;N S&#192;NG', verdictNotReady: 'CH&#431;A S&#7860;N S&#192;NG',
    blockingTitle: 'Ch&#7863;n:', blockLeaf: 'l&#225; {status}', blockRc: 'ki&#7875;m tra {result}',
    blockInvalid: 'c&#226;y sai: {n} l&#7895;i ki&#7875;m tra',
    modeDown: 'XU&#7888;NG', modeUp: 'L&#202;N', showAll: 'Xem t&#7845;t c&#7843;', play: 'Ch&#7841;y', pause: 'D&#7915;ng',
    stepBack: 'L&#249;i', stepForward: 'Ti&#7871;n', speed: 'T&#7889;c &#273;&#7897;', fit: 'V&#7915;a khung',
    expandAll: 'M&#7903; h&#7871;t', copyJson: 'Sao ch&#233;p JSON', downloadJson: 'T&#7843;i JSON',
    exportSvg: 'Xu&#7845;t SVG', exportPng: 'Xu&#7845;t PNG',
    emptyState: 'D&#225;n tree-json v&#224; b&#7845;m Hi&#7875;n th&#7883;, ho&#7863;c ch&#7885;n m&#7897;t v&#237; d&#7909;.',
    noSelection: 'B&#7845;m m&#7897;t n&#250;t &#273;&#7875; xem n&#7897;i dung, b&#7857;ng ch&#7913;ng, tr&#7841;ng th&#225;i v&#224; ki&#7875;m tra ng&#432;&#7907;c.',
    legendGreen: 'l&#225; &#273;&#227; x&#225;c minh / m&#7885;i con xanh',
    legendAmber: 'l&#225; ch&#432;a x&#225;c minh / con h&#7895;n h&#7907;p',
    legendRed: 'l&#225; th&#7845;t b&#7841;i / c&#243; con &#273;&#7887;',
    legendShape: 'V&#224;ng l&#224; n&#233;t &#273;&#7913;t, &#273;&#7887; l&#224; n&#233;t ch&#7845;m: m&#224;u kh&#244;ng ph&#7843;i t&#237;n hi&#7879;u duy nh&#7845;t.',
    privacyHint: 'M&#7885;i th&#7913; &#7903; l&#7841;i trong trang: kh&#244;ng g&#7885;i m&#7841;ng, kh&#244;ng t&#7843;i l&#234;n.',
    edit: 'S&#7917;a', save: 'L&#432;u', cancel: 'Hu&#7927;', addChild: 'Th&#234;m n&#250;t con',
    deleteNode: 'Xo&#225; n&#250;t', text: 'N&#7897;i dung', evidence: 'B&#7857;ng ch&#7913;ng', status: 'Tr&#7841;ng th&#225;i',
    reverseChecks: 'Ki&#7875;m tra ng&#432;&#7907;c li&#234;n quan', none: 'kh&#244;ng c&#243;',
    copied: '&#272;&#227; sao ch&#233;p', copyFailed: 'Sao ch&#233;p th&#7845;t b&#7841;i - h&#227;y ch&#7885;n v&#224; sao ch&#233;p th&#7911; c&#244;ng',
    newNodeText: 'v&#7845;n &#273;&#7873; con m&#7899;i', newEvidence: 'TODO - thay b&#7857;ng b&#7857;ng ch&#7913;ng th&#7853;t',
    playbackIdle: 'ch&#7901;', playbackAll: 'to&#224;n b&#7897; c&#226;y', playbackStep: 'b&#432;&#7899;c {i}/{n}',
    errEmpty: 'Kh&#244;ng c&#243; g&#236; &#273;&#7875; ph&#226;n t&#237;ch: h&#227;y d&#225;n tree-json ho&#7863;c kh&#7889;i markdown.',
    errJson: 'JSON kh&#244;ng h&#7907;p l&#7879;: {msg}',
    errNotObject: 'Gi&#225; tr&#7883; kh&#244;ng ph&#7843;i l&#224; object.',
    errRoot: 'Thi&#7871;u n&#250;t "root".',
    errVersion: 'version ph&#7843;i l&#224; s&#7889; 1.',
    errDomain: 'domain ph&#7843;i thu&#7897;c general | debug | code | web.',
    errTitle: 'title ph&#7843;i l&#224; chu&#7895;i kh&#244;ng r&#7895;ng.',
    errNodeType: 'n&#250;t ph&#7843;i l&#224; object.',
    errId: 'id n&#250;t ph&#7843;i l&#224; chu&#7895;i kh&#244;ng r&#7895;ng.',
    errDuplicateId: 'id tr&#249;ng "{id}" - id ph&#7843;i duy nh&#7845;t.',
    errText: 'text n&#250;t ph&#7843;i l&#224; chu&#7895;i kh&#244;ng r&#7895;ng.',
    errLeafEvidence: 'l&#225; thi&#7871;u evidence (b&#7855;t bu&#7897;c, &#237;t nh&#7845;t 1 k&#253; t&#7921;).',
    errLeafStatus: 'l&#225; thi&#7871;u status (verified | unverified | failed).',
    errChildrenType: 'children ph&#7843;i l&#224; m&#7843;ng.',
    errChildrenMin: 'children ph&#7843;i c&#243; 1-4 ph&#7847;n t&#7917;: b&#7887; kho&#225; n&#7871;u l&#224; l&#225;.',
    errChildrenMax: 'children t&#7889;i &#273;a 4: h&#227;y t&#225;ch ho&#7863;c h&#7907;p nh&#225;nh.',
    errRcType: 'reverse_check ph&#7843;i l&#224; m&#7843;ng.',
    errRcItem: 'ph&#7847;n t&#7917; reverse_check ph&#7843;i l&#224; object.',
    errRcTarget: 'reverse_check.target ph&#7843;i l&#224; id n&#250;t kh&#244;ng r&#7895;ng.',
    errRcUnknownTarget: 'reverse_check.target "{id}" kh&#244;ng kh&#7899;p n&#250;t n&#224;o.',
    errRcQuestion: 'reverse_check.question ph&#7843;i l&#224; chu&#7895;i kh&#244;ng r&#7895;ng.',
    errRcResult: 'reverse_check.result ph&#7843;i l&#224; pass | fail | gap.',
    errConclusion: 'conclusion ph&#7843;i l&#224; chu&#7895;i.',
    errConclusionEarly: 'conclusion &#273;&#432;&#7907;c vi&#7871;t khi c&#242;n fail/gap: h&#227;y s&#7917;a nh&#225;nh tr&#432;&#7899;c.',
    rootLabel: 'g&#7889;c'
  }
};
/* The `vi` dictionary is authored with numeric HTML entities so app.js stays ASCII.
   Decode them once here so textContent renders real Vietnamese characters. Only our
   own dictionary strings are touched; no user data passes through this. */
function decodeNumericEntities(s) {
  return String(s).replace(/&#(\d+);/g, function (_, d) { return String.fromCharCode(Number(d)); });
}
Object.keys(I18N).forEach(function (code) {
  Object.keys(I18N[code]).forEach(function (key) { I18N[code][key] = decodeNumericEntities(I18N[code][key]); });
});

let lang = 'en';
function t(key, vars) {
  const dict = I18N[lang] || I18N.en;
  let s = (dict[key] !== undefined) ? dict[key] : (I18N.en[key] !== undefined ? I18N.en[key] : key);
  if (vars) {
    Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(String(vars[k])); });
  }
  return s;
}

/* --------------------------------------------------------------- 2. state */
const NS = 'http://www.w3.org/2000/svg';
const STORE_KEY = 'treeviz.session.v1';
const DOMAINS = ['general', 'debug', 'code', 'web'];
const LEAF_STATUSES = ['verified', 'unverified', 'failed'];
const RC_RESULTS = ['pass', 'fail', 'gap'];

const state = {
  model: null,                 // parsed tree-json
  errors: [],                  // validation errors {path, rule, message, warn?}
  statuses: Object.create(null),
  health: null,
  layout: null,
  index: null,                 // id -> laid-out record
  collapsed: new Set(),
  selectedId: null,
  editingId: null,
  focusId: null,
  zoom: 1, panX: 0, panY: 0,
  dragMoved: false,
  theme: 'auto',
  playback: { active: false, phase: 'down', index: 0, playing: false, speed: 1, steps: [] },
  timer: null
};

const els = {};
function $(id) { return document.getElementById(id); }

/* -------------------------------------------------------- 3. DOM helpers */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined && text !== null) n.textContent = String(text);
  return n;
}
function svgEl(tag, attrs) {
  const n = document.createElementNS(NS, tag);
  if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, String(attrs[k])); });
  return n;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

/* ------------------------------------------------------------- 4. parsing */
function extractTreeJson(text) {
  const src = String(text == null ? '' : text);
  const m = src.match(/```tree-json\s*([\s\S]*?)```/i);
  return m ? m[1].trim() : src.trim();
}
function parseInput(text) {
  const raw = extractTreeJson(text);
  if (!raw) return { ok: false, model: null, errors: [{ path: '$', rule: 'empty', message: t('errEmpty') }] };
  let model;
  try {
    model = JSON.parse(raw);
  } catch (e) {
    return { ok: false, model: null, errors: [{ path: '$', rule: 'json', message: t('errJson', { msg: e.message }) }] };
  }
  const errors = validateModel(model);
  const hardErrors = errors.filter(function (e) { return !e.warn; });
  return { ok: hardErrors.length === 0, model: model, errors: errors };
}

/* ---------------------------------------------------------- 5. validation */
function validateModel(m) {
  const errors = [];
  function push(path, rule, message, warn) {
    errors.push({ path: path, rule: rule, message: message, warn: !!warn });
  }
  if (!m || typeof m !== 'object' || Array.isArray(m)) {
    push('$', 'type', t('errNotObject'));
    return errors;
  }
  if (m.version !== 1) push('version', 'const', t('errVersion'));
  if (DOMAINS.indexOf(m.domain) === -1) push('domain', 'enum', t('errDomain'));
  if (typeof m.title !== 'string' || !m.title.trim()) push('title', 'minLength', t('errTitle'));

  const ids = Object.create(null);

  function walkNode(node, path) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      push(path, 'type', t('errNodeType'));
      return;
    }
    if (typeof node.id !== 'string' || !node.id.trim()) push(path + '.id', 'minLength', t('errId'));
    else if (ids[node.id]) push(path + '.id', 'unique', t('errDuplicateId', { id: node.id }));
    else ids[node.id] = true;

    if (typeof node.text !== 'string' || !node.text.trim()) push(path + '.text', 'minLength', t('errText'));

    const hasChildren = Object.prototype.hasOwnProperty.call(node, 'children');
    if (!hasChildren) {
      // leaf: evidence + status are mandatory
      if (typeof node.evidence !== 'string' || !node.evidence.trim()) push(path, 'leafEvidence', t('errLeafEvidence'));
      if (LEAF_STATUSES.indexOf(node.status) === -1) push(path, 'leafStatus', t('errLeafStatus'));
    } else {
      if (!Array.isArray(node.children)) {
        push(path + '.children', 'type', t('errChildrenType'));
      } else {
        if (node.children.length < 1) push(path + '.children', 'minItems', t('errChildrenMin'));
        if (node.children.length > 4) push(path + '.children', 'maxItems', t('errChildrenMax'));
        node.children.forEach(function (c, i) { walkNode(c, path + '.children[' + i + ']'); });
      }
    }
  }
  walkNode(m.root, 'root');

  if (!Array.isArray(m.reverse_check)) {
    push('reverse_check', 'type', t('errRcType'));
  } else {
    m.reverse_check.forEach(function (rc, i) {
      const p = 'reverse_check[' + i + ']';
      if (!rc || typeof rc !== 'object') { push(p, 'type', t('errRcItem')); return; }
      if (typeof rc.target !== 'string' || !rc.target.trim()) push(p + '.target', 'minLength', t('errRcTarget'));
      else if (ids[rc.target] === undefined) push(p + '.target', 'ref', t('errRcUnknownTarget', { id: rc.target }));
      if (typeof rc.question !== 'string' || !rc.question.trim()) push(p + '.question', 'minLength', t('errRcQuestion'));
      if (RC_RESULTS.indexOf(rc.result) === -1) push(p + '.result', 'enum', t('errRcResult'));
    });
  }

  if (typeof m.conclusion !== 'string') {
    push('conclusion', 'type', t('errConclusion'));
  } else if (m.conclusion.trim() && Array.isArray(m.reverse_check) &&
             m.reverse_check.some(function (r) { return r && (r.result === 'fail' || r.result === 'gap'); })) {
    push('conclusion', 'semantic', t('errConclusionEarly'), true);
  }
  return errors;
}

/* -------------------------------------------------------------- 6. status */
function isLeaf(node) { return !(node.children && node.children.length); }

function computeStatuses(model) {
  const map = Object.create(null);
  (function walk(node) {
    if (isLeaf(node)) {
      map[node.id] = node.status === 'verified' ? 'green' : (node.status === 'failed' ? 'red' : 'amber');
      return map[node.id];
    }
    let anyRed = false, allGreen = true;
    node.children.forEach(function (c) {
      const s = walk(c);
      if (s === 'red') anyRed = true;
      if (s !== 'green') allGreen = false;
    });
    map[node.id] = anyRed ? 'red' : (allGreen ? 'green' : 'amber');
    return map[node.id];
  })(model.root);
  return map;
}

function collectLeaves(model) {
  const out = [];
  (function walk(node, depth, parentId) {
    if (isLeaf(node)) { out.push({ node: node, depth: depth, parentId: parentId }); return; }
    node.children.forEach(function (c) { walk(c, depth + 1, node.id); });
  })(model.root, 0, null);
  return out;
}
function maxDepth(model) {
  let d = 0;
  (function walk(node, depth) {
    if (depth > d) d = depth;
    if (isLeaf(node)) return;
    node.children.forEach(function (c) { walk(c, depth + 1); });
  })(model.root, 0);
  return d;
}

function computeHealth(model, statuses) {
  const leaves = collectLeaves(model);
  const counts = { verified: 0, unverified: 0, failed: 0 };
  leaves.forEach(function (l) {
    const s = l.node.status;
    if (s === 'verified') counts.verified++;
    else if (s === 'failed') counts.failed++;
    else counts.unverified++;
  });
  const rcs = Array.isArray(model.reverse_check) ? model.reverse_check : [];
  const fail = rcs.filter(function (r) { return r.result === 'fail'; }).length;
  const gap = rcs.filter(function (r) { return r.result === 'gap'; }).length;

  const blocking = [];
  const seen = Object.create(null);
  leaves.forEach(function (l) {
    if (l.node.status !== 'verified' && !seen[l.node.id]) {
      seen[l.node.id] = true;
      blocking.push({ id: l.node.id, reason: t('blockLeaf', { status: l.node.status }) });
    }
  });
  rcs.forEach(function (r) {
    if ((r.result === 'fail' || r.result === 'gap') && !seen[r.target]) {
      seen[r.target] = true;
      blocking.push({ id: r.target, reason: t('blockRc', { result: r.result }) });
    }
  });
  const ready = leaves.length > 0 && counts.verified === leaves.length && fail === 0 && gap === 0;
  return { counts: counts, leafTotal: leaves.length, fail: fail, gap: gap, blocking: blocking, ready: ready, rcs: rcs };
}

/* -------------------------------------------------------------- 7. layout */
const NODE_W = 208, NODE_MIN_H = 46, LEVEL_H = 132, SIB_GAP = 26, PAD = 40;
const CHAR_W = 6.4, MAX_CHARS = 30, MAX_LINES = 6;

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach(function (w) {
    const candidate = line ? line + ' ' + w : w;
    if (candidate.length <= maxChars) { line = candidate; return; }
    if (line) lines.push(line);
    if (w.length > maxChars) {
      // hard-break very long tokens (ids, urls)
      let rest = w;
      while (rest.length > maxChars) {
        lines.push(rest.slice(0, maxChars - 1) + '-');
        rest = rest.slice(maxChars - 1);
      }
      line = rest;
    } else {
      line = w;
    }
  });
  if (line) lines.push(line);
  if (!lines.length) lines.push('');
  if (lines.length > MAX_LINES) {
    lines.length = MAX_LINES;
    lines[MAX_LINES - 1] = lines[MAX_LINES - 1].slice(0, maxChars - 1) + '\u2026';
  }
  return lines;
}

function visibleChildren(node) {
  if (!node.children || !node.children.length) return [];
  if (state.collapsed.has(node.id)) return [];
  return node.children;
}

function computeLayout(model) {
  const widths = Object.create(null);
  const nodes = [], edges = [];

  (function measure(node) {
    const kids = visibleChildren(node);
    if (!kids.length) { widths[node.id] = NODE_W; return NODE_W; }
    let w = 0;
    kids.forEach(function (k, i) { w += measure(k); if (i) w += SIB_GAP; });
    w = Math.max(NODE_W, w);
    widths[node.id] = w;
    return w;
  })(model.root);

  (function place(node, left, depth, parentId) {
    const w = widths[node.id];
    const lines = wrapText(node.text, MAX_CHARS);
    const h = Math.max(NODE_MIN_H, 16 + lines.length * 15);
    const y = PAD + depth * LEVEL_H;
    const kids = visibleChildren(node);
    const placedKids = [];
    let x;
    if (!kids.length) {
      x = left + (w - NODE_W) / 2;
    } else {
      let cx = left;
      const centers = [];
      kids.forEach(function (k, i) {
        const kw = widths[k.id];
        const rec = place(k, cx, depth + 1, node.id);
        centers.push(rec.cx);
        placedKids.push(rec);
        cx += kw + SIB_GAP;
      });
      x = (centers[0] + centers[centers.length - 1]) / 2 - NODE_W / 2;
    }
    const rec = {
      id: node.id, node: node, x: x, y: y, w: NODE_W, h: h, depth: depth,
      lines: lines, hasChildren: !!(node.children && node.children.length),
      collapsed: state.collapsed.has(node.id), parentId: parentId,
      cx: x + NODE_W / 2, bottom: y + h
    };
    nodes.push(rec);
    placedKids.forEach(function (k) {
      edges.push({ x1: rec.cx, y1: rec.bottom, x2: k.cx, y2: k.y, parentId: node.id, childId: k.id });
    });
    return rec;
  })(model.root, PAD, 0, null);

  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  nodes.forEach(function (n) {
    bounds.minX = Math.min(bounds.minX, n.x);
    bounds.minY = Math.min(bounds.minY, n.y);
    bounds.maxX = Math.max(bounds.maxX, n.x + n.w);
    bounds.maxY = Math.max(bounds.maxY, n.y + n.h);
  });
  if (!nodes.length) { bounds.minX = 0; bounds.minY = 0; bounds.maxX = 1; bounds.maxY = 1; }

  const index = Object.create(null);
  nodes.forEach(function (n) { index[n.id] = n; });
  return { nodes: nodes, edges: edges, bounds: bounds, index: index };
}

/* --------------------------------------------------------- 8. tree render */
function manageLayout() {
  if (!state.model) { state.layout = null; state.index = null; return; }
  state.layout = computeLayout(state.model);
  state.index = state.layout.index;
}

function statusIcon(status) {
  if (status === 'green') return '\u2713';
  if (status === 'amber') return '?';
  if (status === 'red') return '\u2717';
  return '\u25CB';
}

function applyTransform() {
  if (!els.viewport) return;
  els.viewport.setAttribute('transform', 'translate(' + state.panX + ' ' + state.panY + ') scale(' + state.zoom + ')');
  els.zoomBadge.textContent = Math.round(state.zoom * 100) + '%';
}

function renderTree() {
  const svg = els.svg;
  clear(svg);
  if (!state.layout) { els.empty.hidden = false; els.viewport = null; return; }
  els.empty.hidden = true;

  const viewport = svgEl('g', { id: 'viewport' });
  const edgesG = svgEl('g', { class: 'edges' });
  const nodesG = svgEl('g', { class: 'nodes' });

  state.layout.edges.forEach(function (e) { edgesG.appendChild(edgeEl(e)); });
  state.layout.nodes.forEach(function (rec) { nodesG.appendChild(nodeEl(rec)); });

  viewport.appendChild(edgesG);
  viewport.appendChild(nodesG);
  svg.appendChild(viewport);
  els.viewport = viewport;
  applyTransform();
  applyPlaybackStyles();
}

function edgeEl(e) {
  const dy = Math.max(18, (e.y2 - e.y1) * 0.5);
  const d = 'M ' + e.x1 + ' ' + e.y1 + ' C ' + e.x1 + ' ' + (e.y1 + dy) + ' ' + e.x2 + ' ' + (e.y2 - dy) + ' ' + e.x2 + ' ' + e.y2;
  const p = svgEl('path', { class: 'edge', d: d, 'data-child': e.childId });
  return p;
}

function nodeEl(rec) {
  const status = state.statuses[rec.id] || 'amber';
  const g = svgEl('g', {
    class: 'node status-' + status + (state.selectedId === rec.id ? ' selected' : ''),
    'data-id': rec.id,
    role: 'treeitem',
    tabindex: '-1',
    'aria-level': String(rec.depth + 1),
    'aria-label': rec.node.text + ' (' + status + ')'
  });
  if (rec.hasChildren) g.setAttribute('aria-expanded', String(!rec.collapsed));

  g.appendChild(svgEl('rect', { class: 'card', x: rec.x, y: rec.y, width: rec.w, height: rec.h, rx: 10 }));

  const icon = svgEl('text', { class: 'icon', x: rec.x + 10, y: rec.y + 20 });
  icon.textContent = statusIcon(status);
  g.appendChild(icon);

  rec.lines.forEach(function (line, i) {
    const tx = svgEl('text', { class: 'label', x: rec.x + 28, y: rec.y + 20 + i * 15 });
    tx.textContent = line;
    g.appendChild(tx);
  });

  if (rec.hasChildren) {
    const chev = svgEl('text', { class: 'toggle', x: rec.x + rec.w - 16, y: rec.y + 20, 'aria-hidden': 'true' });
    chev.textContent = rec.collapsed ? '\u25B8' : '\u25BE';
    chev.addEventListener('click', function (ev) {
      ev.stopPropagation();
      toggleCollapse(rec.id);
    });
    g.appendChild(chev);
  }

  g.addEventListener('click', function (ev) {
    if (state.dragMoved) return;
    ev.stopPropagation();
    selectNode(rec.id, true);
  });
  g.addEventListener('dblclick', function (ev) {
    ev.stopPropagation();
    selectNode(rec.id, false);
    state.editingId = rec.id;
    renderDetails();
  });
  return g;
}

function toggleCollapse(id) {
  if (state.collapsed.has(id)) state.collapsed.delete(id); else state.collapsed.add(id);
  manageLayout();
  renderTree();
  saveSession();
}

/* ------------------------------------------------------- 9. status visuals */
function applyPlaybackStyles() {
  if (!state.layout) return;
  const pb = state.playback;
  const nodesG = els.svg.querySelector('.nodes');
  const edgesG = els.svg.querySelector('.edges');
  if (!nodesG) return;

  // visible ids: during DOWN playback only the revealed prefix is shown
  let visible = null, fromDepth = null;
  if (pb.active) {
    if (pb.phase === 'down') {
      visible = Object.create(null);
      const downSteps = pb.steps.filter(function (s) { return s.phase === 'down'; });
      downSteps.slice(0, pb.index).forEach(function (s) { visible[s.id] = true; });
    } else {
      const downCount = pb.steps.filter(function (s) { return s.phase === 'down'; }).length;
      const upDone = pb.steps.slice(downCount, pb.index);
      const depths = upDone.filter(function (s) { return s.kind === 'propagate'; }).map(function (s) { return s.depth; });
      fromDepth = depths.length ? Math.min.apply(null, depths) : null;  // null = do not reveal statuses yet
    }
  }

  Array.prototype.forEach.call(nodesG.children, function (g) {
    const id = g.getAttribute('data-id');
    const rec = state.index[id];
    if (!rec) return;
    let status = state.statuses[id];
    if (visible && !visible[id]) { g.style.display = 'none'; return; }
    g.style.display = '';
    if (fromDepth === null && pb.active) status = 'none';
    else if (fromDepth !== null && rec.depth < fromDepth) status = 'none';
    else if (fromDepth === null && !pb.active) status = state.statuses[id];

    g.className.baseVal = 'node status-' + status +
      (state.selectedId === id ? ' selected' : '') +
      (pb.flashId === id ? ' highlight' : '');
  });

  if (edgesG) {
    Array.prototype.forEach.call(edgesG.children, function (p) {
      const childId = p.getAttribute('data-child');
      const rec = state.index[childId];
      if (!rec) return;
      const hidden = visible && !visible[childId];
      p.style.display = hidden ? 'none' : '';
      p.className.baseVal = 'edge' + (pb.flashId === rec.parentId ? ' up' : '');
    });
  }
}

/* ------------------------------------------------------ 10. panels/health */
function renderErrors() {
  clear(els.errors);
  state.errors.forEach(function (e) {
    const li = el('li', e.warn ? 'warn' : null);
    const where = el('code', null, e.path || '$');
    li.appendChild(where);
    li.appendChild(document.createTextNode(' \u2014 ' + e.message + ' [' + e.rule + ']'));
    els.errors.appendChild(li);
  });
}

function renderHealth() {
  const h = state.health;
  if (!h) {
    els.verdict.textContent = '-';
    els.verdict.className = 'verdict';
    els.countVerified.textContent = els.countUnverified.textContent = els.countFailed.textContent = '0';
    els.countRc.textContent = '0';
    clear(els.blocking);
    return;
  }
  els.countVerified.textContent = String(h.counts.verified);
  els.countUnverified.textContent = String(h.counts.unverified);
  els.countFailed.textContent = String(h.counts.failed);
  els.countRc.textContent = String(h.fail + h.gap);
  const hardErrors = state.errors.filter(function (e) { return !e.warn; }).length;
  els.verdict.textContent = (h.ready && !hardErrors) ? t('verdictReady') : t('verdictNotReady');
  els.verdict.className = 'verdict ' + ((h.ready && !hardErrors) ? 'ready' : 'notready');

  clear(els.blocking);
  if (h.blocking.length || hardErrors) {
    const label = el('li', null);
    label.appendChild(el('strong', null, t('blockingTitle')));
    els.blocking.appendChild(label);
    if (hardErrors) {
      const li = el('li');
      const btn = el('button', null, t('blockInvalid', { n: hardErrors }));
      btn.addEventListener('click', function () { els.input.focus(); });
      li.appendChild(btn);
      els.blocking.appendChild(li);
    }
    h.blocking.forEach(function (b) {
      const li = el('li');
      const btn = el('button', null, b.id + ' \u00B7 ' + b.reason);
      btn.addEventListener('click', function () { jumpToNode(b.id); });
      li.appendChild(btn);
      els.blocking.appendChild(li);
    });
  }
}

function revealPath(targetId) {
  const chain = [];
  (function find(node, path) {
    if (node.id === targetId) { chain.push.apply(chain, path); return true; }
    if (!node.children) return false;
    return node.children.some(function (c) { return find(c, path.concat([node.id])); });
  })(state.model.root, []);
  chain.forEach(function (id) { state.collapsed.delete(id); });
}

function jumpToNode(id) {
  if (!state.index || !state.index[id]) return;
  if (state.model) {
    revealPath(id);
    manageLayout();
    renderTree();
  }
  selectNode(id, false);
  const rec = state.index[id];
  if (rec) centerOn(rec);
}

function renderDetails() {
  const body = els.detailsBody;
  clear(body);
  const id = state.selectedId;
  if (!id || !state.index || !state.index[id]) {
    body.appendChild(el('p', 'hint', t('noSelection')));
    return;
  }
  const rec = state.index[id];
  const node = rec.node;
  const editing = state.editingId === id;
  const status = state.statuses[id];

  const head = el('div', 'row');
  head.appendChild(el('span', 'pill ' + (status === 'green' ? 'g' : status === 'red' ? 'r' : 'a'),
    statusIcon(status) + ' ' + (isLeaf(node) ? node.status : 'computed')));
  head.appendChild(el('span', 'meta', id + (rec.parentId ? ' \u2190 ' + rec.parentId : ' (' + t('rootLabel') + ')')));
  body.appendChild(head);

  if (editing) {
    body.appendChild(field('edit-text', t('text'), node.text, true));
    if (isLeaf(node)) {
      body.appendChild(field('edit-evidence', t('evidence'), node.evidence || '', true));
      const wrap = el('div', 'field');
      wrap.appendChild(el('label', null, t('status')));
      const sel = el('select');
      LEAF_STATUSES.forEach(function (s) {
        const o = el('option', null, s);
        o.value = s;
        if (node.status === s) o.selected = true;
        sel.appendChild(o);
      });
      sel.id = 'edit-status';
      wrap.appendChild(sel);
      body.appendChild(wrap);
    }
  } else {
    const tw = el('div', 'field');
    tw.appendChild(el('label', null, t('text')));
    tw.appendChild(el('p', null, node.text));
    body.appendChild(tw);
    if (isLeaf(node)) {
      const ew = el('div', 'field');
      ew.appendChild(el('label', null, t('evidence')));
      ew.appendChild(el('p', null, node.evidence || ''));
      body.appendChild(ew);
    }
  }

  const actions = el('div', 'row');
  if (editing) {
    const save = el('button', 'primary', t('save'));
    save.addEventListener('click', applyEdit);
    const cancel = el('button', null, t('cancel'));
    cancel.addEventListener('click', function () { state.editingId = null; renderDetails(); });
    actions.appendChild(save);
    actions.appendChild(cancel);
  } else {
    const edit = el('button', null, t('edit'));
    edit.addEventListener('click', function () { state.editingId = id; renderDetails(); });
    actions.appendChild(edit);
    const add = el('button', null, t('addChild'));
    add.disabled = (node.children ? node.children.length : 0) >= 4;
    add.addEventListener('click', function () { addChild(id); });
    actions.appendChild(add);
    const del = el('button', null, t('deleteNode'));
    del.disabled = (rec.parentId === null);
    del.addEventListener('click', function () { deleteNode(id); });
    actions.appendChild(del);
  }
  body.appendChild(actions);

  // reverse_check entries targeting this node
  const rcs = state.health ? state.health.rcs.filter(function (r) { return r.target === id; }) : [];
  const rcWrap = el('div', 'field');
  rcWrap.appendChild(el('label', null, t('reverseChecks')));
  if (!rcs.length) {
    rcWrap.appendChild(el('p', 'hint', t('none')));
  } else {
    const ul = el('ul', 'rc-list');
    rcs.forEach(function (r) {
      const li = el('li');
      const res = el('span', 'res ' + r.result, r.result.toUpperCase());
      li.appendChild(res);
      li.appendChild(document.createTextNode(' ' + r.question));
      if (r.note) li.appendChild(el('div', 'hint', r.note));
      ul.appendChild(li);
    });
    rcWrap.appendChild(ul);
  }
  body.appendChild(rcWrap);
}

function field(id, label, value, multiline) {
  const wrap = el('div', 'field');
  const lab = el('label', null, label);
  lab.setAttribute('for', id);
  wrap.appendChild(lab);
  const input = multiline ? el('textarea') : el('input');
  if (!multiline) input.type = 'text';
  else input.rows = 3;
  input.id = id;
  input.value = value;
  wrap.appendChild(input);
  return wrap;
}

/* ------------------------------------------------------------ 11. editing */
function uniqueId(base) {
  const ids = Object.create(null);
  (function walk(n) { ids[n.id] = true; if (n.children) n.children.forEach(walk); })(state.model.root);
  let i = 1, candidate = base + '-n' + i;
  while (ids[candidate]) { i++; candidate = base + '-n' + i; }
  return candidate;
}

function applyEdit() {
  const id = state.editingId;
  const rec = state.index[id];
  if (!rec) return;
  const textEl = $('edit-text');
  const evEl = $('edit-evidence');
  const stEl = $('edit-status');
  if (textEl && textEl.value.trim()) rec.node.text = textEl.value.trim();
  if (evEl) rec.node.evidence = evEl.value;
  if (stEl) rec.node.status = stEl.value;
  state.editingId = null;
  refreshAll();
}

function addChild(id) {
  const rec = state.index[id];
  if (!rec) return;
  const node = rec.node;
  if (!node.children) node.children = [];
  if (node.children.length >= 4) return;
  node.children.push({
    id: uniqueId(id),
    text: t('newNodeText'),
    evidence: t('newEvidence'),
    status: 'unverified'
  });
  state.collapsed.delete(id);
  refreshAll();
}

function deleteNode(id) {
  const rec = state.index[id];
  if (!rec || rec.parentId === null) return;
  const removed = Object.create(null);
  (function collect(n) { removed[n.id] = true; if (n.children) n.children.forEach(collect); })(rec.node);

  (function walk(node) {
    if (!node.children) return;
    node.children = node.children.filter(function (c) { return c.id !== id; });
    if (!node.children.length) delete node.children;
    node.children && node.children.forEach(walk);
  })(state.model.root);

  state.model.reverse_check = (state.model.reverse_check || []).filter(function (r) { return !removed[r.target]; });
  state.selectedId = null;
  if (state.editingId && removed[state.editingId]) state.editingId = null;
  refreshAll();
}

/* ----------------------------------------------------------- 12. playback */
function buildSteps(model) {
  const steps = [];
  const order = [];
  (function walk(n) { order.push(n.id); if (n.children) n.children.forEach(walk); })(model.root);
  order.forEach(function (id) { steps.push({ phase: 'down', kind: 'node', id: id }); });
  const rcs = Array.isArray(model.reverse_check) ? model.reverse_check : [];
  rcs.forEach(function (rc, i) { steps.push({ phase: 'up', kind: 'rc', index: i, target: rc.target, result: rc.result }); });
  const deepest = maxDepth(model);
  for (let d = deepest; d >= 0; d--) steps.push({ phase: 'up', kind: 'propagate', depth: d });
  steps.push({ phase: 'up', kind: 'verdict' });
  return steps;
}

function startPlayback(phase) {
  if (!state.model) return;
  const pb = state.playback;
  pb.steps = buildSteps(state.model);
  pb.active = true;
  pb.phase = phase;
  if (phase === 'down') pb.index = 0;
  else pb.index = pb.steps.filter(function (s) { return s.phase === 'down'; }).length;
  pb.flashId = null;
  updatePlaybackUI();
  applyPlaybackStyles();
  play();
}

function stopPlayback() {
  const pb = state.playback;
  pb.playing = false;
  clearTimeout(state.timer);
  state.timer = null;
  updatePlaybackUI();
}

function showAll() {
  const pb = state.playback;
  stopPlayback();
  pb.active = false;
  pb.index = pb.steps.length;
  pb.flashId = null;
  updatePlaybackUI();
  applyPlaybackStyles();
}

function stepBy(delta) {
  const pb = state.playback;
  if (!pb.active) { startPlayback('down'); return; }
  pb.index = clamp(pb.index + delta, 0, pb.steps.length);
  const cur = pb.index > 0 ? pb.steps[pb.index - 1] : null;
  pb.flashId = (cur && cur.kind === 'rc') ? cur.target : null;
  updatePlaybackUI();
  applyPlaybackStyles();
}

function play() {
  const pb = state.playback;
  if (!pb.active) return;
  pb.playing = true;
  updatePlaybackUI();
  schedule();
}
function pause() { stopPlayback(); }

function schedule() {
  const pb = state.playback;
  clearTimeout(state.timer);
  if (!pb.playing) return;
  const delay = clamp(1000 / (pb.speed || 1), 60, 4000);
  state.timer = setTimeout(function () {
    if (!pb.playing) return;
    if (pb.index >= pb.steps.length) { pb.playing = false; updatePlaybackUI(); return; }
    pb.index += 1;
    const cur = pb.steps[pb.index - 1];
    pb.flashId = (cur && cur.kind === 'rc') ? cur.target : null;
    updatePlaybackUI();
    applyPlaybackStyles();
    schedule();
  }, delay);
}

function updatePlaybackUI() {
  const pb = state.playback;
  els.btnPlay.textContent = pb.playing ? t('pause') : t('play');
  let label;
  if (!pb.active) label = t('playbackAll');
  else if (pb.index >= pb.steps.length) label = t('verdictReady');
  else {
    label = t('playbackStep', { i: pb.index, n: pb.steps.length });
    const next = pb.steps[pb.index];
    if (next && next.kind === 'rc') {
      const rc = (state.health ? state.health.rcs : [])[next.index];
      if (rc) label += ' \u00B7 ' + next.target + ' ' + rc.result.toUpperCase();
    }
  }
  els.playStatus.textContent = label;
}

/* ---------------------------------------------------------- 13. zoom/pan */
function centerOn(rec) {
  const rect = els.svg.getBoundingClientRect();
  state.panX = rect.width / 2 - (rec.x + rec.w / 2) * state.zoom;
  state.panY = rect.height / 3 - (rec.y + rec.h / 2) * state.zoom;
  applyTransform();
}

function fitToScreen() {
  if (!state.layout) return;
  const rect = els.svg.getBoundingClientRect();
  const b = state.layout.bounds;
  const w = Math.max(1, b.maxX - b.minX + 2 * PAD);
  const h = Math.max(1, b.maxY - b.minY + 2 * PAD);
  const scale = clamp(Math.min(rect.width / w, rect.height / h), 0.08, 1.6);
  state.zoom = scale;
  state.panX = (rect.width - w * scale) / 2 - (b.minX - PAD) * scale;
  state.panY = (rect.height - h * scale) / 2 - (b.minY - PAD) * scale;
  applyTransform();
}

function zoomAt(clientX, clientY, factor) {
  const rect = els.svg.getBoundingClientRect();
  const px = clientX - rect.left, py = clientY - rect.top;
  const next = clamp(state.zoom * factor, 0.08, 4);
  const k = next / state.zoom;
  state.panX = px - k * (px - state.panX);
  state.panY = py - k * (py - state.panY);
  state.zoom = next;
  applyTransform();
}

/* ------------------------------------------------------------ 14. export */
const EXPORT_CSS = [
  '.card{fill:#fff;stroke:#d6dbe1;stroke-width:1.5}',
  '.label{fill:#14181d;font:12.5px system-ui,Arial}',
  '.icon{font:700 13px system-ui,Arial}',
  '.toggle{fill:#5b6572;font:13px system-ui,Arial}',
  '.edge{fill:none;stroke:#d6dbe1;stroke-width:1.5}',
  '.node.status-green .card{fill:#e6f4ec;stroke:#1b7f4b;stroke-width:2}',
  '.node.status-green .icon{fill:#1b7f4b}',
  '.node.status-amber .card{fill:#fdf3dd;stroke:#a86a00;stroke-width:2;stroke-dasharray:6 4}',
  '.node.status-amber .icon{fill:#a86a00}',
  '.node.status-red .card{fill:#fdeceb;stroke:#b3261e;stroke-width:2;stroke-dasharray:3 3}',
  '.node.status-red .icon{fill:#b3261e}',
  '.node.status-none .card{fill:#eceff3;stroke:#d6dbe1;stroke-dasharray:2 5}',
  '.node.status-none .icon{fill:#5b6572}'
].join('\n');

function serializeForExport() {
  const clone = els.svg.cloneNode(true);
  const b = state.layout.bounds;
  const w = b.maxX - b.minX + 2 * PAD, h = b.maxY - b.minY + 2 * PAD;
  clone.setAttribute('xmlns', NS);
  clone.setAttribute('viewBox', (b.minX - PAD) + ' ' + (b.minY - PAD) + ' ' + w + ' ' + h);
  clone.setAttribute('width', String(Math.min(w, 2400)));
  clone.setAttribute('height', String(Math.min(h, 2400)));
  const vp = clone.querySelector('#viewport');
  if (vp) vp.removeAttribute('transform');
  const style = svgEl('style', {});
  style.textContent = EXPORT_CSS;
  clone.insertBefore(style, clone.firstChild);
  return new XMLSerializer().serializeToString(clone);
}

function download(name, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = el('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 500);
}

/* ----------------------------------------------------------- 15. storage */
function storageAvailable() {
  try {
    const k = '__treeviz_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch (e) { return false; }
}
function saveSession() {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      json: state.model ? JSON.stringify(state.model) : '',
      lang: lang,
      theme: state.theme,
      collapsed: Array.from(state.collapsed)
    }));
  } catch (e) { /* quota or privacy mode: ignore */ }
}
function loadSession() {
  if (!storageAvailable()) return null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

/* -------------------------------------------------- 16. orchestration */
function refreshAll() {
  const errors = state.model ? validateModel(state.model) : [];
  state.errors = errors;
  state.statuses = state.model ? computeStatuses(state.model) : Object.create(null);
  state.health = state.model ? computeHealth(state.model, state.statuses) : null;
  if (state.model) {
    const ids = Object.create(null);
    (function walk(n) { ids[n.id] = true; if (n.children) n.children.forEach(walk); })(state.model.root);
    Array.from(state.collapsed).forEach(function (id) { if (!ids[id]) state.collapsed.delete(id); });
    if (state.selectedId && !ids[state.selectedId]) state.selectedId = null;
  }
  manageLayout();
  renderTree();
  renderErrors();
  renderHealth();
  renderDetails();
  els.input.value = state.model ? JSON.stringify(state.model, null, 2) : els.input.value;
  updatePlaybackUI();
  saveSession();
}

function renderFromText(text) {
  const res = parseInput(text);
  if (res.model) {
    state.model = res.model;
    stopPlayback();
    state.playback.steps = [];
    state.playback.active = false;
    state.selectedId = null;
    state.editingId = null;
    refreshAll();
    if (state.layout) fitToScreen();
  } else {
    state.model = null;
    state.errors = res.errors;
    state.health = null;
    state.statuses = Object.create(null);
    state.layout = null;
    state.index = null;
    renderTree();
    renderErrors();
    renderHealth();
    renderDetails();
  }
  return res;
}

function selectNode(id, focus) {
  state.selectedId = id;
  state.focusId = id;
  renderTree();
  renderDetails();
  if (focus && state.index && state.index[id]) {
    const g = els.svg.querySelector('.node[data-id="' + cssEscape(id) + '"]');
    if (g) g.focus({ preventScroll: true });
  }
}

function cssEscape(s) { return String(s).replace(/["\\]/g, '\\$&'); }

function neighbors(id) {
  // returns {parent, children, prev, next} for keyboard navigation
  const rec = state.index ? state.index[id] : null;
  if (!rec) return null;
  const parent = rec.parentId && state.index[rec.parentId] ? state.index[rec.parentId] : null;
  const siblings = parent ? visibleChildren(parent.node) : [state.model.root];
  const idx = siblings.findIndex(function (n) { return n.id === id; });
  return {
    parent: parent ? parent.id : null,
    children: visibleChildren(rec.node).map(function (n) { return n.id; }),
    prev: idx > 0 ? siblings[idx - 1].id : null,
    next: idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1].id : null
  };
}

/* ------------------------------------------------------------ 17. events */
function wireEvents() {
  els.btnRender.addEventListener('click', function () { renderFromText(els.input.value); });

  els.input.addEventListener('input', debounce(function () { saveSession(); }, 600));

  els.example.addEventListener('change', function () {
    const key = els.example.value;
    if (!key || !window.TREE_EXAMPLES || !window.TREE_EXAMPLES[key]) return;
    els.input.value = JSON.stringify(window.TREE_EXAMPLES[key], null, 2);
    renderFromText(els.input.value);
  });

  els.btnUpload.addEventListener('click', function () { els.file.click(); });
  els.file.addEventListener('change', function () {
    const f = els.file.files && els.file.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = function () { els.input.value = String(reader.result); renderFromText(els.input.value); };
    reader.onerror = function () { els.errors = [{ path: '$', rule: 'file', message: 'Could not read the file.' }]; renderErrors(); };
    reader.readAsText(f);
  });

  // playback
  els.btnDown.addEventListener('click', function () { startPlayback('down'); });
  els.btnUp.addEventListener('click', function () { startPlayback('up'); });
  els.btnShowAll.addEventListener('click', showAll);
  els.btnPlay.addEventListener('click', function () {
    if (state.playback.playing) pause(); else play();
  });
  els.btnStepBack.addEventListener('click', function () { stepBy(-1); });
  els.btnStepFwd.addEventListener('click', function () { stepBy(1); });
  els.speed.addEventListener('input', function () {
    state.playback.speed = Number(els.speed.value) || 1;
    if (state.playback.playing) schedule();
  });

  // zoom
  els.btnZoomIn.addEventListener('click', function () {
    const r = els.svg.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.2);
  });
  els.btnZoomOut.addEventListener('click', function () {
    const r = els.svg.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.2);
  });
  els.btnFit.addEventListener('click', fitToScreen);

  // edit / export
  els.btnExpand.addEventListener('click', function () {
    state.collapsed.clear();
    refreshAll();
  });
  els.btnCopy.addEventListener('click', function () {
    const text = state.model ? JSON.stringify(state.model, null, 2) : els.input.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash(els.btnCopy, t('copied')); },
        function () { flash(els.btnCopy, t('copyFailed')); });
    } else {
      flash(els.btnCopy, t('copyFailed'));
    }
  });
  els.btnDownload.addEventListener('click', function () {
    if (!state.model) return;
    download('tree.json', 'application/json', JSON.stringify(state.model, null, 2));
  });
  els.btnSvg.addEventListener('click', function () {
    if (!state.layout) return;
    download('tree.svg', 'image/svg+xml', serializeForExport());
  });
  els.btnPng.addEventListener('click', function () {
    if (!state.layout) return;
    const svgStr = serializeForExport();
    const img = new Image();
    img.onload = function () {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, img.width * scale);
      canvas.height = Math.max(1, img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function (blob) {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = el('a');
        a.href = url;
        a.download = 'tree.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 500);
      }, 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  });

  // theme + language
  els.theme.addEventListener('change', function () {
    setTheme(els.theme.value);
    saveSession();
  });
  els.lang.addEventListener('change', function () {
    setLang(els.lang.value);
    saveSession();
  });

  // pointer interactions on the tree
  const svg = els.svg;
  const pointers = new Map();
  let pinchStart = null;

  svg.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });

  svg.addEventListener('pointerdown', function (e) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      pinchStart = { d: distance(pts[0], pts[1]), zoom: state.zoom,
                     cx: (pts[0].x + pts[1].x) / 2, cy: (pts[0].y + pts[1].y) / 2 };
    }
    state.dragMoved = false;
    svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
  });

  svg.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2 && pinchStart) {
      const pts = Array.from(pointers.values());
      const d = distance(pts[0], pts[1]);
      zoomAt(pinchStart.cx, pinchStart.cy, d / Math.max(1, pinchStart.d));
      pinchStart.d = d;
      state.dragMoved = true;
      return;
    }
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 1) state.dragMoved = true;
    if (state.dragMoved) {
      state.panX += dx;
      state.panY += dy;
      applyTransform();
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
    setTimeout(function () { state.dragMoved = false; }, 0);
  }
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);
  svg.addEventListener('pointerleave', endPointer);

  // background click clears selection
  svg.addEventListener('click', function (e) {
    if (state.dragMoved) return;
    if (e.target && e.target.classList && e.target.classList.contains('card')) return;
    if (e.target && e.target.closest && e.target.closest('.node')) return;
    state.selectedId = null;
    renderTree();
    renderDetails();
  });

  // keyboard navigation
  svg.addEventListener('keydown', function (e) {
    if (!state.layout) return;
    const cur = state.focusId || (state.model ? state.model.root.id : null);
    const nb = cur ? neighbors(cur) : null;
    let next = null;
    if (e.key === 'ArrowDown' && nb && nb.children.length) next = nb.children[0];
    else if (e.key === 'ArrowUp' && nb && nb.parent) next = nb.parent;
    else if (e.key === 'ArrowRight' && nb && nb.next) next = nb.next;
    else if (e.key === 'ArrowLeft' && nb && nb.prev) next = nb.prev;
    else if (e.key === 'Enter' && cur) {
      state.selectedId = cur;
      renderTree();
      renderDetails();
      els.detailsBody.querySelector('button, textarea, input, select') && els.detailsBody.querySelector('button, textarea, input, select').focus();
      e.preventDefault();
      return;
    } else if (e.key === ' ' && cur) {
      toggleCollapse(cur);
      e.preventDefault();
      return;
    } else if (e.key === '+' || e.key === '=') {
      const r = els.svg.getBoundingClientRect();
      zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.2);
      e.preventDefault();
      return;
    } else if (e.key === '-') {
      const r = els.svg.getBoundingClientRect();
      zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.2);
      e.preventDefault();
      return;
    } else if (e.key === '0') { fitToScreen(); e.preventDefault(); return; }
    if (next) {
      state.focusId = next;
      selectNode(next, true);
      e.preventDefault();
    }
  });

  window.addEventListener('resize', debounce(function () {
    if (state.layout) fitToScreen();
  }, 250));
}

function distance(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.sqrt(dx * dx + dy * dy); }
function debounce(fn, ms) {
  let id = null;
  return function () {
    const args = arguments, self = this;
    clearTimeout(id);
    id = setTimeout(function () { fn.apply(self, args); }, ms);
  };
}
function flash(button, text) {
  const old = button.textContent;
  button.textContent = text;
  setTimeout(function () { button.textContent = old; }, 1400);
}

/* ------------------------------------------------- 18. theme / language */
function setTheme(value) {
  state.theme = value;
  document.documentElement.setAttribute('data-theme', value);
  els.theme.value = value;
}
function setLang(value) {
  lang = (I18N[value] ? value : 'en');
  document.documentElement.setAttribute('lang', lang);
  els.lang.value = lang;
  applyI18n();
  if (state.model) { renderHealth(); renderDetails(); }
  updatePlaybackUI();
}
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(function (n) { n.textContent = t(n.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-ph]').forEach(function (n) { n.setAttribute('placeholder', t(n.getAttribute('data-i18n-ph'))); });
  document.title = t('appTitle');
}

/* --------------------------------------------------------------- 19. init */
function cacheEls() {
  ['svg', 'empty', 'input', 'errors', 'verdict', 'blocking', 'health', 'theme', 'lang',
   'btn-render', 'btn-upload', 'file', 'example', 'btn-down', 'btn-up', 'btn-show-all',
   'btn-play', 'btn-step-back', 'btn-step-fwd', 'speed', 'play-status', 'btn-zoom-in',
   'btn-zoom-out', 'btn-fit', 'zoom-badge', 'btn-expand', 'btn-copy', 'btn-download',
   'btn-svg', 'btn-png', 'details-body'].forEach(function (id) {
    els[camel(id)] = $(id);
  });
  els.countVerified = $('count-verified');
  els.countUnverified = $('count-unverified');
  els.countFailed = $('count-failed');
  els.countRc = $('count-rc');
}
function camel(id) {
  return id.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
}

function init() {
  cacheEls();
  wireEvents();

  const session = loadSession();
  if (session) {
    if (session.theme) setTheme(session.theme);
    if (session.lang) setLang(session.lang);
    if (Array.isArray(session.collapsed)) state.collapsed = new Set(session.collapsed);
  } else {
    setTheme('auto');
    setLang(document.documentElement.getAttribute('lang') === 'vi' ? 'vi' : 'en');
  }

  let startText = session && session.json ? session.json : '';
  if (!startText && window.TREE_EXAMPLES && window.TREE_EXAMPLES.general) {
    startText = JSON.stringify(window.TREE_EXAMPLES.general, null, 2);
  }
  if (startText) {
    els.input.value = startText;
    renderFromText(startText);
  }
  applyI18n();
  updatePlaybackUI();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
