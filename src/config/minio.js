require('dotenv').config();
const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
});

const BUCKETS = {
  COVERS: process.env.MINIO_BUCKET_COVERS || 'book-covers',
  EBOOKS: process.env.MINIO_BUCKET_EBOOKS || 'ebooks',
  PHOTOS: process.env.MINIO_BUCKET_PHOTOS || 'user-photos'
};

/**
 * Ensure all required buckets exist
 */
async function initBuckets() {
  for (const bucket of Object.values(BUCKETS)) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket, 'us-east-1');
        console.log(`MinIO bucket '${bucket}' created.`);
      }
    } catch (err) {
      console.error(`Error initializing MinIO bucket '${bucket}':`, err.message);
    }
  }
}

/**
 * Upload a file buffer to MinIO
 * @param {string} bucket - Bucket name
 * @param {string} objectName - Object key/path
 * @param {Buffer} buffer - File buffer
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} Object name
 */
async function uploadFile(bucket, objectName, buffer, contentType) {
  await minioClient.putObject(bucket, objectName, buffer, buffer.length, {
    'Content-Type': contentType
  });
  return objectName;
}

/**
 * Generate a presigned URL for reading an object (valid 7 days)
 * @param {string} bucket - Bucket name
 * @param {string} objectName - Object key
 * @param {number} expires - Expiry in seconds (default 7 days)
 * @returns {Promise<string>} Presigned URL
 */
async function getPresignedUrl(bucket, objectName, expires = 7 * 24 * 60 * 60) {
  return await minioClient.presignedGetObject(bucket, objectName, expires);
}

/**
 * Delete an object from MinIO
 * @param {string} bucket - Bucket name
 * @param {string} objectName - Object key
 */
async function deleteFile(bucket, objectName) {
  await minioClient.removeObject(bucket, objectName);
}

/**
 * Check if object exists
 * @param {string} bucket - Bucket name
 * @param {string} objectName - Object key
 * @returns {Promise<boolean>}
 */
async function fileExists(bucket, objectName) {
  try {
    await minioClient.statObject(bucket, objectName);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  minioClient,
  BUCKETS,
  initBuckets,
  uploadFile,
  getPresignedUrl,
  deleteFile,
  fileExists
};
