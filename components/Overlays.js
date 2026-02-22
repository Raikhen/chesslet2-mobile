import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, Animated as RNAnimated, Easing } from "react-native";
import { COLORS } from "../lib/constants";

const CONFETTI_COLORS = ["#facc15", "#f59e0b", "#22c55e", "#f97316", "#ec4899", "#8b5cf6", "#3b82f6", "#fbbf24"];
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

function ConfettiPiece({ delay, color, driftX, burstY, fallY, rotation, size, isCircle, originX }) {
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const translateY = useRef(new RNAnimated.Value(0)).current;
  const rotateProgress = useRef(new RNAnimated.Value(0)).current;
  const opacity = useRef(new RNAnimated.Value(1)).current;

  const pieceW = isCircle ? size : size * 0.7;
  const pieceH = isCircle ? size : size * 1.4;

  useEffect(() => {
    const timer = setTimeout(() => {
      RNAnimated.parallel([
        // Burst upward then fall with gravity
        RNAnimated.sequence([
          RNAnimated.timing(translateY, {
            toValue: burstY,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          RNAnimated.timing(translateY, {
            toValue: fallY,
            duration: 1400,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // Drift sideways with deceleration
        RNAnimated.timing(translateX, {
          toValue: driftX,
          duration: 1850,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // Gentle spin (0 -> 1 progress, interpolated to degrees)
        RNAnimated.timing(rotateProgress, {
          toValue: 1,
          duration: 1850,
          useNativeDriver: true,
        }),
        // Fade out near end
        RNAnimated.sequence([
          RNAnimated.delay(1300),
          RNAnimated.timing(opacity, {
            toValue: 0,
            duration: 550,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const rotateInterpolated = rotateProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${rotation}deg`],
  });

  return (
    <RNAnimated.View
      style={{
        position: "absolute",
        left: originX - pieceW / 2,
        top: "50%",
        width: pieceW,
        height: pieceH,
        backgroundColor: color,
        borderRadius: isCircle ? size / 2 : 3,
        transform: [
          { translateX },
          { translateY },
          { rotate: rotateInterpolated },
        ],
        opacity,
      }}
    />
  );
}

export const WinCelebration = React.memo(function WinCelebration() {
  const pieces = useMemo(() => {
    const cx = SCREEN_WIDTH / 2;
    return Array.from({ length: 30 }, (_, i) => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5;
      const speed = 0.7 + Math.random() * 0.8;
      const burstY = Math.sin(angle) * speed * 280;
      return {
        id: i,
        delay: Math.random() * 180,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        driftX: Math.cos(angle) * speed * 320,
        burstY,
        fallY: burstY + 500 + Math.random() * 200,
        rotation: (Math.random() - 0.5) * 540,
        size: 9 + Math.random() * 7,
        isCircle: Math.random() > 0.6,
        originX: cx + (Math.random() - 0.5) * 20,
      };
    });
  }, []);

  return (
    <View style={styles.celebrationContainer} pointerEvents="none">
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} {...p} />
      ))}
    </View>
  );
});

export function ImpossibleOverlay() {
  return (
    <View style={styles.impossibleOverlay}>
      <View style={styles.impossibleCard}>
        <Text style={styles.impossibleIcon}>!</Text>
        <Text style={styles.impossibleTitle}>Impossible Puzzle</Text>
        <Text style={styles.impossibleText}>This puzzle has no solution</Text>
      </View>
    </View>
  );
}

export function StuckOverlay({ onUndo, onReset }) {
  return (
    <View style={styles.stuckOverlay}>
      <View style={styles.stuckCard}>
        <Text style={styles.stuckTitle}>No moves left!</Text>
        <Text style={styles.stuckText}>Undo or reset to try again</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  celebrationContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
    zIndex: 100,
    elevation: 100,
  },
  impossibleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    borderRadius: 12,
  },
  impossibleCard: {
    alignItems: "center",
    padding: 20,
  },
  impossibleIcon: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.warning,
    marginBottom: 8,
    width: 44,
    height: 44,
    textAlign: "center",
    lineHeight: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: COLORS.warning,
    overflow: "hidden",
  },
  impossibleTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  impossibleText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  stuckOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    borderRadius: 12,
  },
  stuckCard: {
    alignItems: "center",
    padding: 16,
  },
  stuckTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  stuckText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
});
