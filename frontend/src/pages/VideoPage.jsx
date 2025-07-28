import React, { useContext, useEffect, useState } from "react";
import { useParams }                              from "react-router-dom";
import { getVideos }                              from "../api/viewer";
import { CreditContext }                          from "../contexts/CreditContext";
import CreditBar                                  from "../components/CreditBar";
import VideoPlayer                                from "../components/VideoPlayer";
import NextButton from "../components/NextButton";
import { useSequentialPlayer } from '../hooks/useSequentialPlayer';

export default function VideoPage() {
  const { id: sectionId } = useParams();
  const { addCredit }     = useContext(CreditContext);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    getVideos(sectionId)
      .then(setVideos)
      .catch(err => console.error('Failed to load videos', err));
  }, [sectionId]);

  const {
    current,
    videoRef,
    isFinished,
    handleEnded,
    handleNext
  } = useSequentialPlayer(videos, addCredit);

  return (
    <div>
      <CreditBar />
      {current ? (
        <>
          <VideoPlayer
            ref={videoRef}
            src={current.url}
            onEnded={handleEnded}
          />
          <NextButton
            disabled={!isFinished}
            onClick={handleNext}
          />
        </>
      ) : (
        <p>Loading videos…</p>
      )}
    </div>
  );
}