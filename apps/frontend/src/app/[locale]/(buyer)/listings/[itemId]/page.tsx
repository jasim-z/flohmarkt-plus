'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FaArrowLeft, FaBox, FaMapMarkerAlt, FaClock, FaStore, FaChevronLeft, FaChevronRight, FaHeart, FaShare, FaHandshake, FaTag, FaInfoCircle, FaTruck, FaCheckCircle, FaStar 
} from 'react-icons/fa';
import { getListingById, Listing, getListingsBySellerAndMarket } from '@/app/api/listings';
import { getMarketDetails, Market, Vendor } from '@/app/api/markets';
import { getOrCreateConversation } from '@/app/api/messages';
import { useUser } from '@/contexts/UserContext';

export default function BuyerListingDetail() {
  const { itemId, locale } = useParams();
  const router = useRouter();
  const { user, isLoaded, isLoading: authLoading } = useUser();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<Market | null>(null);
  const [seller, setSeller] = useState<Vendor | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [relatedListings, setRelatedListings] = useState<Listing[]>([]);

  const fetchListing = useCallback(async () => {
    if (!itemId) return;
    try {
      setLoading(true);
      const data = await getListingById(itemId as string);
      setListing(data);
      // If the listing is associated with a market, fetch market details to build breadcrumbs and seller info
      const marketId = (data as Listing & { marketId?: string }).marketId as string | undefined;
      const sellerId = (data as Listing & { sellerId?: string }).sellerId as string | undefined;
      if (marketId) {
        try {
          const marketResponse = await getMarketDetails(marketId as string);
          setMarket(marketResponse.market);
          // Try to find the seller within the market vendors
          const vendor = marketResponse.vendors?.find((v: Vendor) => v._id === sellerId);
          if (vendor) setSeller(vendor);
          // Load related listings from same seller in this market
          if (sellerId) {
            try {
              const rel = await getListingsBySellerAndMarket(String(sellerId), String(marketId), { page: 1, limit: 100 });
              setRelatedListings((rel.data || []).filter((it: Listing) => it._id !== String(itemId)).slice(0, 4));
            } catch {
              // ignore
            }
          }
        } catch {
          // Non-blocking if market or vendor not found
        }
      }
    } catch (e) {
      console.error('Failed to load listing', e);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    if (isLoaded && !authLoading) {
      if (!user) {
        router.replace(`/${locale}/login`);
      }
    }
  }, [user, isLoaded, authLoading, router, locale]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const nextImage = () => {
    if (Array.isArray(listing?.images) && listing!.images!.length > 0) {
      setCurrentImageIndex((prev) => prev === listing.images.length - 1 ? 0 : prev + 1);
    }
  };

  const prevImage = () => {
    if (Array.isArray(listing?.images) && listing!.images!.length > 0) {
      setCurrentImageIndex((prev) => prev === 0 ? listing.images.length - 1 : prev - 1);
    }
  };

  const handleMessageSeller = async () => {
    try {
      const sellerId = (listing as any)?.sellerId as string | undefined;
      if (!sellerId) return;
      const convo = await getOrCreateConversation({ sellerId, listingId: String(itemId) });
      // Build prefill text and copy link
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const productUrl = `${baseUrl}/${locale}/listings/${itemId}`;
      const title = listing?.title || 'your item';
      const prefill = `Hi, I am interested in "${title}". Link: ${productUrl}`;
      try { await navigator.clipboard.writeText(prefill); } catch {}
      const conversationId = (convo as any)?._id || (convo as any)?.id;
      if (!conversationId) {
        console.error('Conversation id missing from response', convo);
        return;
      }
      router.push(`/${locale}/user-messages/${conversationId}?prefill=${encodeURIComponent(prefill)}`);
    } catch (e) {
      console.error('failed to start conversation', e);
    }
  };

  if (authLoading || !isLoaded) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs (match market -> seller -> item style when possible) */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <button 
              onClick={() => router.push(`/${locale}/home`)}
              className="hover:text-blue-600 transition-colors"
            >
              Listings
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">{listing?.title || 'Item'}</span>
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-gray-600">Loading item...</div>
        ) : listing ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left column: gallery + seller + market info (desktop) */}
            <div className="space-y-6">
              {/* Main Image with arrows and overlay actions */}
              <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="relative">
          {(() => { const images = listing.images ?? []; return images.length > 0; })() ? (
                    <img
                      src={(listing.images ?? [])[currentImageIndex]}
                      alt={listing.title}
                      className="w-full h-auto max-h-[500px] object-contain"
                    />
                  ) : (
                    <div className="w-full h-[400px] bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                      <FaBox className="text-green-600 w-24 h-24" />
                    </div>
                  )}

                  {(listing.images ?? []).length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200"
                      >
                        <FaChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all duration-200"
                      >
                        <FaChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Overlay buttons */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-3 rounded-full shadow-lg transition-all duration-200 ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 hover:bg-white text-gray-800'}`}
                  >
                    <FaHeart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: listing.title, text: listing.description, url: window.location.href });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                      }
                    }}
                    className="p-3 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all duration-200"
                  >
                    <FaShare className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              {(listing.images ?? []).length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {(listing.images ?? []).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${index === currentImageIndex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <img src={image} alt={`${listing.title} - ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Seller info (desktop) */}
              {seller && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 hidden lg:block">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-full w-16 h-16 flex items-center justify-center">
                      {seller.avatar ? (
                        <img src={seller.avatar} alt={seller.displayName} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <FaStore className="text-blue-600 w-8 h-8" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{seller.displayName}</h3>
                      <div className="flex items-center space-x-2">
                        {seller.isVerified && <FaCheckCircle className="text-blue-600 w-4 h-4" />}
                        <span className="text-sm text-gray-600">{seller.isVerified ? 'Verified Seller' : 'Seller'}</span>
                      </div>
                      {seller.rating && (
                        <div className="flex items-center space-x-1 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar key={i} className={`w-4 h-4 ${i < Math.floor(seller.rating!) ? 'text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                          <span className="text-sm text-gray-600 ml-2">{seller.rating.toFixed(1)} ({seller.totalReviews || 0} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {market && (
                    <button
                      onClick={() => router.push(`/${locale}/user-markets/${market._id}/seller/${seller._id}`)}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      View All Items from This Seller
                    </button>
                  )}
                </div>
              )}

              {/* Market info (desktop) */}
              {market && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 hidden lg:block">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3"><FaStore className="text-gray-400 w-4 h-4" /><span className="text-gray-600">Market:</span><span className="font-medium text-gray-900">{market.name}</span></div>
                    <div className="flex items-center space-x-3"><FaMapMarkerAlt className="text-gray-400 w-4 h-4" /><span className="text-gray-600">Location:</span><span className="font-medium text-gray-900">{market.location}</span></div>
                    <div className="flex items-center space-x-3"><FaClock className="text-gray-400 w-4 h-4" /><span className="text-gray-600">Date:</span><span className="font-medium text-gray-900">{new Date(market.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                    <div className="flex items-center space-x-3"><FaClock className="text-gray-400 w-4 h-4" /><span className="text-gray-600">Time:</span><span className="font-medium text-gray-900">{market.startTime} - {market.endTime}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Right column: product info */}
            <div className="space-y-6">
              {/* Title, chips, description */}
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">{listing.category}</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">{listing.condition}</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                <p className="text-gray-600 text-lg leading-relaxed">{listing.description}</p>
              </div>

              {/* Price + quantity + action */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-baseline space-x-3 mb-4">
                  {listing.isFree ? (
                    <span className="text-4xl font-bold text-green-600">Free</span>
                  ) : (
                    <span className="text-4xl font-bold text-gray-900">€{listing.price.toFixed(2)}</span>
                  )}
                </div>
                <div className="flex items-center space-x-4 mb-6">
                  <label className="text-sm font-medium text-gray-700">Quantity:</label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">-</button>
                    <span className="px-4 py-2 border-x border-gray-300 text-center min-w-[60px]">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors">+</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <button onClick={handleMessageSeller} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
                    <FaHandshake className="w-5 h-5" />
                    <span>Message Seller</span>
                  </button>
                </div>
              </div>

              {/* Item details card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3"><FaTag className="text-gray-400 w-4 h-4" /><span className="text-gray-600">Category:</span><span className="font-medium text-gray-900">{listing.category}</span></div>
                  <div className="flex items-center space-x-3"><FaBox className="text-gray-400 w-4 h-4" /><span className="text-gray-600">Condition:</span><span className="font-medium text-gray-900">{listing.condition}</span></div>
                  {listing.brand && (<div className="flex items-center space-x-3"><FaInfoCircle className="text-gray-400 w-4 h-4" /><span className="text-gray-600">Brand:</span><span className="font-medium text-gray-900">{listing.brand}</span></div>)}
                  {listing.model && (<div className="flex items-center space-x-3"><FaInfoCircle className="text-gray-400 w-4 h-4" /><span className="text-gray-600">Model:</span><span className="font-medium text-gray-900">{listing.model}</span></div>)}
                  <div className="flex items-center space-x-3"><FaMapMarkerAlt className="text-gray-400 w-4 h-4" /><span className="text-gray-600">Location:</span><span className="font-medium text-gray-900">{listing.city}{listing.neighborhood ? `, ${listing.neighborhood}` : ''}</span></div>
                  <div className="flex items-center space-x-3"><FaTruck className="text-gray-400 w-4 h-4" /><span className="text-gray-600">Delivery:</span><span className="font-medium text-gray-900">{listing.deliveryOption}</span></div>
                  {typeof listing.shippingCost !== 'undefined' && (<div className="flex items-center space-x-3"><FaTruck className="text-gray-400 w-4 h-4" /><span className="text-gray-600">Shipping Cost:</span><span className="font-medium text-gray-900">€{Number(listing.shippingCost).toFixed(2)}</span></div>)}
                  <div className="flex items-center space-x-3"><FaHandshake className="text-gray-400 w-4 h-4" /><span className="text-gray-600">Negotiable:</span><span className={`font-medium ${listing.isNegotiable ? 'text-green-600' : 'text-gray-900'}`}>{listing.isNegotiable ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-600">Item not found</div>
        )}
      </div>
      {/* Related items */}
      {relatedListings.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More from This Seller</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedListings.map((relatedItem) => (
                <div
                  key={relatedItem._id}
                  onClick={() => {
                    const mId = (relatedItem as Listing & { marketId?: string }).marketId;
                    const sId = (relatedItem as Listing & { sellerId?: string }).sellerId;
                    if (mId && sId) {
                      router.push(`/${locale}/user-markets/${mId}/seller/${sId}/item/${relatedItem._id}`);
                    } else {
                      router.push(`/${locale}/listings/${relatedItem._id}`);
                    }
                  }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  <div className="aspect-square bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    {relatedItem.images && relatedItem.images.length > 0 ? (
                      <img src={relatedItem.images[0]} alt={relatedItem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <FaBox className="text-green-600 w-16 h-16" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{relatedItem.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{relatedItem.isFree ? 'Free' : `€${relatedItem.price.toFixed(2)}`}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{relatedItem.condition}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


