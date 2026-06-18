// Storage helpers backed by AWS S3.
// Uploads to the configured bucket and returns presigned URLs for retrieval.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

// Presigned URL validity (max allowed by SigV4 is 7 days).
const PRESIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

let cachedClient: S3Client | null = null;

function getStorageConfig(): { client: S3Client; bucket: string } {
  if (!ENV.awsS3Bucket) {
    throw new Error("Storage is not configured: set AWS_S3_BUCKET");
  }
  if (!ENV.awsRegion) {
    throw new Error("Storage is not configured: set AWS_REGION");
  }

  if (!cachedClient) {
    cachedClient = new S3Client({
      region: ENV.awsRegion,
      // Fall back to the default AWS credential provider chain (IAM role,
      // shared config, etc.) when explicit keys are not provided.
      ...(ENV.awsAccessKeyId && ENV.awsSecretAccessKey
        ? {
            credentials: {
              accessKeyId: ENV.awsAccessKeyId,
              secretAccessKey: ENV.awsSecretAccessKey,
            },
          }
        : {}),
    });
  }

  return { client: cachedClient, bucket: ENV.awsS3Bucket };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const { client, bucket } = getStorageConfig();
  const key = normalizeKey(relKey);

  const body =
    typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: PRESIGNED_URL_TTL_SECONDS }
  );

  return { key, url };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const { client, bucket } = getStorageConfig();
  const key = normalizeKey(relKey);

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: PRESIGNED_URL_TTL_SECONDS }
  );

  return { key, url };
}
