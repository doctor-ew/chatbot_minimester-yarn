// server-lambda.js
import serverlessHttp from 'serverless-http';
import app from './common';

export const handler = serverlessHttp(app);
