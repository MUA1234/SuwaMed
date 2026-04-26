import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '../../config/theme';

interface NetworkStatusProps {}

const NetworkStatus: React.FC<NetworkStatusProps> = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const wasDisconnectedRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      if (wasDisconnectedRef.current) {
        setShowReconnected(true);
        wasDisconnectedRef.current = false;
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
      wasDisconnectedRef.current = true;
      setShowReconnected(false);
    };

    const checkConnection = () => {
      setIsConnected(typeof navigator !== 'undefined' ? navigator.onLine !== false : true);
    };

    checkConnection();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isConnected || showReconnected) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isConnected, showReconnected, slideAnim]);

  useEffect(() => {
    if (showReconnected) {
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showReconnected]);

  if (isConnected && !showReconnected) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isConnected ? colors.success : colors.error,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={isConnected ? 'Back online' : 'No internet connection'}
    >
      <Text style={styles.text}>
        {isConnected ? 'Back online' : 'No internet connection'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    zIndex: 1000,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default NetworkStatus;
