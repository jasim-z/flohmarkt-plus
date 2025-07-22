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
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col">
      <Image
        src={imgSrc}
        alt={listing.title}
        width={300}
        height={160}
        className="w-full h-40 object-contain mb-4 rounded"
        onError={() => setImgSrc(DEFAULT_IMAGE)}
        unoptimized // Remove this if you want Next.js to optimize remote images and you have set up allowed domains
      />
      <h2 className="text-lg font-semibold mb-2">{listing.title}</h2>
      <div className="flex-1" />
      <div className="flex items-center justify-between mt-2">
        <span className="text-blue-600 font-bold text-xl">${listing.price}</span>
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Add to Cart</button>
          <button className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm">♡</button>
        </div>
      </div>
    </div>
  );
} 