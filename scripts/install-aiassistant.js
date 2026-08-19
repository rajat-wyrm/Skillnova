import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(__dirname, '..', 'aiassistant', 'aiassistant-backend');
const venvDir = path.join(backendDir, '.venv');
const venvBin = process.platform === 'win32' ? 'Scripts' : 'bin';
const venvPython = path.join(venvDir, venvBin, process.platform === 'win32' ? 'python.exe' : 'python');

function execCommand(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      stdio: 'inherit',
      ...opts,
    });

    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed: ${command} ${args ? args.join(' ') : ''}`));
    });

    child.on('error', reject);
  });
}

async function findSystemPython() {
  const candidates = process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python'];

  for (const candidate of candidates) {
    try {
      if (candidate === 'py') {
        await execCommand('py', ['-3', '--version'], { stdio: 'ignore' });
        return 'py';
      }
      await execCommand(candidate, ['--version'], { stdio: 'ignore' });
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}

async function main() {
  const python = await findSystemPython();
  if (!python) {
    console.error('Python 3 is required to install AIAssistant dependencies. Please install Python and try again.');
    process.exit(1);
  }

  if (!fs.existsSync(venvDir)) {
    console.log('Creating Python virtual environment for AIAssistant...');
    await execCommand(python, ['-m', 'venv', venvDir], { cwd: backendDir });
  }

  const venvInterpreter = fs.existsSync(venvPython) ? venvPython : python;
  console.log('Upgrading pip in the AIAssistant virtual environment...');
  await execCommand(venvInterpreter, ['-m', 'pip', 'install', '--upgrade', 'pip'], { cwd: backendDir });
  console.log('Installing AIAssistant dependencies...');
  await execCommand(venvInterpreter, ['-m', 'pip', 'install', '-r', 'requirements.txt'], { cwd: backendDir });
  console.log('AIAssistant dependencies installed successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
