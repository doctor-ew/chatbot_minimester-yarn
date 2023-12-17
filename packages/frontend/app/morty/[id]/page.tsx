'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState, FC } from 'react';
import { useQuery } from '@apollo/client';
import { GET_POCKET_MORTY_QUERY } from '../../../lib/graphqlQueries';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import Image from 'next/image';

// Define the Morty type
interface Morty {
    name: string;
    id: number;
    type: string;
    assetid: string;
    // Add other properties as needed
}

// Initialize Apollo Client
const apolloClient = new ApolloClient({
    link: new HttpLink({ uri: 'https://mms-graph.doctorew.com/rickmorty' }),
    cache: new InMemoryCache(),
});

const MortyPage: FC = () => {
    const pathname = usePathname();
    const id = parseInt(pathname.split('/').pop() as string, 10);
    const [morty, setMorty] = useState<Morty | null>(null);

    const { loading, error } = useQuery(GET_POCKET_MORTY_QUERY, {
        variables: { id },
        client: apolloClient,
        skip: isNaN(id),
        onCompleted: (data) => {
            if (data && data.pocketMorty) {
                setMorty(data.pocketMorty);
            }
        },
    });

    useEffect(() => {
        if (isNaN(id)) console.log('Invalid Morty ID');
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    if (!morty) return <div>Morty not found.</div>;

    return (
        <div>
            <h1>{morty.name}</h1>
            <div>Number: {morty.id}</div>
            <div>Type: {morty.type}</div>

            <div className="stats-box">
                {/* Display stats */}
            </div>

            <div className="images-and-info">
                <Image src={`https://pocketmortys.net/media/com_pocketmortys/assets/${morty.assetid}Front.png`}
                       alt={`${morty.name} Front`}
                       width={500} // Adjust the width as needed
                       height={300} // Adjust the height as needed
                       unoptimized // Use this if your images are hosted externally
                />
                <Image src={`https://pocketmortys.net/media/com_pocketmortys/assets/${morty.assetid}Back.png`}
                       alt={`${morty.name} Back`}
                       width={500} // Adjust the width as needed
                       height={300} // Adjust the height as needed
                       unoptimized // Use this if your images are hosted externally
                />
                {/* Info grid */}
            </div>
        </div>
    );
};

export default MortyPage;
