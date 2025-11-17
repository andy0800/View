const AWS = require("aws-sdk");

// AWS S3 Configuration - Use environment variables
const AWS_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION || process.env.AWS_S3_REGION || "eu-north-1"
};

// Validate required credentials
if (!AWS_CONFIG.accessKeyId || !AWS_CONFIG.secretAccessKey) {
  throw new Error('AWS credentials must be set via environment variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
}

AWS.config.update(AWS_CONFIG);

const s3 = new AWS.S3();
const S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || "viewapp-ads";

module.exports = {
  s3,
  S3_BUCKET,
  AWS_CONFIG
};