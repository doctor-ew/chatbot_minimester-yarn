// /packages/backend/src/server.ts

import express, { Request, Response } from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { readFileSync } from 'fs';
import path from 'path';
import serverless from 'serverless-http';
import rickMortyResolvers from './graphql/rickmorty/resolvers';
import { generateGraphQLQuery, sendToGraphQLServer, assessGraphQLResponse } from './chat/chatHandler';

const app = express();
const PORT = process.env.PORT || 4000; // Define PORT here

// Load type definitions for the GraphQL endpoint
const rickMortyTypeDefs = readFileSync(path.join(__dirname, 'graphql/rickmorty/schema.graphql'), 'utf-8');

// Create ApolloServer instance for the GraphQL endpoint
const rickMortyServer = new ApolloServer({
    typeDefs: rickMortyTypeDefs,
    resolvers: rickMortyResolvers,
    context: ({ req, res }) => ({ req, res })
});

// Start Apollo Server
async function startApolloServer() {
    await rickMortyServer.start();
    rickMortyServer.applyMiddleware({ app: app as any, path: '/rickmorty' });
}

startApolloServer().catch(error => {
    console.error(error);
    process.exit(1);
});

// Middleware setup
app.use(cors());
app.use(express.json());

// Chat API Route for handling JSON analysis
app.post('/api/chat', async (req: Request, res: Response) => {
    console.log("|-00-| 00 calling handleChatRequest query: ",req.body);
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).send('User query not provided');
        }

        const generatedGqlQuery = await generateGraphQLQuery(query);
        const graphqlResponse = await sendToGraphQLServer(generatedGqlQuery);
        const assessedResponse = assessGraphQLResponse(graphqlResponse);

        res.json(assessedResponse);
    } catch (error) {
        console.error('Error handling user query:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Conditional local server startup, not used in Lambda
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports.handler = serverless(app);
