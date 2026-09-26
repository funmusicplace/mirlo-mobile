import { useCallback, useEffect, useState } from "react";
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TextProps,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const PAUSE_MS = 2000;
const SPEED_PX_PER_SEC = 30;
// Wide enough that Yoga doesn't clamp the text to the parent
const ROW_WIDTH = 10000;

export default function MarqueeText({ style, children, ...rest }: TextProps) {
  const reducedMotion = useReducedMotion();
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const offset = useSharedValue(0);

  const overflows = containerWidth > 0 && textWidth > containerWidth;

  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

  const onMeasureLayout = useCallback((event: LayoutChangeEvent) => {
    setTextWidth(event.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    if (reducedMotion || !overflows) {
      cancelAnimation(offset);
      offset.value = 0;
      return;
    }

    const distance = textWidth - containerWidth;
    const scrollDuration = (distance / SPEED_PX_PER_SEC) * 1000;

    offset.value = 0;
    offset.value = withRepeat(
      withSequence(
        withDelay(
          PAUSE_MS,
          withTiming(-distance, {
            duration: scrollDuration,
            easing: Easing.linear,
          }),
        ),
        withDelay(PAUSE_MS, withTiming(0, { duration: 0 })),
      ),
      -1,
    );

    return () => cancelAnimation(offset);
  }, [reducedMotion, overflows, textWidth, containerWidth, offset]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  if (reducedMotion) {
    return (
      <Text {...rest} style={style} numberOfLines={1} ellipsizeMode="tail">
        {children}
      </Text>
    );
  }

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <Text
        {...rest}
        style={[style, overflows && styles.invisible]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {children}
      </Text>
      {overflows && (
        <Animated.View
          style={[styles.row, animatedStyle]}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={style}>{children}</Text>
        </Animated.View>
      )}
      <View
        style={[styles.row, styles.invisible]}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={style} numberOfLines={1} onLayout={onMeasureLayout}>
          {children}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  row: {
    position: "absolute",
    left: 0,
    top: 0,
    flexDirection: "row",
    width: ROW_WIDTH,
  },
  invisible: {
    opacity: 0,
  },
});
