import { apiClient } from "./client";
import { API_BASE_URL } from "./config";
import { Comment, Recipe, User } from "./types";

export function resolveImageUrl(path?: string | null) {
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

export function getFeed(params: { search?: string; category?: string; sort?: "new" | "top"; page?: number }) {
  return apiClient
    .get<{ recipes: Recipe[]; page: number; pageSize: number }>("/api/recipes", { params })
    .then((r) => r.data);
}

export function getRecipe(id: string) {
  return apiClient.get<Recipe & { comments: Comment[] }>(`/api/recipes/${id}`).then((r) => r.data);
}

export interface NewRecipeInput {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  category?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  imageUri?: string;
}

export function createRecipe(input: NewRecipeInput) {
  const form = new FormData();
  form.append("title", input.title);
  form.append("description", input.description);
  form.append("ingredients", JSON.stringify(input.ingredients));
  form.append("steps", JSON.stringify(input.steps));
  if (input.category) form.append("category", input.category);
  if (input.prepTime) form.append("prepTime", String(input.prepTime));
  if (input.cookTime) form.append("cookTime", String(input.cookTime));
  if (input.servings) form.append("servings", String(input.servings));
  if (input.difficulty) form.append("difficulty", input.difficulty);

  if (input.imageUri) {
    const filename = input.imageUri.split("/").pop() ?? "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : "jpg";
    // React Native's FormData expects this file-object shape, not a Blob.
    form.append("image", {
      uri: input.imageUri,
      name: filename,
      type: `image/${ext === "jpg" ? "jpeg" : ext}`,
    } as unknown as Blob);
  }

  return apiClient
    .post<Recipe>("/api/recipes", form, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
}

export function detectIngredients(imageUri: string): Promise<string[]> {
  const form = new FormData();
  const filename = imageUri.split("/").pop() ?? "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : "jpg";
  form.append("image", {
    uri: imageUri,
    name: filename,
    type: `image/${ext === "jpg" ? "jpeg" : ext}`,
  } as unknown as Blob);

  return apiClient
    .post<{ ingredients: string[] }>("/api/recipes/detect-ingredients", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 10000,
    })
    .then((r) => r.data.ingredients)
    .catch(() => [] as string[]);
}

export function likeRecipe(id: string) {
  return apiClient
    .post<{ likeCount: number; likedByMe: boolean }>(`/api/recipes/${id}/like`)
    .then((r) => r.data);
}

export function unlikeRecipe(id: string) {
  return apiClient
    .delete<{ likeCount: number; likedByMe: boolean }>(`/api/recipes/${id}/like`)
    .then((r) => r.data);
}

export function saveRecipe(id: string) {
  return apiClient
    .post<{ favoriteCount: number; savedByMe: boolean }>(`/api/recipes/${id}/favorite`)
    .then((r) => r.data);
}

export function unsaveRecipe(id: string) {
  return apiClient
    .delete<{ favoriteCount: number; savedByMe: boolean }>(`/api/recipes/${id}/favorite`)
    .then((r) => r.data);
}

export function getComments(recipeId: string) {
  return apiClient.get<{ comments: Comment[] }>(`/api/recipes/${recipeId}/comments`).then((r) => r.data.comments);
}

export function postComment(recipeId: string, text: string) {
  return apiClient.post<Comment>(`/api/recipes/${recipeId}/comments`, { text }).then((r) => r.data);
}

export function getUserProfile(id: string) {
  return apiClient
    .get<
      User & {
        createdAt: string;
        recipes: Recipe[];
        followerCount: number;
        followingCount: number;
        followedByMe: boolean;
      }
    >(`/api/users/${id}`)
    .then((r) => r.data);
}

export function getUserFavorites(id: string) {
  return apiClient.get<{ recipes: Recipe[] }>(`/api/users/${id}/favorites`).then((r) => r.data.recipes);
}

export function followUser(id: string) {
  return apiClient
    .post<{ followerCount: number; followedByMe: boolean }>(`/api/users/${id}/follow`)
    .then((r) => r.data);
}

export function unfollowUser(id: string) {
  return apiClient
    .delete<{ followerCount: number; followedByMe: boolean }>(`/api/users/${id}/follow`)
    .then((r) => r.data);
}
