import { Image, View, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { usePlayer } from "@/state/PlayerContext";
import { API_ROOT } from "@/constants/api-root";
import { shuffle, pullAt } from "lodash";
import TrackPlayer, { State } from "react-native-track-player";
import { useEffect, useState } from "react";
import Text from "@/components/ThemedText";
import { useColors } from "@/constants/colors";

export default function ShuffleButton() {
  const { shuffled, setShuffled } = usePlayer();
  const colors = useColors();

  const onPress = async () => {
    if (!shuffled) {
      const queue = await TrackPlayer.getQueue();
      const activeTrack = (await TrackPlayer.getActiveTrack()) as RNTrack;

      // In order to prevent any hiccups in playing, we always want to keep the active track in the TrackPlayer's Queue
      // What we're doing here is removing all tracks except the active track, shuffling them, and re-adding them to
      // the TrackPlayer's queue. This way, the active track never stops playing

      // Get all track except active track and keep track (pun intended) of their current indices for removal
      const toBeShuffled = queue
        .map((track, index) => {
          return { track: track, index: index };
        })
        .filter((item) => {
          return item.track.title !== activeTrack.title;
        });

      // get all indices that need to be removed
      const toBeRemoved: number[] = toBeShuffled.map((item) => {
        return item.index;
      });
      // Remove from TrackPlayer
      await TrackPlayer.remove(toBeRemoved);

      // Since toBeShuffled contains objects in the form of {track: track, index: index},
      // We need to isolate just the track values since we need an array of objects of type RNTrack
      const shuffledQ = toBeShuffled.map((item) => {
        return item.track;
      });

      // Shuffle
      shuffledQ.sort(() => Math.random() - 0.5);

      // Add to TrackPlayer Queue
      await TrackPlayer.add(shuffledQ);
      setShuffled(true);
    } else {
      const queue = (await TrackPlayer.getQueue()) as RNTrack[];
      const activeTrack = (await TrackPlayer.getActiveTrack()) as RNTrack;

      // The goal with Re-ordering is also to re-order the TrackPlayer's Queue without removing the active track.
      // This way the active track doesn't stop & restart when resetting the Queue in proper order.
      // The method here is again to remove all tracks except the active track, sort them by their 'order' property,
      // and add them back to the TrackPlayer's queue.

      const toBeReordered = queue
        .map((track, index) => {
          return { track, index };
        })
        .filter((item) => {
          return item.track.title !== activeTrack.title;
        });

      const toBeRemoved = toBeReordered.map((item) => {
        return item.index;
      });
      await TrackPlayer.remove(toBeRemoved);

      const sorted = toBeReordered
        .sort((itemA, itemB) => {
          return itemA.track.order - itemB.track.order;
        })
        .map((item) => {
          return item.track;
        });

      const pre: RNTrack[] = [];
      const post: RNTrack[] = [];
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].order < activeTrack.order) {
          pre.push(sorted[i]);
        } else {
          post.push(sorted[i]);
        }
      }

      // Add all tracks that originally come after the active track
      await TrackPlayer.add(post);
      // prepend all tracks that originally come before active track.
      await TrackPlayer.add(pre, 0);

      // const toBeRemoved = toBeReordered.map((item) => {
      //   return item.index;
      // });

      setShuffled(false);
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text>
          <Ionicons
            name="shuffle"
            size={30}
            color={shuffled ? colors.accent : colors.text}
          />
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 10,
  },
});
