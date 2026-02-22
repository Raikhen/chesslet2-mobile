import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Board from "../components/Board";
import GameHeader from "../components/GameHeader";
import { WinCelebration } from "../components/Overlays";
import { useGame, GAME_STATE } from "../lib/useGame";
import { createEmptyBoard, COLORS } from "../lib/constants";

export default function RandomScreen() {
  const [isPlayingSolution, setIsPlayingSolution] = useState(false);
  const [animatingMove, setAnimatingMove] = useState(null);
  const [animatingMoveIndex, setAnimatingMoveIndex] = useState(0);
  const solutionTimeoutRef = useRef(null);
  const usedSolutionRef = useRef(false);
  const [piecesVisible, setPiecesVisible] = useState(true);
  const transitionRef = useRef(null);
  const isTransitioning = useRef(false);

  const { board, gameState, moveHistory, makeMove, resetPuzzle, newPuzzle, getSolution, puzzleInfo } = useGame();
  const makeMoveRef = useRef(makeMove);
  useEffect(() => { makeMoveRef.current = makeMove; }, [makeMove]);

  const displayBoard = board || createEmptyBoard();

  const handleMove = useCallback(
    (fromRow, fromCol, toRow, toCol) => {
      makeMove(fromRow, fromCol, toRow, toCol);
    },
    [makeMove]
  );

  const cancelTransition = useCallback(() => {
    if (transitionRef.current) {
      clearTimeout(transitionRef.current);
      transitionRef.current = null;
    }
    isTransitioning.current = false;
    setPiecesVisible(true);
  }, []);

  // Win handler
  useEffect(() => {
    if (gameState === GAME_STATE.WON && !usedSolutionRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
      // Auto-advance with fade transition
      transitionRef.current = setTimeout(() => {
        setPiecesVisible(false);
        transitionRef.current = setTimeout(() => {
          isTransitioning.current = true;
          newPuzzle();
          usedSolutionRef.current = false;
        }, 450);
      }, 1000);
    }
  }, [gameState]);

  // Fade in new pieces after board changes during transition
  useEffect(() => {
    if (isTransitioning.current) {
      isTransitioning.current = false;
      setTimeout(() => {
        setPiecesVisible(true);
      }, 50);
    }
  }, [board]);

  const handleNewPuzzle = useCallback(() => {
    cancelTransition();
    newPuzzle();
    usedSolutionRef.current = false;
    setIsPlayingSolution(false);
    setAnimatingMove(null);
    setAnimatingMoveIndex(0);
    if (solutionTimeoutRef.current) clearTimeout(solutionTimeoutRef.current);
  }, [newPuzzle, cancelTransition]);

  const handleReset = useCallback(() => {
    cancelTransition();
    resetPuzzle();
  }, [resetPuzzle, cancelTransition]);

  const handleShowSolution = useCallback(() => {
    const solution = getSolution();
    if (!solution || solution.length === 0) return;

    cancelTransition();
    resetPuzzle();
    setIsPlayingSolution(true);
    usedSolutionRef.current = true;

    let moveIndex = 0;
    const playNextMove = () => {
      if (moveIndex >= solution.length) {
        setIsPlayingSolution(false);
        setAnimatingMove(null);
        setAnimatingMoveIndex(0);
        return;
      }
      const move = solution[moveIndex];
      setAnimatingMoveIndex(moveIndex);
      setAnimatingMove(move);
      solutionTimeoutRef.current = setTimeout(() => {
        makeMoveRef.current(move.from.row, move.from.col, move.to.row, move.to.col);
        setAnimatingMove(null);
        moveIndex++;
        solutionTimeoutRef.current = setTimeout(playNextMove, 400);
      }, 700);
    };
    solutionTimeoutRef.current = setTimeout(playNextMove, 300);
  }, [getSolution, resetPuzzle]);

  useEffect(() => {
    return () => {
      if (solutionTimeoutRef.current) clearTimeout(solutionTimeoutRef.current);
      if (transitionRef.current) clearTimeout(transitionRef.current);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <GameHeader title="Random" showBack />

      <View style={styles.boardSection}>
        <Board
          board={displayBoard}
          onMove={handleMove}
          disabled={gameState !== GAME_STATE.PLAYING || isPlayingSolution}
          animatingMove={animatingMove}
          animatingMoveIndex={animatingMoveIndex}
          targetOpacity={piecesVisible ? 1 : 0}
          celebrate={gameState === GAME_STATE.WON && !usedSolutionRef.current}
        />
        {gameState === GAME_STATE.WON && !usedSolutionRef.current && <WinCelebration />}
      </View>

      {gameState === GAME_STATE.STUCK && (
        <View style={styles.stuckBanner}>
          <Text style={styles.stuckText}>No moves available! Reset to try again.</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, (moveHistory.length === 0 || isPlayingSolution) && styles.btnDisabled]}
          onPress={handleReset}
          disabled={moveHistory.length === 0 || isPlayingSolution}
        >
          <Text style={styles.btnText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, (gameState === GAME_STATE.WON || isPlayingSolution) && styles.btnDisabled]}
          onPress={handleShowSolution}
          disabled={gameState === GAME_STATE.WON || isPlayingSolution}
        >
          <Text style={styles.btnText}>{isPlayingSolution ? "Playing..." : "Solution"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnPrimary, isPlayingSolution && styles.btnDisabled]}
          onPress={handleNewPuzzle}
          disabled={isPlayingSolution}
        >
          <Text style={styles.btnPrimaryText}>New Puzzle</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  stuckBanner: {
    backgroundColor: COLORS.error + "20",
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 4,
  },
  stuckText: { color: COLORS.error, fontSize: 14, fontWeight: "600" },
  boardSection: { flex: 1, justifyContent: "center" },
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
  btnText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: "600" },
  btnPrimary: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  btnDisabled: { opacity: 0.4 },
});
