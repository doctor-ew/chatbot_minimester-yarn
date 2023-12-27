// /packages/backend/src/chat/chatHandler.ts

import { OpenAI } from "openai";
import axios from "axios";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface FetchSortedMortiesArgs {
    first?: number | 5;
    last?: number;
    sortBy: "basehp" | "baseatk" | "basedef" | "basespd" | "basexp" | "stattotal" | "assetid";
}

// Fetch data from a URL
async function fetchData(url: string) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}

// Sort Morties data
const sortData = (data: any[], sortBy: string, order: 'asc' | 'desc' = 'desc') => {
    return order === 'asc' ? data.sort((a, b) => a[sortBy] - b[sortBy]) : data.sort((a, b) => b[sortBy] - a[sortBy]);
};

// Fetch and sort Morties based on given arguments
export const fetchSortedMorties = async (args: FetchSortedMortiesArgs) => {
    const data = await fetchData("https://www.doctorew.com/shuttlebay/cleaned_pocket_morties.json");

    // Determine the sorting order based on the presence of 'first' or 'last'
    const sortOrder = args.last !== undefined ? 'asc' : 'desc';

    // Sort the data
    const sortedData = sortData(data, args.sortBy, sortOrder);

    // Determine the number of results to return
    let results = [];
    if (args.first !== undefined) {
        // If 'first' is defined, take the first N items
        results = sortedData.slice(0, args.first);
    } else if (args.last !== undefined) {
        // If 'last' is defined, reverse the sorted data and take the first N items
        results = sortedData.reverse().slice(0, args.last);
    } else {
        // Default case if neither 'first' nor 'last' is defined
        results = sortedData.slice(0, 5); // Default to 5 items if neither is specified
    }
    // Map the results to the expected format
    return results.map(morty => ({ node: morty, cursor: `cursor-${morty.id}` }));
};

// Function to generate a GraphQL query using OpenAI
export async function generateGraphQLQuery(userInput: string): Promise<string> {
    console.log('|-o-| |-g-| Generating GraphQL query for user input:', userInput);

    const openAiPrompt = `
    Translate the following user request into a GraphQL query. Use 'first' for top or best requests and 'last' for worst, lowest, or bottom requests. The fields are: id, name, assetid, basehp, baseatk, basedef, basespd, basexp. 
    
    All graph queries require a sortedMorties func call with a sortBy with a string and a first or last designator. The sortBy string can be any of the fields listed above. The first or last designator  is the user-requested number. The graph calls require a node and cursor. The node is the data requested and the cursor is a string. Please use the following format for the query:

    Examples:
    User Request: "Show the top 3 Morties by base attack"
    GraphQL Query: "query { sortedMorties(sortBy: \"baseatk\", first: 3){node {...} cursor }}"

    User Request: "Show the worst 5 Morties by base defense"
    GraphQL Query: "query { sortedMorties(sortBy: \"basedef\", last: 5){node {...} cursor }}"

    Your task is to create similar GraphQL queries based on the user input.
    User Request: "${userInput}"
`;


    try {
        const stream = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {role: "system", content: openAiPrompt},
                {role: "user", content: userInput}
            ],
            max_tokens: 150,
            stream: true,
        });
        console.log("|-ooo-| openAiPrompt:", openAiPrompt);
        console.log("|-oOo-| userInput:", userInput);

        let gqlQuery = "";
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            gqlQuery += content;
        }
        console.log("|-oooo-| Raw response from OpenAI:", gqlQuery);

        // Override check for 'worst', 'lowest', or 'bottom'
        if (userInput.toLowerCase().includes("worst") || userInput.toLowerCase().includes("lowest") || userInput.toLowerCase().includes("least") || userInput.toLowerCase().includes("bottom")) {
            gqlQuery = gqlQuery.replace("first:", "last:");
        }
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

        console.log("|-OO-| Generated GraphQL query:", gqlQuery);
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
        const response = await axios.post('http://local.doctorew.com:4000/rickmorty', {
            query: gqlQuery,
        });
        return response.data;
    } catch (error: any) {  // Change to 'any' to avoid TypeScript errors
        console.error("Error sending GraphQL query to server:", error);
        if (axios.isAxiosError(error)) {
            // Handle Axios-specific errors
            if (error.response) {
                // Server responded with a status code that falls out of the range of 2xx
                console.error("Server Response:", error.response.data);
            } else if (error.request) {
                // The request was made but no response was received
                console.error("No response received:", error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error("Error Message:", error.message);
            }
        } else {
            // Handle non-Axios errors
            console.error("Error:", error);
        }
        throw new Error('Failed to send GraphQL query');
    }
}

// Function to assess the GraphQL response and generate a meaningful message
export function assessGraphQLResponse(graphqlResponse: any): any {
    //console.log('Assessing GraphQL response:', graphqlResponse);

    // Check for errors in the GraphQL response
    if (graphqlResponse.errors) {
        console.error('GraphQL Errors:', graphqlResponse.errors);
        return {error: "Error in GraphQL response", details: graphqlResponse.errors};
    }

    // Assuming a successful response, process it as needed
    // This processing will depend on your specific requirements and the structure of your GraphQL data
    const processedResponse = processGraphQLData(graphqlResponse.data);

    return processedResponse;
}

// Function to process GraphQL data
function processGraphQLData(data: any) {
    if (!data || !data?.sortedMorties) {
        return {error: "No data returned"};
    }

    // Extracting Morties data
    const morties = data?.sortedMorties.map((edge: any) => edge?.node);
    console.log('|-O-| Extracted Morties:', morties);

    // Return in a format your frontend expects
    return {morties};
}


