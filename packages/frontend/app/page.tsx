'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apolloClient } from '../lib/apolloClient';
import { useQuery } from '@apollo/client';
import Card from '../components/Card';
import { GET_POCKET_MORTIES_QUERY } from '../lib/graphqlQueries';
import { PocketMortyConnection, PocketMortyEdge } from '../lib/types';
import "./globals.css";

const RickAndMortyPage = () => {
    const [morties, setMorties] = useState<PocketMortyEdge[]>([]);
    const [displayedMorties, setDisplayedMorties] = useState<PocketMortyEdge[]>([]);
    const [endCursor, setEndCursor] = useState<string | null>(null);
    const [loadCount, setLoadCount] = useState(0);
    const mainRef = useRef(null);

    const { loading, error, fetchMore } = useQuery<PocketMortyConnection>(GET_POCKET_MORTIES_QUERY, {
        variables: { first: 9, after: null },
        client: apolloClient,
        onCompleted: (data: any) => {
            if (data?.pocketMorties?.edges) {
                setMorties(data.pocketMorties.edges);
                setEndCursor(data.pocketMorties.pageInfo.endCursor);
                setLoadCount(1); // Set load count to 1 after initial load
                // Initially display only the first set
                setDisplayedMorties(data.pocketMorties.edges.slice(0, 9));
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
                setMorties(prevMorties => [...prevMorties, ...newMorties.edges]);
                setEndCursor(newMorties.pageInfo.endCursor);
                setLoadCount(prevCount => prevCount + 1);
            }
        });
    }, [endCursor, loading, fetchMore]);

    // Load the second set when the user scrolls to the end of the first set
    useEffect(() => {
        const handleScroll = () => {
            const scrollHeight = mainRef.current.scrollHeight - window.innerHeight;
            const scrollTop = window.pageYOffset;
            const scrollPercent = scrollTop / scrollHeight;
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                if (loadCount === 1) {
                    // Display the second set
                    setDisplayedMorties(morties);
                } else {
                    loadMoreMorties();
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loadMoreMorties, loadCount, morties]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    const isHorizontalScroll = loadCount % 2 === 0 && loadCount !== 0;

    return (
        <main ref={mainRef} className="flex min-h-screen flex-col items-center justify-between p-24">
            <div className="mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">Pocket Morties</h1>

                {/* Section for pinning and horizontal scrolling */}
                <section id="sectionPin" className={isHorizontalScroll ? 'horizontal-scroll-section' : ''}>
                    <div className="pin-wrap-sticky">
                        <div className="pin-wrap">
                            {displayedMorties.map(({ node }, index) => (
                                <Card
                                    className="card"
                                    key={`${loadCount}-${node.id}-${index}`}
                                    title={node.name}
                                    href={`/morty/${node.id}`}
                                    imageSrc={`https://pocketmortys.net/media/com_pocketmortys/assets/${node.assetid}Front.png`}
                                    imageAlt={node.name}
                                    type={node.type}
                                    basehp={node.basehp}
                                    baseatk={node.baseatk}
                                    // ... other props
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {loading && <p>Loading more...</p>}
            </div>
        </main>
    );
};

export default RickAndMortyPage;
