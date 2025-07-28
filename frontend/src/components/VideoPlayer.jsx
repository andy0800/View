import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function VideoPlayer({ src, ...props }) {
  const videoRef = useRef(null);

  useEffect(() => {
    let hls; 

    // Attach HLS if supported
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      videoRef.current.src = src;
    }

    // CLEANUP: destroy Hls instance if created
    return () => {
      if (hls && typeof hls.destroy === 'function') {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: '100%', maxHeight: '480px' }}
      {...props}
    />
  );
}