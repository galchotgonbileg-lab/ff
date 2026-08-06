export interface User {
  id: string;
  email?: string;
  username: string;
  avatarUrl?: string | null;
}

export interface Recipe {
  id: string;
  authorId: string;
  author: User;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  imageUrl?: string | null;
  category?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
  difficulty?: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  recipeId: string;
  text: string;
  createdAt: string;
  user: User;
}
