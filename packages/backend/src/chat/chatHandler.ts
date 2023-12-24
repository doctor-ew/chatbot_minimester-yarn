// /packages/backend/src/chat/chatHandler.ts

// Import necessary modules and types

import {OpenAI} from "openai";
import axios from "axios";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

export interface FetchSortedMortiesArgs {
    first?: number | 5;
    sortBy: "basehp" | "baseatk" | "basedef" | "basespd" | "basexp" | "stattotal";
}

async function fetchData(url: string) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}

const sortData = (data: any[], sortBy: string) => {
    return data.sort((a, b) => b[sortBy] - a[sortBy]);
};

export const fetchSortedMorties = async (args: FetchSortedMortiesArgs, first: number) => {
    console.log('Fetching sorted Morties with args:', args);
    const data = await fetchData("https://www.doctorew.com/shuttlebay/cleaned_pocket_morties.json");
    const sortedData = sortData(data, args.sortBy);

    // Slice the data based on the 'first' argument
    return sortedData.slice(0, first).map((morty) => ({node: morty, cursor: `cursor-${morty.id}`}));
};


export async function handleChatRequest(userInput: string): Promise<any> {
    try {
        const lowerCaseInput = userInput.toLowerCase();

        // Check if the user query contains a keyword indicating GraphQL request
        if (lowerCaseInput.includes("graphql")) {
            // Extract the GraphQL query from the user input
            const gqlQuery = lowerCaseInput.replace("graphql", "").trim();

            // Call the GraphQL handling function with the extracted query
            const graphqlResponse = await handleChatRequestForGraph(gqlQuery);

            return graphqlResponse;
        } else if (lowerCaseInput.includes("json")) {
            // Handle JSON analysis request
            const jsonAnalysisResponse = await handleJSONAnalysis();

            return jsonAnalysisResponse;
        } else if (lowerCaseInput.includes("top morties by")) {
            // Handle top Morties request by a specific stat
            const statMatch = lowerCaseInput.match(/top morties by (\w+)/);
            if (statMatch && statMatch[1]) {
                const stat = statMatch[1].trim() as FetchSortedMortiesArgs['sortBy']; // Type assertion to valid stat type
                if (['basehp', 'baseatk', 'basedef', 'basespd', 'basexp', 'stattotal'].includes(stat)) {
                    const topMorties = await fetchTopMortiesByStat(stat, 5); // Change 5 to the desired count
                    return {message: `Here are the top Morties by ${stat}:\n${formatTopMorties(topMorties)}`};
                } else {
                    return {message: "Please specify a valid stat for top Morties (e.g., top Morties by baseatk)."};
                }
            } else {
                return {message: "Please specify a valid stat for top Morties (e.g., top Morties by baseatk)."};
            }
        } else {
            // If the user query doesn't match either condition, use the OpenAI chat model
            const stream = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {role: "system", content: "Your GraphQL system message here"},
                    {role: "user", content: userInput},
                ],
                max_tokens: 150,
                stream: true,
            });

            let lastMessage = "";
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                lastMessage += content;
            }

            return {message: lastMessage, gqlQuery: '', gqlResponse: null};
        }
    } catch (error) {
        console.error("Error handling the chat request:", error);
        throw error;
    }
}

// Add a new function to fetch top Morties by a specific stat
async function fetchTopMortiesByStat(stat: string, count: number): Promise<any[]> {
    try {
        // Ensure 'stat' matches one of the allowed string literals
        if (!['basehp', 'baseatk', 'basedef', 'basespd', 'basexp', 'stattotal'].includes(stat)) {
            throw new Error(`Invalid stat: ${stat}`);
        }

        // Cast 'stat' to the specific union type
        const sortBy = stat as FetchSortedMortiesArgs['sortBy'];
        const sortedMorties = await fetchSortedMorties({sortBy}, count);
        return sortedMorties.slice(0, count);
    } catch (error) {
        console.error(`Error fetching top Morties by ${stat}:`, error);
        throw error;
    }
}


// Add a function to format the top Morties for display
function formatTopMorties(topMorties: any[]): any {
    // Implement your logic to format the top Morties for display as a string
    // You can include relevant information from the Morties (e.g., name, stat value)
    // Return the formatted string
}

export async function handleChatRequestForGraph(userInput: string): Promise<any> {
    try {
        // Construct a GraphQL query based on the user input
        const gqlQuery = constructGraphQLQuery(userInput);

        // Send the GraphQL query to your server
        const graphqlResponse = await executeGraphQLQuery(gqlQuery);

        // Analyze the GraphQL response data here
        const analysisResult = analyzeGraphQLResponse(graphqlResponse);

        return {message: graphqlResponse, gqlQuery, gqlResponse: analysisResult};
    } catch (error) {
        console.error("Error handling the GraphQL chat request:", error);
        throw error;
    }
}

