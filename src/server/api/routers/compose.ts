import {
  SQSClient,
  SendMessageBatchCommand,
  type SendMessageBatchRequestEntry,
} from "@aws-sdk/client-sqs";
import {
  SchedulerClient,
  CreateScheduleCommand,
  ScheduleState,
  FlexibleTimeWindowMode,
  ActionAfterCompletion,
} from "@aws-sdk/client-scheduler";
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

const schedulerClient = new SchedulerClient({
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
  sendEventBridge: protectedProcedure
    .input(
      z.object({
        date: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const scheduleParams = {
          Name: "MyOneTimeSchedule1", // Name of the schedule, must be unique
          FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF }, // No flexibility needed for a one-time schedule
          ScheduleExpression: `at(${input.date})`, // ISO 8601 time format for the specific date and time
          ScheduleExpressionTimezone: "Asia/Singapore",
          Target: {
            Arn: "arn:aws:lambda:ap-southeast-1:058264523057:function:testEventBridge", // Target Lambda function
            RoleArn:
              "arn:aws:iam::058264523057:role/Amazon_EventBridge_Scheduler_LAMBDA", // Role that allows the Scheduler to invoke the target
            Input: JSON.stringify({ test: "hello world!" }), // Optional: Input passed to the Lambda function
          },
          State: ScheduleState.ENABLED,
          ActionAfterCompletion: ActionAfterCompletion.DELETE,
        };

        const createScheduleCommand = new CreateScheduleCommand(scheduleParams);
        const scheduleData = await schedulerClient.send(createScheduleCommand);

        console.log("Scheduler created successfully:", scheduleData);
      } catch (err) {
        console.error("Error creating scheduler:", err);
        throw err;
      }
    }),
});
