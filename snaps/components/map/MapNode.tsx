import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Lock } from 'lucide-react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fontSize, spacing, borderRadius } from '@/lib/constants';
import type { NodeStatus } from '@/types';

const NODE_SIZE = 68;

interface MapNodeProps {
  name: string;
  nameCz: string;
  status: NodeStatus;
  progress: number;
  courseColor: string;
  onPress: () => void;
}

export function MapNode({ name, nameCz, status, progress, courseColor, onPress }: MapNodeProps) {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isActive = status === 'available' || status === 'in_progress';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={isLocked}
      activeOpacity={0.7}
    >
      {/* Outer glow for active node */}
      {isActive && (
        <View style={[styles.glow, { backgroundColor: courseColor + '25', borderColor: courseColor + '40' }]} />
      )}

      {/* Main circle */}
      <View
        style={[
          styles.circle,
          isCompleted && { backgroundColor: colors.success, borderColor: colors.success },
          isActive && { backgroundColor: courseColor, borderColor: courseColor },
          isLocked && styles.lockedCircle,
        ]}
      >
        {isCompleted && <Check size={28} color="#FFFFFF" strokeWidth={3} />}
        {isLocked && <Lock size={22} color={colors.textSecondary} />}
        {isActive && (
          <Text style={styles.nodeNumber}>
            {status === 'in_progress' ? `${Math.round(progress * 100)}%` : '▶'}
          </Text>
        )}
      </View>

      {/* Progress ring for in_progress */}
      {status === 'in_progress' && (
        <ProgressBar
          progress={progress}
          height={3}
          color={courseColor}
          style={styles.progressBar}
        />
      )}

      {/* Labels */}
      <Text style={[styles.name, isLocked && styles.lockedText]} numberOfLines={2}>
        {nameCz}
      </Text>
      <Text style={[styles.subtitle, isLocked && styles.lockedText]} numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 120,
  },
  glow: {
    position: 'absolute',
    top: -6,
    width: NODE_SIZE + 12,
    height: NODE_SIZE + 12,
    borderRadius: (NODE_SIZE + 12) / 2,
    borderWidth: 2,
  },
  circle: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.card,
  },
  lockedCircle: {
    backgroundColor: colors.card,
    borderColor: colors.surface,
    opacity: 0.5,
  },
  nodeNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: fontSize.md,
  },
  progressBar: {
    width: NODE_SIZE,
    marginTop: spacing.xs,
  },
  name: {
    color: colors.textPrimary,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 1,
  },
  lockedText: {
    opacity: 0.4,
  },
});
