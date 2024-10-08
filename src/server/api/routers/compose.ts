import {
  SQSClient,
  SendMessageBatchCommand,
  type SendMessageBatchRequestEntry,
} from "@aws-sdk/client-sqs";
import { z } from "zod";
import { arrayChunkBySize } from "array-chunk-split";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import { replaceEmailSubject } from "~/utils/utils";

const sqs = new SQSClient({
  region: env.SES_REGION,
  credentials: {
    accessKeyId: env.SES_ACCESS_KEY,
    secretAccessKey: env.SES_SECRET_KEY,
  },
});

export const composeRouter = createTRPCRouter({
  sendEmail: protectedProcedure
    .input(
      z.object({
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
    .mutation(async ({ input }) => {
      const sqsMessageGroupId = `${Date.now()}`;
      const splittedArray = arrayChunkBySize(input.toAddress, 5);

      for (const arr of splittedArray) {
        const params: {
          QueueUrl: string;
          Entries: SendMessageBatchRequestEntry[];
        } = {
          QueueUrl: env.SQS_QUEUE_URL,
          Entries: [],
        };

        for (const message of arr) {
          const unsubscribeLinkHtml = `<div style="text-align: center;">Copyright (C) ${new Date().getFullYear()} All rights reserved. <a href="${env.NEXTAUTH_URL}/unsubscribe/${message.subscribeId}" target="_blank;">Unsubscribe</a></div>`;
          const unsubscribeTextHtml = `Copyright (C) ${new Date().getFullYear()} All rights reserved. You can unsubscribe here: ${env.NEXTAUTH_URL}/unsubscribe/${message.subscribeId}`;
          const updatedSubject = replaceEmailSubject(
            input.subject,
            message.firstName,
          );

          params.Entries.push({
            Id: `${Date.now()}-${message.subscribeId}`,
            MessageBody: JSON.stringify({
              to: [message.emailAddress],
              subject: updatedSubject,
              html: input.bodyHtml + unsubscribeLinkHtml,
              text: input.bodyPlainText + unsubscribeTextHtml,
            }),
            MessageGroupId: sqsMessageGroupId,
            MessageDeduplicationId: `${Date.now()}-${message.subscribeId}`,
          });
        }

        const command = new SendMessageBatchCommand(params);
        await sqs.send(command).catch((err) => {
          // TODO: on error, delete the bad email
          console.error(err);
          throw err;
        });
      }
    }),
});
