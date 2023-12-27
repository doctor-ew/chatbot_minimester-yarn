// apps/graphql/packages/graphql/rickmorty/resolvers.ts

import axios from 'axios';
import {fetchSortedMorties, FetchSortedMortiesArgs} from '../../chat/chatHandler'; // Update the import path as needed

// Interfaces for TypeScript type safety
interface PocketMorty {
    id: number;
    name: string;
    type: string;
    assetid: string;
    evolution: number[];
    evolutions: number[];
    rarity: string;
    basehp: number;
    baseatk: number;
    basedef: number;
    basespd: number;
    basexp: number;
    stattotal: number;
    dimensions: string;
    where_found: [string];
}


// Utility function to fetch data from a URL
const fetchData = async (url: string) => {
    try {
        const response = await axios.get(url);
        return response.data.results || response.data; // Accommodate different response structures
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        return [];
    }
};

// Filtering utility for PocketMorties
const filterPocketMorties = (data: any[], args: any) => {
    return data.filter(morty => {
        return (!args.type || args.type.includes(morty.type)) &&
            (!args.rarity || args.rarity.includes(morty.rarity)) &&
            (args.basexp === undefined || morty.basexp === args.basexp) &&
            (args.basehp === undefined || morty.basehp === args.basehp) &&
            (args.baseatk === undefined || morty.baseatk === args.baseatk) &&
            (args.basedef === undefined || morty.basedef === args.basedef) &&
            (args.basespd === undefined || morty.basespd === args.basespd) &&
            (args.stattotal === undefined || morty.stattotal === args.stattotal) &&
            (args.assetid === undefined || morty.assetid === args.assetid) &&
            (!args.dimensions || args.dimensions.includes(morty.dimensions)) &&
            (!args.where_found || args.where_found.some((location: any) => morty.where_found.includes(location)));
    });
};


// Utility function for sorting and limiting
const sortData = (data: any[], sortBy: string) => {
    if (sortBy) {
        return [...data].sort((a, b) => b[sortBy] - a[sortBy]);
    }
    return data;
};

// Update the resolvers
const resolvers = {
    Query: {
        pocketMorty: async (_: any, args: { id: number }) => {
            const data = await fetchData('https://www.doctorew.com/shuttlebay/cleaned_pocket_morties.json');

            // Find the specific Morty by ID
            const morty = data.find((morty: PocketMorty) => morty.id === args.id);
            console.log('|-o-| morty', morty);
            return morty || null; // Return the found Morty or null if not found
        },

        pocketMorties: async (_: any, args: any) => {
            const data = await fetchData('https://www.doctorew.com/shuttlebay/cleaned_pocket_morties.json');
            let filteredData = filterPocketMorties(data, args);
            console.log('|-ofo-| filteredData', filteredData);
            // Sort the filtered data
            filteredData = sortData(filteredData, args.sortBy);

            // Create edges with cursors
            const edges = filteredData.map(morty => ({
                node: morty,
                cursor: `cursor-${morty.id}` // Simple cursor example
            }));

            // Apply cursor-based pagination
            const afterIndex = args.after ? edges.findIndex(edge => edge.cursor === args.after) : -1;
            const paginatedEdges = edges.slice(afterIndex + 1, afterIndex + 1 + args.first);

            return {
                edges: paginatedEdges,
                pageInfo: {
                    hasNextPage: afterIndex + 1 + (args.first || filteredData.length) < edges.length,
                    endCursor: paginatedEdges.length ? paginatedEdges[paginatedEdges.length - 1].cursor : null
                }
            };

        },

        sortedMorties: async (_: any, args: FetchSortedMortiesArgs) => {
            return fetchSortedMorties(args);
        },


        topMortiesByStat: async (_: any, args: { stat: string, first: number }) => {
            const data = await fetchData('https://www.doctorew.com/shuttlebay/cleaned_pocket_morties.json');

            // Sort the data by the specified stat (e.g., baseatk) in descending order
            const sortedData = sortData(data, args.stat).slice(0, args.first);

            return sortedData;
        },


    },
};

export default resolvers;
