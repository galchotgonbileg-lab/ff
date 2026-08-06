import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

const PAGE_SIZE = 20;

function paginationParams(req: { query: any }) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  return { page, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});

const loginSchema = z.object({ password: z.string().min(1) });

router.post("/login", loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  if (parsed.data.password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET!, { expiresIn: "12h" });
  res.json({ token });
});

router.get("/timeseries", requireAdmin, async (_req, res) => {
  const days = 14;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const [users, recipes] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.recipe.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);

  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().slice(0, 10), users: 0, recipes: 0 };
  });
  const indexByDate = new Map(buckets.map((b, i) => [b.date, i]));

  for (const u of users) {
    const key = u.createdAt.toISOString().slice(0, 10);
    const i = indexByDate.get(key);
    if (i !== undefined) buckets[i].users++;
  }
  for (const r of recipes) {
    const key = r.createdAt.toISOString().slice(0, 10);
    const i = indexByDate.get(key);
    if (i !== undefined) buckets[i].recipes++;
  }

  res.json({ days: buckets });
});

router.get("/stats", requireAdmin, async (_req, res) => {
  const [userCount, recipeCount, commentCount, likeCount, favoriteCount] = await Promise.all([
    prisma.user.count(),
    prisma.recipe.count(),
    prisma.comment.count(),
    prisma.like.count(),
    prisma.favorite.count(),
  ]);
  res.json({ userCount, recipeCount, commentCount, likeCount, favoriteCount });
});

router.get("/users", requireAdmin, async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const { page, skip, take } = paginationParams(req);
  const where = search
    ? { OR: [{ email: { contains: search, mode: "insensitive" as const } }, { username: { contains: search, mode: "insensitive" as const } }] }
    : undefined;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        _count: { select: { recipes: true, comments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ users, page, pageSize: take, total });
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } }).catch(() => null);
  res.status(204).end();
});

router.get("/recipes", requireAdmin, async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const { page, skip, take } = paginationParams(req);
  const where = search ? { title: { contains: search, mode: "insensitive" as const } } : undefined;

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        author: { select: { id: true, username: true, email: true } },
        _count: { select: { likes: true, comments: true, favorites: true } },
      },
    }),
    prisma.recipe.count({ where }),
  ]);
  res.json({ recipes, page, pageSize: take, total });
});

router.get("/recipes/:id", requireAdmin, async (req, res) => {
  const recipe = await prisma.recipe.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: { id: true, username: true, email: true } },
      _count: { select: { likes: true, comments: true, favorites: true } },
    },
  });
  if (!recipe) return res.status(404).json({ error: "Not found" });
  res.json(recipe);
});

router.delete("/recipes/:id", requireAdmin, async (req, res) => {
  await prisma.recipe.delete({ where: { id: req.params.id } }).catch(() => null);
  res.status(204).end();
});

router.get("/comments", requireAdmin, async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const { page, skip, take } = paginationParams(req);
  const where = search
    ? {
        OR: [
          { text: { contains: search, mode: "insensitive" as const } },
          { user: { username: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : undefined;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        user: { select: { id: true, username: true } },
        recipe: { select: { id: true, title: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);
  res.json({ comments, page, pageSize: take, total });
});

router.delete("/comments/:id", requireAdmin, async (req, res) => {
  await prisma.comment.delete({ where: { id: req.params.id } }).catch(() => null);
  res.status(204).end();
});

export default router;
