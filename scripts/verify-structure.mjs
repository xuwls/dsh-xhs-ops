import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const path = (relative) => fileURLToPath(new URL(relative, root));
const required = [
  'cordis.patch.yml',
  'SKILL.md',
  'mapping.md',
  'README.md',
  'config/persona.md',
  'config/knowledge-base/README.md',
  'config/knowledge-base/_template.md',
  'config/knowledge-base/accounts/2026-11-06-akuai-ai-notes-positioning.md',
  ...['accounts', 'topics', 'patterns', 'actions', 'reviews']
    .map((directory) => `config/knowledge-base/${directory}/README.md`),
  ...[
    'xhs-account-analysis',
    'xhs-comment-ops',
    'xhs-eval-patterns',
    'xhs-home-feed-analysis',
    'xhs-knowledge-base',
    'xhs-publish-flows',
    'xhs-runtime-rules',
    'xhs-topic-ideation',
    'xhs-viral-copy-flow',
  ].map((name) => `references/${name}.md`),
];

await Promise.all(required.map((relative) => access(path(relative))));

const pkg = JSON.parse(await readFile(path('package.json'), 'utf8'));
for (const entry of ['lib', 'config', 'references', 'SKILL.md', 'mapping.md', 'README.md', 'cordis.patch.yml']) {
  assert(pkg.files.includes(entry), `package.json files missing ${entry}`);
}

const skill = await readFile(path('SKILL.md'), 'utf8');
for (const match of skill.matchAll(/`((?:config|references)\/[^`\n]+)`/g)) {
  await access(path(match[1]));
}
for (const stale of ['`persona.md`', '`knowledge-base/', 'examples/', 'profile=`openclaw`']) {
  assert(!skill.includes(stale), `SKILL.md contains stale reference: ${stale}`);
}
assert(skill.includes('config/persona.md'));
assert(skill.includes('config/knowledge-base/README.md'));

console.log(`xhs-ops structure OK: ${required.length} required resources; SKILL.md references resolve`);
