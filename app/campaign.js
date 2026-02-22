import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Board from "../components/Board";
import GameHeader from "../components/GameHeader";
import { LevelSelectModal } from "../components/Modals";
import { WinCelebration } from "../components/Overlays";
import { useGame, GAME_STATE } from "../lib/useGame";
import { LEVELS, TOTAL_LEVELS, getLevel } from "../lib/levels";
import { createEmptyBoard, COLORS, DIFFICULTY_COLORS } from "../lib/constants";
import { loadProgress, saveProgress } from "../lib/storage";

export default function CampaignScreen() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState(new Set());
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [piecesVisible, setPiecesVisible] = useState(true);
  const completedLevelRef = useRef(null);
  const prevGameStateRef = useRef(null);
  const transitionRef = useRef(null);
  const isTransitioning = useRef(false);

  const levelData = getLevel(currentLevel);
  const { board, gameState, moveHistory, makeMove, resetPuzzle, puzzleInfo } = useGame(levelData?.fen);
  const displayBoard = board || createEmptyBoard();

  // Load progress
  useEffect(() => {
    (async () => {
      const progress = await loadProgress();
      setCurrentLevel(progress.level);
      setCompletedLevels(progress.completed);
      setLoaded(true);
    })();
  }, []);

  // Handle move
  const handleMove = useCallback(
    (fromRow, fromCol, toRow, toCol) => {
      makeMove(fromRow, fromCol, toRow, toCol);
    },
    [makeMove]
  );

  // Handle win - only fire when gameState transitions TO WON (not on level change with stale WON)
  useEffect(() => {
    if (
      gameState === GAME_STATE.WON &&
      prevGameStateRef.current !== GAME_STATE.WON &&
      completedLevelRef.current !== currentLevel
    ) {
      completedLevelRef.current = currentLevel;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
      const newCompleted = new Set(completedLevels);
      newCompleted.add(currentLevel);
      setCompletedLevels(newCompleted);
      saveProgress(currentLevel, newCompleted);

      // Auto-advance with fade transition (unless last level)
      if (currentLevel < TOTAL_LEVELS) {
        transitionRef.current = setTimeout(() => {
          setPiecesVisible(false);
          transitionRef.current = setTimeout(() => {
            isTransitioning.current = true;
            const next = currentLevel + 1;
            setCurrentLevel(next);
            saveProgress(next, newCompleted);
          }, 450);
        }, 1000);
      }
    }
    prevGameStateRef.current = gameState;
  }, [gameState, currentLevel]);

  // Fade in new pieces after board changes during transition
  useEffect(() => {
    if (isTransitioning.current) {
      isTransitioning.current = false;
      setTimeout(() => {
        setPiecesVisible(true);
      }, 50);
    }
  }, [board]);

  // Cleanup transition timeouts
  useEffect(() => {
    return () => {
      if (transitionRef.current) clearTimeout(transitionRef.current);
    };
  }, []);

  const cancelTransition = useCallback(() => {
    if (transitionRef.current) {
      clearTimeout(transitionRef.current);
      transitionRef.current = null;
    }
    isTransitioning.current = false;
    setPiecesVisible(true);
  }, []);

  const handleNextLevel = useCallback(() => {
    cancelTransition();
    if (currentLevel < TOTAL_LEVELS) {
      const next = currentLevel + 1;
      setCurrentLevel(next);
      saveProgress(next, completedLevels);
    }
  }, [currentLevel, completedLevels, cancelTransition]);

  const handleReset = useCallback(() => {
    cancelTransition();
    resetPuzzle();
  }, [resetPuzzle, cancelTransition]);

  const handleSelectLevel = useCallback(
    (level) => {
      cancelTransition();
      setCurrentLevel(level);
      setShowLevelSelect(false);
      saveProgress(level, completedLevels);
    },
    [completedLevels, cancelTransition]
  );

  const progressPercent = (completedLevels.size / TOTAL_LEVELS) * 100;
  const isLastLevel = currentLevel >= TOTAL_LEVELS;
  const diffColors = DIFFICULTY_COLORS[levelData?.difficulty] || DIFFICULTY_COLORS.medium;

  if (!loaded) return <SafeAreaView style={styles.container}><View /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <GameHeader title="Campaign" showBack />

      {/* Level Header */}
      <TouchableOpacity style={styles.levelHeader} onPress={() => setShowLevelSelect(true)}>
        <View style={styles.levelInfo}>
          <Text style={styles.levelNumber}>Level {currentLevel}</Text>
          {levelData?.difficulty && (
            <View style={[styles.diffBadge, { backgroundColor: diffColors.bg }]}>
              <Text style={[styles.diffText, { color: diffColors.text }]}>
                {levelData.difficulty.replace(/-/g, " ")}
              </Text>
            </View>
          )}
          <Text style={styles.chevron}>▾</Text>
        </View>
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedLevels.size}/{TOTAL_LEVELS}</Text>
        </View>
      </TouchableOpacity>

      {/* Board */}
      <View style={styles.boardSection}>
        <Board
          board={displayBoard}
          onMove={handleMove}
          disabled={gameState !== GAME_STATE.PLAYING}
          targetOpacity={piecesVisible ? 1 : 0}
          celebrate={gameState === GAME_STATE.WON}
        />
        {gameState === GAME_STATE.WON && <WinCelebration />}
      </View>

      {/* Controls */}
      {/* Stuck indicator */}
      {gameState === GAME_STATE.STUCK && (
        <View style={styles.stuckBanner}>
          <Text style={styles.stuckText}>No moves available! Reset to try again.</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, moveHistory.length === 0 && styles.btnDisabled]}
          onPress={handleReset}
          disabled={moveHistory.length === 0}
        >
          <Text style={[styles.btnText, moveHistory.length === 0 && styles.btnTextDisabled]}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnPrimary, isLastLevel && styles.btnDisabled]}
          onPress={handleNextLevel}
          disabled={isLastLevel}
        >
          <Text style={[styles.btnPrimaryText, isLastLevel && styles.btnTextDisabled]}>Skip ›</Text>
        </TouchableOpacity>
      </View>

      <LevelSelectModal
        visible={showLevelSelect}
        onClose={() => setShowLevelSelect(false)}
        levels={LEVELS}
        currentLevel={currentLevel}
        completedLevels={completedLevels}
        onSelectLevel={handleSelectLevel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  levelHeader: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  levelInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chevron: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    width: 60,
    height: 6,
    backgroundColor: COLORS.surfaceLighter,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  stuckBanner: {
    backgroundColor: COLORS.error + "20",
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 4,
  },
  stuckText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: "600",
  },
  boardSection: {
    flex: 1,
    justifyContent: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  btn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnTextDisabled: {
    opacity: 0.6,
  },
});
