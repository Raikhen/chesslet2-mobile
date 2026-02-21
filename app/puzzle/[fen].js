import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Board from "../../components/Board";
import GameHeader from "../../components/GameHeader";
import { WinCelebration, ImpossibleOverlay } from "../../components/Overlays";
import { CongratsModal } from "../../components/Modals";
import { useGame, GAME_STATE } from "../../lib/useGame";
import { urlToFen, isValidFen } from "../../lib/fen";
import { createEmptyBoard, COLORS } from "../../lib/constants";

export default function PuzzleScreen() {
  const { fen: urlFen } = useLocalSearchParams();
  const fen = urlToFen(urlFen || "");
  const valid = isValidFen(fen);

  const [showCongrats, setShowCongrats] = useState(false);
  const [isPlayingSolution, setIsPlayingSolution] = useState(false);
  const [animatingMove, setAnimatingMove] = useState(null);
  const [animatingMoveIndex, setAnimatingMoveIndex] = useState(0);
  const solutionTimeoutRef = useRef(null);
  const usedSolutionRef = useRef(false);

  const { board, gameState, moveHistory, makeMove, resetPuzzle, getSolution, newPuzzle, puzzleInfo, difficulty } =
    useGame(valid ? fen : null);
  const makeMoveRef = useRef(makeMove);
  useEffect(() => { makeMoveRef.current = makeMove; }, [makeMove]);

  const displayBoard = board || createEmptyBoard();

  const handleMove = useCallback(
    (fromRow, fromCol, toRow, toCol) => {
      makeMove(fromRow, fromCol, toRow, toCol);
    },
    [makeMove]
  );

  useEffect(() => {
    if (gameState === GAME_STATE.WON && !usedSolutionRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCongrats(true);
    }
  }, [gameState]);

  const handleShowSolution = useCallback(() => {
    const solution = getSolution();
    if (!solution || solution.length === 0) return;
    resetPuzzle();
    setIsPlayingSolution(true);
    setShowCongrats(false);
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

  const handleNextPuzzle = useCallback(() => {
    setShowCongrats(false);
    usedSolutionRef.current = false;
    newPuzzle(difficulty);
  }, [newPuzzle, difficulty]);

  useEffect(() => {
    return () => { if (solutionTimeoutRef.current) clearTimeout(solutionTimeoutRef.current); };
  }, []);

  if (!valid) {
    return (
      <SafeAreaView style={styles.container}>
        <GameHeader title="Puzzle" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid puzzle link</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GameHeader title="Shared Puzzle" showBack />

      <View style={styles.boardSection}>
        <Board
          board={displayBoard}
          onMove={handleMove}
          disabled={gameState !== GAME_STATE.PLAYING || isPlayingSolution}
          animatingMove={animatingMove}
          animatingMoveIndex={animatingMoveIndex}
        />
        {gameState === GAME_STATE.IMPOSSIBLE && <ImpossibleOverlay />}
        {gameState === GAME_STATE.WON && !usedSolutionRef.current && <WinCelebration />}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, (moveHistory.length === 0 || isPlayingSolution) && styles.btnDisabled]}
          onPress={resetPuzzle}
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
          onPress={handleNextPuzzle}
          disabled={isPlayingSolution}
        >
          <Text style={styles.btnPrimaryText}>Next Puzzle</Text>
        </TouchableOpacity>
      </View>

      <CongratsModal
        visible={showCongrats}
        onClose={() => setShowCongrats(false)}
        onNextPuzzle={handleNextPuzzle}
        moveCount={moveHistory.length}
        solutionCount={puzzleInfo?.metrics?.solutionCount || puzzleInfo?.solutionCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  boardSection: { flex: 1, justifyContent: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 18, color: COLORS.error, fontWeight: "600" },
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
