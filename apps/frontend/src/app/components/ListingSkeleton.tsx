export default function ListingSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200"></div>
      
      {/* Content Skeleton */}
      <div className="p-4">
        {/* Title Skeleton */}
        <div className="h-5 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
        
        {/* Description Skeleton */}
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
        
        {/* Info Skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="flex space-x-3">
            <div className="h-3 bg-gray-200 rounded w-8"></div>
            <div className="h-3 bg-gray-200 rounded w-8"></div>
          </div>
        </div>
        
        {/* Button Skeleton */}
        <div className="h-9 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export function ListingSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ListingSkeleton key={index} />
      ))}
    </div>
  );
} 