import React, {
  Reducer,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { PuzzleState, PuzzleAction, PuzzlePiece } from '../types/puzzle';
import { scramble } from '../util/puzzleUtils';
import { puzzleReducer } from './reducers/puzzleReducer';

const Puzzle = () => {
  const [focusedPiece, setFocusedPiece] = useState(-1);
  const [puzzle, dispatchMove] = useReducer<Reducer<PuzzleState, PuzzleAction>>(
    puzzleReducer,
    scramble(3, 3),
  );

  const isPuzzleComplete = useMemo(() => {
    for (let i = 0; i < puzzle.pieces.length - 1; i++) {
      const thisPiece = puzzle.pieces[i];
      const nextPiece = puzzle.pieces[i + 1];
      if (thisPiece.row > nextPiece.row) {
        return false;
      } else if (
        thisPiece.row === nextPiece.row &&
        thisPiece.column > nextPiece.column
      ) {
        return false;
      }
    }

    return true;
  }, [puzzle.pieces]);

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
      <div>Puzzle status: {isPuzzleComplete ? 'Done' : 'In progress'}</div>
    </div>
  );
};

export default Puzzle;
