import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Dimensions, StyleSheet, Animated as RNAnimated, Easing as RNEasing } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import ChessPiece from "./ChessPieces";
import { getValidCaptures } from "../lib/engine";
import { COLORS } from "../lib/constants";

const BOARD_SIZE = 4;
const SCREEN_WIDTH = Dimensions.get("window").width;
const BOARD_PADDING = 16;
const BOARD_WIDTH = Math.min(SCREEN_WIDTH - BOARD_PADDING * 2, 400);
const SQUARE_SIZE = BOARD_WIDTH / BOARD_SIZE;
const PIECE_SIZE = SQUARE_SIZE * 0.78;

export default function Board({ board, onMove, disabled, animatingMove, animatingMoveIndex, targetOpacity, celebrate }) {
  const [dragSource, setDragSource] = useState(null);
  const [validTargets, setValidTargets] = useState([]);
  const [dropTarget, setDropTarget] = useState(null);
  const validTargetsRef = useRef([]);

  // Pieces layer opacity (using RN Animated for reliable opacity animation)
  const layerOpacity = useRef(new RNAnimated.Value(targetOpacity != null ? targetOpacity : 1)).current;

  useEffect(() => {
    const target = targetOpacity != null ? targetOpacity : 1;
    RNAnimated.timing(layerOpacity, {
      toValue: target,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [targetOpacity]);

  // Golden glow on win (using RN Animated which works reliably here)
  const glowAnim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    if (celebrate) {
      RNAnimated.sequence([
        RNAnimated.timing(glowAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        RNAnimated.timing(glowAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [celebrate]);

  const handleDragStart = useCallback(
    (row, col) => {
      if (disabled) return;
      const piece = board[row][col];
      if (!piece) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const captures = getValidCaptures(board, row, col);
      setDragSource({ row, col });
      setValidTargets(captures);
      validTargetsRef.current = captures;
    },
    [board, disabled]
  );

  const handleDragUpdate = useCallback(
    (fromRow, fromCol, translationX, translationY) => {
      const centerX = fromCol * SQUARE_SIZE + SQUARE_SIZE / 2 + translationX;
      const centerY = fromRow * SQUARE_SIZE + SQUARE_SIZE / 2 + translationY;
      const dropCol = Math.floor(centerX / SQUARE_SIZE);
      const dropRow = Math.floor(centerY / SQUARE_SIZE);

      if (dropRow >= 0 && dropRow < BOARD_SIZE && dropCol >= 0 && dropCol < BOARD_SIZE) {
        const isTarget = validTargetsRef.current.some(
          (t) => t.row === dropRow && t.col === dropCol
        );
        if (isTarget) {
          setDropTarget({ row: dropRow, col: dropCol });
          return;
        }
      }
      setDropTarget(null);
    },
    []
  );

  const handleDragEnd = useCallback(
    (fromRow, fromCol, toRow, toCol) => {
      if (toRow >= 0 && toRow < BOARD_SIZE && toCol >= 0 && toCol < BOARD_SIZE) {
        const isTarget = validTargetsRef.current.some(
          (t) => t.row === toRow && t.col === toCol
        );
        if (isTarget) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onMove(fromRow, fromCol, toRow, toCol);
          setDragSource(null);
          setValidTargets([]);
          setDropTarget(null);
          validTargetsRef.current = [];
          return { valid: true, toRow, toCol };
        }
      }
      // Invalid move - notify to bounce back (only if attempted a move to different square)
      if (toRow !== fromRow || toCol !== fromCol) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setDragSource(null);
      setValidTargets([]);
      setDropTarget(null);
      validTargetsRef.current = [];
      return { valid: false, toRow, toCol };
    },
    [onMove]
  );

  // Clear targets when board changes
  React.useEffect(() => {
    setDragSource(null);
    setValidTargets([]);
    setDropTarget(null);
    validTargetsRef.current = [];
  }, [board]);

  return (
    <View style={styles.boardContainer}>
      <RNAnimated.View style={{
        shadowColor: "#facc15",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.8] }),
        shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }),
      }}>
      <View style={styles.board}>
        {/* Square backgrounds */}
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isDragSrc =
              dragSource?.row === rowIndex && dragSource?.col === colIndex;
            const isDropTgt =
              dropTarget?.row === rowIndex && dropTarget?.col === colIndex;
            const isAnimTarget =
              animatingMove?.to.row === rowIndex &&
              animatingMove?.to.col === colIndex;
            const isAnimSource =
              animatingMove?.from.row === rowIndex &&
              animatingMove?.from.col === colIndex;

            // Match web: source=#e0d4a8, dropTarget=#d8c8a8, animTarget=#c4b5fd
            let bgColor;
            if (isAnimTarget) {
              bgColor = "#c4b5fd";
            } else if (isAnimSource) {
              bgColor = "#e0d4a8";
            } else if (isDropTgt) {
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

        {/* Draggable pieces layer with animated opacity */}
        <RNAnimated.View
          style={[styles.piecesLayer, { opacity: layerOpacity }]}
          pointerEvents="box-none"
        >
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              if (!piece) return null;
              const isAnimSource =
                animatingMove?.from.row === rowIndex &&
                animatingMove?.from.col === colIndex;
              const isAnimTarget =
                animatingMove?.to.row === rowIndex &&
                animatingMove?.to.col === colIndex;
              if (isAnimSource || isAnimTarget) return null;

              return (
                <DraggablePiece
                  key={`piece-${rowIndex}-${colIndex}`}
                  piece={piece}
                  row={rowIndex}
                  col={colIndex}
                  onDragStart={handleDragStart}
                  onDragUpdate={handleDragUpdate}
                  onDragEnd={handleDragEnd}
                  disabled={disabled}
                  celebrate={celebrate}
                />
              );
            })
          )}
        </RNAnimated.View>

        {/* Solution animation overlay */}
        {animatingMove &&
          board[animatingMove.from.row]?.[animatingMove.from.col] && (
            <AnimatingPiece
              key={`anim-${animatingMoveIndex || 0}-${animatingMove.from.row}-${animatingMove.from.col}-${animatingMove.to.row}-${animatingMove.to.col}`}
              piece={board[animatingMove.from.row]?.[animatingMove.from.col]}
              fromRow={animatingMove.from.row}
              fromCol={animatingMove.from.col}
              toRow={animatingMove.to.row}
              toCol={animatingMove.to.col}
            />
          )}
      </View>
      </RNAnimated.View>
    </View>
  );
}

