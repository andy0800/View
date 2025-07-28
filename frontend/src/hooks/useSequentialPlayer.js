import { useState, useRef, useCallback } from 'react';

export function useSequentialPlayer(videos = [], onEarn) {
  const [index, setIndex]         = useState(0);
  const [isFinished, setFinished] = useState(false);
  const videoRef                  = useRef();

  const handleEnded = useCallback(() => {
    setFinished(true);
  }, []);

  const handleNext = useCallback(() => {
    if (!isFinished) return;
    onEarn(0.005);  // award 0.005 KWD per full view
    setFinished(false);
    setIndex(i => Math.min(i + 1, videos.length - 1));
  }, [isFinished, onEarn, videos.length]);

  const current = videos[index];

  return { current, videoRef, isFinished, handleEnded, handleNext };
}