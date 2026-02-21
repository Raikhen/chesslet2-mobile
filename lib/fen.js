import { BOARD_SIZE, PIECES, createEmptyBoard } from "./constants";

export function boardToFen(board) {
  const rows = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    let rowStr = "";
    let emptyCount = 0;
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece) {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        rowStr += piece;
      } else {
        emptyCount++;
      }
    }
    if (emptyCount > 0) rowStr += emptyCount;
    rows.push(rowStr || "4");
  }
  return rows.join("/");
}

export function fenToBoard(fen) {
  const normalizedFen = fen.replace(/-/g, "/");
  const rows = normalizedFen.split("/");
  if (rows.length !== BOARD_SIZE) {
    throw new Error(`Invalid FEN: expected ${BOARD_SIZE} rows, got ${rows.length}`);
  }
  const board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const boardRow = [];
    const rowStr = rows[row];
    for (const char of rowStr) {
      if (PIECES.includes(char)) {
        boardRow.push(char);
      } else if (/[1-4]/.test(char)) {
        const emptyCount = parseInt(char, 10);
        for (let i = 0; i < emptyCount; i++) {
          boardRow.push(null);
        }
      } else {
        throw new Error(`Invalid FEN character: ${char}`);
      }
    }
    if (boardRow.length !== BOARD_SIZE) {
      throw new Error(`Invalid FEN: row ${row} has ${boardRow.length} squares`);
    }
    board.push(boardRow);
  }
  return board;
}

export function fenToUrl(fen) {
  return fen.replace(/\//g, "-");
}

export function urlToFen(urlFen) {
  return urlFen.replace(/-/g, "/");
}

export function countPieces(board) {
  let count = 0;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col]) count++;
    }
  }
  return count;
}

export function getPiecePositions(board) {
  const positions = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col]) {
        positions.push({ row, col, piece: board[row][col] });
      }
    }
  }
  return positions;
}

export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

export function isValidFen(fen) {
  try {
    fenToBoard(fen);
    return true;
  } catch {
    return false;
  }
}

export { createEmptyBoard };
