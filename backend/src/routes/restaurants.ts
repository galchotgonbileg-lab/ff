import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, optionalAuth, AuthRequest } from "../middleware/auth";
import { upload } from "../lib/upload";
import { notify } from "../lib/notify";

const router = Router();

function restaurantWithCounts(restaurant: any) {
  const { likes, favorites, _count, ...rest } = restaurant;
  return {
    ...rest,
    likeCount: _count?.likes ?? 0,
    commentCount: _count?.comments ?? 0,
    favoriteCount: _count?.favorites ?? 0,
    likedByMe: likes ? likes.length > 0 : undefined,
    savedByMe: favorites ? favorites.length > 0 : undefined,
  };
}

// GET /api/restaurants?search=&category=&sort=new|top&page=
router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const sort = req.query.sort === "top" ? "top" : "new";
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = 20;

  const where = {
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { address: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "top" ? [{ likes: { _count: "desc" as const } }, { createdAt: "desc" as const }] : { createdAt: "desc" as const };

  const restaurants = await prisma.restaurant.findMany({
    where,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true, favorites: true } },
      ...(req.userId
        ? {
            likes: { where: { userId: req.userId } },
            favorites: { where: { userId: req.userId } },
          }
        : {}),
    },
  });

  res.json({ restaurants: restaurants.map((r) => restaurantWithCounts(r)), page, pageSize });
});

// GET /api/restaurants/:id
router.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      },
      _count: { select: { likes: true, comments: true, favorites: true } },
      ...(req.userId
        ? {
            likes: { where: { userId: req.userId } },
            favorites: { where: { userId: req.userId } },
          }
        : {}),
    },
  });

  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }

  res.json(restaurantWithCounts(restaurant));
});

const createRestaurantSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  address: z.string().min(1).max(300),
  phone: z.string().max(30).optional(),
  category: z.string().min(1).max(80).optional(),
  priceRange: z.enum(["Хямд", "Дунд", "Үнэтэй"]).optional(),
});

// POST /api/restaurants (multipart: name, description, address, phone?, category?, priceRange?, image?)
router.post("/", requireAuth, upload.single("image"), async (req: AuthRequest, res) => {
  const parsed = createRestaurantSchema.safeParse({
    name: req.body.name,
    description: req.body.description,
    address: req.body.address,
    phone: req.body.phone || undefined,
    category: req.body.category || undefined,
    priceRange: req.body.priceRange || undefined,
  });
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  const restaurant = await prisma.restaurant.create({
    data: {
      authorId: req.userId!,
      name: parsed.data.name,
      description: parsed.data.description,
      address: parsed.data.address,
      phone: parsed.data.phone,
      category: parsed.data.category,
      priceRange: parsed.data.priceRange,
      imageUrl,
    },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true, favorites: true } },
    },
  });

  res.status(201).json(restaurantWithCounts(restaurant));
});

// POST /api/restaurants/:id/favorite
router.post("/:id/favorite", requireAuth, async (req: AuthRequest, res) => {
  const restaurantId = req.params.id;
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }

  await prisma.restaurantFavorite.upsert({
    where: { userId_restaurantId: { userId: req.userId!, restaurantId } },
    create: { userId: req.userId!, restaurantId },
    update: {},
  });

  const favoriteCount = await prisma.restaurantFavorite.count({ where: { restaurantId } });
  res.status(201).json({ favoriteCount, savedByMe: true });
});

// DELETE /api/restaurants/:id/favorite
router.delete("/:id/favorite", requireAuth, async (req: AuthRequest, res) => {
  const restaurantId = req.params.id;

  await prisma.restaurantFavorite.deleteMany({ where: { userId: req.userId!, restaurantId } });

  const favoriteCount = await prisma.restaurantFavorite.count({ where: { restaurantId } });
  res.json({ favoriteCount, savedByMe: false });
});

// POST /api/restaurants/:id/like
router.post("/:id/like", requireAuth, async (req: AuthRequest, res) => {
  const restaurantId = req.params.id;
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }

  const existing = await prisma.restaurantLike.findUnique({
    where: { userId_restaurantId: { userId: req.userId!, restaurantId } },
  });
  if (!existing) {
    await prisma.restaurantLike.create({ data: { userId: req.userId!, restaurantId } });
    await notify({ userId: restaurant.authorId, actorId: req.userId!, type: "LIKE", restaurantId });
  }

  const likeCount = await prisma.restaurantLike.count({ where: { restaurantId } });
  res.status(201).json({ likeCount, likedByMe: true });
});

// DELETE /api/restaurants/:id/like
router.delete("/:id/like", requireAuth, async (req: AuthRequest, res) => {
  const restaurantId = req.params.id;

  await prisma.restaurantLike.deleteMany({ where: { userId: req.userId!, restaurantId } });

  const likeCount = await prisma.restaurantLike.count({ where: { restaurantId } });
  res.json({ likeCount, likedByMe: false });
});

// GET /api/restaurants/:id/comments
router.get("/:id/comments", async (req, res) => {
  const comments = await prisma.restaurantComment.findMany({
    where: { restaurantId: req.params.id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
  });
  res.json({ comments });
});

const createCommentSchema = z.object({
  text: z.string().min(1).max(1000),
});

// POST /api/restaurants/:id/comments
router.post("/:id/comments", requireAuth, async (req: AuthRequest, res) => {
  const restaurantId = req.params.id;
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) {
    return res.status(404).json({ error: "Restaurant not found" });
  }

  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const comment = await prisma.restaurantComment.create({
    data: { userId: req.userId!, restaurantId, text: parsed.data.text },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
  });

  await notify({ userId: restaurant.authorId, actorId: req.userId!, type: "COMMENT", restaurantId });

  res.status(201).json(comment);
});

export default router;
