import shell from 'shelljs';

/**
 * Checks if a command is available in the shell.
 * @param {string} cmd - The command to check.
 */
const checkCommand = (cmd) => {
  if (!shell.which(cmd)) {
    console.log(`Command ${cmd} not found. Please install it.`);
    process.exit(1);
  }
};

export default checkCommand;
