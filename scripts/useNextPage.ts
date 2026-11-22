import { useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";

type Paging = Pick<
  UseInfiniteQueryResult,
  | "hasNextPage"
  | "isFetchingNextPage"
  | "isFetchNextPageError"
  | "fetchNextPage"
>;

// FlatList props that load the next page at the end of the list. A failed page
// takes the spinner footer away, which puts the list at its end again without
// a scroll, so the next attempt waits until a scroll has left the end
export function useNextPage({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  fetchNextPage,
}: Paging) {
  const scrolledAway = useRef(false);
  return {
    // Every scroll fires this, a screen reader or scrollToOffset fires no drag
    onScroll: ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
      const distanceFromEnd =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      if (!isFetchingNextPage && distanceFromEnd > 1) {
        scrolledAway.current = true;
      }
    },
    onEndReached: () => {
      if (!hasNextPage || isFetchingNextPage) return;
      if (isFetchNextPageError && !scrolledAway.current) return;
      scrolledAway.current = false;
      fetchNextPage();
    },
  };
}
