/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";

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
          .object({ emailAddress: z.string(), subscribeId: z.string() })
          .array(),
      }),
    )
    .mutation(async ({ input }) => {
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let x = 0; x < input.toAddress.length; x++) {
        console.log(`sending emails ${x + 1} of ${input.toAddress.length}`);

        const unsubscribeLinkHtml = `<div style="text-align: center;">Copyright (C) ${new Date().getFullYear()} All rights reserved. <a href="${env.NEXTAUTH_URL}/unsubscribe/${input.toAddress[x]!.subscribeId}" target="_blank;">Unsubscribe</a></div>`;
        const unsubscribeTextHtml = `Copyright (C) ${new Date().getFullYear()} All rights reserved. You can unsubscribe here: ${env.NEXTAUTH_URL}/unsubscribe/${input.toAddress[x]!.subscribeId}`;

        const sqsCommand = new SendMessageCommand({
          QueueUrl: env.SQS_QUEUE_URL,
          MessageBody: JSON.stringify({
            to: [input.toAddress[x]!.emailAddress],
            subject: input.subject,
            html: input.bodyHtml + unsubscribeLinkHtml,
            text: input.bodyPlainText + unsubscribeTextHtml,
          }),
        });
        sqs.send(sqsCommand).catch((err) => {
          // TODO: on error, delete the bad email
          console.error(err);
          throw err;
        });
      }
    }),
});
