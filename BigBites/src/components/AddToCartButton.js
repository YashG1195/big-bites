import React, { useCallback } from 'react';
import { Text, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../constants/colors';

/**
 * AddToCartButton
 *
 * A fully animated + button for menu items.
 *
 * On press:
 *   1. Scale: 1 → 0.78 → 1.1 → 1  (withSpring bounce)
 *   2. Background: transparent-border → solid #FF6B35 → back (withTiming)
 *
 * All animations run on the UI thread via useAnimatedStyle.
 *
 * Props:
 *   onPress  - () => void
 *   size     - number (diameter, default 36)
 *   disabled - boolean
 */
const AddToCartButton = ({ onPress, size = 36, disabled = false }) => {
  // 0 = default state, 1 = pressed state
  const pressed = useSharedValue(0);
  const scale   = useSharedValue(1);

  const handlePress = useCallback(() => {
    if (disabled) return;

    // Scale: punch-in then spring back with overshoot
    scale.value = withSequence(
      withSpring(0.78, { damping: 8,  stiffness: 500 }),
      withSpring(1.1,  { damping: 5,  stiffness: 400 }),
      withSpring(1,    { damping: 10, stiffness: 300 })
    );

    // Color fill: flash orange then fade back
    pressed.value = withSequence(
      withTiming(1, { duration: 80,  easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
    );

    onPress?.();
  }, [disabled, onPress]);

  const animStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      pressed.value,
      [0, 1],
      ['transparent', COLORS.primary]
    );
    const borderColor = interpolateColor(
      pressed.value,
      [0, 1],
      [COLORS.primary, COLORS.primary]
    );

    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    // Icon text colour: orange → white on fill
    const color = interpolateColor(
      pressed.value,
      [0, 1],
      [COLORS.primary, '#FFFFFF']
    );
    return { color };
  });

  return (
    <TouchableWithoutFeedback onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={[
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          animStyle,
        ]}
      >
        <Animated.Text style={[styles.plus, iconStyle]}>+</Animated.Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '600',
    marginTop: -1, // optical centering
  },
});

export default AddToCartButton;
