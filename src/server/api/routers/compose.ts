/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { SES } from "@aws-sdk/client-ses";
import { z } from "zod";
import throttledQueue from "throttled-queue";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";

const throttle = throttledQueue(12, 1000, true);
const ses = new SES({
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
        await throttle(() => {
          console.log(`sending emails ${x + 1} of ${input.toAddress.length}`);

          const unsubscribeLinkHtml = `<div style="text-align: center;">Copyright (C) ${new Date().getFullYear()} Diri Technologies Sdn. Bhd. All rights reserved. <a href="${env.NEXTAUTH_URL}/unsubscribe/${input.toAddress[x]!.subscribeId}" target="_blank;">Unsubscribe</a></div>`;
          const unsubscribeTextHtml = `Copyright (C) ${new Date().getFullYear()} Diri Technologies Sdn. Bhd. All rights reserved. You can unsubscribe here: ${env.NEXTAUTH_URL}/unsubscribe/${input.toAddress[x]!.subscribeId}`;

          ses
            .sendEmail({
              Destination: {
                ToAddresses: [input.toAddress[x]!.emailAddress],
              },
              Message: {
                Body: {
                  Html: {
                    Charset: "UTF-8",
                    Data: input.bodyHtml + unsubscribeLinkHtml,
                  },
                  Text: {
                    Charset: "UTF-8",
                    Data: input.bodyPlainText + unsubscribeTextHtml,
                  },
                },
                Subject: {
                  Charset: "UTF-8",
                  Data: input.subject,
                },
              },
              ReturnPath: env.SES_EMAIL_RETURN,
              Source: env.SES_EMAIL_SENDER,
            })
            .catch((err) => {
              // TODO: on error, delete the bad email
              console.error(err);
              throw err;
            });
        });
      }
    }),
});
