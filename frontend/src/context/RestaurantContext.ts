import { createContext } from "react";
import { type Restaurant } from "../pages/Restaurants";

export interface RestaurantContextType {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (r: Restaurant | null) => void;
  setRestaurants: (r:Restaurant[]) => void
}



export const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);