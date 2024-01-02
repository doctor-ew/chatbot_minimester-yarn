'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState, FC } from 'react';
import { useQuery } from '@apollo/client';
import { GET_POCKET_MORTY_QUERY } from '../../../lib/graphqlQueries';
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import Image from 'next/image';

interface Morty {
    name: string;
    id: number;
    type: string;
    assetid: string;
    rarity: string;
    dimensions: string;
    where_found: string[];
    basehp: number;
    baseatk: number;
    basedef: number;
    basespd: number;
    basexp: number;
    stattotal: number;
    // Add other properties as needed
}

//const acurl: string = 'http://local.doctorew.com:4000/rickmorty';
const acurl: string = 'https://mms-graph.doctorew.com/rickmorty';

const apolloClient = new ApolloClient({
    link: new HttpLink({ uri: acurl, credentials: 'same-origin' }),
    cache: new InMemoryCache(),
});

const MortyPage: FC = () => {
    const pathname = usePathname();
    const id = parseInt(pathname.split('/').pop() as string, 10);
    const [morty, setMorty] = useState<Morty | null>(null);
    const [showFront, setShowFront] = useState(true); // Place this hook here

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
        // Toggle the image every 5 seconds (5000 milliseconds)
        const interval = setInterval(() => {
            setShowFront(prev => !prev);
        }, 5000);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        if (isNaN(id)) console.log('Invalid Morty ID');
    }, [id]);

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    if (error) return <div className="text-red-500 text-center mt-4">Error: {error.message}</div>;
    if (!morty) return <div className="text-center mt-4">Morty not found.</div>;


    return (
        <div className="bg-fixed bg-center bg-cover" style={{ backgroundImage: `url(https://pocketmortys.net/media/com_pocketmortys/assets/${morty.assetid}${showFront ? 'Front' : 'Back'}.png)`, backgroundSize: '50%' }}>
            <div className="min-h-screen bg-black bg-opacity-50">
                <div className="text-white p-4 md:p-8 lg:p-12">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">{morty.name}</h1>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <h2 className="text-xl font-semibold">Details</h2>
                            <div>Number: {morty.id}</div>
                            <div>Type: {morty.type}</div>
                            <div>Rarity: {morty.rarity}</div>
                            <div>Dimensions: {morty.dimensions}</div>
                            <div>Found In: {morty.where_found.join(', ')}</div>
                            {/* Additional details here */}
                        </div>
                        <div className="stats-box">
                            <h2 className="text-xl font-semibold">Stats</h2>
                            <div>HP: {morty.basehp}</div>
                            <div>Attack: {morty.baseatk}</div>
                            <div>Defense: {morty.basedef}</div>
                            <div>Speed: {morty.basespd}</div>
                            <div>Exp: {morty.basexp}</div>
                            <div>Total Stats: {morty.stattotal}</div>
                            {/* Additional stats here */}
                        </div>
                    </div>

                    {/* Image and info section */}
                </div>
            </div>
        </div>
    );
};
export default MortyPage;
