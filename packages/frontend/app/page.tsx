'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {apolloClient} from '../lib/apolloClient';
import { useQuery } from '@apollo/client';
import Card from '../components/Card';
import { GET_POCKET_MORTIES_QUERY } from '../lib/graphqlQueries';
import { PocketMortyConnection, PocketMortyEdge } from '../lib/types';
import "./globals.css";

const RickAndMortyPage = () => {
    const [morties, setMorties] = useState<PocketMortyEdge[]>([]);
    const [endCursor, setEndCursor] = useState<string | null>(null);
    const { loading, error, data, fetchMore } = useQuery<PocketMortyConnection>(GET_POCKET_MORTIES_QUERY, {
        variables: { first: 9, after: null },
        client: apolloClient,
        onCompleted: (data:any) => {
            if (data?.pocketMorties?.edges) {
                setMorties(data.pocketMorties.edges);
                setEndCursor(data.pocketMorties.pageInfo.endCursor);
            }

        }
    });

    const loadMoreMorties = useCallback(() => {
        if (!endCursor || loading) return;

        fetchMore({
            variables: { after: endCursor },
        }).then((fetchMoreResult: any) => {
            const newMorties = fetchMoreResult.data.pocketMorties as PocketMortyConnection;
            if (newMorties && newMorties.edges) {
                setMorties(prevMorties => [
                    ...prevMorties,
                    ...newMorties.edges
                ]);
                setEndCursor(newMorties.pageInfo.endCursor);
            }
        });
    }, [endCursor, loading, fetchMore]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                loadMoreMorties();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMoreMorties]);

    if (loading && !data) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div className="mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">Pocket Morties</h1>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {morties.map(({ node }) => (
                        <Card
                            className="bg-white rounded-lg shadow-md p-4"
                            key={node.id}
                            title={node.name}
                            href={`/morty/${node.id}`}
                            imageSrc={`https://pocketmortys.net/media/com_pocketmortys/assets/${node.assetid}Front.png`}
                            imageAlt={node.name}
                            type={node.type}
                            basehp={node.basehp}
                            baseatk={node.baseatk}
                            // ... other properties as needed
                        />
                    ))}
                </div>
                {loading && <p>Loading more...</p>}
            </div>
        </main>
    );
};

export default RickAndMortyPage;
