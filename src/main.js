#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { log } from './utils/logger';
import container from './diContainer';


const program = new Command();

program
    .command('create')
    .description('Create a new project')
    .requiredOption('-n, --name <projectName>', 'Project name')
    .option('--platform-android', 'Include Android platform')
    .option('--platform-ios', 'Include iOS platform')
    .requiredOption('-u, --url <url>', 'URL to be used in the WebView component')
    .requiredOption('-d, --directory <projectDirectory>', 'Directory where the project will be created')
    .option('--verbose', 'Enable verbose mode')
    .option('-i, --icon <icon>', 'Path to app icon')
    .option('-s, --splash <splash>', 'Path to splash screen')
    .option('-c, --config <configFile>', 'Path to JSON configuration file')
    .action((options) => {
        const createCommand = container.get('CreateCommand');
        createCommand.execute(options);
    });

program.parse(process.argv);