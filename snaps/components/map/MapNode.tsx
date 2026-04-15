import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Check,
  Lock,
  Star,
  BookOpen,
  Brain,
  Lightbulb,
  Atom,
  TrendingUp,
  Network,
  BarChart3,
  AlertTriangle,
  Users,
  Filter,
  Dice1,
  Clock,
  User as UserIcon,
  Eye,
  Activity,
  Wind,
  Zap,
  Compass,
  Trophy,
} from 'lucide-react-native';
import { colors, fontSize, spacing } from '@/lib/constants';
import type { NodeStatus } from '@/types';

const NODE_SIZE = 76;
// Duolingo nodes have a clear bottom rim that gives the 3D effect
const RIM_HEIGHT = 8;

// Map of inner icons that nodes can use — different shapes break up the
// repetition of round buttons going down the path.
const NODE_ICONS: Record<string, React.ComponentType<any>> = {
  Star,
  BookOpen,
  Brain,
  Lightbulb,
  Atom,
  TrendingUp,
  Network,
  BarChart3,
  AlertTriangle,
  Users,
  Filter,
  Dice1,
  Clock,
  User: UserIcon,
  Eye,
  Activity,
  Wind,
  Zap,
  Compass,
  Trophy,
};

interface MapNodeProps {
  name: string;
  nameCz: string;
  status: NodeStatus;
  progress: number;
  courseColor: string;
  iconName?: string;
  onPress: () => void;
  language?: 'cs' | 'en';
}

/**
 * Duolingo-style path node with 3D bottom rim.
 *
 * Active node has a thick colored rim that looks pressed-in when tapped.
 * Locked nodes are flat gray. Completed nodes use the success green
 * with a check mark.
 */
export function MapNode({
  name,
  nameCz,
  status,
  progress,
  courseColor,
  iconName,
  onPress,
  language = 'cs',
}: MapNodeProps) {
  const primary = language === 'en' ? name : nameCz;
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isAvailable = status === 'available';
  const isInProgress = status === 'in_progress';
  const isActive = isAvailable || isInProgress;

  // Project-coloured node bodies; only the inner SVG icon picks up the
  // category colour. The face stays cream, the rim uses primary so the
  // path reads as one coherent orange theme.
  let topColor = colors.background;
  let rimColor = colors.borderLight;
  let iconColor = courseColor;
  if (isCompleted) {
    topColor = colors.background;
    rimColor = colors.success;
    iconColor = colors.success;
  } else if (isActive) {
    topColor = colors.background;
    rimColor = colors.primary;
  } else if (isLocked) {
    topColor = colors.surface;
    rimColor = colors.borderSubtle;
    iconColor = colors.textMuted;
  }

  const Icon = iconName ? NODE_ICONS[iconName] ?? Star : Star;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && !isLocked && { transform: [{ translateY: 2 }] },
      ]}
      onPress={onPress}
      disabled={isLocked}
    >
      {/* Active pulse halo — uses project primary so the path stays one tone */}
      {isActive && (
        <View
          style={[
            styles.halo,
            { borderColor: colors.primary + '55' },
          ]}
        />
      )}

      {/* Top face */}
      <View
        style={[
          styles.face,
          { backgroundColor: topColor, borderColor: rimColor, borderWidth: 2 },
        ]}
      >
        {/* Icon */}
        {isCompleted ? (
          <Check size={32} color={colors.success} strokeWidth={3.5} />
        ) : isLocked ? (
          <Lock size={26} color={iconColor} strokeWidth={2.5} />
        ) : (
          <Icon size={32} color={iconColor} strokeWidth={2.5} />
        )}
      </View>

      {/* In-progress thin progress arc as text below */}
      {isInProgress && (
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      )}

      {/* Label below the node — only the active one gets a fancy speech bubble */}
      {isActive ? (
        <View style={[styles.startBubble, { backgroundColor: colors.background, borderColor: colors.primary }]}>
          <Text style={[styles.startBubbleText, { color: colors.primary }]}>{primary}</Text>
        </View>
      ) : (
        <Text
          style={[styles.label, isLocked && styles.lockedText]}
          numberOfLines={2}
        >
          {primary}
        </Text>
      )}
    </Pressable>
  );
}

/** Quick HEX darken — drops each channel by ~20% for a believable 3D rim */
function darken(hex: string): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const r = Math.max(0, parseInt(m.slice(0, 2), 16) - 50);
  const g = Math.max(0, parseInt(m.slice(2, 4), 16) - 50);
  const b = Math.max(0, parseInt(m.slice(4, 6), 16) - 50);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 140,
    paddingTop: 12,
  },
  halo: {
    position: 'absolute',
    top: 4,
    width: NODE_SIZE + 18,
    height: NODE_SIZE + 18,
    borderRadius: (NODE_SIZE + 18) / 2,
    borderWidth: 3,
  },
  rim: {
    position: 'absolute',
    top: 12 + RIM_HEIGHT,
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
  },
  face: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    position: 'absolute',
    width: NODE_SIZE - 10,
    height: NODE_SIZE - 10,
    borderRadius: (NODE_SIZE - 10) / 2,
    borderWidth: 2,
  },
  progressBadge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  progressText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  startBubble: {
    marginTop: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 14,
    borderWidth: 2,
  },
  startBubbleText: {
    fontSize: fontSize.xs,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  lockedText: {
    opacity: 0.5,
  },
});
