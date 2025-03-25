import ICreateCommandValidator from './ICreateCommandValidator';

/**
 * CreateCommandValidator class.
 * Validates the options for creating a project.
 * @extends ICreateCommandValidator
 */
class CreateCommandValidator extends ICreateCommandValidator {
  /**
   * Validates the options.
   * @param {Object} options - Options to validate.
   * @throws Will throw an error if validation fails.
   */
  validate(options) {
    if (!options.name) {
      throw new Error('Project name is required.');
    }
    if (!options.url) {
      throw new Error('URL is required.');
    }
    if (!options.directory) {
      throw new Error('Project directory is required.');
    }
  }
}

export default CreateCommandValidator;
