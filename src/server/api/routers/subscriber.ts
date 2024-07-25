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
  updateSubscriberList: publicProcedure
    .input(
      z.object({
        subscriberId: z.string(),
        addList: z.string().array(),
        removeList: z.string().array(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user exist
      const subscriberData = await ctx.db.subscriber.findUnique({
        where: {
          id: input.subscriberId,
        },
        include: {
          list: {
            include: {
              segment: true,
            },
          },
        },
      });

      if (!subscriberData) {
        return { code: 404, message: "Subscriber not exist!" };
      }

      // Remove segment that subscriber already in
      let filteredAddList: string[] = [];
      if (subscriberData.list.length < 0) {
        filteredAddList = [...input.addList];
      } else {
        input.addList.forEach((segment) => {
          const isSubscriberAlreadyInSegment = subscriberData.list.find(
            (segmentData) => {
              return segmentData.segment.name === segment;
            },
          );

          if (!isSubscriberAlreadyInSegment) filteredAddList.push(segment);
        });
      }

      // // Add new segment if not exist and get segment id for addList
      // const unknownSegment: string[] = [];
      // const addListId: number[] = [];

      // await Promise.all(
      //   input.addList.map(async (segment) => {
      //     const segmentData = await ctx.db.segment.findUnique({
      //       where: {
      //         name: segment,
      //       },
      //     });

      //     if (!segmentData) {
      //       unknownSegment.push(segment);
      //     } else {
      //       addListId.push(segmentData.id);
      //     }
      //   }),
      // );

      // if (unknownSegment.length > 0) {
      //   await Promise.all(
      //     unknownSegment.map(async (segment) => {
      //       const segmentData = await ctx.db.segment.create({
      //         data: {
      //           name: segment,
      //         },
      //       });

      //       addListId.push(segmentData.id);
      //     }),
      //   );
      // }

      // Get segment id for removeList
      const removeListId: number[] = [];

      await Promise.all(
        input.removeList.map(async (segment) => {
          const segmentData = await ctx.db.segment.findUnique({
            where: {
              name: segment,
            },
          });

          if (segmentData) removeListId.push(segmentData.id);
        }),
      );

      const prismaAddList = filteredAddList.map((segment) => {
        return {
          segment: {
            connectOrCreate: {
              where: {
                name: segment,
              },
              create: {
                name: segment,
              },
            },
          },
        };
      });

      const prismaRemoveList = removeListId.map((segment) => {
        return {
          segmentId: segment,
        };
      });

      await ctx.db.subscriber.update({
        where: { id: input.subscriberId },
        data: {
          list: {
            create: prismaAddList,
            deleteMany: prismaRemoveList,
          },
        },
      });

      return { code: 200, message: "Subscriber list updates!" };
    }),
});
