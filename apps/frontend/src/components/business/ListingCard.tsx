'use client';

import { useState } from "react";
import Image from "next/image";

type Listing = {
  id: number;
  title: string;
  price: number;
  image: string;
};

const DEFAULT_IMAGE = '/default-listing.svg';

export default function ListingCard({ listing }: { listing: Listing }) {
  const [imgSrc, setImgSrc] = useState(listing.image || DEFAULT_IMAGE);

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-300 p-3 sm:p-4 flex flex-col h-full">
      <div className="relative w-full h-32 sm:h-40 mb-3 sm:mb-4 rounded-lg overflow-hidden">
        <Image
          src={imgSrc}
          alt={listing.title}
          fill
          className="object-cover"
          onError={() => setImgSrc(DEFAULT_IMAGE)}
          unoptimized // Remove this if you want Next.js to optimize remote images and you have set up allowed domains
        />
      </div>
      <h2 className="text-base sm:text-lg font-semibold mb-2 line-clamp-2">{listing.title}</h2>
      <div className="flex-1" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 space-y-2 sm:space-y-0">
        <span className="text-blue-600 font-bold text-lg sm:text-xl">€{listing.price}</span>
        <div className="flex space-x-2">
          <button className="flex-1 sm:flex-none px-3 py-2 sm:py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium min-h-[44px] sm:min-h-[32px] transition-colors duration-200">
            Add to Cart
          </button>
          <button className="px-3 py-2 sm:py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm min-h-[44px] sm:min-h-[32px] min-w-[44px] sm:min-w-[32px] flex items-center justify-center transition-colors duration-200">
            ♡
          </button>
        </div>
      </div>
    </div>
  );
} 