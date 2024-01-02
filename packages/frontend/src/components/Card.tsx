import React from 'react';
import Image from 'next/image';

interface CardProps {
    className: string;
    title: string;
    href: string;
    imageSrc: string;
    imageAlt: string;
    imageId: string;
    type: string;
    basehp: number;
    baseatk: number;
    basedef: number;
    basespd: number;
    basexp: number;
    stattotal: number;
}

const Card = ({
                  className, title, href, imageSrc, imageAlt, imageId, type, basehp, baseatk, basedef, basespd, basexp, stattotal
              }: CardProps) => (
    <div className={`bg-gray-200 rounded-lg overflow-hidden ${className}`}>
        <a href={href}>
            <div className="relative h-64 flex justify-center items-center"> {/* Centering the image */}
                <Image id={imageId} src={imageSrc} alt={imageAlt} layout="intrinsic" width={90} height={195}/>
            </div>
            <h2 className="text-lg font-bold">{title}</h2>
            <div>Type: {type}</div>
            <div>HP: {basehp}</div>
            <div>Attack: {baseatk}</div>
            <div>Defense: {basedef}</div>
            <div>Speed: {basespd}</div>
            <div>Exp: {basexp}</div>
            <div>Total Stats: {stattotal}</div>
        </a>
    </div>
);


export default Card;
