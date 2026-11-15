// Hook "Stop" do Claude Code: ao fim da resposta, roda `npm run check` se houve mudança fora da documentação.
// Se o check falhar, sai com código 2 e devolve o resultado ao Claude para ele corrigir.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  // sem entrada válida: segue como se fosse a primeira vez
}

// Já estamos continuando por causa deste hook: não entra em laço.
if (input.stop_hook_active) process.exit(0);

const status = spawnSync('git', ['status', '--porcelain'], { encoding: 'utf8' });
const changedCode = (status.stdout ?? '')
  .split('\n')
  .filter(Boolean)
  .map((line) => line.slice(3))
  .some((file) => !file.startsWith('docs/') && !file.endsWith('.md'));

if (!changedCode) process.exit(0);

const result = spawnSync('npm', ['run', 'check', '--silent'], { encoding: 'utf8', shell: true });
if (result.status === 0) process.exit(0);

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.split('\n').slice(-60).join('\n');
console.error(`npm run check falhou. Corrija antes de encerrar:\n${output}`);
process.exit(2);
