import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Runs a shell command and logs the output.
 * @param {string} command - The command to run.
 * @param {Array<string>} args - The command arguments.
 * @param {Object} [options={}] - Options for running the command.
 * @returns {Promise<void>}
 */
const runCommand = (command, args, options = {}) => {
  return new Promise((resolve, reject) => {
    const logFilePath = path.join(options.logDirectory || '', 'react-native.log');
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], shell: true, ...options });

    if (options.input) {
      child.stdin.write(options.input);
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      logStream.write(data.toString());
    });

    child.stderr.on('data', (data) => {
      logStream.write(data.toString());
    });

    child.on('close', (code) => {
      logStream.end();
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command ${command} ${args.join(' ')} failed with code ${code}. See ${logFilePath} for details.`));
      }
    });
  });
};

export default runCommand;
