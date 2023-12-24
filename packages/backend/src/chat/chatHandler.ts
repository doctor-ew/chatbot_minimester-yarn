// Import necessary modules and types

import { OpenAI } from "openai";
import axios from "axios";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface FetchSortedMortiesArgs {
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

export const fetchSortedMorties = async (args: FetchSortedMortiesArgs) => {
    console.log('Fetching sorted Morties with args:', args);
    const data = await fetchData("https://www.doctorew.com/shuttlebay/cleaned_pocket_morties.json");
    const sortedData = sortData(data, args.sortBy).slice(0, 5);
    return sortedData.map((morty) => ({ node: morty, cursor: `cursor-${morty.id}` }));
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
        } else {
            // If the user query doesn't match either condition, use the OpenAI chat model
            const stream = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "Your GraphQL system message here" },
                    { role: "user", content: userInput },
                ],
                max_tokens: 150,
                stream: true,
            });

            let lastMessage = "";
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                lastMessage += content;
            }

            return { message: lastMessage, gqlQuery: '', gqlResponse: null };
        }
    } catch (error) {
        console.error("Error handling the chat request:", error);
        throw error;
    }
}

export async function handleChatRequestForGraph(userInput: string): Promise<any> {
    try {
        // Construct a GraphQL query based on the user input
        const gqlQuery = constructGraphQLQuery(userInput);

        // Send the GraphQL query to your server
        const graphqlResponse = await executeGraphQLQuery(gqlQuery);

        // Analyze the GraphQL response data here
        const analysisResult = analyzeGraphQLResponse(graphqlResponse);

        return { message: graphqlResponse, gqlQuery, gqlResponse: analysisResult };
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
        topMorties.forEach((morty:any, index:number) => {
            message += `${index + 1}. ${morty.name} (Base Attack: ${morty.baseatk})\n`;
        });

        return { message: message, analysisResult: analysisResult };
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
