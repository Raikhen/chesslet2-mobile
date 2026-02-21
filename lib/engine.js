import { BOARD_SIZE } from "./constants";

function isInBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function hasPiece(board, row, col) {
  return isInBounds(row, col) && board[row][col] !== null;
}

function getKingCaptures(board, row, col) {
  const captures = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];
  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    if (hasPiece(board, newRow, newCol)) {
      captures.push({ row: newRow, col: newCol });
    }
  }
  return captures;
}

function getRookCaptures(board, row, col) {
  const captures = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dRow, dCol] of directions) {
    for (let dist = 1; dist < BOARD_SIZE; dist++) {
      const newRow = row + dRow * dist;
      const newCol = col + dCol * dist;
      if (!isInBounds(newRow, newCol)) break;
      if (board[newRow][newCol] !== null) {
        captures.push({ row: newRow, col: newCol });
        break;
      }
    }
  }
  return captures;
}

function getBishopCaptures(board, row, col) {
  const captures = [];
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  for (const [dRow, dCol] of directions) {
    for (let dist = 1; dist < BOARD_SIZE; dist++) {
      const newRow = row + dRow * dist;
      const newCol = col + dCol * dist;
      if (!isInBounds(newRow, newCol)) break;
      if (board[newRow][newCol] !== null) {
        captures.push({ row: newRow, col: newCol });
        break;
      }
    }
  }
  return captures;
}

function getQueenCaptures(board, row, col) {
  return [...getRookCaptures(board, row, col), ...getBishopCaptures(board, row, col)];
}

function getKnightCaptures(board, row, col) {
  const captures = [];
  const moves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dRow, dCol] of moves) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    if (hasPiece(board, newRow, newCol)) {
      captures.push({ row: newRow, col: newCol });
    }
  }
  return captures;
}

function getPawnCaptures(board, row, col) {
  const captures = [];
  const captureSquares = [
    [row - 1, col - 1],
    [row - 1, col + 1],
  ];
  for (const [newRow, newCol] of captureSquares) {
    if (hasPiece(board, newRow, newCol)) {
      captures.push({ row: newRow, col: newCol });
    }
  }
  return captures;
}

export function getValidCaptures(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  switch (piece) {
    case "K": return getKingCaptures(board, row, col);
    case "Q": return getQueenCaptures(board, row, col);
    case "R": return getRookCaptures(board, row, col);
    case "B": return getBishopCaptures(board, row, col);
    case "N": return getKnightCaptures(board, row, col);
    case "P": return getPawnCaptures(board, row, col);
    default: return [];
  }
}

export function isValidCapture(board, fromRow, fromCol, toRow, toCol) {
  const captures = getValidCaptures(board, fromRow, fromCol);
  return captures.some((c) => c.row === toRow && c.col === toCol);
}

export function executeCapture(board, fromRow, fromCol, toRow, toCol) {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[fromRow][fromCol];
  newBoard[fromRow][fromCol] = null;
  newBoard[toRow][toCol] = piece;
  return newBoard;
}

export function getAllValidMoves(board) {
  const moves = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece) {
        const captures = getValidCaptures(board, row, col);
        for (const capture of captures) {
          moves.push({ from: { row, col }, to: capture, piece });
        }
      }
    }
  }
  return moves;
}

export function isSolved(board) {
  let pieceCount = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col]) pieceCount++;
    }
  }
  return pieceCount === 1;
}

export function isStuck(board) {
  const moves = getAllValidMoves(board);
  const pieceCount = board.flat().filter((p) => p !== null).length;
  return moves.length === 0 && pieceCount > 1;
}
