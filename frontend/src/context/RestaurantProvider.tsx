import { useState, useEffect, useCallback } from "react";
import { RestaurantContext } from "./RestaurantContext";
import type { Restaurant } from "../lib/types";
import { fetchRestaurants, createRestaurant, updateRestaurant as updateRestaurantApi, removeRestaurant } from "../lib/api";
import { getStoredUser, getToken } from "../lib/auth";

export const RestaurantProvider = ({ children }: { children: React.ReactNode }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const refreshRestaurants = useCallback(async () => {
    try {
      const token = getToken();
      const user = getStoredUser();

      if (!token || !user) {
        setRestaurants([]);
        setSelectedRestaurant(null);
        return;
      }

      const data = await fetchRestaurants();
      setRestaurants(data);
      if (selectedRestaurant) {
        const latest = data.find((r) => r.id === selectedRestaurant.id) || null;
        setSelectedRestaurant(latest);
      }
    } catch (error) {
      console.error('Failed to refresh restaurants:', error);

	  if (error instanceof Error) {
		throw error;
	  }

	  if (typeof error === 'object' && error !== null && 'message' in error) {
		const message = (error as { message?: string }).message;
		if (typeof message === 'string' && message.trim() !== '') {
		  throw new Error(message);
		}
	  }

	  throw new Error('Failed to fetch restaurants');
    }
  }, [selectedRestaurant]);

  const addRestaurant = useCallback(async (name: string) => {
    const newRestaurant = await createRestaurant(name);
    setRestaurants((prev) => [...prev, newRestaurant]);
    return newRestaurant;
  }, []);

  const updateRestaurant = useCallback(async (id: number, name: string): Promise<Restaurant> => {
    const updatedRestaurant = await updateRestaurantApi(id, name);
    setRestaurants((prev) => prev.map((r) => r.id === id ? updatedRestaurant : r));
    if (selectedRestaurant?.id === id) {
      setSelectedRestaurant(updatedRestaurant);
    }
    return updatedRestaurant;
  }, [selectedRestaurant]);

  const deleteRestaurant = useCallback(async (id: number) => {
    await removeRestaurant(id);
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    if (selectedRestaurant?.id === id) {
      setSelectedRestaurant(null);
    }
  }, [selectedRestaurant]);

  useEffect(() => {
    const syncRestaurantsWithAuth = async () => {
      const token = getToken();
      const user = getStoredUser();

      if (!token || !user) {
        setRestaurants([]);
        setSelectedRestaurant(null);
        return;
      }

      await refreshRestaurants();
    };

    const onAuthChanged = () => {
      syncRestaurantsWithAuth().catch(() => {
        // Keep provider stable and let page-level components show fetch failures.
      });
    };

    window.addEventListener('auth-changed', onAuthChanged);
    onAuthChanged();

    return () => {
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, [refreshRestaurants]);

  return (
    <RestaurantContext.Provider
      value={{
        restaurants,
        selectedRestaurant,
        setSelectedRestaurant,
        setRestaurants,
        refreshRestaurants,
        addRestaurant,
        updateRestaurant,
        deleteRestaurant,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};