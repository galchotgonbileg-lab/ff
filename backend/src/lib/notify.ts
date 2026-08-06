import { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";

export async function notify(params: {
  userId: string; // recipient
  actorId: string; // who triggered it
  type: NotificationType;
  recipeId?: string;
}) {
  if (params.userId === params.actorId) return; // never notify yourself
  await prisma.notification.create({
    data: {
      userId: params.userId,
      actorId: params.actorId,
      type: params.type,
      recipeId: params.recipeId,
    },
  });
}
