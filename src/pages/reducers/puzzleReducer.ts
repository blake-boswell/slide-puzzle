import { PuzzleAction, PuzzleState } from '../../types/puzzle';
import { scramble } from '../../util/puzzleUtils';

export function puzzleReducer(state: PuzzleState, action: PuzzleAction) {
  const { type } = action;
  let id = -1;
  if ('id' in action) {
    id = action.id;
  }

  const { emptyLocation, pieces, rowSize, columnSize } = state;
  // Check for control changes
  if (type === 'reset') {
    const newPuzzle = scramble(rowSize, columnSize);
    return newPuzzle;
  } else if (type === 'resize') {
    const { rowSize: row, colSize: col } = action.size;
    const newPuzzle = scramble(row, col);
    return newPuzzle;
  } else if (type === 'auto-complete') {
    return {
      ...state,
      pieces: pieces.map(piece => {
        // Set row
        const row = Math.floor((piece.id - 1) / rowSize);
        const column = (piece.id - 1) % rowSize;
        return {
          id: piece.id,
          row,
          column,
        };
      }),
      emptyLocation: {
        row: rowSize - 1,
        column: columnSize - 1,
      },
    };
  }

  const { row: emptyRow, column: emptyCol } = emptyLocation;
  const rowMin = 0;
  const rowMax = columnSize - 1;
  const colMin = 0;
  const colMax = rowSize - 1;
  const targetPieceIndex = pieces.findIndex(piece => piece.id === id);
  if (targetPieceIndex > -1) {
    let { row, column } = pieces[targetPieceIndex];
    let moveType = type;

    if (row === emptyRow && column === emptyCol) {
      // We are trying to move the empty piece.
      // Move the piece next to it in the direction we were trying to move.
      switch (type) {
        case 'move-up':
          row -= 1;
          moveType = 'move-down';
          break;
        case 'move-down':
          row += 1;
          moveType = 'move-up';
          break;
        case 'move-left':
          column -= 1;
          moveType = 'move-right';
          break;
        case 'move-right':
          column += 1;
          moveType = 'move-left';
          break;
      }
    }

    if (row < rowMin || row > rowMax || column < colMin || column > colMax) {
      console.error('Tried to move a piece that was out of bounds. ', {
        row,
        column,
      });
      return state;
    }

    switch (moveType) {
      case 'move-up': {
        // Check to see if move is legal
        if (row === rowMin) return state;
        if (!(row > emptyRow && column === emptyCol)) return state;

        // Legal move
        const newPieces = pieces.map(piece => {
          if (
            piece.row > emptyRow &&
            piece.column === emptyCol &&
            piece.row <= row &&
            piece.column === column
          ) {
            // This piece is the selected piece, or any piece in between the selected piece and the empty space
            // Move up one
            return {
              ...piece,
              row: piece.row - 1,
            };
          } else if (piece.row === emptyRow && piece.column === emptyCol) {
            // Update empty position row. Swap row with the selected piece
            return {
              ...piece,
              row,
            };
          }

          return piece;
        });

        return {
          ...state,
          pieces: newPieces,
          emptyLocation: {
            row,
            column: emptyLocation.column,
          },
        };
      }
      case 'move-down': {
        // Check to see if move is legal
        if (row === rowMax) return state;
        if (!(row < emptyRow && column === emptyCol)) return state;

        // Legal move
        const newPieces = pieces.map(piece => {
          if (
            piece.row < emptyRow &&
            piece.column === emptyCol &&
            piece.row >= row &&
            piece.column === column
          ) {
            // This piece is the selected piece, or any piece in between the selected piece and the empty space
            // Update row
            return {
              ...piece,
              row: piece.row + 1,
            };
          } else if (piece.row === emptyRow && piece.column === emptyCol) {
            // Update empty position row. Swap row with the selected piece
            return {
              ...piece,
              row,
            };
          }

          return piece;
        });

        return {
          ...state,
          pieces: newPieces,
          emptyLocation: {
            row,
            column: emptyLocation.column,
          },
        };
      }
      case 'move-left': {
        // Check to see if move is legal
        if (column === colMin) return state;
        if (!(row === emptyRow && column > emptyCol)) return state;

        // Legal move
        const newPieces = pieces.map(piece => {
          if (
            piece.column > emptyCol &&
            piece.row === emptyRow &&
            piece.column <= column &&
            piece.row === row
          ) {
            // This piece is the selected piece, or any piece in between the selected piece and the empty space
            // Update column
            return {
              ...piece,
              column: piece.column - 1,
            };
          } else if (piece.row === emptyRow && piece.column === emptyCol) {
            // Update empty position column. Swap column with the selected piece
            return {
              ...piece,
              column,
            };
          }

          return piece;
        });

        return {
          ...state,
          pieces: newPieces,
          emptyLocation: {
            row: emptyLocation.row,
            column,
          },
        };
      }
      case 'move-right': {
        // Check to see if move is legal
        if (column === colMax) return state;
        if (!(row === emptyRow && column < emptyCol)) return state;

        // Legal move
        const newPieces = pieces.map(piece => {
          if (
            piece.column < emptyCol &&
            piece.row === emptyRow &&
            piece.column >= column &&
            piece.row === row
          ) {
            // This piece is the selected piece, or any piece in between the selected piece and the empty space
            // Update column
            return {
              ...piece,
              column: piece.column + 1,
            };
          } else if (piece.row === emptyRow && piece.column === emptyCol) {
            // Update empty position column
            return {
              ...piece,
              column,
            };
          }
          return piece;
        });

        return {
          ...state,
          pieces: newPieces,
          emptyLocation: {
            row: emptyLocation.row,
            column,
          },
        };
      }
      default:
        return state;
    }
  }

  return state;
}
