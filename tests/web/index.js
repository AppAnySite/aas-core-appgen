const { execFile } = require('child_process');
const path = require('path');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const projectDirectory = path.resolve(__dirname);
const iconImagePath = path.resolve(__dirname, 'logo.png');
const splashImagePath = path.resolve(__dirname, 'logo.svg');
const binaryPath = path.resolve(__dirname, 'build', 'APPANYSITE');

console.log(projectDirectory);
console.log(iconImagePath);
console.log(splashImagePath);

// Serve static files (like the HTML page)
app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('startCommand', (command) => {
        let args = [];
        if (command === 'create') {
            args = [
                'create',
                '--name', 'MaighaInc',
                '--platform-ios',
                '--platform-android',
                '--url', 'https://maigha.com',
                '--directory', projectDirectory,
            ];
        } else if (command === 'update-android') {
            args = [
                'update-icon',
                '-d', path.join(projectDirectory, 'MaighaInc'),
                '-i', iconImagePath,
                '--platform', 'android'
            ];
        } else if (command === 'update-ios') {
            args = [
                'update-icon',
                '-d', path.join(projectDirectory, 'MaighaInc'),
                '-i', iconImagePath,
                '--platform', 'ios'
            ];
        } else if (command === 'update-splash') {
            args = [
                'update-splash',
                '-d', path.join(projectDirectory, 'MaighaInc'),
                '-s', splashImagePath,
            ];
        }
        runCommand(args, socket);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const runCommand = (args, socket) => {
    const child = execFile(binaryPath, args);

    const handleOutput = (data) => {
        const progressMatch = data.match(/Progress:\s*(\d+)%\s*-\s*(.*)/);
        if (progressMatch) {
            const progress = parseInt(progressMatch[1], 10);
            socket.emit('progressUpdate', progress);
        } else {
            socket.emit('commandOutput', data); // Send other output to the client if necessary
        }
    };

    child.stdout.on('data', (data) => handleOutput(data.toString()));
    child.stderr.on('data', (data) => handleOutput(data.toString()));

    child.on('close', (code) => {
        if (code !== 0) {
            socket.emit('commandError', `Command failed with exit code ${code}`);
        } else {
            socket.emit('commandComplete', code);
        }
    });

    child.on('error', (err) => {
        console.error('Failed to start command:', err);
        socket.emit('commandError', `Failed to start command: ${err.message}`);
    });
};

http.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
