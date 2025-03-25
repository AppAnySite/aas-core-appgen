import ICreateCommand from './ICreateCommand';
import { handleError } from '../../utils/errorHandler';
import { log } from '../../utils/logger';
import PlatformSetup from '../../core/platform/PlatformSetup';
import path from 'path';

/**
 * CreateCommand class.
 * Handles the creation of a new React Native project, setting up platforms,
 * creating WebView components, and updating icons and splash screens.
 * @extends ICreateCommand
 */

class CreateCommand extends ICreateCommand {
    constructor(createCommandValidator, projectCreator, errorHandler) {
        super();
        this.createCommandValidator = createCommandValidator;
        this.projectCreator = projectCreator;
        this.PlatformSetup = PlatformSetup;
        this.errorHandler = errorHandler;
    }

    async execute(options) {
        try {
            const tasks = [
                { fn: this.validateOptions.bind(this), weight: 10, description: 'Validating Options' },
                { fn: this.createProject.bind(this), weight: 50, description: 'Creating Project' },
                { fn: this.setupPlatformAndroid.bind(this), weight: 20, description: 'Setting up Android Platform' },
                { fn: this.setupPlatformIos.bind(this), weight: 20, description: 'Setting up iOS Platform' },
            ];

            let totalProgress = 0;
            for (const task of tasks) {
                await task.fn(options);
                totalProgress += task.weight;
                this.printProgress(totalProgress, task.description);
            }

            this.printProgress(100, 'Project creation completed successfully');
            log('INFO', 'Project creation completed successfully');
        } catch (error) {
            log('ERROR', `Error in CreateCommand.execute: ${error.message}`);
            this.errorHandler.handleError(error);
        }
    }

    printProgress(percentage, message) {
        console.log(`Progress: ${percentage}% - ${message}`);
    }

    validateOptions(options) {
        this.createCommandValidator.validate(options);
    }

    async createProject(options) {
        await this.projectCreator.createProject(options);
    }

    async setupPlatformAndroid(options) {
        if (options.platformAndroid) {
            const platformSetup = new this.PlatformSetup(options.directory, options.name);
            await platformSetup.setupPlatform('android', options.url);
        }
    }

    async setupPlatformIos(options) {
        if (options.platformIos) {
            const platformSetup = new this.PlatformSetup(options.directory, options.name);
            await platformSetup.setupPlatform('ios', options.url);
        }
    }
}

export default CreateCommand;