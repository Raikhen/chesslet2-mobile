import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Board from "../components/Board";
import GameHeader from "../components/GameHeader";
import { WinCelebration } from "../components/Overlays";
import { useGame, GAME_STATE } from "../lib/useGame";
import { generatePuzzle, DIFFICULTY, getStarterPuzzle, evaluatePuzzle } from "../lib/generator";
import { fenToBoard } from "../lib/fen";
import { createEmptyBoard, COLORS } from "../lib/constants";
import { loadHighScore, saveHighScore } from "../lib/storage";

const GAME_DURATION = 60;

function getDifficultyForScore(score) {
  if (score < 3) return DIFFICULTY.EASY;
  if (score < 6) return DIFFICULTY.MEDIUM;
  return DIFFICULTY.HARD;
}

export default function TimedScreen() {
  const [gamePhase, setGamePhase] = useState("ready");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [highScore, setHighScore] = useState(null);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const timerRef = useRef(null);
  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Load high score
  useEffect(() => {
    (async () => {
      const hs = await loadHighScore();
      setHighScore(hs);
      setLoaded(true);
    })();
  }, []);

  const generateNewPuzzle = useCallback((currentScore) => {
    const difficulty = getDifficultyForScore(currentScore);
    let puzzle = generatePuzzle({
      difficulty,
      minPieces: difficulty === DIFFICULTY.EASY ? 2 : difficulty === DIFFICULTY.MEDIUM ? 3 : 4,
      maxPieces: difficulty === DIFFICULTY.EASY ? 4 : difficulty === DIFFICULTY.MEDIUM ? 6 : 7,
      maxAttempts: difficulty === DIFFICULTY.HARD ? 30 : 50,
      fast: true,
    });
    if (!puzzle) {
      const starter = getStarterPuzzle(difficulty);
      const starterBoard = fenToBoard(starter.fen);
      puzzle = {
        fen: starter.fen,
        board: starterBoard,
        difficulty: starter.difficulty,
        ...evaluatePuzzle(starterBoard),
      };
    }
    setCurrentPuzzle(puzzle);
    return puzzle;
  }, []);

  const { board, gameState, moveHistory, makeMove, resetPuzzle, loadPuzzle } = useGame(currentPuzzle?.fen);

  useEffect(() => {
    if (currentPuzzle && gamePhase === "playing") {
      loadPuzzle(currentPuzzle.fen);
    }
  }, [currentPuzzle, gamePhase, loadPuzzle]);

  const startGame = useCallback(() => {
    setGamePhase("playing");
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setIsNewHighScore(false);
    generateNewPuzzle(0);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGamePhase("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [generateNewPuzzle]);

  // Handle puzzle completion
  useEffect(() => {
    if (gameState === GAME_STATE.WON && gamePhase === "playing") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const newScore = scoreRef.current + 1;
      setScore(newScore);
      setTimeout(() => {
        if (gamePhase === "playing") generateNewPuzzle(newScore);
      }, 300);
    }
  }, [gameState, gamePhase, generateNewPuzzle]);

  // Save high score
  useEffect(() => {
    if (gamePhase === "finished") {
      if (highScore === null || score > highScore) {
        setHighScore(score);
        setIsNewHighScore(true);
        saveHighScore(score);
      }
    }
  }, [gamePhase, score, highScore]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleMove = useCallback(
    (fromRow, fromCol, toRow, toCol) => {
      makeMove(fromRow, fromCol, toRow, toCol);
    },
    [makeMove]
  );

  const handleSkip = useCallback(() => {
    if (gamePhase === "playing") generateNewPuzzle(score);
  }, [gamePhase, score, generateNewPuzzle]);

  const displayBoard = board || createEmptyBoard();
  const timerProgress = (timeLeft / GAME_DURATION) * 100;
  const isLowTime = timeLeft <= 10;

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <SafeAreaView style={styles.container}>
      <GameHeader title="Timed" showBack />

      {gamePhase === "ready" && (
        <>
          <View style={styles.centerCard}>
            <Text style={styles.readyIcon}>⏱️</Text>
            <Text style={styles.readyTitle}>Timed Mode</Text>
            <Text style={styles.readyDesc}>Solve as many puzzles as you can in 60 seconds!</Text>
            <View style={styles.highScoreBox}>
              <Text style={styles.highScoreLabel}>Best Score</Text>
              <Text style={styles.highScoreValue}>{highScore !== null ? highScore : "--"}</Text>
            </View>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startBtnText}>▶  Start Game</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {gamePhase === "playing" && (
        <>
          <View style={styles.statsBar}>
            <View style={styles.timerSection}>
              <Text style={[styles.timerText, isLowTime && styles.timerLow]}>
                {formatTime(timeLeft)}
              </Text>
              <View style={styles.timerBar}>
                <View
                  style={[
                    styles.timerFill,
                    { width: `${timerProgress}%` },
                    isLowTime && styles.timerFillLow,
                  ]}
                />
              </View>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
          </View>

          <View style={styles.boardSection}>
            <Board board={displayBoard} onMove={handleMove} disabled={gameState !== GAME_STATE.PLAYING} celebrate={gameState === GAME_STATE.WON} />
            {gameState === GAME_STATE.WON && <WinCelebration />}
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.btn, moveHistory.length === 0 && styles.btnDisabled]}
              onPress={resetPuzzle}
              disabled={moveHistory.length === 0}
            >
              <Text style={styles.btnText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={handleSkip}>
              <Text style={styles.btnText}>Skip ▶|</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {gamePhase === "finished" && (
        <>
          <View style={styles.centerCard}>
            <Text style={styles.readyIcon}>{isNewHighScore ? "🏆" : "⏱️"}</Text>
            <Text style={styles.readyTitle}>{isNewHighScore ? "New High Score!" : "Time's Up!"}</Text>
            <View style={styles.finalScore}>
              <Text style={styles.finalScoreLabel}>Puzzles Solved</Text>
              <Text style={styles.finalScoreValue}>{score}</Text>
            </View>
            {highScore !== null && !isNewHighScore && (
              <Text style={styles.bestInfo}>Best: {highScore}</Text>
            )}
          </View>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.startBtn} onPress={startGame}>
              <Text style={styles.startBtnText}>▶  Play Again</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  readyIcon: { fontSize: 56, marginBottom: 16 },
  readyTitle: { fontSize: 28, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  readyDesc: { fontSize: 16, color: COLORS.textSecondary, textAlign: "center", marginBottom: 28 },
  highScoreBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  highScoreLabel: { fontSize: 14, color: COLORS.textMuted, marginBottom: 4 },
  highScoreValue: { fontSize: 36, fontWeight: "800", color: COLORS.accent },
  startBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 14,
  },
  startBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 16,
  },
  timerSection: { flex: 1 },
  timerText: { fontSize: 24, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  timerLow: { color: COLORS.error },
  timerBar: {
    height: 6,
    backgroundColor: COLORS.surfaceLighter,
    borderRadius: 3,
    overflow: "hidden",
  },
  timerFill: {
    height: "100%",
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  timerFillLow: { backgroundColor: COLORS.error },
  scoreBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  scoreLabel: { fontSize: 12, color: COLORS.textMuted },
  scoreValue: { fontSize: 28, fontWeight: "800", color: COLORS.accent },
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
  btnDisabled: { opacity: 0.4 },
  finalScore: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 36,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  finalScoreLabel: { fontSize: 14, color: COLORS.textMuted, marginBottom: 4 },
  finalScoreValue: { fontSize: 48, fontWeight: "800", color: COLORS.accent },
  bestInfo: { fontSize: 16, color: COLORS.textMuted, marginBottom: 24 },
});
