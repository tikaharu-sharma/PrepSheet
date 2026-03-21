import { createContext } from "react";
import type { Restaurant } from "../lib/types";

export interface RestaurantContextType {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (r: Restaurant | null) => void;
  setRestaurants: (r: Restaurant[]) => void;
  refreshRestaurants: () => Promise<void>;
  addRestaurant: (name: string) => Promise<Restaurant>;
  deleteRestaurant: (id: number) => Promise<void>;
}

export const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);