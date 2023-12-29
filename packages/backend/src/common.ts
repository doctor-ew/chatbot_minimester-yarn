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
const rickMortyServer = new ApolloServer({
    typeDefs: rickMortyTypeDefs,
    resolvers: rickMortyResolvers,
});

rickMortyServer.applyMiddleware({ app, path: '/rickmorty' });

app.post('/api/chat', handleChat);
app.get('/health', (req, res) => res.status(200).send('OK'));

export default app;
