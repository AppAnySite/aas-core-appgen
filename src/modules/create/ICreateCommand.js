/**
 * Interface for CreateCommand.
 * @interface
 */
class ICreateCommand {
  /**
   * Executes the command.
   * @param {Object} options - Options for executing the command.
   */
  execute(options) {
    throw new Error('Method not implemented');
  }
}

export default ICreateCommand;
