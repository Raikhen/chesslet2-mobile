import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "../lib/constants";

const MODES = [
  {
    id: "campaign",
    title: "Campaign",
    description: "100 levels of increasing difficulty",
    route: "/campaign",
    emoji: "\u{1F3C6}",
  },
  {
    id: "random",
    title: "Random",
    description: "Endless random puzzles",
    route: "/random",
    emoji: "\u{1F3B2}",
  },
  {
    id: "timed",
    title: "Timed",
    description: "Solve puzzles against the clock",
    route: "/timed",
    emoji: "\u{23F1}\uFE0F",
  },
  {
    id: "designer",
    title: "Designer",
    description: "Create and share your own puzzles",
    route: "/designer",
    emoji: "\u{1F3A8}",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Svg width={36} height={36} viewBox="0 0 45 45">
              <Path
                d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
                fill={COLORS.accent}
                stroke={COLORS.text}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3"
                fill={COLORS.accent}
                stroke={COLORS.text}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z"
                fill={COLORS.text}
              />
              <Path
                d="M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z"
                fill={COLORS.text}
              />
            </Svg>
          </View>
          <Text style={styles.logo}>Chesslet</Text>
        </View>
        <Text style={styles.tagline}>Every move must capture</Text>
      </View>

      <ScrollView style={styles.modesContainer} contentContainerStyle={styles.modesContent}>
        {MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={styles.modeCard}
            activeOpacity={0.7}
            onPress={() => router.push(mode.route)}
          >
            <Text style={styles.modeEmoji}>{mode.emoji}</Text>
            <View style={styles.modeInfo}>
              <Text style={styles.modeTitle}>{mode.title}</Text>
              <Text style={styles.modeDescription}>{mode.description}</Text>
            </View>
            <Text style={styles.modeArrow}>{"\u203A"}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  logoIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    fontSize: 36,
    fontFamily: "CrimsonPro_500Medium",
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  modesContainer: {
    flex: 1,
  },
  modesContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 40,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  modeEmoji: {
    fontSize: 32,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: COLORS.textSecondary,
  },
  modeArrow: {
    fontSize: 24,
    color: COLORS.textMuted,
    fontWeight: "300",
  },
});
