import { apiClient } from "./client";

export interface IngredientEntry {
  name: string;
  category: string;
  description: string;
}

export function getIngredients() {
  return apiClient
    .get<{ ingredients: IngredientEntry[] }>("/api/ingredients")
    .then((r) => r.data.ingredients);
}
