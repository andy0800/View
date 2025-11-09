'use strict';

const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

// 1) Multer in-memory config (for parsing incoming files)
const storage = multer.memoryStorage();
const upload  = multer({ storage });

/**
 * Uploads a buffer to S3 when S3 env vars are configured.
 * Falls back to local disk at /uploads/[folder]/[filename] otherwise.
 * Returns an absolute S3 URL when using S3, otherwise a local public path (/uploads/...).
 */
async function uploadToS3(buffer, originalName, folder) {
  try {
    const region   = process.env.AWS_REGION;
    const bucket   = process.env.S3_BUCKET;
    const hasS3    = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && region && bucket);

    // Build a unique filename
    const ext      = path.extname(originalName || '') || '';
    const rand     = crypto.randomBytes(6).toString('hex');
    const fileName = `${Date.now()}_${rand}${ext.toLowerCase()}`;

    // If S3 is configured, prefer uploading there
    if (hasS3) {
      const s3 = new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });

      const key = `${folder}/${fileName}`;

      // Minimal content-type detection
      const lower = (ext || '').toLowerCase();
      let contentType = 'application/octet-stream';
      if (lower === '.mp4') contentType = 'video/mp4';
      else if (lower === '.webm') contentType = 'video/webm';
      else if (lower === '.ogg') contentType = 'video/ogg';
      else if (lower === '.jpg' || lower === '.jpeg') contentType = 'image/jpeg';
      else if (lower === '.png') contentType = 'image/png';

      // Use high-level Upload for multi-part support on large files
      const uploader = new Upload({
        client: s3,
        params: {
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read' // If bucket is public. Remove if using CloudFront OAC.
        }
      });

      await uploader.done();

      // Build public URL
      const baseUrl = process.env.S3_BASE_URL && process.env.S3_BASE_URL.trim().length > 0
        ? process.env.S3_BASE_URL.trim().replace(/\/+$/, '')
        : `https://${bucket}.s3.${region}.amazonaws.com`;

      const publicUrl = `${baseUrl}/${key}`;
      console.log(`✅ Uploaded to S3: s3://${bucket}/${key} -> ${publicUrl}`);
      return publicUrl;
    }

    // Fallback: write to local disk under backend/src/uploads
    const baseDir = path.resolve(__dirname, '..', 'uploads', folder);
    fs.mkdirSync(baseDir, { recursive: true });

    const filePath = path.join(baseDir, fileName);

    // Write file
    fs.writeFileSync(filePath, buffer);
    
    // Verify file was written successfully
    if (!fs.existsSync(filePath)) {
      throw new Error('Failed to write file to disk');
    }

    console.log(`✅ File uploaded successfully: ${fileName} (${buffer.length} bytes) to ${filePath}`);

    // Return the public URL your frontend can later fetch
    // This matches the static serving path in server.js: /uploads
    return `/uploads/${folder}/${fileName}`;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

module.exports = {
  upload,
  uploadToS3
};