function DraggablePiece({ piece, row, col, onDragStart, onDragUpdate, onDragEnd, disabled, celebrate }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIdx = useSharedValue(1);
  const shadowOpac = useSharedValue(0);
  const didDrop = useSharedValue(0);

  // Winning piece bounce (RNAnimated - not affected by Reduce Motion)
  const bounceScale = useRef(new RNAnimated.Value(1)).current;
  useEffect(() => {
    if (celebrate) {
      const timer = setTimeout(() => {
        RNAnimated.sequence([
          RNAnimated.timing(bounceScale, {
            toValue: 1.35,
            duration: 200,
            easing: RNEasing.out(RNEasing.quad),
            useNativeDriver: true,
          }),
          RNAnimated.spring(bounceScale, {
            toValue: 1,
            friction: 6,
            tension: 180,
            useNativeDriver: true,
          }),
        ]).start();
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [celebrate]);

  // Called on JS thread after drag ends - handles snap or bounce animation
  const handleDragResult = useCallback((result) => {
    if (result.valid) {
      didDrop.value = 1;
      const targetX = (result.toCol - col) * SQUARE_SIZE;
      const targetY = (result.toRow - row) * SQUARE_SIZE;
      translateX.value = targetX;
      translateY.value = targetY;
      scale.value = 1;
      zIdx.value = 1;
      shadowOpac.value = 0;
    } else {
      didDrop.value = 0;
      translateX.value = withSpring(0, { damping: 12, stiffness: 180 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 180 });
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      zIdx.value = 1;
      shadowOpac.value = withTiming(0, { duration: 150 });
    }
  }, [row, col]);

  // Wrapper called via runOnJS - calls onDragEnd and processes the result
  const handleDrop = useCallback((fromRow, fromCol, dropRow, dropCol) => {
    const result = onDragEnd(fromRow, fromCol, dropRow, dropCol);
    handleDragResult(result);
  }, [onDragEnd, handleDragResult]);

  const gesture = Gesture.Pan()
    .minDistance(2)
    .onStart(() => {
      didDrop.value = 0;
      zIdx.value = 100;
      scale.value = withSpring(1.15, { damping: 15, stiffness: 200 });
      shadowOpac.value = withTiming(0.3, { duration: 100 });
      runOnJS(onDragStart)(row, col);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      runOnJS(onDragUpdate)(row, col, event.translationX, event.translationY);
    })
    .onEnd((event) => {
      const centerX = col * SQUARE_SIZE + SQUARE_SIZE / 2 + event.translationX;
      const centerY = row * SQUARE_SIZE + SQUARE_SIZE / 2 + event.translationY;
      const dropCol = Math.floor(centerX / SQUARE_SIZE);
      const dropRow = Math.floor(centerY / SQUARE_SIZE);

      // Set flag before runOnJS to prevent onFinalize from springing back
      didDrop.value = 1;
      runOnJS(handleDrop)(row, col, dropRow, dropCol);
    })
    .onFinalize(() => {
      if (didDrop.value !== 1) {
        // Only runs if onEnd didn't fire (gesture cancelled)
        translateX.value = withSpring(0, { damping: 12, stiffness: 180 });
        translateY.value = withSpring(0, { damping: 12, stiffness: 180 });
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        zIdx.value = 1;
        shadowOpac.value = withTiming(0, { duration: 150 });
      }
    })
    .enabled(!disabled);

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
        <RNAnimated.View style={{ transform: [{ scale: bounceScale }] }}>
          <ChessPiece piece={piece} size={PIECE_SIZE} />
        </RNAnimated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function AnimatingPiece({ piece, fromRow, fromCol, toRow, toCol }) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    // Reset to 0 first to ensure clean animation start
    progress.value = 0;
    // Small delay to ensure the component is mounted before animating
    const timer = setTimeout(() => {
      progress.value = withTiming(1, {
        duration: 550,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }, 16);
    return () => clearTimeout(timer);
  }, [fromRow, fromCol, toRow, toCol]);

  const animatedStyle = useAnimatedStyle(() => {
    const startX = fromCol * SQUARE_SIZE + (SQUARE_SIZE - PIECE_SIZE) / 2;
    const startY = fromRow * SQUARE_SIZE + (SQUARE_SIZE - PIECE_SIZE) / 2;
    const endX = toCol * SQUARE_SIZE + (SQUARE_SIZE - PIECE_SIZE) / 2;
    const endY = toRow * SQUARE_SIZE + (SQUARE_SIZE - PIECE_SIZE) / 2;

    // Scale: 1 -> 1.12 at 20%, stay at 1.12 until 80%, back to 1 at 100%
    const scaleValue = interpolate(
      progress.value,
      [0, 0.2, 0.8, 1],
      [1, 1.12, 1.12, 1]
    );

    // Shadow opacity peaks in the middle of the animation
    const shadowOpacValue = interpolate(
      progress.value,
      [0, 0.3, 0.7, 1],
      [0.1, 0.5, 0.5, 0.1]
    );

    return {
      position: "absolute",
      left: startX + (endX - startX) * progress.value,
      top: startY + (endY - startY) * progress.value,
      width: PIECE_SIZE,
      height: PIECE_SIZE,
      zIndex: 10,
      transform: [{ scale: scaleValue }],
      shadowColor: "rgb(139, 92, 246)",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: shadowOpacValue,
      shadowRadius: 10,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <ChessPiece piece={piece} size={PIECE_SIZE} />
    </Animated.View>
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
  piecesLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: BOARD_WIDTH,
    height: BOARD_WIDTH,
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
});
