/**
 * Android Build Repository Implementation
 * 
 * High-performance implementation of Android build operations
 * with optimized process management, keystore integration, and build automation.
 * 
 * @author AAS Development Team
 * @version 1.0.0
 * @license MIT
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { AppConfig } from '../../domain/entities/AppConfig.js';

export class AndroidBuildRepository {
    constructor() {
        this.timeoutMs = 600000; // 10 minutes
        this.maxRetries = 3;
        this.buildCache = new Map();
    }

    /**
     * Build Android debug APK
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @param {Object} options - Build options
     * @returns {Promise<Object>} Build result
     */
    async buildDebugAPK(projectPath, appConfig, options) {
        const startTime = Date.now();
        const progressCallback = options.progressCallback || (() => {});
        
        try {
            progressCallback(40, 'Validating Android project structure...');
            // Validate Android project structure
            await this.validateAndroidProject(projectPath);
            
            progressCallback(50, 'Preparing build environment...');
            // Prepare build environment
            await this.prepareBuildEnvironment(projectPath, appConfig, 'debug');
            
            progressCallback(60, 'Executing Gradle debug build...');
            // Execute debug build
            const result = await this.executeGradleBuild(projectPath, 'assembleDebug', {
                ...options,
                progressCallback: (progress, message) => {
                    // Map progress from 60-85% for the gradle build
                    const mappedProgress = 60 + (progress * 0.25);
                    progressCallback(mappedProgress, message);
                }
            });
            
            progressCallback(85, 'Copying APK to output directory...');
            // Get output file information
            const outputPath = path.join(projectPath, 'build', 'android', 'debug');
            const apkPath = path.join(outputPath, `${appConfig.projectName}-debug.apk`);
            
            // Ensure output directory exists
            await fs.mkdir(outputPath, { recursive: true });
            
            // Copy APK to output directory
            const sourceApkPath = path.join(projectPath, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
            await fs.copyFile(sourceApkPath, apkPath);
            
            // Get file size
            const stats = await fs.stat(apkPath);
            const fileSize = this.formatFileSize(stats.size);
            
            progressCallback(90, 'Debug APK build completed successfully');
            
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                outputPath: apkPath,
                fileSize,
                duration
            };
        } catch (error) {
            throw new Error(`Debug APK build failed: ${error.message}`);
        }
    }

    /**
     * Build Android release APK
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @param {Object} options - Build options
     * @returns {Promise<Object>} Build result
     */
    async buildReleaseAPK(projectPath, appConfig, options) {
        const startTime = Date.now();
        
        try {
            // Validate Android project structure
            await this.validateAndroidProject(projectPath);
            
            // Prepare build environment with keystore
            await this.prepareBuildEnvironment(projectPath, appConfig, 'release');
            
            // Execute release build
            const result = await this.executeGradleBuild(projectPath, 'assembleRelease', options);
            
            // Get output file information
            const outputPath = path.join(projectPath, 'build', 'android', 'release');
            const apkPath = path.join(outputPath, `${appConfig.projectName}-release.apk`);
            
            // Ensure output directory exists
            await fs.mkdir(outputPath, { recursive: true });
            
            // Copy APK to output directory
            const sourceApkPath = path.join(projectPath, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
            await fs.copyFile(sourceApkPath, apkPath);
            
            // Get file size
            const stats = await fs.stat(apkPath);
            const fileSize = this.formatFileSize(stats.size);
            
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                outputPath: apkPath,
                fileSize,
                duration,
                keystoreUsed: `${appConfig.projectName}-release-key.keystore`
            };
        } catch (error) {
            throw new Error(`Release APK build failed: ${error.message}`);
        }
    }

    /**
     * Build Android AAB bundle
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @param {Object} options - Build options
     * @returns {Promise<Object>} Build result
     */
    async buildAABBundle(projectPath, appConfig, options) {
        const startTime = Date.now();
        
        try {
            // Validate Android project structure
            await this.validateAndroidProject(projectPath);
            
            // Prepare build environment with keystore
            await this.prepareBuildEnvironment(projectPath, appConfig, 'release');
            
            // Execute AAB build
            const result = await this.executeGradleBuild(projectPath, 'bundleRelease', options);
            
            // Get output file information
            const outputPath = path.join(projectPath, 'build', 'android', 'aab');
            const aabPath = path.join(outputPath, `${appConfig.projectName}-release.aab`);
            
            // Ensure output directory exists
            await fs.mkdir(outputPath, { recursive: true });
            
            // Copy AAB to output directory
            const sourceAabPath = path.join(projectPath, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
            await fs.copyFile(sourceAabPath, aabPath);
            
            // Get file size
            const stats = await fs.stat(aabPath);
            const fileSize = this.formatFileSize(stats.size);
            
            const duration = Date.now() - startTime;
            
            return {
                success: true,
                outputPath: aabPath,
                fileSize,
                duration,
                keystoreUsed: `${appConfig.projectName}-release-key.keystore`
            };
        } catch (error) {
            throw new Error(`AAB bundle build failed: ${error.message}`);
        }
    }

    /**
     * Validate Android project structure
     * @param {string} projectPath - Path to the project
     * @throws {Error} If project structure is invalid
     */
    async validateAndroidProject(projectPath) {
        const requiredFiles = [
            'android/app/build.gradle',
            'android/gradle.properties',
            'android/gradlew',
            'android/settings.gradle'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(projectPath, file);
            try {
                await fs.access(filePath);
            } catch (error) {
                throw new Error(`Required Android file not found: ${file}`);
            }
        }
    }

    /**
     * Prepare build environment
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @param {string} buildType - Build type (debug/release)
     */
    async prepareBuildEnvironment(projectPath, appConfig, buildType) {
        // Update gradle.properties with build configuration
        await this.updateGradleProperties(projectPath, appConfig, buildType);
        
        // Update build.gradle with signing configuration for release builds
        if (buildType === 'release') {
            await this.updateBuildGradle(projectPath, appConfig);
        }
    }

    /**
     * Update gradle.properties with build configuration
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     * @param {string} buildType - Build type
     */
    async updateGradleProperties(projectPath, appConfig, buildType) {
        const gradlePropertiesPath = path.join(projectPath, 'android', 'gradle.properties');
        const buildConfig = appConfig.build?.android || {};
        
        let gradleProperties = await fs.readFile(gradlePropertiesPath, 'utf8');
        
        // Keystore configuration is handled by KeystoreRepository.js
        // No need to add it here to avoid duplication
    }

    /**
     * Update build.gradle with signing configuration
     * @param {string} projectPath - Path to the project
     * @param {AppConfig} appConfig - App configuration
     */
    async updateBuildGradle(projectPath, appConfig) {
        const buildGradlePath = path.join(projectPath, 'android', 'app', 'build.gradle');
        let buildGradle = await fs.readFile(buildGradlePath, 'utf8');
        
        // Add signing configuration if not exists
        if (!buildGradle.includes('signingConfigs.release')) {
            const signingConfig = `
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }`;
            
            // Insert signing config after debug config
            buildGradle = buildGradle.replace(
                /(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/,
                `$1${signingConfig}`
            );
            
            // Update release buildType to use release signing
            buildGradle = buildGradle.replace(
                /signingConfig signingConfigs\.debug/,
                'signingConfig signingConfigs.release'
            );
            
            await fs.writeFile(buildGradlePath, buildGradle, 'utf8');
        }
    }

    /**
     * Execute Gradle build command
     * @param {string} projectPath - Path to the project
     * @param {string} task - Gradle task to execute
     * @param {Object} options - Build options
     * @returns {Promise<Object>} Build result
     */
    async executeGradleBuild(projectPath, task, options) {
        return new Promise((resolve, reject) => {
            const gradlewPath = path.join(projectPath, 'android', 'gradlew');
            const androidPath = path.join(projectPath, 'android');
            const progressCallback = options.progressCallback || (() => {});
            
            const gradleProcess = spawn('./gradlew', [task], {
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                cwd: androidPath,
                env: { 
                    ...process.env, 
                    JAVA_HOME: process.env.JAVA_HOME || '/usr/lib/jvm/java-17-openjdk-amd64',
                    ANDROID_HOME: process.env.ANDROID_HOME || '/opt/android',
                    ANDROID_SDK_ROOT: process.env.ANDROID_SDK_ROOT || '/opt/android'
                }
            });

            let stdout = '';
            let stderr = '';
            let isCompleted = false;
            let timeoutId = null;
            let progressCounter = 0;

            // Handle stdout
            gradleProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                progressCounter++;
                if (progressCounter % 10 === 0) {
                    // Cap progress at 95% during build, 100% will be called on completion
                    const cappedProgress = Math.min(progressCounter, 95);
                    progressCallback(cappedProgress, 'Gradle build in progress...');
                }
            });

            // Handle stderr
            gradleProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Handle process completion
            gradleProcess.on('close', (code) => {
                isCompleted = true;
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                if (code === 0) {
                    progressCallback(100, 'Gradle build completed successfully');
                    resolve({ success: true, stdout, stderr });
                } else {
                    reject(new Error(`Gradle build failed with code ${code}. Stderr: ${stderr}`));
                }
            });

            // Handle process errors
            gradleProcess.on('error', (error) => {
                isCompleted = true;
                
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                
                reject(new Error(`Failed to execute Gradle build: ${error.message}`));
            });

            // Set timeout
            timeoutId = setTimeout(() => {
                if (!isCompleted) {
                    isCompleted = true;
                    gradleProcess.kill('SIGTERM');
                    reject(new Error('Gradle build timed out'));
                }
            }, this.timeoutMs);
        });
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Get repository statistics
     * @returns {Object} Repository statistics
     */
    getStats() {
        return {
            buildCacheSize: this.buildCache.size,
            timeoutMs: this.timeoutMs,
            maxRetries: this.maxRetries
        };
    }

    /**
     * Clear build cache
     */
    clearCache() {
        this.buildCache.clear();
    }
}
