export const BOARD_SIZE = 4;
export const PIECES = ["K", "Q", "R", "B", "N", "P"];

export function createEmptyBoard() {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));
}

export const DIFFICULTY_COLORS = {
  "very-easy": { bg: "#dcfce7", text: "#15803d" },
  easy: { bg: "#ccfbf1", text: "#0d9488" },
  medium: { bg: "#fef3c7", text: "#b45309" },
  hard: { bg: "#fee2e2", text: "#dc2626" },
  "very-hard": { bg: "#ede9fe", text: "#7c3aed" },
};

export const COLORS = {
  background: "#f5f3ef",
  surface: "#ffffff",
  surfaceLight: "#f5f3ef",
  surfaceLighter: "#e8e4dc",
  accent: "#d4a012",
  accentLight: "#facc15",
  accentDark: "#b8860b",
  text: "#3d3a36",
  textSecondary: "#5c564e",
  textMuted: "#9a9080",
  boardLight: "#f0d9b5",
  boardDark: "#b58863",
  selected: "#baca44",
  validTarget: "rgba(130, 151, 105, 0.5)",
  dropTarget: "rgba(186, 202, 68, 0.6)",
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f97316",
  border: "#e8e4dc",
};
