import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/notifications
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: { select: { id: true, username: true, avatarUrl: true } },
      recipe: { select: { id: true, title: true, imageUrl: true } },
    },
  });
  res.json({ notifications });
});

// GET /api/notifications/unread-count
router.get("/unread-count", requireAuth, async (req: AuthRequest, res) => {
  const count = await prisma.notification.count({ where: { userId: req.userId!, read: false } });
  res.json({ count });
});

// POST /api/notifications/read — mark all as read
router.post("/read", requireAuth, async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({ where: { userId: req.userId!, read: false }, data: { read: true } });
  res.json({ ok: true });
});

export default router;
