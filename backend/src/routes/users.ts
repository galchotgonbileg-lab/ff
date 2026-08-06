import { Router } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth, requireAuth, AuthRequest } from "../middleware/auth";
import { notify } from "../lib/notify";

const router = Router();

// GET /api/users/:id
router.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
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
      _count: { select: { followers: true, following: true } },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let followedByMe = false;
  if (req.userId && req.userId !== user.id) {
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.userId, followingId: user.id } },
    });
    followedByMe = !!existing;
  }

  const { _count, ...rest } = user;
  res.json({
    ...rest,
    followerCount: _count.followers,
    followingCount: _count.following,
    followedByMe,
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

// POST /api/users/:id/follow
router.post("/:id/follow", requireAuth, async (req: AuthRequest, res) => {
  const followingId = req.params.id;
  if (followingId === req.userId) {
    return res.status(400).json({ error: "Өөрийгөө дагах боломжгүй" });
  }

  const target = await prisma.user.findUnique({ where: { id: followingId } });
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.userId!, followingId } },
  });
  if (!existing) {
    await prisma.follow.create({ data: { followerId: req.userId!, followingId } });
    await notify({ userId: followingId, actorId: req.userId!, type: "FOLLOW" });
  }

  const followerCount = await prisma.follow.count({ where: { followingId } });
  res.status(201).json({ followerCount, followedByMe: true });
});

// DELETE /api/users/:id/follow
router.delete("/:id/follow", requireAuth, async (req: AuthRequest, res) => {
  const followingId = req.params.id;
  await prisma.follow.deleteMany({ where: { followerId: req.userId!, followingId } });

  const followerCount = await prisma.follow.count({ where: { followingId } });
  res.json({ followerCount, followedByMe: false });
});

export default router;
