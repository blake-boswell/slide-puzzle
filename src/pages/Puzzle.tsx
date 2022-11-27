import React, {
  Reducer,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { PuzzleState, PuzzleAction, PuzzlePiece } from '../types/puzzle';
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

  const handleSizeChange: React.ChangeEventHandler<HTMLSelectElement> = e => {
    const matrixSize = e.target.value;
    const [row, col] = matrixSize.split('x');
    const newRowSize = Number.parseInt(row);
    const newColSize = Number.parseInt(col);
    setRowSize(newRowSize);
    setColSize(newColSize);
  };

  const getDiagonalDelayTime = (piece: PuzzlePiece) => {
    return `${(piece.row + piece.column) * 0.1}s`;
  };

  const handleImageLoad: React.ChangeEventHandler<HTMLInputElement> = e => {
    const { files } = e.target;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        continue;
      }

      console.log(file);
      const reader = new FileReader();
      reader.onload = e => {
        const { result } = e.target;
        if (typeof result === 'string') {
          const image = new Image();
          image.src = result;
          image.decode().then(() => {
            if (puzzleRef.current) {
              const puzzleWidth = puzzleRef.current.offsetWidth;
              const newImageWidth =
                image.width > puzzleWidth ? puzzleWidth : image.width;
              const newImageHeight =
                image.width > puzzleWidth
                  ? (puzzleWidth * image.height) / image.width
                  : image.height;
              setImageHeight(newImageHeight);
              setImageWidth(newImageWidth);
              setImageSource(result);
            } else {
              setImageHeight(image.height);
              setImageWidth(image.width);
              setImageSource(result);
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="puzzle" ref={puzzleRef}>
      <div className="puzzle__control">
        <label htmlFor="puzzle-image">Puzzle image: </label>
        <input
          id="puzzle-image"
          type="file"
          accept="image/*"
          onChange={handleImageLoad}
        />
        <div className="control-end">
          <label htmlFor="size-selector">Size:</label>
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
              <div
                className={`puzzle-piece__content${
                  isPuzzleComplete ? ' puzzle-piece__content--complete' : ''
                }`}
                style={{
                  backgroundImage: `url(${imageSource})`,
                  backgroundSize: `${imageWidth}px ${imageHeight}px`,
                  backgroundRepeat: 'no-repeat',
                  backgroundOrigin: 'border-box',
                  backgroundPosition: `left ${((piece.id - 1) %
                    puzzle.rowSize) *
                    (1 / (puzzle.rowSize - 1)) *
                    100}% top ${Math.floor((piece.id - 1) / puzzle.columnSize) *
                    (1 / (puzzle.columnSize - 1)) *
                    100}%`,
                  animationDelay: getDiagonalDelayTime(piece),
                }}
              >
                {!imageSource && piece.id}
              </div>
            </div>
          ),
        )}
        <div style={{ display: 'none' }}>
          <img src={imageSource} />
        </div>
      </div>
      <div className="puzzle__footer">
        <div>Puzzle status: {isPuzzleComplete ? 'Done' : 'In progress'}</div>
        <div className="action-buttons">
          <button onClick={() => dispatchMove({ type: 'auto-complete' })}>
            Complete
          </button>
          <button
            className="btn--danger"
            onClick={() => dispatchMove({ type: 'reset' })}
          >
            Scramble
          </button>
        </div>
      </div>
    </div>
  );
};

export default Puzzle;