export async function handleJSONAnalysis(): Promise<any> {
    try {
        // Read and parse the JSON file for analysis
        const rawData = fs.readFileSync('cleaned_pocket_morties.json', 'utf8');
        const data = JSON.parse(rawData);

        // Perform analysis on the JSON data to find the top 5 Morties with the highest base attack
        const sortedMorties = sortData(data, 'baseatk').slice(0, 5);
        // Perform analysis on the JSON data
        const analysisResult = analyzeJSONResponse(data);

        // Construct a response message with the analysis results
        let message = "The top 5 Morties with the highest base attack are:\n\n";
        const topMorties = analysisResult.slice(0, 5);
        topMorties.forEach((morty: any, index: number) => {
            message += `${index + 1}. ${morty.name} (Base Attack: ${morty.baseatk})\n`;
        });

        return {message: message, analysisResult: analysisResult};
    } catch (error) {
        console.error('Error analyzing JSON data:', error);
        throw error;
    }
}

// Implement your executeGraphQLQuery function according to your GraphQL setup
export async function executeGraphQLQuery(gqlQuery: string): Promise<any> {
    try {
        // Your logic to execute the GraphQL query and return the response
        // Example: You can use Apollo Client, Axios, or any other library to send the query to your GraphQL server
        // Return the GraphQL response here
    } catch (error) {
        console.error("Error executing the GraphQL query:", error);
        throw error;
    }
}

// Implement your constructGraphQLQuery and analyzeGraphQLResponse functions as needed
function constructGraphQLQuery(userInput: string): any {
    console.log('Constructing GraphQL query for user input:', userInput);
    // Your logic to construct a GraphQL query based on user input
    // Return the constructed query as a string
}

function analyzeGraphQLResponse(response: any): any {
    // Your logic to analyze the GraphQL response data
    // Return the analysis result
}

function analyzeJSONResponse(data: any): any {
    // Your logic to analyze JSON data
    // Return the analysis result
}

// Function to generate a GraphQL query using OpenAI
export async function generateGraphQLQuery(userInput: string): Promise<string> {
    console.log('Generating GraphQL query for user input:', userInput);

    const openAiPrompt = `
        Convert the following user request into a GraphQL query based on this schema:
        Fields: id, name, basehp, baseatk, basedef, basespd, basexp

    Example:
    curl -X POST http://localhost:4000/rickmorty \\
       -H "Content-Type: application/json" \\
       -d '{"query": "query { sortedMorties(sortBy: \\"baseatk\\") { node { id name baseatk } cursor } }"}'
    User Request: "${userInput}"
    `;

    try {
        const stream = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: openAiPrompt },
                { role: "user", content: userInput }
            ],
            max_tokens: 150,
            stream: true,
        });

        let gqlQuery = "";
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            gqlQuery += content;
        }
        console.log("Raw response from OpenAI:", gqlQuery);

        // Replace incorrect field names if necessary
        const fieldMapping = {
            "attack": "baseatk", // Add other mappings as necessary
        };
        // Replace incorrect field names in the query
        for (const key in fieldMapping) {
            if (fieldMapping.hasOwnProperty(key)) {
                const mappedKey = key as keyof typeof fieldMapping; // Assert the key type
                gqlQuery = gqlQuery.replace(new RegExp(mappedKey, "g"), fieldMapping[mappedKey]);
            }
        }

        console.log("Generated GraphQL query:", gqlQuery);
        return gqlQuery;
    } catch (error) {
        console.error("Error in generating GraphQL query:", error);
        throw error;
    }
}


// Function to send the GraphQL query to your GraphQL server
export async function sendToGraphQLServer(gqlQuery: string): Promise<any> {
    console.log('|-oo-| Sending GraphQL query to server:', gqlQuery);
    try {
        const response = await axios.post('http://localhost:4000/rickmorty', {
            query: gqlQuery,
        });
        //console.log('|-oo-| GraphQL response:', response.data);
        return response.data;
    } catch (error) {
        console.error("Error sending GraphQL query to server:", error);
        throw error;
    }
}

// Function to assess the GraphQL response and generate a meaningful message
export function assessGraphQLResponse(graphqlResponse: any): any {
    //console.log('Assessing GraphQL response:', graphqlResponse);

    // Check for errors in the GraphQL response
    if (graphqlResponse.errors) {
        console.error('GraphQL Errors:', graphqlResponse.errors);
        return { error: "Error in GraphQL response", details: graphqlResponse.errors };
    }

    // Assuming a successful response, process it as needed
    // This processing will depend on your specific requirements and the structure of your GraphQL data
    const processedResponse = processGraphQLData(graphqlResponse.data);

    return processedResponse;
}

function processGraphQLData(data: any): any {
    //console.log('|-o-| Processing GraphQL data:', data);
    // Implement the logic to process your GraphQL data and return a meaningful result
    // This could involve formatting the data, extracting specific fields, etc.
}

