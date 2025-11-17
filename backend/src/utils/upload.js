'use strict';

const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

// AWS S3 Configuration - Use environment variables
const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION || process.env.AWS_S3_REGION || "eu-north-1"
};

const S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || "viewapp-ads";

// Validate required credentials
if (!AWS_CONFIG.accessKeyId || !AWS_CONFIG.secretAccessKey) {
  throw new Error('AWS credentials must be set via environment variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
}

// 1) Multer in-memory config (for parsing incoming files)
const storage = multer.memoryStorage();
const upload  = multer({ storage });

/**
 * Uploads a buffer to S3.
 * Always uses S3 - no fallback to local storage.
 * Returns an absolute S3 URL.
 */
async function uploadToS3(buffer, originalName, folder) {
  try {
    // Build a unique filename
    const ext      = path.extname(originalName || '') || '';
    const rand     = crypto.randomBytes(6).toString('hex');
    const fileName = `${Date.now()}_${rand}${ext.toLowerCase()}`;

    // Initialize S3 client
    const s3 = new S3Client({
      region: AWS_CONFIG.region,
      credentials: {
        accessKeyId: AWS_CONFIG.accessKeyId,
        secretAccessKey: AWS_CONFIG.secretAccessKey
      }
    });

    const key = `${folder}/${fileName}`;

    // Content-type detection
    const lower = (ext || '').toLowerCase();
    let contentType = 'application/octet-stream';
    if (lower === '.mp4') contentType = 'video/mp4';
    else if (lower === '.webm') contentType = 'video/webm';
    else if (lower === '.ogg') contentType = 'video/ogg';
    else if (lower === '.jpg' || lower === '.jpeg') contentType = 'image/jpeg';
    else if (lower === '.png') contentType = 'image/png';
    else if (lower === '.pdf') contentType = 'application/pdf';

    // Use high-level Upload for multi-part support on large files
    // Note: ACL is not included as the bucket has ACLs disabled
    // Public access should be configured via bucket policy if needed
    const uploader = new Upload({
      client: s3,
      params: {
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType
      }
    });

    await uploader.done();

    // Build public S3 URL
    const baseUrl = `https://${S3_BUCKET}.s3.${AWS_CONFIG.region}.amazonaws.com`;
    const publicUrl = `${baseUrl}/${key}`;
    
    console.log(`✅ Uploaded to S3: s3://${S3_BUCKET}/${key} -> ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('❌ S3 Upload failed:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
}

module.exports = {
  upload,
  uploadToS3
};