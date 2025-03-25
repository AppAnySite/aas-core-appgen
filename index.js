import './src/main.js';

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
