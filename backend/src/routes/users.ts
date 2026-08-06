import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      createdAt: true,
      recipes: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { likes: true, comments: true, favorites: true } } },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    ...user,
    recipes: user.recipes.map(({ _count, ...r }) => ({
      ...r,
      likeCount: _count.likes,
      commentCount: _count.comments,
      favoriteCount: _count.favorites,
    })),
  });
});

// GET /api/users/:id/favorites
router.get("/:id/favorites", async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.params.id },
    orderBy: { createdAt: "desc" },
    include: {
      recipe: {
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { likes: true, comments: true, favorites: true } },
        },
      },
    },
  });

  res.json({
    recipes: favorites.map(({ recipe }) => {
      const { _count, ...rest } = recipe;
      return {
        ...rest,
        likeCount: _count.likes,
        commentCount: _count.comments,
        favoriteCount: _count.favorites,
        savedByMe: true,
      };
    }),
  });
});

export default router;
