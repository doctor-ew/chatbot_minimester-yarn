// common.js
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import path from 'path';
import rickMortyResolvers from './graphql/rickmorty/resolvers';
import { handleChat } from './chat/chatHandler';

const app = express();
app.use(cors());
app.use(express.json());

const rickMortyTypeDefs = readFileSync(path.join(__dirname, 'graphql/rickmorty/schema.graphql'), 'utf-8');

let rickMortyServer;
let serverStarted = false;

export async function startServer() {
    console.log('|-o-| Starting server...');
    if (!serverStarted) {
        rickMortyServer = new ApolloServer({
            typeDefs: rickMortyTypeDefs,
            resolvers: rickMortyResolvers,
        });

        await rickMortyServer.start();
        console.log('|-o-| Apollo Server started');
        rickMortyServer.applyMiddleware({ app, path: '/dev/rickmorty' });
        serverStarted = true;
    }
    // Additional routes
    app.post('/dev/api/chat', handleChat);
    app.get('/dev/health', (req, res) => res.status(200).send('OK'));
}

startServer().catch(error => {
    console.error('Failed to start the server:', error);
});

export default app;
