import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { colors, spacing, borderRadius } from '../../config/theme';

// Simple shimmer skeleton replacing moti/skeleton (incompatible with React 19)

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number | 'round' | 'square';
  style?: ViewStyle;
}

const ShimmerBox: React.FC<{ width?: number | string; height?: number; radius?: number | string }> = ({
  width,
  height = 20,
  radius = borderRadius.sm,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const resolvedRadius = radius === 'round' ? 9999 : radius === 'square' ? 0 : radius;

  return (
    <Animated.View
      style={{
        width: width as any,
        height,
        borderRadius: resolvedRadius,
        backgroundColor: '#E1E9EE',
        opacity,
      }}
    />
  );
};

export const Skeleton: React.FC<SkeletonProps> = ({ width, height = 20, radius = borderRadius.sm, style }) => (
  <View style={style}>
    <ShimmerBox width={width} height={height} radius={radius} />
  </View>
);

export const SkeletonGroup: React.FC<{ show: boolean; children: React.ReactNode }> = ({
  show,
  children,
}) => <>{children}</>;

// --- Pre-built skeleton layouts for common screens ---

export const DoctorCardSkeleton: React.FC = () => (
  <View style={skeletonStyles.doctorCard}>
    <ShimmerBox radius="round" height={56} width={56} />
    <View style={skeletonStyles.doctorCardContent}>
      <ShimmerBox width="70%" height={18} />
      <View style={skeletonStyles.gap} />
      <ShimmerBox width="50%" height={14} />
      <View style={skeletonStyles.gap} />
      <ShimmerBox width="35%" height={14} />
    </View>
  </View>
);

export const AppointmentCardSkeleton: React.FC = () => (
  <View style={skeletonStyles.appointmentCard}>
    <View style={skeletonStyles.appointmentHeader}>
      <ShimmerBox radius="round" height={44} width={44} />
      <View style={skeletonStyles.appointmentHeaderText}>
        <ShimmerBox width="60%" height={16} />
        <View style={skeletonStyles.gapSm} />
        <ShimmerBox width="40%" height={13} />
      </View>
      <ShimmerBox width={70} height={24} radius={borderRadius.full} />
    </View>
    <View style={skeletonStyles.divider} />
    <View style={skeletonStyles.appointmentFooter}>
      <ShimmerBox width="30%" height={13} />
      <ShimmerBox width="25%" height={13} />
    </View>
  </View>
);

export const StatCardSkeleton: React.FC = () => (
  <View style={skeletonStyles.statCard}>
    <ShimmerBox radius="round" height={40} width={40} />
    <View style={skeletonStyles.gapSm} />
    <ShimmerBox width="60%" height={22} />
    <View style={skeletonStyles.gapSm} />
    <ShimmerBox width="80%" height={13} />
  </View>
);

export const ListItemSkeleton: React.FC = () => (
  <View style={skeletonStyles.listItem}>
    <ShimmerBox radius="round" height={44} width={44} />
    <View style={skeletonStyles.listItemContent}>
      <ShimmerBox width="65%" height={16} />
      <View style={skeletonStyles.gapSm} />
      <ShimmerBox width="45%" height={13} />
    </View>
  </View>
);

export const HealthTipSkeleton: React.FC = () => (
  <View style={skeletonStyles.healthTipCard}>
    <ShimmerBox width="100%" height={140} radius={borderRadius.md} />
    <View style={{ padding: spacing.lg }}>
      <ShimmerBox width="30%" height={12} />
      <View style={skeletonStyles.gap} />
      <ShimmerBox width="90%" height={18} />
      <View style={skeletonStyles.gapSm} />
      <ShimmerBox width="70%" height={14} />
    </View>
  </View>
);

// --- Skeleton list renderer ---
export const SkeletonList: React.FC<{
  count?: number;
  ItemSkeleton: React.FC;
}> = ({ count = 4, ItemSkeleton }) => (
  <View>
    {Array.from({ length: count }).map((_, i) => (
      <ItemSkeleton key={i} />
    ))}
  </View>
);

const skeletonStyles = StyleSheet.create({
  gap: { height: spacing.sm },
  gapSm: { height: spacing.xs },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  doctorCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  doctorCardContent: {
    marginLeft: spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  appointmentCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentHeaderText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minWidth: 140,
    margin: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  listItemContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  healthTipCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
});
