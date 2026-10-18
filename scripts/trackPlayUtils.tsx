import TrackPlayer from "react-native-track-player";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function getPlays(trackId: number): Promise<number | undefined> {
  try {
    const id = String(trackId);
    const plays = await AsyncStorage.getItem(id);

    if (plays !== null) {
      return Number(plays);
    }

    return 0;
  } catch (err) {
    console.error(err);
  }
}

export async function reachedMaxPlays(
  trackId: number,
  maxFreePlays?: number,
): Promise<boolean | undefined> {
  try {
    // If no limit is set, no need to check anything
    if (maxFreePlays == null) {
      console.log("No maxFreePlays set");
      return false; // No limit means limit not reached
    }

    const plays: number | undefined = await getPlays(trackId);
    if (plays === undefined) {
      console.error(
        "Issue getting number of plays: 'number of plays undefined'",
      );
      return undefined; // Can't determine, something went wrong
    }

    console.log(maxFreePlays);
    return plays >= maxFreePlays;
  } catch (err) {
    console.error(err);
    return undefined;
  }
}
export async function incrementPlayCount(trackId: number) {
  try {
    const numPlays = await getPlays(trackId);

    if (numPlays === undefined) {
      console.error(
        "Issue getting number of plays: 'number of plays undefined'",
      );
      return;
    }

    if (numPlays === 0) {
      await AsyncStorage.setItem(String(trackId), "1");
      const updated = await AsyncStorage.getItem(String(trackId));
      console.log("trackId: " + String(trackId) + ", plays: " + updated);
      return;
    } else {
      const updatedPlays = numPlays + 1;
      await AsyncStorage.setItem(String(trackId), String(updatedPlays));
      const updated = await AsyncStorage.getItem(String(trackId));
      console.log("trackId: " + String(trackId) + ", plays: " + updated);
      return;
    }
  } catch (err) {
    console.error(err);
  }
}

// Wraps around the queue in both directions
export async function skipTrack(direction: "previous" | "next") {
  const queue = await TrackPlayer.getQueue();
  const index = await TrackPlayer.getActiveTrackIndex();
  const last = queue.length - 1;
  if (direction === "next") {
    await (index === last ? TrackPlayer.skip(0) : TrackPlayer.skipToNext());
  } else {
    await (index === 0 ? TrackPlayer.skip(last) : TrackPlayer.skipToPrevious());
  }
  await TrackPlayer.play();
}
