-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "restaurantId" TEXT;

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "category" TEXT,
    "priceRange" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestaurantLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantComment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestaurantComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestaurantFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Restaurant_authorId_idx" ON "Restaurant"("authorId");

-- CreateIndex
CREATE INDEX "Restaurant_category_idx" ON "Restaurant"("category");

-- CreateIndex
CREATE INDEX "RestaurantLike_restaurantId_idx" ON "RestaurantLike"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantLike_userId_restaurantId_key" ON "RestaurantLike"("userId", "restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantComment_restaurantId_idx" ON "RestaurantComment"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantFavorite_restaurantId_idx" ON "RestaurantFavorite"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantFavorite_userId_restaurantId_key" ON "RestaurantFavorite"("userId", "restaurantId");

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantLike" ADD CONSTRAINT "RestaurantLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantLike" ADD CONSTRAINT "RestaurantLike_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantComment" ADD CONSTRAINT "RestaurantComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantComment" ADD CONSTRAINT "RestaurantComment_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantFavorite" ADD CONSTRAINT "RestaurantFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantFavorite" ADD CONSTRAINT "RestaurantFavorite_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
