import CreateCommand from './modules/create/CreateCommand';
import CreateCommandValidator from './modules/create/validators/CreateCommandValidator';
import ProjectCreator from './core/project/ProjectCreator';
import PlatformSetup from './core/platform/PlatformSetup';
import ErrorHandler from './utils/errorHandler';

class DIContainer {
    constructor() {
        this.services = {};
    }

    register(name, Constructor, dependencies = []) {
        if (typeof Constructor !== 'function') {
            throw new Error(`Constructor for ${name} is not a function`);
        }
        this.services[name] = { Constructor, dependencies };
    }

    get(name) {
        const service = this.services[name];
        if (!service) {
            throw new Error(`Service ${name} not found`);
        }
        const { Constructor, dependencies } = service;
        const resolvedDependencies = dependencies.map(dep => this.get(dep));
        return new Constructor(...resolvedDependencies);
    }
}

const container = new DIContainer();

// Registering all services with their dependencies
container.register('CreateCommand', CreateCommand, ['CreateCommandValidator', 'ProjectCreator', 'ErrorHandler']);
container.register('CreateCommandValidator', CreateCommandValidator);
container.register('ProjectCreator', ProjectCreator);
container.register('PlatformSetup', PlatformSetup);
container.register('ErrorHandler', ErrorHandler);


export default container;