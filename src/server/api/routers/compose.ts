import {
  SendMessageBatchCommand,
  type SendMessageBatchRequestEntry,
} from "@aws-sdk/client-sqs";
import {
  CreateScheduleCommand,
  ScheduleState,
  FlexibleTimeWindowMode,
  ActionAfterCompletion,
  UpdateScheduleCommand,
  DeleteScheduleCommand,
} from "@aws-sdk/client-scheduler";
import { z } from "zod";
import { arrayChunkBySize } from "array-chunk-split";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { env } from "~/env";
import { replaceEmailSubject } from "~/utils/utils";
import { sqs, schedulerClient } from "~/server/aws";

export const composeRouter = createTRPCRouter({
  sendEmail: publicProcedure
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
  sendEditedEmail: protectedProcedure
    .input(
      z.object({
        isRemoveScheduler: z.boolean(),
        schedulerName: z.string(),
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

        if (input.isRemoveScheduler) {
          const command = new DeleteScheduleCommand({
            Name: input.schedulerName,
          });
          const response = await schedulerClient.send(command);
          console.log("Schedule deleted successfully:", response);
        }
      }
    }),
  sendEventBridge: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        scheduleName: z.string(),
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
      try {
        const scheduleParams = {
          Name: input.scheduleName, // Name of the schedule, must be unique
          FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF }, // No flexibility needed for a one-time schedule
          ScheduleExpression: `at(${input.date})`, // ISO 8601 time format for the specific date and time
          ScheduleExpressionTimezone: "Asia/Singapore",
          Target: {
            Arn: env.SCHEDULE_LAMBDA, // Target Lambda function
            RoleArn: env.SCHEDULE_ROLE, // Role that allows the Scheduler to invoke the target
            Input: JSON.stringify({
              subject: input.subject,
              bodyHtml: input.bodyHtml,
              bodyPlainText: input.bodyPlainText,
              toAddress: input.toAddress,
            }), // Optional: Input passed to the Lambda function
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
  updateEventBridge: protectedProcedure
    .input(
      z.object({
        date: z.string(),
        scheduleName: z.string(),
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
      try {
        const scheduleParams = {
          Name: input.scheduleName,
          FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
          ScheduleExpression: `at(${input.date})`,
          ScheduleExpressionTimezone: "Asia/Singapore",
          Target: {
            Arn: env.SCHEDULE_LAMBDA,
            RoleArn: env.SCHEDULE_ROLE,
            Input: JSON.stringify({
              subject: input.subject,
              bodyHtml: input.bodyHtml,
              bodyPlainText: input.bodyPlainText,
              toAddress: input.toAddress,
            }),
          },
          State: ScheduleState.ENABLED,
          ActionAfterCompletion: ActionAfterCompletion.DELETE,
        };

        const updateScheduleCommand = new UpdateScheduleCommand(scheduleParams);
        const scheduleData = await schedulerClient.send(updateScheduleCommand);

        console.log("Scheduler updated successfully:", scheduleData);
      } catch (err) {
        console.error("Error updating scheduler:", err);
        throw err;
      }
    }),
});
