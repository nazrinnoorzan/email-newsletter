import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { DeleteScheduleCommand } from "@aws-sdk/client-scheduler";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import { sanitizeStringWithUniqueId, CAMPAIGN_STATUS } from "~/utils/utils";
import { schedulerClient, s3Client } from "~/server/aws";
import { type Readable } from "stream";

// Helper function to convert stream to string
async function streamToString(stream: Readable) {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}

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
  find: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const campaignData = await ctx.db.campaign.findUnique({
          where: {
            id: input.campaignId,
          },
        });
        const segmentData = await ctx.db.segment.findFirst({
          where: {
            name: (campaignData?.segmentList as string[])?.[0] ?? "",
          },
        });

        const response = await s3Client.send(
          new GetObjectCommand({
            Bucket: env.S3_BUCKET_NAME,
            Key: `${campaignData?.s3Key}.json`,
          }),
        );
        const stream = response.Body as Readable;
        const s3Data = await streamToString(stream);

        const edittedCampaignData = {
          ...campaignData,
          segmentName: (campaignData?.segmentList as string[])?.[0] ?? "",
          segmentId: `${segmentData?.id}`,
          objectData: s3Data,
        };

        return edittedCampaignData;
      } catch (err) {
        console.error("Error find campaign data:", err);
        throw err;
      }
    }),
  update: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        s3key: z.string(),
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
        const key = `${input.s3key}.json`;
        const inputToJSON = JSON.stringify(input);

        const params = {
          Bucket: env.S3_BUCKET_NAME,
          Key: key,
          Body: inputToJSON,
          ContentType: "application/json",
        };

        const data = await s3Client.send(new PutObjectCommand(params));
        console.log("Success, JSON updated:", data);

        let campaignStatus = CAMPAIGN_STATUS.SENT;
        if (input.scheduleTime) {
          campaignStatus = CAMPAIGN_STATUS.SCHEDULED;
        } else if (input.status === CAMPAIGN_STATUS.DRAFT) {
          campaignStatus = CAMPAIGN_STATUS.DRAFT;
        }

        await ctx.db.campaign.update({
          where: { id: input.campaignId },
          data: {
            title: input.subject,
            status: campaignStatus,
            segmentList: [input.segmentName],
            totalEmailSent: input.subscriberCount,
            scheduleKey: input.scheduleTime ? input.s3key : null,
            scheduleDate: input.scheduleTime ? input.scheduleTime : null,
          },
        });

        return input.s3key;
      } catch (err) {
        console.error("Error updating JSON:", err);
        throw err;
      }
    }),
});
