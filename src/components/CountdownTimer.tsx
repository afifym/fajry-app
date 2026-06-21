import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

type Props = {
  targetTime: Date;
  onReach?: () => void;
};

function formatDuration(ms: number): string {
  if (ms <= 0) return '0:00:00';
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const CountdownTimer = ({ targetTime, onReach }: Props) => {
  const [remaining, setRemaining] = useState(() => targetTime.getTime() - Date.now());

  useEffect(() => {
    const tick = () => {
      const r = targetTime.getTime() - Date.now();
      setRemaining(r);
      if (r <= 0) {
        onReach?.();
        clearInterval(id);
      }
    };

    const id = setInterval(tick, 1000);
    tick(); // immediate first tick
    return () => clearInterval(id);
  }, [targetTime, onReach]);

  return <Text style={styles.countdown}>{formatDuration(remaining)}</Text>;
}

const styles = StyleSheet.create({
  countdown: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
});
