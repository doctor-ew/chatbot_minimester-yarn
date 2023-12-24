// /packages/backend/src/server.ts

import express, {Express, Request, Response, NextFunction} from 'express';

import {ApolloServer} from 'apollo-server-express';
import {readFileSync} from 'fs';
import path from 'path';
import rickMortyResolvers from './graphql/rickmorty/resolvers';
import { handleJSONAnalysis, handleChatRequestForGraph, handleChatRequest } from './chat/chatHandler';

const app: express.Application = express();
const PORT = 4000;

// Use express.json() to parse JSON payloads
app.use(express.json());

// Load type definitions for the GraphQL endpoint
const rickMortyTypeDefs = readFileSync(path.join(__dirname, 'graphql/rickmorty/schema.graphql'), 'utf-8');

async function fetchMorties() {
    const response = await fetch('http://localhost:4000/rickmorty', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: `query GetPocketMorties($first: Int, $after: String, $type: [String], $sortBy: String) {
        pocketMorties(first: $first, after: $after, type: $type, sortBy: $sortBy) {
          edges {
            node {
              id
              name
              type
              assetid
              evolution
              evolutions
              rarity
              basehp
              baseatk
              basedef
              basespd
              basexp
              stattotal
              dimensions
              where_found
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
            variables: {
                first: 10,
                after: null, // Adjust this as needed for pagination
                type: null, // Adjust this based on user selection
                sortBy: null, // Adjust this based on user selection
            },
        }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
}
// Create ApolloServer instance for the GraphQL endpoint
const rickMortyServer = new ApolloServer({
    typeDefs: rickMortyTypeDefs,
    resolvers: rickMortyResolvers,
    context: ({ req, res }) => ({
        req,
        res,
    })
});

// Start Apollo Server
async function startApolloServer() {
    await rickMortyServer.start();
    rickMortyServer.applyMiddleware({ app: app as any, path: '/rickmorty' });
}

// Call the asynchronous function to start the server
startApolloServer().then(() => {
    // Chat API Route for handling GraphQL queries
    app.post('/api/chat', async (req: Request, res: Response) => {
        try {
            const { query } = req.body;

            if (!query) {
                return res.status(400).send('GraphQL query not provided');
            }

            const graphqlResponse = await handleChatRequest(query);
            res.json(graphqlResponse);
        } catch (error) {
            console.error('Error handling GraphQL request:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    app.post('/api/chat/graphql', async (req: Request, res: Response) => {
        try {
            const { query } = req.body;

            if (!query) {
                return res.status(400).send('GraphQL query not provided');
            }

            const graphqlResponse = await handleChatRequestForGraph(query);
            res.json(graphqlResponse);
        } catch (error) {
            console.error('Error handling GraphQL request:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    // Chat API Route for handling JSON analysis
    app.get('/api/chat/json', async (req: Request, res: Response) => {
        try {
            const jsonAnalysisResponse = await handleJSONAnalysis();
            res.json(jsonAnalysisResponse);
        } catch (error) {
            console.error('Error analyzing JSON data:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    // Health Check Endpoint
    app.get('/health', async (req: Request, res: Response) => {
        // Update this endpoint to check the health of other services if necessary
        res.status(200).send('OK');
    });

    // Start the server
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error(error);
    process.exit(1);
});
