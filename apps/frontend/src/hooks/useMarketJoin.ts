import { useState, useCallback } from 'react';
import { joinMarket, JoinMarketRequest } from '@/app/api/markets';

export const useMarketJoin = () => {
  const [joiningMarkets, setJoiningMarkets] = useState<Set<string>>(new Set());

  const joinMarketById = useCallback(async (request: JoinMarketRequest) => {
    const { marketId } = request;
    
    try {
      setJoiningMarkets(prev => new Set(prev).add(marketId));
      
      // Call the actual join market API
      const response = await joinMarket(request);
      
      return response;
    } catch (error) {
      console.error('Failed to join market:', error);
      throw error;
    } finally {
      setJoiningMarkets(prev => {
        const newSet = new Set(prev);
        newSet.delete(marketId);
        return newSet;
      });
    }
  }, []);

  const isJoining = useCallback((marketId: string) => {
    return joiningMarkets.has(marketId);
  }, [joiningMarkets]);

  return {
    joinMarketById,
    isJoining,
  };
}; 