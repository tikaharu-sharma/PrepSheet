import { useState } from "react";
import { RestaurantContext } from "./RestaurantContext";
import { getRestaurants, type Restaurant } from "../pages/Restaurants";

export const RestaurantProvider = ({ children }: { children: React.ReactNode }) => {
  const initialRestaurants = getRestaurants();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(
    initialRestaurants[0] || null
  );

  return (
    <RestaurantContext.Provider
      value={{ restaurants, selectedRestaurant, setSelectedRestaurant, setRestaurants }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};