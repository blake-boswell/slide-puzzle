import React, { Reducer, useEffect, useReducer, useState } from 'react';
import { PuzzleState, PuzzleAction, PuzzlePiece } from '../types/puzzle';

function puzzleReducer(state: PuzzleState, action: PuzzleAction) {
  const { type, id } = action;
  const { emptyLocation, pieces, rowSize, columnSize } = state;
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

const Puzzle = () => {
  const [focusedPiece, setFocusedPiece] = useState(-1);
  const [puzzle, dispatchMove] = useReducer<Reducer<PuzzleState, PuzzleAction>>(
    puzzleReducer,
    {
      rowSize: 3,
      columnSize: 3,
      pieces: [
        { id: 1, row: 0, column: 0 },
        { id: 2, row: 0, column: 1 },
        { id: 3, row: 0, column: 2 },
        { id: 4, row: 1, column: 0 },
        { id: 5, row: 1, column: 1 },
        { id: 6, row: 1, column: 2 },
        { id: 7, row: 2, column: 0 },
        { id: 8, row: 2, column: 1 },
        { id: 9, row: 2, column: 2 },
      ],
      emptyLocation: {
        row: 2,
        column: 2,
      },
    },
  );

  useEffect(() => {
    if (focusedPiece > -1) {
      const pieceToFocus = document.getElementById(
        `puzzle-piece-${focusedPiece}`,
      );
      if (pieceToFocus) {
        pieceToFocus.focus();
      }
    }
  }, [focusedPiece]);

  // Position absolute puzzle pieces

  const movePiece = (id: number, row: number, col: number) => {
    // Determine direction to move
    const { row: emptyRow, column: emptyCol } = puzzle.emptyLocation;
    if (emptyCol > col) {
      dispatchMove({ type: 'move-right', id });
    } else if (emptyCol < col) {
      dispatchMove({ type: 'move-left', id });
    } else if (emptyRow > row) {
      dispatchMove({ type: 'move-down', id });
    } else if (emptyRow < row) {
      dispatchMove({ type: 'move-up', id });
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    piece: PuzzlePiece,
  ) => {
    const { code } = e;
    let spacesAway = 1;
    switch (code) {
      case 'Space':
        movePiece(piece.id, piece.row, piece.column);
        break;
      case 'ArrowUp': {
        // Check if the empty space is above
        if (
          puzzle.emptyLocation.column === piece.column &&
          puzzle.emptyLocation.row === piece.row - 1
        ) {
          // Increment spaces away to skip over the empty space
          spacesAway = 2;
        }

        // Focus piece if one exists above
        const pieceAbove = puzzle.pieces.find(
          puzzlePiece =>
            puzzlePiece.row === piece.row - spacesAway &&
            puzzlePiece.column === piece.column,
        );
        if (pieceAbove) {
          setFocusedPiece(pieceAbove.id);
        }
        break;
      }
      case 'ArrowDown': {
        // Check if the empty space is below
        if (
          puzzle.emptyLocation.column === piece.column &&
          puzzle.emptyLocation.row === piece.row + 1
        ) {
          // Increment spaces away to skip over the empty space
          spacesAway = 2;
        }

        // Focus piece if one exists below
        const pieceBelow = puzzle.pieces.find(
          puzzlePiece =>
            puzzlePiece.row === piece.row + spacesAway &&
            puzzlePiece.column === piece.column,
        );
        if (pieceBelow) {
          setFocusedPiece(pieceBelow.id);
        }
        break;
      }
      case 'ArrowLeft': {
        // Check if the empty space is to the left
        if (
          puzzle.emptyLocation.column === piece.column - 1 &&
          puzzle.emptyLocation.row === piece.row
        ) {
          // Increment spaces away to skip over the empty space
          spacesAway = 2;
        }

        // Focus piece if one exists to the left
        const pieceToLeft = puzzle.pieces.find(
          puzzlePiece =>
            puzzlePiece.row === piece.row &&
            puzzlePiece.column === piece.column - spacesAway,
        );
        if (pieceToLeft) {
          setFocusedPiece(pieceToLeft.id);
        }
        break;
      }
      case 'ArrowRight': {
        // Check if the empty space is to the right
        if (
          puzzle.emptyLocation.column === piece.column + 1 &&
          puzzle.emptyLocation.row === piece.row
        ) {
          // Increment spaces away to skip over the empty space
          spacesAway = 2;
        }

        // Focus piece if one exists to the right
        const pieceToRight = puzzle.pieces.find(
          puzzlePiece =>
            puzzlePiece.row === piece.row &&
            puzzlePiece.column === piece.column + spacesAway,
        );
        if (pieceToRight) {
          setFocusedPiece(pieceToRight.id);
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <div className="puzzle">
      <div className="puzzle__control"></div>
      <div className="puzzle__board">
        {puzzle.pieces.map(piece =>
          piece.column === puzzle.emptyLocation.column &&
          piece.row === puzzle.emptyLocation.row ? null : (
            <div
              id={`puzzle-piece-${piece.id}`}
              className="puzzle-piece"
              key={piece.id}
              onClick={() => movePiece(piece.id, piece.row, piece.column)}
              onKeyDown={e => handleKeyDown(e, piece)}
              onFocus={() => setFocusedPiece(piece.id)}
              style={{
                position: 'absolute',
                transform: `translate3d(${piece.column * 100}%, ${piece.row *
                  100}%, 0)`,
                height: `${(1 / puzzle.columnSize) * 100}%`,
                width: `${(1 / puzzle.rowSize) * 100}%`,
              }}
              tabIndex={piece.row * puzzle.rowSize + piece.column + 1}
            >
              {piece.id}
            </div>
          ),
        )}
      </div>
    </div>
  );
};

export default Puzzle;
