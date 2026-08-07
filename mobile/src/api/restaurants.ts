import { apiClient } from "./client";
import { Restaurant, RestaurantComment } from "./types";

export function getRestaurantFeed(params: { search?: string; category?: string; sort?: "new" | "top"; page?: number }) {
  return apiClient
    .get<{ restaurants: Restaurant[]; page: number; pageSize: number }>("/api/restaurants", { params })
    .then((r) => r.data);
}

export function getRestaurant(id: string) {
  return apiClient
    .get<Restaurant & { comments: RestaurantComment[] }>(`/api/restaurants/${id}`)
    .then((r) => r.data);
}

export interface NewRestaurantInput {
  name: string;
  description: string;
  address: string;
  phone?: string;
  category?: string;
  priceRange?: string;
  imageUri?: string;
}

export function createRestaurant(input: NewRestaurantInput) {
  const form = new FormData();
  form.append("name", input.name);
  form.append("description", input.description);
  form.append("address", input.address);
  if (input.phone) form.append("phone", input.phone);
  if (input.category) form.append("category", input.category);
  if (input.priceRange) form.append("priceRange", input.priceRange);

  if (input.imageUri) {
    const filename = input.imageUri.split("/").pop() ?? "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : "jpg";
    form.append("image", {
      uri: input.imageUri,
      name: filename,
      type: `image/${ext === "jpg" ? "jpeg" : ext}`,
    } as unknown as Blob);
  }

  return apiClient
    .post<Restaurant>("/api/restaurants", form, { headers: { "Content-Type": "multipart/form-data" } })
    .then((r) => r.data);
}

export function likeRestaurant(id: string) {
  return apiClient
    .post<{ likeCount: number; likedByMe: boolean }>(`/api/restaurants/${id}/like`)
    .then((r) => r.data);
}

export function unlikeRestaurant(id: string) {
  return apiClient
    .delete<{ likeCount: number; likedByMe: boolean }>(`/api/restaurants/${id}/like`)
    .then((r) => r.data);
}

export function saveRestaurant(id: string) {
  return apiClient
    .post<{ favoriteCount: number; savedByMe: boolean }>(`/api/restaurants/${id}/favorite`)
    .then((r) => r.data);
}

export function unsaveRestaurant(id: string) {
  return apiClient
    .delete<{ favoriteCount: number; savedByMe: boolean }>(`/api/restaurants/${id}/favorite`)
    .then((r) => r.data);
}

export function postRestaurantComment(restaurantId: string, text: string) {
  return apiClient
    .post<RestaurantComment>(`/api/restaurants/${restaurantId}/comments`, { text })
    .then((r) => r.data);
}
