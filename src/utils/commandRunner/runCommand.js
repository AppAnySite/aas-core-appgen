import { exec } from 'child_process';
import { promisify } from 'util';
import log from '../logger';

const execAsync = promisify(exec);

export default async function runCommand(command, args = [], options = {}) {
    const FN = "runCommand";
    const FILE = "runCommand.js";
    
    try {
        // Build the full command string for exec
        const fullCommand = `${command} ${args.join(' ')}`;
        
        log('info', `Executing command with exec: ${fullCommand}`);

        // Use exec for npx compatibility (npx requires shell)
        const { stdout, stderr } = await execAsync(fullCommand, {
            cwd: options.cwd,
            env: options.env || process.env
        });

        // Log output
        if (stdout) {
            log('info', `Command stdout: ${stdout.trim()}`);
        }

        if (stderr) {
            log('warn', `Command stderr: ${stderr.trim()}`);
        }

        return { stdout, stderr };
    } catch (error) {
        log('error', `Command execution failed: ${error.message}`);
        throw error;
    }
}
