import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const segmentRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.segment.findMany();
  }),
  getSubscribers: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data = await ctx.db.segment.findFirst({
        where: {
          id: input.id,
        },
        include: {
          list: {
            select: {
              subscriber: true,
            },
          },
        },
      });

      return data;
    }),
  addSegment: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.segment.create({
        data: {
          name: input.name,
        },
      });
    }),
});
