import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/colors';

/**
 * InAppToast
 *
 * Displays a native-feeling slide-in toast at the top of the screen for
 * foreground FCM notifications. Pass the `notification` object (FCM remote
 * message) to show it; pass `null` to hide.
 *
 * Props:
 *   notification: { notification: { title, body }, data } | null
 *   onPress: (data) => void  — called when the user taps the toast
 */
const InAppToast = ({ notification, onPress }) => {
  const translateY = useRef(new Animated.Value(-120)).current;
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!notification) return;

    setVisible(true);

    // Slide in
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    // Auto dismiss after 4 seconds
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => dismiss(), 4000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification]);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible || !notification) return null;

  const { title, body } = notification?.notification ?? {};
  const data = notification?.data ?? {};

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => {
          dismiss();
          if (onPress) onPress(data);
        }}
      >
        {/* Left accent */}
        <View style={styles.accent} />

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        </View>

        {/* Dismiss button */}
        <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 14,
  },
  accent: {
    width: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    alignSelf: 'stretch',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  body: {
    color: '#A0A0B0',
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    color: '#606070',
    fontSize: 14,
  },
});

export default InAppToast;
