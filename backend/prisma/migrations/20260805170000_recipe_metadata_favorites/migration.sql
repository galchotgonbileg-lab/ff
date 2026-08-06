-- Add recipe metadata fields.
ALTER TABLE "Recipe" ADD COLUMN "category" TEXT;
ALTER TABLE "Recipe" ADD COLUMN "prepTime" INTEGER;
ALTER TABLE "Recipe" ADD COLUMN "cookTime" INTEGER;
ALTER TABLE "Recipe" ADD COLUMN "servings" INTEGER;
ALTER TABLE "Recipe" ADD COLUMN "difficulty" TEXT;

CREATE INDEX "Recipe_category_idx" ON "Recipe"("category");

-- Add saved/favorite recipes.
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Favorite_userId_recipeId_key" ON "Favorite"("userId", "recipeId");
CREATE INDEX "Favorite_recipeId_idx" ON "Favorite"("recipeId");

ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
