/**
 * Pre-push smoke: verify vendored SDK, run app tests, production build.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const corePkg = path.join(root, 'playfield', 'packages', 'core', 'package.json');

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit', env: process.env });
}

if (!fs.existsSync(corePkg)) {
  console.error('Missing vendored Playfield SDK. Run: npm run sync-playfield');
  process.exit(1);
}

if (!process.env.CI) {
  run('npm run sync-playfield');
}

run('npm run build --prefix ./playfield');
run(
  'npx vitest run src/game/__tests__/smoke.test.ts src/game/__tests__/playfieldIntegration.test.ts src/game/__tests__/playthrough.test.ts'
);
run('npm test');
run('npm run build');

console.log('\nSmoke passed — OK to push.');
