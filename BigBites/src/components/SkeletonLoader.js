import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

/**
 * SkeletonLoader
 *
 * Renders a shimmer placeholder box running entirely on the UI thread.
 *
 * Props:
 *   width  - number | string  (default: '100%')
 *   height - number           (default: 20)
 *   borderRadius - number     (default: 8)
 *   style  - ViewStyle        (optional extra styles on container)
 */
const SkeletonLoader = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  // 0 → 1 drives the shimmer position left-to-right
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.linear }),
      -1,   // infinite
      false // no reverse — reset and restart for a clean sweep
    );
  }, []);

  // translateX: -width → +width creates the horizontal sweep
  const animatedOverlay = useAnimatedStyle(() => {
    // We approximate the container width as 400 for the translate calculation;
    // the shimmer is intentionally 50% wider than the card to look smooth.
    const translateX = interpolate(shimmerProgress.value, [0, 1], [-300, 400]);
    return { transform: [{ translateX }] };
  });

  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius },
        style,
      ]}
    >
      {/* Shimmer overlay strip */}
      <Animated.View style={[styles.shimmer, animatedOverlay]} />
    </View>
  );
};

/**
 * RestaurantCardSkeleton
 *
 * A ready-made skeleton layout matching the restaurant card dimensions.
 * Drop this into a FlatList renderItem while loading === true.
 */
export const RestaurantCardSkeleton = () => (
  <View style={styles.card}>
    {/* Image placeholder */}
    <SkeletonLoader height={160} borderRadius={12} />
    <View style={styles.cardBody}>
      {/* Name line */}
      <SkeletonLoader height={18} width="70%" borderRadius={4} style={styles.row} />
      {/* Sub-line: rating + time */}
      <View style={styles.row2}>
        <SkeletonLoader height={14} width={60} borderRadius={4} />
        <SkeletonLoader height={14} width={80} borderRadius={4} />
      </View>
      {/* Discount badge */}
      <SkeletonLoader height={14} width="50%" borderRadius={4} style={styles.row} />
    </View>
  </View>
);

const SHIMMER_HIGHLIGHT = 'rgba(255,255,255,0.12)';
const BASE_COLOR = '#2C2C2C';

const styles = StyleSheet.create({
  base: {
    backgroundColor: BASE_COLOR,
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: '40%',
    backgroundColor: SHIMMER_HIGHLIGHT,
    // Soft edges via opacity bands instead of a real gradient (no extra lib needed)
    opacity: 0.7,
  },
  card: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardBody: {
    padding: 12,
  },
  row: {
    marginTop: 10,
  },
  row2: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});

export default SkeletonLoader;
