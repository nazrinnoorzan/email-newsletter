import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import { sanitizeStringWithUniqueId } from "~/utils/utils";

const s3Client = new S3Client({
  region: env.SES_REGION,
  credentials: {
    accessKeyId: env.SES_ACCESS_KEY,
    secretAccessKey: env.SES_SECRET_KEY,
  },
});

export const campaignRouter = createTRPCRouter({
  save: protectedProcedure
    .input(
      z.object({
        segmentName: z.string(),
        subscriberCount: z.number(),
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

        await ctx.db.campaign.create({
          data: {
            s3Key: sanitizedSubject,
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
});
