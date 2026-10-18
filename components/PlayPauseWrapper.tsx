import { usePlayer } from "@/state/PlayerContext";
import { useState, useEffect } from "react";
import TrackPlayer, { PlaybackState, State } from "react-native-track-player";
import { TrackItem } from "./TrackItem";
import { isTrackOwnedOrPreview } from "@/scripts/utils";
import { useAuthContext } from "@/state/AuthContext";

type Props = {
  trackObject: RNTrack;
  selectedAlbum?: AlbumProps;
};

export default function PlayPauseWrapper({
  trackObject,
  selectedAlbum,
}: Props) {
  const {
    playbackState,
    playableTracks,
    activeTrack,
    setActiveTrack,
    setShuffled,
  } = usePlayer();
  const audioURL = trackObject?.url;
  const [thisSongSelected, setThisSongSelected] = useState<boolean>(false);
  const { user } = useAuthContext();

  const canPlayTrack = isTrackOwnedOrPreview(trackObject, user, selectedAlbum);

  useEffect(() => {
    const checkTrack = async () => {
      try {
        const queue = await TrackPlayer.getQueue();
        const currentTrack = await TrackPlayer.getActiveTrack();

        const isSameAlbum =
          currentTrack?.trackGroup.urlSlug === trackObject.trackGroup.urlSlug &&
          playableTracks.length === queue?.length;

        // Need to check isSameAlbum because track could be located on it's respective album view or in individual track view
        if (activeTrack?.url === audioURL && isSameAlbum) {
          setThisSongSelected(true);
        } else {
          setThisSongSelected(false);
        }
      } catch (error) {
        console.error("Error checking track:", error);
      }
    };

    checkTrack();
  }, [activeTrack, playableTracks]);

  const togglePlayBack = async (
    playBackState: PlaybackState | { state: undefined },
  ) => {
    try {
      const queue = await TrackPlayer.getQueue();
      // Set queue if no queue currently set
      if (!queue.length) {
        console.log("no curr track: setting track");
        await TrackPlayer.setQueue(playableTracks);
        await TrackPlayer.skip(trackObject.queueIndex);
        setActiveTrack(trackObject);
        await TrackPlayer.play();
        console.log("Q set from nothing");
        return;
      }

      const currentTrack = await TrackPlayer.getActiveTrack();

      const isSameAlbum =
        currentTrack?.trackGroup.urlSlug === trackObject.trackGroup.urlSlug &&
        playableTracks.length === queue.length
          ? true
          : false;

      // Song Change to different album
      if (!isSameAlbum) {
        try {
          setShuffled(false);
          await TrackPlayer.setQueue(playableTracks);
          await TrackPlayer.skip(trackObject.queueIndex);
          setActiveTrack(trackObject);
          await TrackPlayer.play();
          console.log("Q set from diff album");
          return;
        } catch (err) {
          console.error("issue changing albums", err);
          return;
        }
      }

      // Song Change within same album
      if (currentTrack?.url !== audioURL) {
        setActiveTrack(trackObject);
        await TrackPlayer.skip(trackObject.queueIndex);
        await TrackPlayer.play();
        return;
      } else {
        if (
          playbackState.state === State.Paused ||
          playbackState.state === State.Ready
        ) {
          await TrackPlayer.play();
        } else {
          await TrackPlayer.pause();
        }
      }
    } catch (err) {
      console.error("issue with playback:", err);
    }
  };

  return (
    <TrackItem
      track={trackObject}
      album={selectedAlbum ? selectedAlbum : undefined}
      thisSongSelected={thisSongSelected}
      onPress={async () => {
        if (canPlayTrack) {
          await togglePlayBack(playbackState);
          const q = await TrackPlayer.getQueue();
        } else {
          return;
        }
      }}
    />
  );
}
