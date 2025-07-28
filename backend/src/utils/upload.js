'use strict';

const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');

// 1) Multer in-memory config (for parsing incoming files)
const storage = multer.memoryStorage();
const upload  = multer({ storage });

/**
 * Stub of uploadToS3: writes the buffer to disk under /uploads/[folder]/[filename],
 * returns the public path (e.g. '/uploads/civil/1234_abcd.jpg').
 */
async function uploadToS3(buffer, originalName, folder) {
  // Ensure base upload dir exists
  const baseDir = path.resolve(__dirname, '../../uploads', folder);
  fs.mkdirSync(baseDir, { recursive: true });

  // Build a unique filename
  const ext      = path.extname(originalName) || '';
  const rand     = crypto.randomBytes(6).toString('hex');
  const fileName = `${Date.now()}_${rand}${ext.toLowerCase()}`;
  const filePath = path.join(baseDir, fileName);

  // Write file
  fs.writeFileSync(filePath, buffer);

  // Return the public URL your frontend can later fetch
  // You’ll serve /uploads statically in server.js
  return `/uploads/${folder}/${fileName}`;
}

module.exports = {
  upload,
  uploadToS3
};