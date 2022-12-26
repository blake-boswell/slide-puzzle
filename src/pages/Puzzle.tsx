import React, {
  Reducer,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import PuzzlePiece from '../components/PuzzlePiece';
import {
  PuzzleState,
  PuzzleAction,
  PuzzlePiece as PuzzlePieceType,
} from '../types/puzzle';
import { solvePiece } from '../util/puzzleUtils';
import { wait } from '../util/timingUtils';
import { puzzleReducer } from './reducers/puzzleReducer';

const Puzzle = () => {
  const [rowSize, setRowSize] = useState(3);
  const [colSize, setColSize] = useState(3);
  const [puzzle, dispatchMove] = useReducer<Reducer<PuzzleState, PuzzleAction>>(
    puzzleReducer,
    {
      rowSize,
      columnSize: colSize,
      pieces: [
        { id: 1, row: 0, column: 0 },
        { id: 2, row: 0, column: 1 },
        { id: 3, row: 0, column: 2 },
        { id: 4, row: 1, column: 0 },
        { id: 5, row: 1, column: 1 },
        { id: 6, row: 1, column: 2 },
        { id: 7, row: 2, column: 0 },
        { id: 8, row: 2, column: 1 },
        { id: 9, row: 2, column: 1 },
      ],
      emptyLocation: {
        row: 2,
        column: 2,
      },
    },
  );
  const [focusedPiece, setFocusedPiece] = useState(-1);
  const [imageSource, setImageSource] = useState('');
  const [imageHeight, setImageHeight] = useState(0);
  const [imageWidth, setImageWidth] = useState(0);
  const puzzleRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dispatchMove({ type: 'resize', size: { rowSize, colSize } });
  }, [rowSize, colSize]);

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
    piece: PuzzlePieceType,
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

  const handleSizeChange: React.ChangeEventHandler<HTMLSelectElement> = e => {
    const matrixSize = e.target.value;
    const [row, col] = matrixSize.split('x');
    const newRowSize = Number.parseInt(row);
    const newColSize = Number.parseInt(col);
    setRowSize(newRowSize);
    setColSize(newColSize);
  };

  const handleImageLoad: React.ChangeEventHandler<HTMLInputElement> = e => {
    const { files } = e.target;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        continue;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const { result } = e.target;
        if (typeof result === 'string') {
          // Resize the image
          const image = new Image();
          image.onload = e => {
            let puzzleWidth;
            if (puzzleRef.current) {
              puzzleWidth = puzzleRef.current.offsetWidth;
            }

            const canvas = document.createElement('canvas');
            const max_size = puzzleWidth;
            let width = image.width;
            let height = image.height;

            // Resize to fit the puzzle
            if (width > height) {
              if (width > max_size) {
                height *= max_size / width;
                width = max_size;
              }
            } else {
              if (height > max_size) {
                width *= max_size / height;
                height = max_size;
              }
            }
            canvas.width = width;
            canvas.height = height;
            console.log(width, height);

            // Draw image on canvas
            canvas.getContext('2d').drawImage(image, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg');

            setImageHeight(height);
            setImageWidth(width);
            setImageSource(dataUrl);
          };
          image.src = result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const showModal = () => {
    if (typeof modalRef.current.showModal === 'function') {
      modalRef.current.showModal();
    }
  };

  const hideModal = () => {
    if (typeof modalRef.current.close === 'function') {
      modalRef.current.close();
    }
  };

  const handleSolve = async () => {
    async function movesWithDelay(moves: PuzzleAction[], delay: number) {
      if (moves.length < 1) return Promise.resolve();

      for (let moveIndex = 0; moveIndex < moves.length; moveIndex++) {
        dispatchMove(moves[moveIndex]);
        await wait(delay);
      }
      return Promise.resolve();
    }
    // Solve for row one (except last slot)
    const { rowSize } = puzzle;
    let puzzleState: PuzzleState = JSON.parse(JSON.stringify(puzzle));
    for (let id = 1; id < rowSize; id++) {
      const results = solvePiece(puzzleState, id);
      const moves = results[0];
      puzzleState = results[1];
      console.log(`MOVES for ${id}: `, moves);
      await movesWithDelay(moves, 500);
    }
  };

  return (
    <div className="puzzle-container">
      <div className="puzzle" ref={puzzleRef}>
        <div className="puzzle__control">
          <label htmlFor="puzzle-image" className="file-input">
            Upload image
          </label>
          <input
            id="puzzle-image"
            type="file"
            accept="image/*"
            onChange={handleImageLoad}
          />
          <div className="control-end">
            <label className="d-block" htmlFor="size-selector">
              Size
            </label>
            <select id="size-selector" onChange={handleSizeChange}>
              <option value="3x3">3x3</option>
              <option value="4x4">4x4</option>
              <option value="5x5">5x5</option>
              <option value="6x6">6x6</option>
              <option value="7x7">7x7</option>
              <option value="8x8">8x8</option>
              <option value="9x9">9x9</option>
              <option value="10x10">10x10</option>
            </select>
          </div>
        </div>
        <div
          className="puzzle__board"
          style={{
            aspectRatio:
              imageWidth && imageHeight ? imageWidth / imageHeight : '1/1',
          }}
        >
          {puzzle.pieces.map(piece =>
            piece.column === puzzle.emptyLocation.column &&
            piece.row === puzzle.emptyLocation.row ? null : (
              <div
                id={`puzzle-piece-${piece.id}`}
                className="puzzle-piece"
                style={{
                  position: 'absolute',
                  transform: `translate3d(${piece.column * 100}%, ${piece.row *
                    100}%, 0)`,
                  height: `${(1 / puzzle.columnSize) * 100}%`,
                  width: `${(1 / puzzle.rowSize) * 100}%`,
                }}
                key={piece.id}
                onClick={() => movePiece(piece.id, piece.row, piece.column)}
                onKeyDown={e => handleKeyDown(e, piece)}
                onFocus={() => setFocusedPiece(piece.id)}
                tabIndex={piece.row * puzzle.rowSize + piece.column + 1}
              >
                <PuzzlePiece
                  className={
                    isPuzzleComplete
                      ? 'puzzle-piece__content puzzle-piece__content--complete'
                      : 'puzzle-piece__content'
                  }
                  id={piece.id}
                  src={imageSource}
                  rowSize={puzzle.rowSize}
                  columnSize={puzzle.columnSize}
                />
              </div>
            ),
          )}
        </div>
        <div className="puzzle__footer">
          <div className="action-buttons">
            <button onClick={() => dispatchMove({ type: 'auto-complete' })}>
              Complete
            </button>
            <button onClick={handleSolve}>Solve first</button>
            <button
              className="btn--accent"
              onClick={() => dispatchMove({ type: 'reset' })}
            >
              Scramble
            </button>
          </div>
        </div>
      </div>
      <div className="puzzle-reference">
        {imageSource && (
          <>
            <div className="puzzle-reference__heading">
              <span className="h4">Reference</span>
            </div>
            <div className="puzzle-reference__body">
              <button onClick={showModal} className="btn-text">
                <img src={imageSource} className="puzzle-reference__image" />
              </button>
            </div>
          </>
        )}
      </div>
      <dialog ref={modalRef}>
        <div className="modal-heading">
          <button className="close-button" onClick={hideModal}>
            &#x2715;
          </button>
        </div>
        <img src={imageSource} className="puzzle-reference__image" />
      </dialog>
    </div>
  );
};

export default Puzzle;
