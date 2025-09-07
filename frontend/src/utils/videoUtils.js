// Utility functions for video handling

/**
 * Converts a relative video URL to an absolute backend URL
 * @param {string} mediaUrl - The relative URL from the database (e.g., /uploads/ads/filename.mp4)
 * @returns {string} - The absolute URL pointing to the backend
 */
export const getVideoUrl = (mediaUrl) => {
  if (!mediaUrl) return '';
  
  // Use the backend URL from the API configuration
  const backendUrl = 'http://localhost:4001';
  
  if (mediaUrl.startsWith('http')) {
    // If it's already a full URL, check if it needs the /uploads/ads/ path
    if (mediaUrl.includes('localhost:4001/') && !mediaUrl.includes('/uploads/ads/')) {
      // Extract the filename and add the correct path
      const filename = mediaUrl.split('/').pop();
      const fullUrl = `${backendUrl}/uploads/ads/${filename}`;
      console.log('🔍 getVideoUrl - Full URL missing path, corrected:', { mediaUrl, fullUrl });
      return fullUrl;
    }
    return mediaUrl;
  }
  
  // If mediaUrl is just a filename (no path), add the uploads/ads/ prefix
  if (!mediaUrl.includes('/')) {
    const fullUrl = `${backendUrl}/uploads/ads/${mediaUrl}`;
    console.log('🔍 getVideoUrl - Filename only:', { mediaUrl, fullUrl });
    return fullUrl;
  }
  
  // If mediaUrl already has a path, use it as is
  const fullUrl = `${backendUrl}${mediaUrl}`;
  console.log('🔍 getVideoUrl - With path:', { mediaUrl, fullUrl });
  return fullUrl;
};

/**
 * Checks if a video URL is valid
 * @param {string} mediaUrl - The video URL to validate
 * @returns {boolean} - True if the URL is valid
 */
export const isValidVideoUrl = (mediaUrl) => {
  if (!mediaUrl) return false;
  return mediaUrl.startsWith('http') || mediaUrl.startsWith('/uploads/') || !mediaUrl.includes('/');
};

/**
 * Gets the video filename from a URL
 * @param {string} mediaUrl - The video URL
 * @returns {string} - The filename
 */
export const getVideoFilename = (mediaUrl) => {
  if (!mediaUrl) return '';
  return mediaUrl.split('/').pop() || '';
};
