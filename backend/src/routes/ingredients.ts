import { Router } from "express";
import { INGREDIENTS } from "../data/ingredients";

const router = Router();

// GET /api/ingredients — static reference list used for autocomplete when
// writing a recipe. Small enough (a couple hundred rows) to send whole and
// filter client-side rather than adding a search endpoint.
router.get("/", (_req, res) => {
  res.json({ ingredients: INGREDIENTS });
});

export default router;
