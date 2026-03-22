import { useState, useEffect, useCallback } from "react";
import { RestaurantContext } from "./RestaurantContext";
import type { Restaurant } from "../lib/types";
import { fetchRestaurants, createRestaurant, updateRestaurant as updateRestaurantApi, removeRestaurant } from "../lib/api";

export const RestaurantProvider = ({ children }: { children: React.ReactNode }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const refreshRestaurants = useCallback(async () => {
    try {
      const data = await fetchRestaurants();
      setRestaurants(data);
      if (selectedRestaurant) {
        const latest = data.find((r) => r.id === selectedRestaurant.id) || null;
        setSelectedRestaurant(latest);
      }
    } catch (error) {
      console.error('Failed to refresh restaurants:', error);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshRestaurants();
  }, []);

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