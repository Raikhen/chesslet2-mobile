import { useState, useCallback, useEffect, useRef } from "react";
import { fenToBoard, boardToFen, cloneBoard, countPieces } from "./fen";
import { isValidCapture, executeCapture, isSolved, isStuck, getAllValidMoves } from "./engine";
import { isSolvable, getHint, solvePuzzle } from "./solver";
import { generatePuzzle, evaluatePuzzle, getStarterPuzzle, DIFFICULTY } from "./generator";

export const GAME_STATE = {
  PLAYING: "playing",
  WON: "won",
  STUCK: "stuck",
  IMPOSSIBLE: "impossible",
};

export function useGame(initialFen = null, defaultDifficulty = null) {
  const initialValues = (() => {
    if (initialFen) {
      try {
        const parsedBoard = fenToBoard(initialFen);
        const evaluation = evaluatePuzzle(parsedBoard);
        return {
          board: parsedBoard,
          initialBoard: cloneBoard(parsedBoard),
          puzzleInfo: evaluation,
          difficulty: evaluation.difficulty,
          gameState: evaluation.solvable ? GAME_STATE.PLAYING : GAME_STATE.IMPOSSIBLE,
        };
      } catch {
        return { board: null, initialBoard: null, puzzleInfo: null, difficulty: null, gameState: GAME_STATE.PLAYING };
      }
    }
    return { board: null, initialBoard: null, puzzleInfo: null, difficulty: null, gameState: GAME_STATE.PLAYING };
  })();

  const [board, setBoard] = useState(initialValues.board);
  const [initialBoard, setInitialBoard] = useState(initialValues.initialBoard);
  const [puzzleInfo, setPuzzleInfo] = useState(initialValues.puzzleInfo);
  const [difficulty, setDifficulty] = useState(initialValues.difficulty);
  const [gameState, setGameState] = useState(initialValues.gameState);
  const [moveHistory, setMoveHistory] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialFen && !initialized.current) {
      initialized.current = true;
      newPuzzle(defaultDifficulty);
    }
  }, []);

  const loadPuzzle = useCallback((fen) => {
    try {
      const newBoard = fenToBoard(fen);
      const evaluation = evaluatePuzzle(newBoard);
      setBoard(newBoard);
      setInitialBoard(cloneBoard(newBoard));
      setMoveHistory([]);
      setLastMove(null);
      setDifficulty(evaluation.difficulty);
      setPuzzleInfo(evaluation);
      setGameState(evaluation.solvable ? GAME_STATE.PLAYING : GAME_STATE.IMPOSSIBLE);
    } catch (err) {
      console.error("Failed to load puzzle:", err);
      newPuzzle();
    }
  }, []);

  useEffect(() => {
    if (initialFen) {
      loadPuzzle(initialFen);
    }
  }, [initialFen, loadPuzzle]);

  const newPuzzle = useCallback((targetDifficulty = null) => {
    let puzzle = generatePuzzle({
      difficulty: targetDifficulty,
      minPieces: 3,
      maxPieces: 6,
      maxAttempts: 50,
    });

    if (!puzzle) {
      const starter = getStarterPuzzle(targetDifficulty);
      puzzle = {
        fen: starter.fen,
        board: fenToBoard(starter.fen),
        difficulty: starter.difficulty,
        ...evaluatePuzzle(fenToBoard(starter.fen)),
      };
    } else {
      puzzle.solvable = true;
    }

    setBoard(puzzle.board);
    setInitialBoard(cloneBoard(puzzle.board));
    setMoveHistory([]);
    setLastMove(null);
    setDifficulty(puzzle.difficulty);
    setPuzzleInfo(puzzle);
    setGameState(GAME_STATE.PLAYING);
    return puzzle.fen;
  }, []);

  const makeMove = useCallback(
    (fromRow, fromCol, toRow, toCol) => {
      if (gameState !== GAME_STATE.PLAYING) return false;
      if (!isValidCapture(board, fromRow, fromCol, toRow, toCol)) return false;

      const newBoard = executeCapture(board, fromRow, fromCol, toRow, toCol);
      const move = {
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        capturedPiece: board[toRow][toCol],
        movingPiece: board[fromRow][fromCol],
      };

      setBoard(newBoard);
      setMoveHistory((prev) => [...prev, move]);
      setLastMove(move);

      if (isSolved(newBoard)) {
        setGameState(GAME_STATE.WON);
      } else if (isStuck(newBoard)) {
        setGameState(GAME_STATE.STUCK);
      }

      return true;
    },
    [board, gameState]
  );

  const undoMove = useCallback(() => {
    if (moveHistory.length === 0) return false;
    const newHistory = [...moveHistory];
    newHistory.pop();

    let currentBoard = cloneBoard(initialBoard);
    for (const move of newHistory) {
      currentBoard = executeCapture(currentBoard, move.from.row, move.from.col, move.to.row, move.to.col);
    }

    setBoard(currentBoard);
    setMoveHistory(newHistory);
    setLastMove(newHistory.length > 0 ? newHistory[newHistory.length - 1] : null);
    setGameState(GAME_STATE.PLAYING);
    return true;
  }, [moveHistory, initialBoard]);

  const resetPuzzle = useCallback(() => {
    if (!initialBoard) return;
    setBoard(cloneBoard(initialBoard));
    setMoveHistory([]);
    setLastMove(null);
    setGameState(puzzleInfo?.solvable ? GAME_STATE.PLAYING : GAME_STATE.IMPOSSIBLE);
  }, [initialBoard, puzzleInfo]);

  const requestHint = useCallback(() => {
    if (gameState !== GAME_STATE.PLAYING) return null;
    return getHint(board);
  }, [board, gameState]);

  const getSolution = useCallback(() => {
    if (!initialBoard) return null;
    const result = solvePuzzle(initialBoard, { findAll: false, maxSolutions: 1 });
    if (result.solvable && result.solutions.length > 0) {
      return result.solutions[0];
    }
    return null;
  }, [initialBoard]);

  const getCurrentFen = useCallback(() => {
    return board ? boardToFen(board) : null;
  }, [board]);

  const getValidMovesCount = useCallback(() => {
    if (!board) return 0;
    return getAllValidMoves(board).length;
  }, [board]);

  return {
    board,
    gameState,
    moveHistory,
    lastMove,
    difficulty,
    puzzleInfo,
    piecesRemaining: board ? countPieces(board) : 0,
    validMovesCount: getValidMovesCount(),
    makeMove,
    undoMove,
    resetPuzzle,
    newPuzzle,
    loadPuzzle,
    requestHint,
    getSolution,
    getCurrentFen,
    GAME_STATE,
    DIFFICULTY,
  };
}
