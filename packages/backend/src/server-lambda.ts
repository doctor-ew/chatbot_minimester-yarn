import { ApolloServer } from 'apollo-server-lambda';
import { makeExecutableSchema } from '@graphql-tools/schema';
import path from 'path';
import { readFileSync } from 'fs';
import pocketMortyResolvers from './graphql/rickmorty/resolvers';

// Load type definitions
const pocketMortyTypeDefs = readFileSync(path.join(__dirname, 'graphql/rickmorty/schema.graphql'), 'utf-8');

// Create the executable schema
const schema = makeExecutableSchema({
    typeDefs: pocketMortyTypeDefs,
    resolvers: pocketMortyResolvers,
});

// Create ApolloServer instance with the executable schema
const server = new ApolloServer({
    schema,
    introspection: true,
});

// Lambda handler
exports.handler = (event:any, context:any, callback:any) => {
    const origin = event.headers.origin;
    let headers = {};

    // Check if the origin is a subdomain of doctorew.com or is local.doctorew.com
    if (/https:\/\/.*\.doctorew\.com$/.test(origin) || origin === 'http://local.doctorew.com:3000') {
        headers = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': true,
            // Add other headers as needed
        };
    }

    // Apollo Server handler
    const handler = server.createHandler({
        expressGetMiddlewareOptions: {
            cors: {
                origin: true,
                credentials: true,
            },
        },
    });

    // Check for OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return callback(null, {
            statusCode: 200,
            headers,
            body: '',
        });
    }

    // Pass the request to Apollo Server
    return handler(event, context, callback);
};
