// /packages/backend/src/server-lambda.ts

import serverlessHttp from 'serverless-http';
import { app, startServer } from './common';

startServer().then(() => {
    console.log('Server started successfully');
}).catch(error => {
    console.error('Failed to start the server in Lambda:', error);
});

export const handler = async (event:any, context:any) => {
    console.log('Received event:', JSON.stringify(event));
    // You can add more logging here to debug
    const serverlessHandler = serverlessHttp(app);
    console.log('|-O-| serverlessHandler called:', serverlessHandler, ' :: event:', event, ' :: context:', context);
    return serverlessHandler(event, context);
};
