// /packages/backend/src/server.ts

import express, {Express, Request, Response, NextFunction} from 'express';
const cors = require('cors');
import {ApolloServer} from 'apollo-server-express';
import {readFileSync} from 'fs';
import path from 'path';
import rickMortyResolvers from './graphql/rickmorty/resolvers';
import { generateGraphQLQuery, sendToGraphQLServer, assessGraphQLResponse } from './chat/chatHandler';




const app: express.Application = express();
const PORT = 4000;

// Use express.json() to parse JSON payloads
app.use(cors());
app.use(express.json());

// Load type definitions for the GraphQL endpoint
const rickMortyTypeDefs = readFileSync(path.join(__dirname, 'graphql/rickmorty/schema.graphql'), 'utf-8');

async function fetchMorties() {
    const response = await fetch('http://local.doctorew.com:4000/rickmorty', {
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

    // New endpoint for handling user queries
    app.post('/api/chat', async (req: Request, res: Response) => {
        console.log("|-00-| 00 calling handleChatRequest query: ",req.body);
        try {
            const { query } = req.body;

            if (!query) {
                return res.status(400).send('User query not provided');
            }

            // Step 1: Generate a GraphQL query using OpenAI
            const generatedGqlQuery = await generateGraphQLQuery(query);

            // Step 2: Send the GraphQL query to your GraphQL server
            const graphqlResponse = await sendToGraphQLServer(generatedGqlQuery);

            // Step 3: Receive and process the GraphQL response
            const assessedResponse = assessGraphQLResponse(graphqlResponse);

            // Step 4: Respond with the assessed result
            res.json(assessedResponse);
        } catch (error) {
            console.error('Error handling user query:', error);
            res.status(500).send('Internal Server Error');
        }
    });


// Chat API Route for handling JSON analysis


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

