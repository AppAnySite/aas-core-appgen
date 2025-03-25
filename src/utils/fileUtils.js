const fs = require('fs');
const path = require('path');

/**
 * Ensures that a directory exists. If the directory does not exist, it is created.
 * @param {string} dir - The directory path.
 */
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Writes content to a specified file.
 * @param {string} filePath - The full path to the file.
 * @param {string} content - The content to write.
 */
function writeFile(filePath, content) {
  const directory = path.dirname(filePath);
  ensureDirectoryExists(directory);
  fs.writeFileSync(filePath, content);
}

module.exports = { ensureDirectoryExists, writeFile };
