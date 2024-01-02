// graphqlQueries.ts
import { gql } from '@apollo/client';

export const GET_POCKET_MORTIES_QUERY = gql`
    query GetPocketMorties($first: Int, $after: String, $type: [String], $sortBy: String) {
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
    },`
export const GET_POCKET_MORTY_QUERY = gql`
    query GetPocketMorty($id: Int!) {
        pocketMorty(id: $id) {
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
    },

`;
