import { Router } from "express";
import { z } from "zod";
import fs from "fs";
import { prisma } from "../lib/prisma";
import { requireAuth, optionalAuth, AuthRequest } from "../middleware/auth";
import { upload } from "../lib/upload";
import { detectIngredients } from "../lib/recognitionClient";
import { notify } from "../lib/notify";

const router = Router();

// `likes` here is the current user's own like rows (queried with a
// `where: { userId }` filter), used only to derive `likedByMe` — it's never
// the full likes list. `comments`, if present on the input, passes through.
function recipeWithCounts(recipe: any) {
  const { likes, favorites, _count, ...rest } = recipe;
  return {
    ...rest,
    likeCount: _count?.likes ?? 0,
    commentCount: _count?.comments ?? 0,
    favoriteCount: _count?.favorites ?? 0,
    likedByMe: likes ? likes.length > 0 : undefined,
    savedByMe: favorites ? favorites.length > 0 : undefined,
  };
}

// GET /api/recipes?search=&category=&sort=new|top&page=
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
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { ingredients: { has: search } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "top" ? [{ likes: { _count: "desc" as const } }, { createdAt: "desc" as const }] : { createdAt: "desc" as const };

  const recipes = await prisma.recipe.findMany({
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

  res.json({ recipes: recipes.map((r) => recipeWithCounts(r)), page, pageSize });
});

// GET /api/recipes/:id
router.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  const recipe = await prisma.recipe.findUnique({
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

  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  res.json(recipeWithCounts(recipe));
});

// POST /api/recipes/detect-ingredients (multipart: image) — best-effort AI suggestion,
// never fails the caller: on any recognition-service problem it returns an empty list
// with 200 rather than an error, since this is a non-blocking nice-to-have.
router.post("/detect-ingredients", requireAuth, upload.single("image"), async (req: AuthRequest, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "image is required" });
  }

  try {
    const detections = await detectIngredients(req.file.path, req.file.mimetype);
    res.json({ ingredients: detections.map((d) => d.labelMn) });
  } catch (err) {
    console.error("recognition service error:", err);
    res.json({ ingredients: [] });
  } finally {
    await fs.promises.unlink(req.file.path).catch(() => {});
  }
});

const createRecipeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  ingredients: z.array(z.string().min(1)).min(1),
  steps: z.array(z.string().min(1)).min(1),
  category: z.string().min(1).max(80).optional(),
  prepTime: z.coerce.number().int().positive().max(1440).optional(),
  cookTime: z.coerce.number().int().positive().max(1440).optional(),
  servings: z.coerce.number().int().positive().max(100).optional(),
  difficulty: z.enum(["Амархан", "Дунд", "Хэцүү"]).optional(),
});

// POST /api/recipes (multipart: title, description, ingredients (JSON string[]), steps (JSON string[]), metadata, image?)
router.post("/", requireAuth, upload.single("image"), async (req: AuthRequest, res) => {
  let ingredients: unknown;
  let steps: unknown;
  try {
    ingredients = JSON.parse(req.body.ingredients ?? "[]");
    steps = JSON.parse(req.body.steps ?? "[]");
  } catch {
    return res.status(400).json({ error: "ingredients and steps must be JSON arrays of strings" });
  }

  const parsed = createRecipeSchema.safeParse({
    title: req.body.title,
    description: req.body.description,
    ingredients,
    steps,
    category: req.body.category || undefined,
    prepTime: req.body.prepTime || undefined,
    cookTime: req.body.cookTime || undefined,
    servings: req.body.servings || undefined,
    difficulty: req.body.difficulty || undefined,
  });
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  const recipe = await prisma.recipe.create({
    data: {
      authorId: req.userId!,
      title: parsed.data.title,
      description: parsed.data.description,
      ingredients: parsed.data.ingredients,
      steps: parsed.data.steps,
      imageUrl,
      category: parsed.data.category,
      prepTime: parsed.data.prepTime,
      cookTime: parsed.data.cookTime,
      servings: parsed.data.servings,
      difficulty: parsed.data.difficulty,
    },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true, favorites: true } },
    },
  });

  res.status(201).json(recipeWithCounts(recipe));
});

// POST /api/recipes/:id/favorite
router.post("/:id/favorite", requireAuth, async (req: AuthRequest, res) => {
  const recipeId = req.params.id;
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  await prisma.favorite.upsert({
    where: { userId_recipeId: { userId: req.userId!, recipeId } },
    create: { userId: req.userId!, recipeId },
    update: {},
  });

  const favoriteCount = await prisma.favorite.count({ where: { recipeId } });
  res.status(201).json({ favoriteCount, savedByMe: true });
});

// DELETE /api/recipes/:id/favorite
router.delete("/:id/favorite", requireAuth, async (req: AuthRequest, res) => {
  const recipeId = req.params.id;

  await prisma.favorite.deleteMany({ where: { userId: req.userId!, recipeId } });

  const favoriteCount = await prisma.favorite.count({ where: { recipeId } });
  res.json({ favoriteCount, savedByMe: false });
});

// POST /api/recipes/:id/like
router.post("/:id/like", requireAuth, async (req: AuthRequest, res) => {
  const recipeId = req.params.id;
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  const existing = await prisma.like.findUnique({
    where: { userId_recipeId: { userId: req.userId!, recipeId } },
  });
  if (!existing) {
    await prisma.like.create({ data: { userId: req.userId!, recipeId } });
    await notify({ userId: recipe.authorId, actorId: req.userId!, type: "LIKE", recipeId });
  }

  const likeCount = await prisma.like.count({ where: { recipeId } });
  res.status(201).json({ likeCount, likedByMe: true });
});

// DELETE /api/recipes/:id/like
router.delete("/:id/like", requireAuth, async (req: AuthRequest, res) => {
  const recipeId = req.params.id;

  await prisma.like.deleteMany({ where: { userId: req.userId!, recipeId } });

  const likeCount = await prisma.like.count({ where: { recipeId } });
  res.json({ likeCount, likedByMe: false });
});

// GET /api/recipes/:id/comments
router.get("/:id/comments", async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { recipeId: req.params.id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
  });
  res.json({ comments });
});

const createCommentSchema = z.object({
  text: z.string().min(1).max(1000),
});

// POST /api/recipes/:id/comments
router.post("/:id/comments", requireAuth, async (req: AuthRequest, res) => {
  const recipeId = req.params.id;
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const comment = await prisma.comment.create({
    data: { userId: req.userId!, recipeId, text: parsed.data.text },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
  });

  await notify({ userId: recipe.authorId, actorId: req.userId!, type: "COMMENT", recipeId });

  res.status(201).json(comment);
});

export default router;
