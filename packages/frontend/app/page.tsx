'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apolloClient } from '../lib/apolloClient';
import { useQuery } from '@apollo/client';
import Card from '../components/Card';
import ChatBox from '../components/ChatBox';
import { GET_POCKET_MORTIES_QUERY } from '../lib/graphqlQueries';
import { PocketMortyConnection, PocketMortyEdge } from '../lib/types';
import "./globals.css";

const RickAndMortyPage = () => {
    const [morties, setMorties] = useState<PocketMortyEdge[]>([]);
    const [endCursor, setEndCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [totalMortiesLoaded, setTotalMortiesLoaded] = useState(0);
    const [loadCount, setLoadCount] = useState(0);

    const handleChatQuery = async (query) => {
        const response = await fetch('http://local.doctorew.com:4000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const data = await response.json();

        if (data && data.morties) {
            // Update the morties state with the new data
            const newMorties = data.morties.map(morty => ({
                node: {
                    id: morty.id,
                    name: morty.name,
                    baseatk: morty.baseatk,
                    type: "Unknown", // Placeholder value
                    basehp: 100, // Placeholder value
                    assetid: morty.assetid, // Placeholder image ID

                    // Add other properties as needed
                }
            }));
            console.log('|-n-|', newMorties);
            setMorties(newMorties);
            // Reset the endCursor and loadCount since we're displaying new data
            setEndCursor(null);
            setLoadCount(0);
        }
    };

    const { loading, error, fetchMore } = useQuery<PocketMortyConnection>(GET_POCKET_MORTIES_QUERY, {
        variables: { first: 12, after: null },
        client: apolloClient,
        fetchPolicy: 'network-only',
        onCompleted: (data: any) => {
            if (data?.pocketMorties?.edges) {
                setMorties(data.pocketMorties.edges);
                setEndCursor(data.pocketMorties.pageInfo.endCursor);
                setTotalMortiesLoaded(data.pocketMorties.edges.length);
            }
        }
    });

    const loadMoreMorties = useCallback(() => {
        if (!endCursor || isLoadingMore || loading) return;

        setIsLoadingMore(true);
        fetchMore({
            variables: { after: endCursor },
        }).then((fetchMoreResult: any) => {
            const newMorties = fetchMoreResult.data.pocketMorties as PocketMortyConnection;
            if (newMorties && newMorties.edges) {
                setMorties(prevMorties => [...prevMorties, ...newMorties.edges]);
                setTotalMortiesLoaded(prev => prev + newMorties.edges.length);
                setIsLoadingMore(false);
            }
            setEndCursor(fetchMoreResult.data.pocketMorties.pageInfo.endCursor);
            setLoadCount(prevCount => prevCount + 1);
        });
    }, [endCursor, isLoadingMore, loading, fetchMore]);

    useEffect(() => {
        const handleScroll = () => {
            // Check if the user has scrolled to the bottom of the page
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !isLoadingMore) {
                loadMoreMorties();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMoreMorties, isLoadingMore]);

    useEffect(() => {
        let isScrolling;

        const handleScroll = () => {
            window.clearTimeout(isScrolling);

            morties.forEach(({ node }, index) => {
                // Calculate the index within the current set of 12 Morties
                const setIndex = index % 12;
                if (setIndex % 2 !== 0) {
                    const imageElement = document.getElementById(`morty-image-${node.id}`);
                    if (imageElement) {
                        imageElement.style.transform = `rotate(${window.scrollY % 360}deg)`;
                    }
                }
            });

            isScrolling = setTimeout(() => {
                morties.forEach(({ node }, index) => {
                    // Calculate the index within the current set of 12 Morties
                    const setIndex = index % 12;
                    if (setIndex % 2 !== 0) {
                        const imageElement = document.getElementById(`morty-image-${node.id}`);
                        if (imageElement) {
                            // Keep the current rotation angle
                            const currentRotation = window.scrollY % 360;
                            imageElement.style.transform = `rotate(${currentRotation}deg)`;
                        }
                    }
                });
            }, 66);
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (isScrolling) {
                clearTimeout(isScrolling);
            }
        };
    }, [morties, totalMortiesLoaded]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div className="mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">Pocket Morties</h1>
                <ChatBox onSend={handleChatQuery} />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {morties.map(({ node }, index) => (
                        <Card
                            className="bg-white rounded-lg shadow-md p-4"
                            key={`${loadCount}-${totalMortiesLoaded}-${node.id}-${index}`}
                            title={`${node.name} :: ${node.id}--${endCursor}--${loadCount}-${totalMortiesLoaded}-${index}`}
                            href={`/morty/${node.id}`}
                            imageSrc={`https://pocketmortys.net/media/com_pocketmortys/assets/${node.assetid}Front.png`}
                            imageAlt={node.name}
                            imageId={`morty-image-${node.id}`}
                            type={node.type}
                            basehp={node.basehp}
                            baseatk={node.baseatk}
                        />
                    ))}
                </div>
                {isLoadingMore && <p>Loading more...</p>}
            </div>
        </main>
    );
};

export default RickAndMortyPage;
