export interface PocketMorty {
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
    where_found: string[]; // Changed from [string] to string[]
}

export interface PocketMortyEdge {
    node: PocketMorty;
    cursor: string;
}

export interface PageInfo {
    hasNextPage: boolean;
    endCursor: string | null;
}

export interface PocketMortyConnection {
    pocketMorties: ((prevState: PocketMortyEdge[]) => PocketMortyEdge[]) | PocketMortyEdge[];
    edges: PocketMortyEdge[];
    pageInfo: PageInfo;
}

// You can also define Character if needed
export interface Character {
    id: number;
    name: string;
    status: string;
    species: string;
    image: string;
    // Add other fields as needed
}
