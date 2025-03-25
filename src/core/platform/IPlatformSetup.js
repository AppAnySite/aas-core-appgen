/**
 * Interface for PlatformSetup.
 * @interface
 */
class IPlatformSetup {
  /**
   * Sets up the specified platform.
   * @param {string} platform - The platform to set up.
   * @param {string} url - The URL to be used in the WebView component.
   */
  setupPlatform(platform, url) {
    throw new Error('Method not implemented');
  }

  /**
   * Removes the specified platform.
   * @param {string} platform - The platform to remove.
   */
  removePlatform(platform) {
    throw new Error('Method not implemented');
  }
}

export default IPlatformSetup;
