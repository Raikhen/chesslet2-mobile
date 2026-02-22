import { getAllValidMoves, executeCapture, isSolved } from "./engine";
import { cloneBoard, countPieces } from "./fen";

export function solvePuzzle(board, options = {}) {
  const { findAll = false, maxSolutions = 100 } = options;
  const solutions = [];
  let deadEnds = 0;
  let totalBranches = 0;

  function solve(currentBoard, moves) {
    if (solutions.length >= maxSolutions) return;
    if (isSolved(currentBoard)) {
      solutions.push([...moves]);
      return;
    }
    const validMoves = getAllValidMoves(currentBoard);
    totalBranches += validMoves.length;
    if (validMoves.length === 0) {
      deadEnds++;
      return;
    }
    for (const move of validMoves) {
      if (!findAll && solutions.length > 0) return;
      const newBoard = executeCapture(currentBoard, move.from.row, move.from.col, move.to.row, move.to.col);
      solve(newBoard, [...moves, { from: move.from, to: move.to }]);
    }
  }

  solve(cloneBoard(board), []);

  return {
    solvable: solutions.length > 0,
    solutions,
    minMoves: solutions.length > 0 ? Math.min(...solutions.map((s) => s.length)) : 0,
    maxMoves: solutions.length > 0 ? Math.max(...solutions.map((s) => s.length)) : 0,
    solutionCount: solutions.length,
    deadEnds,
    totalBranches,
  };
}

export function isSolvable(board) {
  const result = solvePuzzle(board, { findAll: false, maxSolutions: 1 });
  return result.solvable;
}

export function getHint(board) {
  const result = solvePuzzle(board, { findAll: false, maxSolutions: 1 });
  if (result.solvable && result.solutions[0].length > 0) {
    return result.solutions[0][0];
  }
  return null;
}

export function moveKeepsSolvable(board, fromRow, fromCol, toRow, toCol) {
  const newBoard = executeCapture(board, fromRow, fromCol, toRow, toCol);
  if (isSolved(newBoard)) return true;
  return isSolvable(newBoard);
}

export function analyzeMoves(board) {
  const allMoves = getAllValidMoves(board);
  const winning = [];
  const losing = [];
  for (const move of allMoves) {
    const newBoard = executeCapture(board, move.from.row, move.from.col, move.to.row, move.to.col);
    if (isSolved(newBoard) || isSolvable(newBoard)) {
      winning.push(move);
    } else {
      losing.push(move);
    }
  }
  return { winning, losing };
}

const PIECE_CHANGE_DECAY = 0.2;

export function calculateWeightedDifficulty(board, { maxPaths = 5000 } = {}) {
  const allPaths = [];
  let limitReached = false;

  function explorePaths(currentBoard, path, lastCapturingPiece, pieceChanges) {
    if (limitReached) return;
    if (isSolved(currentBoard)) {
      allPaths.push({ path: [...path], pieceChanges, isSolution: true, length: path.length });
      if (allPaths.length >= maxPaths) limitReached = true;
      return;
    }
    const validMoves = getAllValidMoves(currentBoard);
    if (validMoves.length === 0) {
      allPaths.push({ path: [...path], pieceChanges, isSolution: false, length: path.length });
      if (allPaths.length >= maxPaths) limitReached = true;
      return;
    }
    for (const move of validMoves) {
      if (limitReached) return;
      const capturingPiece = currentBoard[move.from.row][move.from.col];
      const newPieceChanges =
        lastCapturingPiece !== null && capturingPiece !== lastCapturingPiece
          ? pieceChanges + 1
          : pieceChanges;
      const newBoard = executeCapture(currentBoard, move.from.row, move.from.col, move.to.row, move.to.col);
      explorePaths(newBoard, [...path, { piece: capturingPiece, from: move.from, to: move.to }], capturingPiece, newPieceChanges);
    }
  }

  explorePaths(cloneBoard(board), [], null, 0);

  let totalWeightedPaths = 0;
  let totalWeightedSolutions = 0;
  let totalPaths = allPaths.length;
  let totalSolutions = 0;
  let minPieceChangesForSolution = Infinity;
  let maxPieceChangesForSolution = 0;

  for (const pathInfo of allPaths) {
    const weight = Math.pow(PIECE_CHANGE_DECAY, pathInfo.pieceChanges);
    totalWeightedPaths += weight;
    if (pathInfo.isSolution) {
      totalWeightedSolutions += weight;
      totalSolutions++;
      minPieceChangesForSolution = Math.min(minPieceChangesForSolution, pathInfo.pieceChanges);
      maxPieceChangesForSolution = Math.max(maxPieceChangesForSolution, pathInfo.pieceChanges);
    }
  }

  const weightedSolutionRatio = totalWeightedPaths > 0 ? totalWeightedSolutions / totalWeightedPaths : 0;
  const rawSolutionRatio = totalPaths > 0 ? totalSolutions / totalPaths : 0;
  const weightedDifficulty = Math.round((1 - weightedSolutionRatio) * 100);

  return {
    weightedDifficulty,
    weightedSolutionRatio,
    rawSolutionRatio,
    totalPaths,
    totalSolutions,
    totalWeightedPaths,
    totalWeightedSolutions,
    minPieceChangesForSolution: totalSolutions > 0 ? minPieceChangesForSolution : null,
    maxPieceChangesForSolution: totalSolutions > 0 ? maxPieceChangesForSolution : null,
  };
}

export function getPuzzleMetrics(board, { fast = false } = {}) {
  const pieceCount = countPieces(board);
  const maxSolutions = fast ? 100 : 1000;
  const result = solvePuzzle(board, { findAll: true, maxSolutions });
  const initialMoves = getAllValidMoves(board);

  let goodFirstMoves = 0;
  let badFirstMoves = 0;
  if (!fast) {
    for (const move of initialMoves) {
      if (moveKeepsSolvable(board, move.from.row, move.from.col, move.to.row, move.to.col)) {
        goodFirstMoves++;
      } else {
        badFirstMoves++;
      }
    }
  }

  const maxPaths = fast ? 2000 : 5000;
  const difficultyMetrics = calculateWeightedDifficulty(board, { maxPaths });

  return {
    pieceCount,
    solvable: result.solvable,
    solutionCount: result.solutionCount,
    minMoves: result.minMoves,
    maxMoves: result.maxMoves,
    deadEnds: result.deadEnds,
    totalBranches: result.totalBranches,
    initialMoveCount: initialMoves.length,
    goodFirstMoves,
    badFirstMoves,
    trapRatio: initialMoves.length > 0 ? badFirstMoves / initialMoves.length : 0,
    ...difficultyMetrics,
  };
}
