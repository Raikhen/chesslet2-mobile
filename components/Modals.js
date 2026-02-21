import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { COLORS, DIFFICULTY_COLORS } from "../lib/constants";

export function CongratsModal({ visible, onClose, onNextPuzzle, moveCount, solutionCount }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalCard}>
            <Text style={styles.celebrateEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.modalSubtitle}>
              Solved in {moveCount} move{moveCount !== 1 ? "s" : ""}
            </Text>
            {solutionCount > 1 && (
              <Text style={styles.solutionInfo}>
                This puzzle has {solutionCount} solution{solutionCount !== 1 ? "s" : ""}
              </Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
                <Text style={styles.btnSecondaryText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={onNextPuzzle}>
                <Text style={styles.btnPrimaryText}>Next Puzzle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export function LevelCompleteModal({ visible, onClose, onNextLevel, moveCount, solutionCount, levelNumber, isLastLevel }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalCard}>
            <Text style={styles.celebrateEmoji}>{isLastLevel ? "🏆" : "🎉"}</Text>
            <Text style={styles.modalTitle}>
              {isLastLevel ? "All Levels Complete!" : `Level ${levelNumber} Complete!`}
            </Text>
            <Text style={styles.modalSubtitle}>
              Solved in {moveCount} move{moveCount !== 1 ? "s" : ""}
            </Text>
            {solutionCount > 1 && (
              <Text style={styles.solutionInfo}>
                This puzzle has {solutionCount} solution{solutionCount !== 1 ? "s" : ""}
              </Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
                <Text style={styles.btnSecondaryText}>Close</Text>
              </TouchableOpacity>
              {!isLastLevel && (
                <TouchableOpacity style={styles.btnPrimary} onPress={onNextLevel}>
                  <Text style={styles.btnPrimaryText}>Next Level</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export function LevelSelectModal({ visible, onClose, levels, currentLevel, completedLevels, onSelectLevel }) {
  const screenWidth = Dimensions.get("window").width;
  const cols = 5;
  const cellSize = Math.floor((screenWidth - 80) / cols);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.levelSelectCard, { maxHeight: "80%" }]}>
          <View style={styles.levelSelectHeader}>
            <Text style={styles.levelSelectTitle}>Select Level</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Difficulty legend */}
          <View style={styles.legend}>
            {Object.entries(DIFFICULTY_COLORS).map(([key, colors]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.text }]} />
                <Text style={styles.legendLabel}>{key.replace(/-/g, " ")}</Text>
              </View>
            ))}
          </View>

          <ScrollView style={styles.levelGrid} showsVerticalScrollIndicator={false}>
            <View style={styles.gridContainer}>
              {levels.map((level) => {
                const isCompleted = completedLevels.has(level.level);
                const isCurrent = level.level === currentLevel;
                const diffColors = DIFFICULTY_COLORS[level.difficulty] || DIFFICULTY_COLORS.medium;

                return (
                  <TouchableOpacity
                    key={level.level}
                    style={[
                      styles.levelCell,
                      {
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: diffColors.bg,
                        borderColor: isCurrent ? COLORS.accent : "transparent",
                        borderWidth: isCurrent ? 2 : 0,
                      },
                    ]}
                    onPress={() => onSelectLevel(level.level)}
                  >
                    <Text style={[styles.levelCellText, { color: diffColors.text }]}>
                      {isCompleted ? "✓" : level.level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function InstructionsModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>How to Play</Text>
            <View style={styles.instructionsList}>
              <View style={styles.instructionRow}>
                <View style={styles.instructionBadge}>
                  <Text style={styles.instructionBadgeText}>1</Text>
                </View>
                <Text style={styles.instructionText}>
                  Every move must capture a piece
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <View style={styles.instructionBadge}>
                  <Text style={styles.instructionBadgeText}>2</Text>
                </View>
                <Text style={styles.instructionText}>
                  Pieces move like standard chess
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <View style={styles.instructionBadge}>
                  <Text style={styles.instructionBadgeText}>3</Text>
                </View>
                <Text style={styles.instructionText}>
                  Reduce the board to one piece to win
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={onClose}>
              <Text style={styles.btnPrimaryText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 28,
    width: Dimensions.get("window").width - 48,
    maxWidth: 380,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  celebrateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  solutionInfo: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  btnPrimary: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  btnSecondary: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnSecondaryText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  // Level Select
  levelSelectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    width: Dimensions.get("window").width - 32,
    maxWidth: 420,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  levelSelectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelSelectTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: "capitalize",
  },
  levelGrid: {
    maxHeight: 400,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "center",
  },
  levelCell: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
  },
  levelCellText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Instructions
  instructionsList: {
    width: "100%",
    gap: 16,
    marginVertical: 20,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  instructionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  instructionBadgeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
});
