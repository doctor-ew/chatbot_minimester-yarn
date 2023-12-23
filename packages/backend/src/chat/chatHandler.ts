import { OpenAI } from "openai";
import axios from "axios";
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

        // Check if the user is asking for top attack Morties
        if (lowerCaseInput.includes("top") && lowerCaseInput.includes("attack morties")) {
            const gqlResponse = await fetchSortedMorties({ sortBy: "baseatk" });

            // Construct the response message
            let message = "The top 5 attack Morties are:\n\n";
            gqlResponse.forEach((item, index) => {
                message += `${index + 1}. ${item.node.name} (Base Attack: ${item.node.baseatk})\n`;
            });

            return {
                message: message,
                gqlQuery: 'fetchSortedMorties({ sortBy: "baseatk" })',
                gqlResponse: gqlResponse
            };
        }

        // If the user query doesn't match the above condition, use the OpenAI chat model
        const stream = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a knowledgeable assistant equipped to analyze data from 'https://www.doctorew.com/shuttlebay/cleaned_pocket_morties.json' and 'https://pocketmortys.net/mortys' and 'https://pocketmortys.net/index.php?option=com_content&view=article&id=393:best-mortys&catid=11:guides#comments'. Your mission is to assist players in understanding and querying the statistics of various Morties from the game PocketMorties. Provide clear and informative responses to their inquiries"},
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

        return { message: lastMessage, gqlQuery: "", gqlResponse: null };
    } catch (error) {
        console.error("Error handling the chat request:", error);
        throw error;
    }
}
