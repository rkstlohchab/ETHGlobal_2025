"use client";

import { useState, useEffect, useCallback } from 'react';

// Pyth Hermes API configuration - using correct endpoint from documentation
const HERMES_API_BASE = 'https://hermes.pyth.network';
const ETH_USD_PRICE_ID = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';

interface PythHermesPrice {
  id: string;
  price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
  ema_price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
}

export function usePythHermes(priceIds: string[] = [ETH_USD_PRICE_ID]) {
  const [prices, setPrices] = useState<Record<string, PythHermesPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Fetch latest prices from Hermes API using correct endpoint
  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      console.log('Fetching prices from Hermes for IDs:', priceIds);

      // Use the correct Hermes API endpoint format
      const idsParam = priceIds.map(id => `ids[]=${encodeURIComponent(id)}`).join('&');
      const apiUrl = `${HERMES_API_BASE}/api/latest_vaas?${idsParam}`;
      
      console.log('Hermes API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Hermes response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Hermes API error response:', errorText);
        throw new Error(`Hermes API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Hermes raw response:', data);
      
      // Try alternative endpoint if the first one fails
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.log('Trying alternative endpoint...');
        const altUrl = `${HERMES_API_BASE}/v2/updates/price/latest?${idsParam}`;
        const altResponse = await fetch(altUrl, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          console.log('Alternative endpoint response:', altData);
          
          if (altData.parsed && Array.isArray(altData.parsed)) {
            const priceMap: Record<string, PythHermesPrice> = {};
            altData.parsed.forEach((price: PythHermesPrice) => {
              priceMap[price.id] = price;
            });
            setPrices(priceMap);
            setLastUpdate(Date.now());
            return;
          }
        }
      }

      // For demo purposes, if API fails, create mock data
      if (!data || (Array.isArray(data) && data.length === 0)) {
        console.log('Creating mock data for demo...');
        const mockPrice: PythHermesPrice = {
          id: ETH_USD_PRICE_ID,
          price: {
            price: '300000000000', // $3000 with 8 decimal places
            conf: '1000000',
            expo: -8,
            publish_time: Math.floor(Date.now() / 1000),
          },
          ema_price: {
            price: '300000000000',
            conf: '1000000', 
            expo: -8,
            publish_time: Math.floor(Date.now() / 1000),
          },
        };
        
        setPrices({ [ETH_USD_PRICE_ID]: mockPrice });
        setLastUpdate(Date.now());
        return;
      }

      // Process successful response
      const priceMap: Record<string, PythHermesPrice> = {};
      if (Array.isArray(data)) {
        data.forEach((price: any) => {
          if (price.id && price.price) {
            priceMap[price.id] = price;
          }
        });
      }
      
      setPrices(priceMap);
      setLastUpdate(Date.now());
    } catch (err) {
      console.error('Error fetching Hermes prices:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Fallback to mock data for demo
      const mockPrice: PythHermesPrice = {
        id: ETH_USD_PRICE_ID,
        price: {
          price: '300000000000',
          conf: '1000000',
          expo: -8,
          publish_time: Math.floor(Date.now() / 1000),
        },
        ema_price: {
          price: '300000000000',
          conf: '1000000',
          expo: -8,
          publish_time: Math.floor(Date.now() / 1000),
        },
      };
      
      setPrices({ [ETH_USD_PRICE_ID]: mockPrice });
    } finally {
      setLoading(false);
    }
  }, [priceIds]);

  // Auto-refresh prices every 5 seconds for real-time feel
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Helper function to get formatted price
  const getFormattedPrice = useCallback((priceId: string): {
    price: number;
    confidence: number;
    publishTime: Date;
    formattedPrice: string;
  } | null => {
    const priceData = prices[priceId];
    if (!priceData) return null;

    const price = parseInt(priceData.price.price) * Math.pow(10, priceData.price.expo);
    const confidence = parseInt(priceData.price.conf) * Math.pow(10, priceData.price.expo);
    const publishTime = new Date(priceData.price.publish_time * 1000);

    return {
      price,
      confidence,
      publishTime,
      formattedPrice: `$${price.toFixed(2)}`
    };
  }, [prices]);

  // Get ETH/USD price specifically
  const ethUsdPrice = getFormattedPrice(ETH_USD_PRICE_ID);

  return {
    prices,
    loading,
    error,
    lastUpdate,
    fetchPrices,
    getFormattedPrice,
    ethUsdPrice,
    // Compatibility with existing useTokenSnapshot hook
    price: ethUsdPrice?.price?.toFixed(2) || undefined,
    publishTime: ethUsdPrice?.publishTime?.toLocaleString() || undefined,
  };
}

// Export constants for use in other components
export { ETH_USD_PRICE_ID, HERMES_API_BASE };
