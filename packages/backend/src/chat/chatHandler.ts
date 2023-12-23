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
    const data = await fetchData("https://www.doctorew.com/shuttlebay/cleaned_pocket_morties.json");
    const sortedData = sortData(data, args.sortBy).slice(0, 3);
    return sortedData.map((morty) => ({ node: morty, cursor: `cursor-${morty.id}` }));
};

export async function handleChatRequest(userInput: string): Promise<any> {
    try {
        const stream = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
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

        if (lastMessage.includes("highest attack Morties")) {
            return fetchSortedMorties({ sortBy: "baseatk" });
        }

        return { message: lastMessage };
    } catch (error) {
        console.error("Error handling the chat request:", error);
        throw error;
    }
}

