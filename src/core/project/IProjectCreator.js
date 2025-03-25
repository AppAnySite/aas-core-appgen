/**
 * Interface for ProjectCreator.
 * @interface
 */
class IProjectCreator {
  /**
   * Creates a new project.
   * @param {Object} options - Options for creating the project.
   * @param {string} options.name - Name of the project.
   * @param {string} options.directory - Directory where the project will be created.
   */
  createProject(options) {
    throw new Error('Method not implemented');
  }

  /**
   * Updates the app icon.
   * @param {string} iconPath - Path to the new icon.
   */
  updateIcon(iconPath) {
    throw new Error('Method not implemented');
  }

  /**
   * Updates the splash screen.
   * @param {string} splashPath - Path to the new splash screen.
   */
  updateSplashScreen(splashPath) {
    throw new Error('Method not implemented');
  }
}

export default IProjectCreator;
