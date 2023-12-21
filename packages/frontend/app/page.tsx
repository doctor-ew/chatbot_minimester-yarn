'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apolloClient } from '../lib/apolloClient';
import { useQuery } from '@apollo/client';
import Card from '../components/Card';
import { GET_POCKET_MORTIES_QUERY } from '../lib/graphqlQueries';
import { PocketMortyConnection, PocketMortyEdge } from '../lib/types';
import "./globals.css";

const RickAndMortyPage = () => {
    const [morties, setMorties] = useState<PocketMortyEdge[]>([]);
    const [endCursor, setEndCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadCount, setLoadCount] = useState(0);

    const { loading, error, fetchMore } = useQuery<PocketMortyConnection>(GET_POCKET_MORTIES_QUERY, {
        variables: { first: 9, after: null },
        client: apolloClient,
        onCompleted: (data: any) => {
            if (data?.pocketMorties?.edges) {
                setMorties(data.pocketMorties.edges);
                setEndCursor(data.pocketMorties.pageInfo.endCursor);
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
                setIsLoadingMore(false);
            }
            setEndCursor(fetchMoreResult.data.pocketMorties.pageInfo.endCursor);
            setLoadCount(prevCount => prevCount + 1);
        });
    }, [endCursor, isLoadingMore, loading, fetchMore]);

    useEffect(() => {
        let isScrolling;

        const handleScroll = () => {
            window.clearTimeout(isScrolling);

            // Check if the user has scrolled to the bottom of the page
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !isLoadingMore) {
                loadMoreMorties();
            }

            // Apply spin class to all odd-numbered Morties on scroll
            morties.forEach(({ node }, index) => {
                if (index % 2 !== 0) {
                    const imageElement = document.getElementById(`morty-image-${node.id}`);
                    if (imageElement) {
                        imageElement.style.transform = `rotate(${window.scrollY % 360}deg)`;
                    }
                }
            });

            isScrolling = setTimeout(() => {
                morties.forEach(({ node }, index) => {
                    if (index % 2 !== 0) {
                        const imageElement = document.getElementById(`morty-image-${node.id}`);
                        if (imageElement) {
                            imageElement.classList.remove('spin');
                        }
                    }
                });
            }, 66); // Adjust time as needed
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (isScrolling) {
                clearTimeout(isScrolling);
            }
        };
    }, [morties, loadMoreMorties, isLoadingMore]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div className="mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">Pocket Morties</h1>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {morties.map(({ node }, index) => (
                        <Card
                            className="bg-white rounded-lg shadow-md p-4"
                            key={`${loadCount}-${node.id}-${index}`}
                            title={node.name}
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
