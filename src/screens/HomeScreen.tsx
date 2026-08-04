// src/screens/HomeScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing } from '../theme/theme';
import {
  getGarageOnline,
  triggerOpenGarage,
  triggerCloseGarage,
} from '../services/firebase';

const POLL_INTERVAL_MS = 3000;

export default function HomeScreen() {
  const [online, setOnline] = useState<boolean | null>(null); // null = unknown yet
  const [sending, setSending] = useState<'open' | 'close' | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handlePress = async (action: 'open' | 'close') => {
    if (sending) return;
    setSending(action);
    try {
      if (action === 'open') {
        await triggerOpenGarage();
      } else {
        await triggerCloseGarage();
      }
    } catch (err: any) {
      Alert.alert('Command failed', err?.message ?? 'Unknown error');
    } finally {
      setSending(null);
      // Give the board a moment to act, then refresh status
      setTimeout(poll, 1500);
    }
  };

  const statusColor =
    online === null ? colors.textDim2 : online ? colors.green : colors.red;
  const statusLabel =
    online === null ? 'CHECKING...' : online ? 'ONLINE' : 'OFFLINE';

  const buttonsDisabled = online !== true || sending !== null;

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

      <View style={styles.buttonArea}>
        <Pressable
          onPress={() => handlePress('open')}
          disabled={buttonsDisabled}
          style={({ pressed }) => [
            styles.actionButton,
            { borderColor: colors.cyan },
            buttonsDisabled && styles.actionButtonDisabled,
            pressed && !buttonsDisabled && styles.actionButtonPressed,
          ]}
        >
          {sending === 'open' ? (
            <ActivityIndicator color={colors.cyan} />
          ) : (
            <Text style={[styles.actionButtonText, { color: colors.cyan }]}>
              OPEN GARAGE
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => handlePress('close')}
          disabled={buttonsDisabled}
          style={({ pressed }) => [
            styles.actionButton,
            { borderColor: colors.amber },
            buttonsDisabled && styles.actionButtonDisabled,
            pressed && !buttonsDisabled && styles.actionButtonPressed,
          ]}
        >
          {sending === 'close' ? (
            <ActivityIndicator color={colors.amber} />
          ) : (
            <Text style={[styles.actionButtonText, { color: colors.amber }]}>
              CLOSE GARAGE
            </Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.footerNote}>
        {online === false
          ? 'Garage unit unreachable \u2014 controls disabled'
          : 'Auto-refreshing every 3s'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: spacing.lg,
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
  buttonArea: { gap: spacing.md, marginTop: spacing.lg },
  actionButton: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
  },
  actionButtonPressed: { opacity: 0.7 },
  actionButtonDisabled: { opacity: 0.3, borderColor: colors.textDim2 },
  actionButtonText: { fontSize: 16, fontWeight: '700', letterSpacing: 3 },
  footerNote: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.textDim2,
    fontSize: 11,
    letterSpacing: 1,
  },
});
