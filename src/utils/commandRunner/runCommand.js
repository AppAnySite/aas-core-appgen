import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function runCommand(command, args = [], options = {}) {
    const FN = "runCommand";
    
    try {
        // Build the full command string for exec
        const fullCommand = `${command} ${args.join(' ')}`;
        
        Logger.info('Executing command with exec', {
            file: FILE,
            function: FN,
            command: fullCommand,
            cwd: options.cwd || process.cwd()
        });

        // Use exec for npx compatibility (npx requires shell)
        const { stdout, stderr } = await execAsync(fullCommand, {
            cwd: options.cwd,
            env: options.env || process.env
        });

        // Log output
        if (stdout) {
            Logger.info('Command stdout', {
                file: FILE,
                function: FN,
                stdout: stdout.trim()
            });
        }

        if (stderr) {
            Logger.warn('Command stderr', {
                file: FILE,
                function: FN,
                stderr: stderr.trim()
            });
        }

        return { stdout, stderr };
    } catch (error) {
        Logger.error('Command execution failed', {
            file: FILE,
            function: FN,
            error: error.message,
            command: `${command} ${args.join(' ')}`
        });
        throw error;
    }
}
