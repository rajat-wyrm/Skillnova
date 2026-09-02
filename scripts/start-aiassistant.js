import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(__dirname, '..', 'aiassistant', 'aiassistant-backend');
const venvDir = path.join(backendDir, '.venv');
const venvBin = process.platform === 'win32' ? 'Scripts' : 'bin';
const venvPython = path.join(venvDir, venvBin, process.platform === 'win32' ? 'python.exe' : 'python');

async function findPython() {
  if (fs.existsSync(venvPython)) {
    return venvPython;
  }

  const candidates = process.platform === 'win32'
    ? ['python', 'py -3']
    : ['python3', 'python'];

  for (const candidate of candidates) {
    try {
      await execCommand(candidate, ['--version']);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

function execCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: true,
      stdio: 'ignore',
    });

    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
    });

    child.on('error', reject);
  });
}

async function main() {
  const python = await findPython();
  if (!python) {
    console.error('Unable to find Python. Install Python 3 and ensure it is on your PATH.');
    process.exit(1);
  }

  const child = spawn(python, ['main.py'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      AIASSISTANT_RELOAD: 'false',
    },
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', (err) => {
    console.error('Failed to start the AIAssistant backend:', err.message);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
