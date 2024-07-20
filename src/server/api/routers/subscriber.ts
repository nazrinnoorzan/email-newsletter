import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const subscriberRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.subscriber.findMany({
      where: { isDeactive: false },
      orderBy: { createdAt: "desc" },
      include: {
        list: {
          select: {
            segment: true,
          },
        },
      },
    });
  }),
  addSubscribers: protectedProcedure
    .input(
      z.object({
        emails: z
          .object({ email: z.string().email("This is not a valid email.") })
          .array(),
        list: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.list === -1) {
        await ctx.db.subscriber.createMany({
          data: input.emails,
          skipDuplicates: true,
        });
      } else {
        await Promise.all(
          input.emails.map((email) =>
            ctx.db.subscriber.upsert({
              where: { email: email.email },
              update: {
                list: {
                  create: [
                    {
                      segment: {
                        connect: {
                          id: input.list,
                        },
                      },
                    },
                  ],
                },
              },
              create: {
                email: email.email,
                list: {
                  create: [
                    {
                      segment: {
                        connect: {
                          id: input.list,
                        },
                      },
                    },
                  ],
                },
              },
            }),
          ),
        );
      }
    }),
  deactivateSubscribers: publicProcedure
    .input(z.object({ unsubscribeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.subscriber.update({
        where: {
          id: input.unsubscribeId,
        },
        data: {
          isDeactive: true,
        },
      });
    }),
  getSubscriberId: publicProcedure
    .input(z.object({ email: z.string().email("This is not a valid email.") }))
    .query(async ({ ctx, input }) => {
      const subscriberData = await ctx.db.subscriber.findUniqueOrThrow({
        where: {
          email: input.email,
        },
      });

      return subscriberData;
    }),
});
