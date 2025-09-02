/**
 * Interface for BuildCommand.
 * @interface
 */
class IBuildCommand {
  /**
   * Executes the build command.
   * @param {Object} options - Options for executing the build command.
   */
  execute(options) {
    throw new Error('Method not implemented');
  }
}

module.exports = IBuildCommand;
