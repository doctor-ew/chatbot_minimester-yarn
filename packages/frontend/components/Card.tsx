import React from 'react';
import Image from 'next/image';

interface CardProps {
    className: string;
    title: string;
    href: string;
    imageSrc: string;
    imageAlt: string;
    type: string;
    basehp: number;
    baseatk: number;
}

const Card = ({
                  className, title, href, imageSrc, imageAlt, type, basehp, baseatk
              }: CardProps) => (
    <div className={`bg-gray-200 rounded-lg overflow-hidden ${className}`}>
        <a href={href}>
            <div className="relative h-64">
                <Image src={imageSrc} alt={imageAlt} width={90} height={195}/>
            </div>
            <h2 className="text-lg font-bold">{title}</h2>
            <div>Type: {type}</div>
            <div>HP: {basehp}</div>
            <div>Attack: {baseatk}</div>
            {/* Additional details */}
        </a>
    </div>
);

export default Card;
