import { SQSClient } from "@aws-sdk/client-sqs";
import { SchedulerClient } from "@aws-sdk/client-scheduler";
import { S3Client } from "@aws-sdk/client-s3";

import { env } from "~/env";

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

const s3Client = new S3Client({
  region: env.SES_REGION,
  credentials: {
    accessKeyId: env.SES_ACCESS_KEY,
    secretAccessKey: env.SES_SECRET_KEY,
  },
});

export { sqs, schedulerClient, s3Client };
