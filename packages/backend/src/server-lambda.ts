// server-lambda.js
import serverlessHttp from 'serverless-http';
import app, { startServer } from './common';

// Start the server for the Lambda environment
startServer().catch(error => {
    console.error('Failed to start the server in Lambda:', error);
});

export const handler = serverlessHttp(app);
