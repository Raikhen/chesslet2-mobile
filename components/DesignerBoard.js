import React, { useState, useCallback, useRef } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import ChessPiece from "./ChessPieces";
import { COLORS } from "../lib/constants";

const BOARD_SIZE = 4;
const SCREEN_WIDTH = Dimensions.get("window").width;
const BOARD_PADDING = 16;
const BOARD_WIDTH = Math.min(SCREEN_WIDTH - BOARD_PADDING * 2, 400);
const SQUARE_SIZE = BOARD_WIDTH / BOARD_SIZE;
const PIECE_SIZE = SQUARE_SIZE * 0.78;

export { BOARD_WIDTH, SQUARE_SIZE, BOARD_PADDING };

export default function DesignerBoard({ board, onBoardChange, paletteDragHover, onBoardMeasured }) {
  const [dragSource, setDragSource] = useState(null);
  const [hoverTarget, setHoverTarget] = useState(null);
  const boardRef = useRef(null);
  const boardLayoutRef = useRef({ x: 0, y: 0 });

  const handleBoardLayout = useCallback(() => {
    if (boardRef.current) {
      boardRef.current.measureInWindow((wx, wy) => {
        boardLayoutRef.current = { x: wx, y: wy };
        if (onBoardMeasured) onBoardMeasured(wx, wy);
      });
    }
  }, [onBoardMeasured]);

  const handleDragStart = useCallback((row, col) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDragSource({ row, col });
  }, []);

  const handleDragUpdate = useCallback((fromRow, fromCol, translationX, translationY) => {
    const centerX = fromCol * SQUARE_SIZE + SQUARE_SIZE / 2 + translationX;
    const centerY = fromRow * SQUARE_SIZE + SQUARE_SIZE / 2 + translationY;
    const dropCol = Math.floor(centerX / SQUARE_SIZE);
    const dropRow = Math.floor(centerY / SQUARE_SIZE);

    if (dropRow >= 0 && dropRow < BOARD_SIZE && dropCol >= 0 && dropCol < BOARD_SIZE) {
      if (dropRow !== fromRow || dropCol !== fromCol) {
        setHoverTarget({ row: dropRow, col: dropCol });
        return;
      }
    }
    setHoverTarget(null);
  }, []);

  const handleDragEnd = useCallback((fromRow, fromCol, toRow, toCol) => {
    setDragSource(null);
    setHoverTarget(null);

    if (toRow >= 0 && toRow < BOARD_SIZE && toCol >= 0 && toCol < BOARD_SIZE) {
      if (toRow === fromRow && toCol === fromCol) return;

      const newBoard = board.map((r) => [...r]);
      const piece = newBoard[fromRow][fromCol];
      if (!piece) return;

      newBoard[fromRow][fromCol] = null;
      newBoard[toRow][toCol] = piece;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onBoardChange(newBoard);
    }
  }, [board, onBoardChange]);

  const handleTapRemove = useCallback((row, col) => {
    if (board[row][col]) {
      const newBoard = board.map((r) => [...r]);
      newBoard[row][col] = null;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onBoardChange(newBoard);
    }
  }, [board, onBoardChange]);

  // Clear state when board changes
  React.useEffect(() => {
    setDragSource(null);
    setHoverTarget(null);
  }, [board]);

  return (
    <View style={styles.boardContainer}>
      <View
        ref={boardRef}
        style={styles.board}
        onLayout={handleBoardLayout}
      >
        {/* Square backgrounds */}
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isDragSrc =
              dragSource?.row === rowIndex && dragSource?.col === colIndex;
            const isHoverTgt =
              hoverTarget?.row === rowIndex && hoverTarget?.col === colIndex;
            const isPaletteHover =
              paletteDragHover?.row === rowIndex && paletteDragHover?.col === colIndex;

            let bgColor;
            if (isHoverTgt || isPaletteHover) {
              bgColor = "#d8c8a8";
            } else if (isDragSrc) {
              bgColor = "#e0d4a8";
            } else {
              bgColor = isLight ? COLORS.boardLight : COLORS.boardDark;
            }

            const cornerStyle = getCornerStyle(rowIndex, colIndex);

            return (
              <View
                key={`sq-${rowIndex}-${colIndex}`}
                style={[styles.square, cornerStyle, { backgroundColor: bgColor }]}
              />
            );
          })
        )}

        {/* Draggable pieces */}
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            if (!piece) return null;

            return (
              <DesignerDraggablePiece
                key={`piece-${rowIndex}-${colIndex}-${piece}`}
                piece={piece}
                row={rowIndex}
                col={colIndex}
                onDragStart={handleDragStart}
                onDragUpdate={handleDragUpdate}
                onDragEnd={handleDragEnd}
                onTapRemove={handleTapRemove}
              />
            );
          })
        )}

      </View>
    </View>
  );
}

