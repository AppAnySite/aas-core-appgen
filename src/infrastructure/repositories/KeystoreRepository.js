/**
 * Keystore Repository Implementation
 * 
 * High-performance implementation of keystore management
 * with automatic keystore creation and configuration.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { AppConfig } from '../../domain/entities/AppConfig.js';

export class KeystoreRepository {
    constructor() {
        this.timeoutMs = 60000; // 1 minute
        this.maxRetries = 3;
        this.keystoreCache = new Map();
    }

    /**
     * Create keystore for project
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @returns {Promise<Object>} Keystore result
     */
    async createKeystore(projectPath, appConfig) {
        const startTime = Date.now();
        
        try {
            // Get keystore configuration
            const keystoreConfig = appConfig.build?.android?.keystore || {};
            
            // Prepare keystore path
            const keystoreDir = path.join(projectPath, 'build', 'android', 'keystores');
            const keystorePath = path.join(keystoreDir, `${appConfig.projectName}-release-key.keystore`);
            
            // Ensure keystore directory exists
            await fs.mkdir(keystoreDir, { recursive: true });
            
            // Create keystore using keytool
            await this.executeKeytoolCommand(keystorePath, appConfig, keystoreConfig);
            
            // Update gradle.properties with keystore configuration
            await this.updateGradleProperties(projectPath, appConfig, keystorePath);
            
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                keystorePath,
                projectName: appConfig.projectName,
                duration
            };
        } catch (error) {
            throw new Error(`Keystore creation failed: ${error.message}`);
        }
    }

    /**
     * Execute keytool command to create keystore
     * @param {string} keystorePath - Path to keystore file
     * @param {AppConfig} appConfig - App configuration
     * @param {Object} keystoreConfig - Keystore configuration
     * @returns {Promise<void>}
     */
    async executeKeytoolCommand(keystorePath, appConfig, keystoreConfig) {
        return new Promise((resolve, reject) => {
            const certInfo = keystoreConfig.certificateInfo || {};
            
            const args = [
                '-genkeypair',
                '-v',
                '-storetype', keystoreConfig.storeType,
                '-keystore', keystorePath,
                '-alias', keystoreConfig.defaultAlias,
                '-keyalg', keystoreConfig.keyAlgorithm,
                '-keysize', keystoreConfig.keySize.toString(),
                '-validity', keystoreConfig.validity.toString(),
                '-storepass', keystoreConfig.defaultPassword,
                '-keypass', keystoreConfig.defaultPassword,
                '-dname', `"CN=${certInfo.commonName},OU=${certInfo.organizationalUnit},O=${certInfo.organization},L=${certInfo.locality},ST=${certInfo.state},C=${certInfo.country}"`,
                '-noprompt'
            ];
            
            const keytoolProcess = spawn('keytool', args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                env: { ...process.env }
            });

            let stdout = '';
            let stderr = '';
            let isCompleted = false;
            let timeoutId = null;

            // Handle stdout
            keytoolProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            // Handle stderr
            keytoolProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Handle process completion
            keytoolProcess.on('close', (code) => {
                isCompleted = true;
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                if (code === 0) {
                    resolve({ success: true, stdout, stderr });
                } else {
                    reject(new Error(`Keytool failed with code ${code}. Stderr: ${stderr}`));
                }
            });

            // Handle process errors
            keytoolProcess.on('error', (error) => {
                isCompleted = true;
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                
                reject(new Error(`Failed to execute keytool: ${error.message}`));
            });

            // Set timeout
            timeoutId = setTimeout(() => {
                if (!isCompleted) {
                    isCompleted = true;
                    keytoolProcess.kill('SIGTERM');
                    reject(new Error('Keytool execution timed out'));
                }
            }, this.timeoutMs);
        });
    }

    /**
     * Update gradle.properties with keystore configuration
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @param {string} keystorePath - Path to keystore file
     */
    async updateGradleProperties(projectPath, appConfig, keystorePath) {
        const gradlePropertiesPath = path.join(projectPath, 'android', 'gradle.properties');
        const keystoreConfig = appConfig.build?.android?.keystore || {};
        
        let gradleProperties = '';
        
        try {
            gradleProperties = await fs.readFile(gradlePropertiesPath, 'utf8');
        } catch (error) {
            // File doesn't exist, start with empty content
        }
        
        // Add keystore configuration
        const keystoreConfigLines = [
            '',
            '# AppAnySite Keystore Configuration',
            `MYAPP_UPLOAD_STORE_FILE=../build/android/keystores/${appConfig.projectName}-release-key.keystore`,
            `MYAPP_UPLOAD_KEY_ALIAS=${keystoreConfig.defaultAlias}`,
            `MYAPP_UPLOAD_STORE_PASSWORD=${keystoreConfig.defaultPassword}`,
            `MYAPP_UPLOAD_KEY_PASSWORD=${keystoreConfig.defaultPassword}`
        ];
        
        gradleProperties += keystoreConfigLines.join('\n');
        await fs.writeFile(gradlePropertiesPath, gradleProperties, 'utf8');
        
        // Update Hermes path in build.gradle with absolute path
        await this.updateHermesPath(projectPath, appConfig);
    }
    
    /**
     * Update Hermes path in build.gradle with absolute path
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     */
    async updateHermesPath(projectPath, appConfig) {
        const buildGradlePath = path.join(projectPath, 'android', 'app', 'build.gradle');
        
        try {
            let buildGradle = await fs.readFile(buildGradlePath, 'utf8');
            
            // Update Hermes path with absolute path
            const hermesPath = path.join(projectPath, 'node_modules', 'react-native', 'sdks', 'hermesc', 'linux64-bin', 'hermesc');
            const hermesPlaceholder = `${appConfig.projectName}_HERMES_PATH_PLACEHOLDER`;
            
            if (buildGradle.includes(hermesPlaceholder)) {
                buildGradle = buildGradle.replace(hermesPlaceholder, hermesPath);
                await fs.writeFile(buildGradlePath, buildGradle, 'utf8');
            }
        } catch (error) {
            // If build.gradle doesn't exist yet, that's okay - it will be created later
            console.warn('Could not update Hermes path:', error.message);
        }
    }

    /**
     * Get repository statistics
     * @returns {Object} Repository statistics
     */
    getStats() {
        return {
            keystoreCacheSize: this.keystoreCache.size,
            timeoutMs: this.timeoutMs,
            maxRetries: this.maxRetries
        };
    }

    /**
     * Clear keystore cache
     */
    clearCache() {
        this.keystoreCache.clear();
    }
}
