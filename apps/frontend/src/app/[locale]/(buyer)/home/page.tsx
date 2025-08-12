'use client';
import ListingCard from '@/app/components/ListingCard';
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../../../api/auth";
import { getListings } from "../../../api/listings";

interface Listing {
  id: number;
  title: string;
  price: number;
  image: string;
  description: string;
  category: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export default function BuyerHome() {
  const router = useRouter();
  const params = useParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (!user) {
        router.replace(`/${params.locale}/login`);
      } else if (user && user.role === "seller") {
        router.replace(`/${params.locale}/seller/home`);
      } else if (user && user.role === "admin") {
        router.replace(`/${params.locale}/dashboard`);
      }
    }
    checkAuth();
  }, [router, params.locale]);

  useEffect(() => {
    async function fetchListings() {
      try {
        const listings = await getListings();
        setListings(listings);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load listings');
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center">
      <div className="w-full max-w-7xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-600 drop-shadow-sm mb-2 font-nunito tracking-tight">
            Willkommen zu FlohMarkt<span className="text-purple-600">+</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 font-medium">
            Entdecke tolle Angebote in deiner Nachbarschaft und beginne jetzt mit dem Stöbern!
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {loading ? (
            <div className="col-span-full text-center text-blue-500 text-lg font-semibold">Lade Angebote...</div>
          ) : error ? (
            <div className="col-span-full text-center text-red-500 text-lg font-semibold">{error}</div>
          ) : listings.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 text-lg font-semibold">Keine Angebote gefunden.</div>
          ) : (
            listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 