function DesignerDraggablePiece({ piece, row, col, onDragStart, onDragUpdate, onDragEnd, onTapRemove }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIdx = useSharedValue(1);
  const shadowOpac = useSharedValue(0);
  const didDrop = useSharedValue(0);
  const hasMoved = useSharedValue(0);

  const gesture = Gesture.Pan()
    .minDistance(4)
    .onStart(() => {
      didDrop.value = 0;
      hasMoved.value = 0;
      zIdx.value = 100;
      scale.value = withSpring(1.15, { damping: 15, stiffness: 200 });
      shadowOpac.value = withTiming(0.3, { duration: 100 });
      runOnJS(onDragStart)(row, col);
    })
    .onUpdate((event) => {
      hasMoved.value = 1;
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      runOnJS(onDragUpdate)(row, col, event.translationX, event.translationY);
    })
    .onEnd((event) => {
      if (hasMoved.value === 0) {
        // Treated as tap - remove piece
        runOnJS(onTapRemove)(row, col);
        return;
      }

      const centerX = col * SQUARE_SIZE + SQUARE_SIZE / 2 + event.translationX;
      const centerY = row * SQUARE_SIZE + SQUARE_SIZE / 2 + event.translationY;
      const dropCol = Math.floor(centerX / SQUARE_SIZE);
      const dropRow = Math.floor(centerY / SQUARE_SIZE);

      runOnJS(onDragEnd)(row, col, dropRow, dropCol);

      if (dropRow >= 0 && dropRow < BOARD_SIZE && dropCol >= 0 && dropCol < BOARD_SIZE) {
        if (dropRow !== row || dropCol !== col) {
          didDrop.value = 1;
          const targetX = (dropCol - col) * SQUARE_SIZE;
          const targetY = (dropRow - row) * SQUARE_SIZE;
          translateX.value = targetX;
          translateY.value = targetY;
          scale.value = 1;
          shadowOpac.value = 0;
          return;
        }
      }
    })
    .onFinalize(() => {
      if (didDrop.value === 1) {
        scale.value = 1;
        zIdx.value = 1;
        shadowOpac.value = 0;
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        zIdx.value = 1;
        shadowOpac.value = withTiming(0, { duration: 150 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIdx.value,
    shadowOpacity: shadowOpac.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            left: col * SQUARE_SIZE,
            top: row * SQUARE_SIZE,
            width: SQUARE_SIZE,
            height: SQUARE_SIZE,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 10,
            elevation: 5,
          },
          animatedStyle,
        ]}
      >
        <ChessPiece piece={piece} size={PIECE_SIZE} />
      </Animated.View>
    </GestureDetector>
  );
}

function getCornerStyle(row, col) {
  const radius = 12;
  if (row === 0 && col === 0) return { borderTopLeftRadius: radius };
  if (row === 0 && col === 3) return { borderTopRightRadius: radius };
  if (row === 3 && col === 0) return { borderBottomLeftRadius: radius };
  if (row === 3 && col === 3) return { borderBottomRightRadius: radius };
  return {};
}

const styles = StyleSheet.create({
  boardContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: BOARD_PADDING,
  },
  board: {
    width: BOARD_WIDTH,
    height: BOARD_WIDTH,
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 12,
    overflow: "visible",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
