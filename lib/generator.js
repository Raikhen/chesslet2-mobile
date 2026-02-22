import { createEmptyBoard, boardToFen, countPieces } from "./fen";
import { isSolvable, getPuzzleMetrics } from "./solver";
import { PIECES, BOARD_SIZE } from "./constants";

export const DIFFICULTY = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
};

function generateRandomBoard(pieceCount) {
  const board = createEmptyBoard();
  const positions = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      positions.push({ row, col });
    }
  }
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  for (let i = 0; i < Math.min(pieceCount, positions.length); i++) {
    const { row, col } = positions[i];
    const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
    board[row][col] = piece;
  }
  return board;
}

function calculateDifficultyScore(metrics) {
  if (!metrics.solvable) return -1;
  return metrics.weightedDifficulty;
}

export function getDifficultyLevel(score) {
  if (score < 30) return DIFFICULTY.EASY;
  if (score < 60) return DIFFICULTY.MEDIUM;
  return DIFFICULTY.HARD;
}

export function generatePuzzle(options = {}) {
  const { minPieces = 2, maxPieces = 8, difficulty = null, maxAttempts = 100, fast = false } = options;

  let bestPuzzle = null;
  let bestScoreDiff = Infinity;

  const targetRanges = {
    [DIFFICULTY.EASY]: { min: 0, max: 29, target: 15 },
    [DIFFICULTY.MEDIUM]: { min: 30, max: 59, target: 45 },
    [DIFFICULTY.HARD]: { min: 60, max: 100, target: 80 },
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pieceCount = Math.floor(Math.random() * (maxPieces - minPieces + 1)) + minPieces;
    const board = generateRandomBoard(pieceCount);
    if (!isSolvable(board)) continue;

    const metrics = getPuzzleMetrics(board, { fast });
    const score = calculateDifficultyScore(metrics);
    const level = getDifficultyLevel(score);

    const puzzle = { board, fen: boardToFen(board), difficulty: level, score, metrics };

    if (!difficulty) return puzzle;

    const range = targetRanges[difficulty];
    if (score >= range.min && score <= range.max) {
      if (fast) return puzzle;
      const scoreDiff = Math.abs(score - range.target);
      if (scoreDiff < bestScoreDiff) {
        bestScoreDiff = scoreDiff;
        bestPuzzle = puzzle;
      }
    }

    if (bestScoreDiff === 0) break;
  }

  return bestPuzzle;
}

export function evaluatePuzzle(board) {
  const metrics = getPuzzleMetrics(board);
  const score = calculateDifficultyScore(metrics);
  return {
    difficulty: metrics.solvable ? getDifficultyLevel(score) : null,
    score: metrics.solvable ? score : -1,
    metrics,
    solvable: metrics.solvable,
  };
}

export const STARTER_PUZZLES = [
  { fen: "K3/4/4/3Q", difficulty: DIFFICULTY.EASY },
  { fen: "R3/4/4/R3", difficulty: DIFFICULTY.EASY },
  { fen: "N3/4/1N2/4", difficulty: DIFFICULTY.EASY },
  { fen: "Q3/4/4/3P", difficulty: DIFFICULTY.EASY },
  { fen: "RB2/4/4/2QK", difficulty: DIFFICULTY.MEDIUM },
  { fen: "N2B/4/K3/3R", difficulty: DIFFICULTY.MEDIUM },
  { fen: "Q3/2N1/4/B2K", difficulty: DIFFICULTY.MEDIUM },
  { fen: "K2R/4/2B1/N3", difficulty: DIFFICULTY.MEDIUM },
  { fen: "QRNB/4/4/PPKP", difficulty: DIFFICULTY.HARD },
  { fen: "K2Q/NB2/2R1/P2P", difficulty: DIFFICULTY.HARD },
  { fen: "RNB1/P3/2Q1/K2P", difficulty: DIFFICULTY.HARD },
  { fen: "QKRB/P3/2N1/3P", difficulty: DIFFICULTY.HARD },
];

export function getStarterPuzzle(difficulty = null) {
  let filtered = STARTER_PUZZLES;
  if (difficulty) {
    filtered = STARTER_PUZZLES.filter((p) => p.difficulty === difficulty);
  }
  return filtered[Math.floor(Math.random() * filtered.length)];
}
