import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { DeleteScheduleCommand } from "@aws-sdk/client-scheduler";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import { sanitizeStringWithUniqueId, CAMPAIGN_STATUS } from "~/utils/utils";
import { schedulerClient, s3Client } from "~/server/aws";

export const campaignRouter = createTRPCRouter({
  save: protectedProcedure
    .input(
      z.object({
        segmentName: z.string(),
        subscriberCount: z.number(),
        status: z.nativeEnum(CAMPAIGN_STATUS),
        scheduleTime: z.string(),
        subject: z.string(),
        bodyHtml: z.string(),
        bodyPlainText: z.string(),
        toAddress: z
          .object({
            emailAddress: z.string(),
            subscribeId: z.string(),
            firstName: z.string().nullable(),
            lastName: z.string().nullable(),
          })
          .array(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const sanitizedSubject = sanitizeStringWithUniqueId(input.subject);
        const key = `${sanitizedSubject}.json`;
        const inputToJSON = JSON.stringify(input);

        const params = {
          Bucket: env.S3_BUCKET_NAME,
          Key: key,
          Body: inputToJSON,
          ContentType: "application/json",
        };

        const data = await s3Client.send(new PutObjectCommand(params));
        console.log("Success, JSON uploaded:", data);

        let campaignStatus = CAMPAIGN_STATUS.SENT;
        if (input.scheduleTime) {
          campaignStatus = CAMPAIGN_STATUS.SCHEDULED;
        } else if (input.status === CAMPAIGN_STATUS.DRAFT) {
          campaignStatus = CAMPAIGN_STATUS.DRAFT;
        }

        await ctx.db.campaign.create({
          data: {
            title: input.subject,
            s3Key: sanitizedSubject,
            status: campaignStatus,
            segmentList: [input.segmentName],
            totalEmailSent: input.subscriberCount,
            scheduleKey: input.scheduleTime ? sanitizedSubject : null,
            scheduleDate: input.scheduleTime ? input.scheduleTime : null,
          },
        });

        return sanitizedSubject;
      } catch (err) {
        console.error("Error uploading JSON:", err);
        throw err;
      }
    }),
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.campaign.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),
  delete: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        s3Key: z.string(),
        isScheduled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.campaign.delete({
          where: {
            id: input.campaignId,
          },
        });

        // Set up the parameters for the S3 deleteObject request
        const params = {
          Bucket: env.S3_BUCKET_NAME,
          Key: `${input.s3Key}.json`,
        };

        const data = await s3Client.send(new DeleteObjectCommand(params));
        console.log("Success, s3 object deleted:", data);

        if (input.isScheduled) {
          const command = new DeleteScheduleCommand({ Name: input.s3Key });
          const response = await schedulerClient.send(command);
          console.log("Schedule deleted successfully:", response);
        }
      } catch (err) {
        console.error("Error deleting campaign:", err);
        throw err;
      }
    }),
});
