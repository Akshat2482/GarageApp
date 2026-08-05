// src/screens/HomeScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { colors, spacing } from '../theme/theme';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  getGarageOnline,
  triggerOpenGarage,
  triggerCloseGarage,
} from '../services/firebase';

const POLL_INTERVAL_MS = 3000;
const MIN_SPIN_MS = 1400; // keeps the spin visible even on a fast network reply

type DoorState = 'closed' | 'open'; // assumed, not sensor-verified -- see notes below
type ActionState = 'idle' | 'sending';

export default function HomeScreen() {
  const [online, setOnline] = useState<boolean | null>(null); // null = unknown yet
  const [doorState, setDoorState] = useState<DoorState>('closed'); // best-guess only
  const [action, setAction] = useState<ActionState>('idle');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const poll = useCallback(async () => {
    try {
      const isOnline = await getGarageOnline();
      setOnline(isOnline);
    } catch (err) {
      console.warn('Status poll failed:', err);
      setOnline(null);
    }
  }, []);

  useEffect(() => {
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [poll]);

  const startSpin = () => {
    spinValue.setValue(0);
    spinLoopRef.current = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoopRef.current.start();
  };

  const stopSpin = () => {
    spinLoopRef.current?.stop();
    spinValue.setValue(0);
  };

  const handlePress = async () => {
    if (action !== 'idle' || online !== true) return;

    const goingTo: DoorState = doorState === 'closed' ? 'open' : 'closed';
    setAction('sending');
    startSpin();

    const started = Date.now();
    try {
      if (goingTo === 'open') {
        await triggerOpenGarage();
      } else {
        await triggerCloseGarage();
      }
    } catch (err: any) {
      Alert.alert('Command failed', err?.message ?? 'Unknown error');
    } finally {
      const elapsed = Date.now() - started;
      const wait = Math.max(0, MIN_SPIN_MS - elapsed);
      setTimeout(() => {
        stopSpin();
        setDoorState(goingTo);
        setAction('idle');
        setTimeout(poll, 500); // refresh real online status shortly after
      }, wait);
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const disabled = online !== true || action !== 'idle';

  const statusColor =
    online === null ? colors.textDim2 : online ? colors.green : colors.red;
  const statusLabel =
    online === null ? 'CONNECTING' : online ? 'ONLINE' : 'OFFLINE';

  const centerLabel =
    action === 'sending'
      ? doorState === 'closed'
        ? 'Opening'
        : 'Closing'
      : doorState === 'closed'
        ? 'CLOSED'
        : 'OPEN';

  const ringColor = doorState === 'closed' ? colors.textDim2 : colors.cyan;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>GARAGE CONTROL</Text>
        </View>
        <View style={[styles.statusPill, { borderColor: statusColor }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.centerArea}>
        <View style={styles.dialWrap}>
          {action === 'sending' && (
            <Animated.View
              style={[
                styles.spinRing,
                { transform: [{ rotate: spin }] },
              ]}
            />
          )}
          <Pressable
            onPress={handlePress}
            disabled={disabled}
            style={({ pressed }) => [
              styles.dialButton,
              { backgroundColor: ringColor },
              disabled && action === 'idle' && styles.dialDisabled,
              pressed && !disabled && { opacity: 0.85 },
            ]}
          >
            <Svg width={64} height={56} viewBox="0 0 64 56">
              <Path d="M2 20 L32 2 L62 20 Z" fill="#000000" />
              <Rect x="6" y="18" width="52" height="34" rx="4" fill="#000000" />
              <Rect x="14" y="26" width="36" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
              <Rect x="14" y="34" width="36" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
              <Rect x="14" y="42" width="36" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
            </Svg>
          </Pressable>
        </View>

        <Text style={styles.subLabel}>Garage Door</Text>
        <Text
          style={[
            styles.centerLabel,
            { color: action === 'sending' ? colors.textDim2 : colors.text },
          ]}
        >
          {centerLabel}
        </Text>
        {doorState !== null && action === 'idle' && (
          <Text style={styles.assumedNote}>
            (estimated \u2014 no door sensor installed)
          </Text>
        )}
      </View>

      <Text style={styles.footerNote}>
        {online === false
          ? 'Garage unit unreachable \u2014 controls disabled'
          : 'Tap to toggle'}
      </Text>
    </View>
  );
}

const DIAL_SIZE = 180;
const RING_SIZE = DIAL_SIZE + 24;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cyan,
  },
  brandText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  spinRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: colors.cyan,
    borderRightColor: colors.cyan,
  },
  dialButton: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialDisabled: {
    opacity: 0.4,
  },
  subLabel: {
    color: colors.textDim2,
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 4,
  },
  centerLabel: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
  assumedNote: {
    color: colors.textDim2,
    fontSize: 10,
    marginTop: 8,
    fontStyle: 'italic',
  },
  footerNote: {
    marginBottom: spacing.lg,
    textAlign: 'center',
    color: colors.textDim2,
    fontSize: 11,
    letterSpacing: 1,
  },
});

