import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { COLORS } from "../lib/constants";
import { InstructionsModal } from "./Modals";

export default function GameHeader({ title, showBack, showHelp = true }) {
  const router = useRouter();
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth={2}>
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </TouchableOpacity>
      ) : (
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Svg width={20} height={20} viewBox="0 0 45 45">
              <Path
                d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
                fill={COLORS.accent}
                stroke={COLORS.accent}
                strokeWidth="1"
              />
              <Path
                d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z"
                fill={COLORS.accent}
                stroke={COLORS.accent}
                strokeWidth="0.5"
              />
            </Svg>
          </View>
        </View>
      )}

      <Text style={styles.title}>{title || "Chesslet"}</Text>

      {showHelp ? (
        <TouchableOpacity onPress={() => setShowInstructions(true)} style={styles.helpBtn}>
          <Text style={styles.helpBtnText}>?</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 36 }} />
      )}

      <InstructionsModal visible={showInstructions} onClose={() => setShowInstructions(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: "CrimsonPro_500Medium",
    color: COLORS.text,
    letterSpacing: 0,
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  helpBtnText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: "700",
  },
});
