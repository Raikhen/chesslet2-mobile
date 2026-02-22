import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Board from "../components/Board";
import DesignerBoard, { BOARD_WIDTH, SQUARE_SIZE, BOARD_PADDING } from "../components/DesignerBoard";
import GameHeader from "../components/GameHeader";
import ChessPiece from "../components/ChessPieces";
import { WinCelebration, ImpossibleOverlay } from "../components/Overlays";
import { useGame, GAME_STATE } from "../lib/useGame";
import { createEmptyBoard, PIECES, COLORS, DIFFICULTY_COLORS, BOARD_SIZE } from "../lib/constants";
import { boardToFen, fenToUrl, countPieces } from "../lib/fen";
import { isSolvable, getPuzzleMetrics } from "../lib/solver";
import { getDifficultyLevel } from "../lib/generator";

const PALETTE_PIECE_SIZE = 36;

export default function DesignerScreen() {
  const [designBoard, setDesignBoard] = useState(createEmptyBoard);
  const [analysis, setAnalysis] = useState({ status: "unsolvable", message: "Not solvable" });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [testPlayMode, setTestPlayMode] = useState(false);
  const [testPlayFen, setTestPlayFen] = useState(null);
  const [isPlayingSolution, setIsPlayingSolution] = useState(false);
  const [animatingMove, setAnimatingMove] = useState(null);
  const [animatingMoveIndex, setAnimatingMoveIndex] = useState(0);
  const solutionTimeoutRef = useRef(null);

  // Palette drag state
  const [paletteDragHover, setPaletteDragHover] = useState(null);
  const boardScreenPos = useRef({ x: 0, y: 0 });

  const pieceCount = useMemo(() => countPieces(designBoard), [designBoard]);

  const { board: gameBoard, gameState, moveHistory, makeMove, resetPuzzle, getSolution } = useGame(testPlayFen);
  const makeMoveRef = useRef(makeMove);
  useEffect(() => { makeMoveRef.current = makeMove; }, [makeMove]);

  useEffect(() => {
    return () => { if (solutionTimeoutRef.current) clearTimeout(solutionTimeoutRef.current); };
  }, []);

  // Analyze board
  useEffect(() => {
    if (pieceCount <= 1) {
      setAnalysis(pieceCount === 1
        ? { status: "solvable", message: "Solvable!", difficulty: "very-easy", score: 0, solutionCount: 1, minMoves: 0 }
        : { status: "unsolvable", message: "Not solvable" }
      );
      return;
    }
    setIsAnalyzing(true);
    const timeoutId = setTimeout(() => {
      try {
        const solvable = isSolvable(designBoard);
        if (solvable) {
          const metrics = getPuzzleMetrics(designBoard);
          const difficulty = getDifficultyLevel(metrics.weightedDifficulty);
          setAnalysis({
            status: "solvable",
            message: "Solvable!",
            difficulty,
            score: metrics.weightedDifficulty,
            solutionCount: metrics.solutionCount,
            minMoves: metrics.minMoves,
          });
        } else {
          setAnalysis({ status: "unsolvable", message: "Not solvable" });
        }
      } catch {
        setAnalysis({ status: "error", message: "Analysis failed" });
      }
      setIsAnalyzing(false);
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [designBoard, pieceCount]);

  // Board position callback from DesignerBoard
  const handleBoardMeasured = useCallback((x, y) => {
    boardScreenPos.current = { x, y };
  }, []);

  // Convert absolute screen coords to board square
  // Use rounding to center of square for more forgiving hit detection
  const screenToSquare = useCallback((absX, absY) => {
    const bx = absX - boardScreenPos.current.x;
    const by = absY - boardScreenPos.current.y;
    // Offset the touch point upward by half a square to account for finger occlusion
    const adjustedBy = by - SQUARE_SIZE * 0.35;
    const col = Math.floor(bx / SQUARE_SIZE);
    const row = Math.floor(adjustedBy / SQUARE_SIZE);
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      return { row, col };
    }
    return null;
  }, []);

  // Re-measure board position on demand (for accurate drop detection)
  const remeasureBoard = useCallback(() => {
    // The DesignerBoard will call onBoardMeasured on layout, but we can also
    // request a re-measure to handle any scroll/layout shifts
  }, []);

  // Handle palette drag callbacks
  const handlePaletteDragStart = useCallback((piece) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handlePaletteDragUpdate = useCallback((absX, absY) => {
    const sq = screenToSquare(absX, absY);
    setPaletteDragHover(sq);
  }, [screenToSquare]);

  const handlePaletteDragEnd = useCallback((piece, absX, absY) => {
    const sq = screenToSquare(absX, absY);
    if (sq) {
      const newBoard = designBoard.map((r) => [...r]);
      newBoard[sq.row][sq.col] = piece;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setDesignBoard(newBoard);
    }
    setPaletteDragHover(null);
  }, [designBoard, screenToSquare]);

  const handlePaletteDragCancel = useCallback(() => {
    setPaletteDragHover(null);
  }, []);

  // Handle board changes from drag
  const handleBoardChange = useCallback((newBoard) => {
    setDesignBoard(newBoard);
  }, []);

  const handleClear = useCallback(() => {
    setDesignBoard(createEmptyBoard());
  }, []);

  const handleTestPlay = useCallback(() => {
    if (pieceCount < 2) return;
    setTestPlayFen(boardToFen(designBoard));
    setTestPlayMode(true);
  }, [designBoard, pieceCount]);

  const handleBackToEdit = useCallback(() => {
    setTestPlayMode(false);
    setTestPlayFen(null);
    setIsPlayingSolution(false);
    setAnimatingMove(null);
    setAnimatingMoveIndex(0);
    if (solutionTimeoutRef.current) clearTimeout(solutionTimeoutRef.current);
  }, []);

  const handleShare = useCallback(async () => {
    if (analysis?.status !== "solvable") return;
    const fen = boardToFen(designBoard);
    const urlFen = fenToUrl(fen);
    const shareUrl = `https://www.chesslet.xyz/puzzle/${urlFen}`;
    try {
      await Share.share({ message: `Try this Chesslet puzzle!\n${shareUrl}`, url: shareUrl });
    } catch (e) {
      Alert.alert("Share failed", e.message);
    }
  }, [designBoard, analysis]);

  const handleTestMove = useCallback(
    (fromRow, fromCol, toRow, toCol) => {
      makeMove(fromRow, fromCol, toRow, toCol);
    },
    [makeMove]
  );

  const handleShowSolution = useCallback(() => {
    const solution = getSolution();
    if (!solution || solution.length === 0) return;
    resetPuzzle();
    setIsPlayingSolution(true);
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

  const displayBoard = testPlayMode ? (gameBoard || createEmptyBoard()) : designBoard;
  const diffColors = analysis?.difficulty ? DIFFICULTY_COLORS[analysis.difficulty] || {} : {};

  return (
    <SafeAreaView style={styles.container}>
      <GameHeader title={testPlayMode ? "Test Play" : "Designer"} showBack />

      {testPlayMode ? (
        <>
          <View style={styles.boardSectionFlex}>
            <Board
              board={displayBoard}
              onMove={handleTestMove}
              disabled={gameState !== GAME_STATE.PLAYING || isPlayingSolution}
              animatingMove={animatingMove}
              animatingMoveIndex={animatingMoveIndex}
            />
            {gameState === GAME_STATE.IMPOSSIBLE && <ImpossibleOverlay />}
            {gameState === GAME_STATE.WON && <WinCelebration />}
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
            <TouchableOpacity style={styles.btnPrimary} onPress={handleBackToEdit}>
              <Text style={styles.btnPrimaryText}>Back to Edit</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.contentArea}>
            {/* Piece Palette - Drag pieces to the board */}
            <View style={styles.palette}>
              <Text style={styles.paletteLabel}>Drag to board</Text>
              <View style={styles.paletteRow}>
                {PIECES.map((piece) => (
                  <DraggablePalettePiece
                    key={piece}
                    piece={piece}
                    onDragStart={handlePaletteDragStart}
                    onDragUpdate={handlePaletteDragUpdate}
                    onDragEnd={handlePaletteDragEnd}
                    onDragCancel={handlePaletteDragCancel}
                  />
                ))}
              </View>
            </View>

            {/* Design Board with drag support */}
            <View style={styles.boardSection}>
              <DesignerBoard
                board={displayBoard}
                onBoardChange={handleBoardChange}
                paletteDragHover={paletteDragHover}
                onBoardMeasured={handleBoardMeasured}
              />
            </View>

            {/* Analysis */}
            <View style={[styles.analysisCard, analysis.status === "solvable" && { borderColor: COLORS.success }]}>
              <View style={styles.analysisRow}>
                <Text style={styles.analysisIcon}>
                  {isAnalyzing ? "⏳" : analysis.status === "solvable" ? "✓" : "✗"}
                </Text>
                <Text style={styles.analysisText}>
                  {isAnalyzing ? "Analyzing..." : analysis.message}
                </Text>
                {!isAnalyzing && analysis.status === "solvable" && (
                  <View style={[styles.diffBadge, { backgroundColor: diffColors.bg }]}>
                    <Text style={[styles.diffBadgeText, { color: diffColors.text }]}>
                      {analysis.difficulty.replace(/-/g, " ")}
                    </Text>
                  </View>
                )}
                {!isAnalyzing && analysis.status === "unsolvable" && (
                  <View style={[styles.diffBadge, { backgroundColor: "#fee2e2" }]}>
                    <Text style={[styles.diffBadgeText, { color: "#dc2626" }]}>impossible</Text>
                  </View>
                )}
              </View>
              <Text style={styles.analysisDetails}>
                {isAnalyzing
                  ? " "
                  : analysis.status === "solvable"
                    ? `${analysis.solutionCount} solution${analysis.solutionCount !== 1 ? "s" : ""} · ${analysis.minMoves} moves`
                    : "0 solutions · \u221E moves"}
              </Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.btn, pieceCount === 0 && styles.btnDisabled]}
              onPress={handleClear}
              disabled={pieceCount === 0}
            >
              <Text style={styles.btnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, pieceCount < 2 && styles.btnDisabled]}
              onPress={handleTestPlay}
              disabled={pieceCount < 2}
            >
              <Text style={styles.btnText}>Test Play</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, analysis?.status !== "solvable" && styles.btnDisabled]}
              onPress={handleShare}
              disabled={analysis?.status !== "solvable"}
            >
              <Text style={styles.btnPrimaryText}>Share</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function DraggablePalettePiece({ piece, onDragStart, onDragUpdate, onDragEnd, onDragCancel }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const zIdx = useSharedValue(1);

  const gesture = Gesture.Pan()
    .minDistance(4)
    .onStart(() => {
      zIdx.value = 1000;
      scale.value = withSpring(1.2, { damping: 15, stiffness: 200 });
      opacity.value = 0.85;
      runOnJS(onDragStart)(piece);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      runOnJS(onDragUpdate)(event.absoluteX, event.absoluteY);
    })
    .onEnd((event) => {
      runOnJS(onDragEnd)(piece, event.absoluteX, event.absoluteY);
      translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 150 });
      zIdx.value = 1;
    })
    .onFinalize(() => {
      translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 150 });
      zIdx.value = 1;
      runOnJS(onDragCancel)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: zIdx.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.paletteItem, animatedStyle]}>
        <ChessPiece piece={piece} size={PALETTE_PIECE_SIZE} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentArea: { flex: 1, justifyContent: "center" },
  palette: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  paletteLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontWeight: "500",
  },
  paletteRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  paletteItem: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  boardSectionFlex: { flex: 1, justifyContent: "center" },
  boardSection: { justifyContent: "center", paddingVertical: 8 },
  analysisCard: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  analysisRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  analysisIcon: { fontSize: 18 },
  analysisText: { fontSize: 15, fontWeight: "600", color: COLORS.text, flex: 1 },
  analysisDetails: { fontSize: 13, color: COLORS.textMuted, marginTop: 6, marginLeft: 28 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffBadgeText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
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
