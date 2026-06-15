import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

/**
 * CartBounce
 *
 * Wraps any icon with a scale-bounce animation (1 → 1.35 → 1).
 * Expose a `bounce()` method via ref so callers can trigger it
 * without causing component re-renders.
 *
 * Usage:
 *   const cartBounceRef = useRef(null);
 *   ...
 *   cartBounceRef.current?.bounce();
 *   ...
 *   <CartBounce ref={cartBounceRef}>
 *     <CartIcon />
 *   </CartBounce>
 */
const CartBounce = forwardRef(({ children, style }, ref) => {
  const scale = useSharedValue(1);

  // Expose bounce() to parent via ref — no state change, pure UI-thread
  useImperativeHandle(ref, () => ({
    bounce: () => {
      scale.value = withSequence(
        withSpring(1.35, { damping: 4, stiffness: 400 }),
        withSpring(1,    { damping: 6, stiffness: 300 })
      );
    },
  }));

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      {children}
    </Animated.View>
  );
});

CartBounce.displayName = 'CartBounce';

export default CartBounce;
