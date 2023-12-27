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
    last?: number;
    sortBy: "basehp" | "baseatk" | "basedef" | "basespd" | "basexp" | "stattotal" | "assetid";
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

const sortMData = (data: any[], sortBy: string) => {
    return data.sort((a, b) => b[sortBy] - a[sortBy]);
};

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
    return results.map((morty) => ({
        node: morty,
        cursor: `cursor-${morty.id}`,
    }));
};


const sortData = (data: any[], sortBy: string, order: 'asc' | 'desc' = 'desc') => {
    if (order === 'asc') {
        return data.sort((a, b) => a[sortBy] - b[sortBy]);
    } else {
        return data.sort((a, b) => b[sortBy] - a[sortBy]);
    }
};


export async function handleChatRequest(userInput: string): Promise<any> {
    console.log("|-0-| |-0-| Handling chat request for user input:", userInput);
    try {
        const lowerCaseInput = userInput.toLowerCase();

        // Check if the user query contains a keyword indicating GraphQL request
        if (lowerCaseInput.includes("graphql")) {
            console.log("|-1-| incl gql");
            const gqlQuery = lowerCaseInput.replace("graphql", "").trim();
            const graphqlResponse = await handleChatRequestForGraph(gqlQuery);
            return graphqlResponse;
        } else if (lowerCaseInput.includes("json")) {
            console.log("|-2-| incl gql");
            const jsonAnalysisResponse = await handleJSONAnalysis();
            return jsonAnalysisResponse;
        } else if (lowerCaseInput.includes("top morties by")) {
            console.log("|-3-| |-0-| incl top morties");
            const statMatch = lowerCaseInput.match(/top morties by (\w+)/);
            if (statMatch && statMatch[1]) {
                console.log("|-3-| |-1-| statMatch", statMatch);
                const stat = statMatch[1].trim() as FetchSortedMortiesArgs['sortBy'];
                const topMorties = await fetchTopMortiesByStat(stat, 5);
                return {message: `Here are the top Morties by ${stat}:\n${formatTopMorties(topMorties)}`};
            } else {
                console.log("|-3-| |-2-| No statMatch", statMatch);
                return {message: "Please specify a valid stat for top Morties (e.g., top Morties by baseatk)."};
            }
        } else if (lowerCaseInput.includes("worst morties by") || lowerCaseInput.includes("bottom morties by")) {
            console.log("|-4-| |-0-| incl worst/bottom morties");
            const statMatch = lowerCaseInput.match(/(worst|bottom) morties by (\w+)/);
            if (statMatch && statMatch[2]) {
                console.log("|-4-| |-1-| statMatch", statMatch);
                const stat = statMatch[2].trim() as FetchSortedMortiesArgs['sortBy'];
                const bottomMorties = await fetchSortedMorties({sortBy: stat, last: 3});
                return {message: `Here are the bottom 3 Morties by ${stat}:\n${formatTopMorties(bottomMorties)}`};
            } else {
                console.log("|-4-| |-2-| No statMatch", statMatch);
                return {message: "Please specify a valid stat for bottom Morties (e.g., bottom Morties by basedef)."};
            }
        } else {
            console.log("|-5-| incl else");
            const stream = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `You are a helpful assistant that will translate human language into GraphQL queries based on the following schemas:

            When asked for the top or best in defense:
            \`\`\`
            query {
                sortedMorties(sortBy: "basedef", first: 3) {
                    node {
                        id
                        name
                        assetid
                        basehp
                        baseatk
                        basedef
                        basespd
                        basexp
                    }
                    cursor
                }
            }
            \`\`\`

            When asked for the lowest or worst in attack:
            \`\`\`
            query {
                sortedMorties(sortBy: "baseatk", last: 3) {
                    node {
                        id
                        name
                        assetid
                        basehp
                        baseatk
                        basedef
                        basespd
                        basexp
                    }
                    cursor
                }
            }
            \`\`\`

            Valid sort fields are: "basehp", "baseatk", "basedef", "basespd", "basexp", "stattotal", "assetid".
            Translate user requests into corresponding GraphQL queries.`
                    },
                    {
                        role: "user",
                        content: "Can you show me the worst three Morties in terms of attack?"
                    }
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
        const sortedMorties = await fetchSortedMorties({sortBy});
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
        const sortedMorties = sortMData(data, 'baseatk').slice(0, 5);
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
        return {error: "Error in GraphQL response", details: graphqlResponse.errors};
    }

    // Assuming a successful response, process it as needed
    // This processing will depend on your specific requirements and the structure of your GraphQL data
    const processedResponse = processGraphQLData(graphqlResponse.data);

    return processedResponse;
}

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

