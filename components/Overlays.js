import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../lib/constants";

const CONFETTI_COLORS = ["#facc15", "#d4a012", "#22c55e", "#f97316", "#b58863", "#fbbf24"];
const SCREEN_WIDTH = Dimensions.get("window").width;

function ConfettiPiece({ delay, color, startX }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(400, { duration: 2000, easing: Easing.out(Easing.quad) }));
    translateX.value = withDelay(delay, withTiming((Math.random() - 0.5) * 100, { duration: 2000 }));
    rotate.value = withDelay(delay, withTiming(Math.random() * 720 - 360, { duration: 2000 }));
    opacity.value = withDelay(delay + 1500, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          top: 0,
          width: 8,
          height: 12,
          backgroundColor: color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

export function WinCelebration() {
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    startX: Math.random() * SCREEN_WIDTH,
  }));

  return (
    <View style={styles.celebrationContainer} pointerEvents="none">
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} delay={p.delay} color={p.color} startX={p.startX} />
      ))}
    </View>
  );
}

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
    overflow: "hidden",
    zIndex: 100,
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
