# reasoning-suite

Four AI skills that teach a model HOW to reason, plus a standalone visualizer for the
tree those skills produce.

```
reasoning-suite/
├── 1-general/     universal framework + the tree-json contract
├── 2-debug/       symptom -> hypotheses -> evidence -> fix
├── 3-code/        requirement -> acceptance criteria -> runnable parts
├── 4-web/         user goal -> checkable web parts -> flow walk
├── tree.schema.json
├── TEST-PLAN.md
└── visualizer/    static site (HTML/CSS/JS, no build, no backend)
```

Every skill emits one fenced `tree-json` block after the prose answer; the visualizer
parses, validates, renders, plays and edits that tree.

## 0. Install with npx (fastest)
The package ships one CLI with three commands and no dependencies (Node >= 18):

```bash
npx reasoning-suite install        # copies the 4 skills + tree.schema.json into ~/.claude/skills
npx reasoning-suite visualizer     # serves the viewer on http://127.0.0.1:8080
npx reasoning-suite tree validate ./my-tree.json   # schema check, exit 1 when invalid
```

Useful flags: `install --dir <skills-root>` (other agent, other layout),
`install --only 1-general,2-debug`, `install --force` (overwrite), `install --dry-run`,
`visualizer --port 8081 --no-open`, `tree validate -` (read stdin), `tree validate <file> --json`.

Not on npm yet? Fetch it from the repo. npm 12 blocks git and remote-tarball fetches by
default (`allow-git = none`, `allow-remote = none`), so either pass the flag for one run
or allow it once:

```bash
npx --yes --allow-git=all github:vinhan432/reasoning-suite install   # one run, from the repo
npm config set allow-git all                                        # or allow it permanently

git clone --depth 1 https://github.com/vinhan432/reasoning-suite.git
npx --yes ./reasoning-suite install          # local checkout - no flags needed
npm pack && npx --yes ./reasoning-suite-1.0.0.tgz install   # local tarball

npx --yes --allow-remote=all \
  https://github.com/vinhan432/reasoning-suite/archive/refs/heads/main.tar.gz install
```

`tree validate` prints one line per problem as `path - message [rule]`, then the node
counts and the READY / NOT READY verdict - the same rules the visualizer enforces.

## 1. Install the skills
1. Copy the four folders into the skills directory of your agent:
   - Claude Code / compatible: `~/.claude/skills/` (project-local: `.claude/skills/`)
   - any other tool: the folder that holds `<name>/SKILL.md` skill packages
2. Keep the folder names (`1-general`, `2-debug`, ...) and the `references/` subfolders;
   the skills link to them by relative path.
3. `tree.schema.json` lives at the suite root because `1-general/references/tree-format.md`
   points at `../tree.schema.json`. If you install only one skill, copy that file next to
   the skill so the relative link still resolves.
4. Restart the agent so it re-reads the skill index. Verify: a prompt like
   "should we shard the orders table?" must load `general-reasoning`, and
   "fix this pytest flake" must load `debug-reasoning`.

Installing all four is optional: `2-4` reference `1-general`, so install `1-general`
whenever you install any other one. The three domain skills never repeat the base
procedure.

## 2. Run the visualizer locally
No build step:
- Option A: double-click `visualizer/index.html` (works offline; examples are embedded
  in `examples/data.js` because browsers block `fetch()` on `file://`).
- Option B (recommended for file upload tests): `cd visualizer && python -m http.server 8080`,
  then open `http://localhost:8080`.

Paste a `tree-json` block (or a whole markdown answer containing one) and press Render,
or pick one of the four examples (all-green / failed leaf / reverse-check gap / deep tree).

## 3. Deploy it free
The site is fully static and needs no server:
- GitHub Pages: push the repo, Settings -> Pages -> Deploy from branch -> `/` (root) or
  `/reasoning-suite/visualizer` if you publish a subfolder.
- Netlify: drag the `visualizer/` folder onto app.netlify.com/drop.
- Vercel: `vercel deploy --prod` from inside `visualizer/` (framework preset: Other).
- Cloudflare Pages: connect the repo, build command empty, output directory `visualizer`.

Nothing calls the network at runtime, so the page also works from a USB stick or a
local copy with the Wi-Fi off.

## 4. Use the full loop
1. Ask the agent a non-trivial question. It reasons root -> branches -> leaves, runs the
   upward check, then emits the `tree-json` block.
2. Copy that block into the visualizer (or save it and use Upload, or keep it as a
   `examples/*.json`-style file).
3. Read the top bar: READY only when every leaf is verified and no check is `fail`/`gap`.
4. Click the blocking chips to jump to the offending node; use UP playback to watch the
   reverse check land and the status propagate.
5. Fix the failed/unverified nodes as new evidence arrives (double-click to edit), then
   re-run the reasoning with the fixed tree - the model must not patch the conclusion.
6. Export the final tree (JSON for records, PNG/SVG for a review or a ticket).

## 5. Validate anything by hand
`tree.schema.json` is standard JSON Schema 2020-12; `npx ajv-cli validate` or any online
validator accepts it. The visualizer implements the same rules plus two extras that JSON
Schema cannot express: unique node ids, and `reverse_check[].target` must exist.

## 6. Test the suite
`TEST-PLAN.md` holds the 12 skill prompts (easy / hard / non-trigger per skill) with
pass checks and a defect-routing table, plus the visualizer manual checklist.
