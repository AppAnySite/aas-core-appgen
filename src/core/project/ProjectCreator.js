import IProjectCreator from './IProjectCreator';
import { runCommand } from '../../utils/commandRunner';
import { log } from '../../utils/logger';

/**
 * ProjectCreator class.
 * Creates a new React Native project and manages updates to icons and splash screens.
 * @extends IProjectCreator
 */
class ProjectCreator extends IProjectCreator {
    constructor() {
        super();
    }

    async createProject(options) {
        await runCommand('npx', ['@react-native-community/cli@latest', 'init', options.name], {
            cwd: options.directory,
            input: 'y\n'
        });
    }

}

export default ProjectCreator;