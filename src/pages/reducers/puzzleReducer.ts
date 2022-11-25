import { PuzzleAction, PuzzleState } from '../../types/puzzle';
import { scramble } from '../../util/puzzleUtils';

export function puzzleReducer(state: PuzzleState, action: PuzzleAction) {
  const { type, id } = action;
  const { emptyLocation, pieces, rowSize, columnSize } = state;
  // Check for control changes
  if (type === 'reset') {
    const newPuzzle = scramble(rowSize, columnSize);
    return newPuzzle;
  } else if (type === 'resize') {
    const { rowSize: row, colSize: col } = action.size;
    const newPuzzle = scramble(row, col);
    return newPuzzle;
  }

  const { row: emptyRow, column: emptyCol } = emptyLocation;
  const rowMin = 0;
  const rowMax = rowSize - 1;
  const colMin = 0;
  const colMax = columnSize - 1;
  const targetPieceIndex = pieces.findIndex(piece => piece.id === id);
  if (targetPieceIndex > -1) {
    const { row, column } = pieces[targetPieceIndex];

    switch (type) {
      case 'move-up': {
        // Check to see if move is legal
        if (row === rowMin) return state;
        if (!(row - 1 === emptyRow && column === emptyCol)) return state;

        // Legal move
        const newPieces = pieces.map(piece => {
          if (piece.id === id) {
            // Update row
            return {
              ...piece,
              row: piece.row - 1,
            };
          } else if (piece.row === emptyRow && piece.column === emptyCol) {
            // Update empty position row
            return {
              ...piece,
              row: piece.row + 1,
            };
          }

          return piece;
        });

        return {
          ...state,
          pieces: newPieces,
          emptyLocation: {
            row: emptyLocation.row + 1,
            column: emptyLocation.column,
          },
        };
      }
      case 'move-down': {
        // Check to see if move is legal
        if (row === rowMax) return state;
        if (!(row + 1 === emptyRow && column === emptyCol)) return state;

        // Legal move
        const newPieces = pieces.map(piece => {
          if (piece.id === id) {
            // Update row
            return {
              ...piece,
              row: piece.row + 1,
            };
          } else if (piece.row === emptyRow && piece.column === emptyCol) {
            // Update empty position row
            return {
              ...piece,
              row: piece.row - 1,
            };
          }

          return piece;
        });

        return {
          ...state,
          pieces: newPieces,
          emptyLocation: {
            row: emptyLocation.row - 1,
            column: emptyLocation.column,
          },
        };
      }
      case 'move-left': {
        // Check to see if move is legal
        if (column === colMin) return state;
        if (!(row === emptyRow && column - 1 === emptyCol)) return state;

        // Legal move
        const newPieces = pieces.map(piece => {
          if (piece.id === id) {
            // Update column
            return {
              ...piece,
              column: piece.column - 1,
            };
          } else if (piece.row === emptyRow && piece.column === emptyCol) {
            // Update empty position column
            return {
              ...piece,
              column: piece.column + 1,
            };
          }

          return piece;
        });

        return {
          ...state,
          pieces: newPieces,
          emptyLocation: {
            row: emptyLocation.row,
            column: emptyLocation.column + 1,
          },
        };
      }
      case 'move-right': {
        // Check to see if move is legal
        if (column === colMax) return state;
        if (!(row === emptyRow && column + 1 === emptyCol)) return state;

        // Legal move
        const newPieces = pieces.map(piece => {
          if (piece.id === id) {
            // Update column
            return {
              ...piece,
              column: piece.column + 1,
            };
          } else if (piece.row === emptyRow && piece.column === emptyCol) {
            // Update empty position column
            return {
              ...piece,
              column: piece.column - 1,
            };
          }
          return piece;
        });

        return {
          ...state,
          pieces: newPieces,
          emptyLocation: {
            row: emptyLocation.row,
            column: emptyLocation.column - 1,
          },
        };
      }
      default:
        return state;
    }
  }

  return state;
}
