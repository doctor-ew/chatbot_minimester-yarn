'use client';

import React, { useState, useEffect, useCallback, CSSProperties} from 'react';
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
    const [bgMortyAssetId, setBgMortyAssetId] = useState('');
    const [bgMortyRotation, setBgMortyRotation] = useState(0);

    // Function to update the background Morty image
    const updateBackgroundMorty = useCallback(() => {
        if (morties.length) {
            // Ensure that the random index doesn't exceed the array length
            const validLength = Math.min(12, morties.length);
            const randomIndex = Math.floor(Math.random() * validLength);

            // Use nullish coalescing operator to provide a default value
            const bgmaid = morties[randomIndex]?.node.assetid ?? 'MortyDefault';
            setBgMortyAssetId(bgmaid);

            console.log('|-ubm-|', randomIndex, morties, bgmaid);
        }
    }, [morties]);


    const handleChatQuery = async (query:string) => {
        console.log("|-hcq-|", query);
        //const cqurl:string = 'http://local.doctorew.com:4000/api/chat/';
        const cqurl:string = 'https://mms-graph.doctorew.com/chat/';
        const response = await fetch(cqurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        const data = await response.json();

        if (data && data.morties) {
            // Update the morties state with the new data
            const newMorties = data.morties.map((morty:any) => ({
                node: {
                    id: morty.id,
                    name: morty.name,
                    assetid: morty.assetid, // Use actual data
                    baseatk: morty.baseatk,
                    basedef: morty.basedef,
                    basehp: morty.basehp, // Use actual data
                    basespd: morty.basespd,
                    basexp: morty.basexp,
                    stattotal: morty.stattotal,
                    type: morty.type, // Use actual data
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
        // Update the background Morty image on scroll
        const handleScroll = () => {
            const rotationAngle = window.scrollY % 360;
            document.documentElement.style.setProperty('--bg-morty-rotation', `${rotationAngle}deg`);

            // Load more morties at the bottom of the page
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !isLoadingMore) {
                loadMoreMorties();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [morties, totalMortiesLoaded]);

    useEffect(() => {
        // Initial setup for background Morty
        if (morties.length) {
            updateBackgroundMorty();
        }
    }, [morties, updateBackgroundMorty]);

    useEffect(() => {
        let isScrolling: number;

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

            // Update rotation on scroll
            const rotation = window.scrollY % 360;
            setBgMortyRotation(rotation);

            isScrolling = setTimeout(() : void => {
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
            }, 66) as unknown as number;
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [morties, totalMortiesLoaded]);

    // Define the background image style
    const bgImageStyle : CSSProperties = {
        backgroundImage: `url(https://pocketmortys.net/media/com_pocketmortys/assets/${bgMortyAssetId}Front.png)`,
        backgroundSize: '25%', // Adjust the size as needed
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.5,
        transform: `rotate(${bgMortyRotation}deg)`,
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div style={bgImageStyle} id="main-content"/> {/* Background image container */}
            <div className="mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">Pocket Morties</h1>
                <ChatBox onSend={handleChatQuery} />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {morties.map(({ node }, index) => (
                        <Card
                            className="bg-[#7ad1e3] bg-opacity-80 text-black dark:bg-opacity-80 dark:text-white rounded-lg shadow-md p-4"
                            key={`${loadCount}-${totalMortiesLoaded}-${node.id}-${index}`}
                            title={`${node.name} :: ${node.id}--${endCursor}--${loadCount}-${totalMortiesLoaded}-${index}`}
                            href={`/morty/${node.id}`}
                            imageSrc={`https://pocketmortys.net/media/com_pocketmortys/assets/${node.assetid}Front.png`}
                            imageAlt={node.name}
                            imageId={`morty-image-${node.id}`}
                            type={node.type}
                            basehp={node.basehp}
                            baseatk={node.baseatk}
                            basedef={node.basedef}
                            basespd={node.basespd}
                            basexp={node.basexp}
                            stattotal={node.stattotal}
                        />
                    ))}
                </div>
                {isLoadingMore && <p>Loading more...</p>}
            </div>
        </main>
    );
};

export default RickAndMortyPage;
