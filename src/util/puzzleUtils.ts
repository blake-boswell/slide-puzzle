import { PuzzleAction, PuzzlePiece, PuzzleState } from '../types/puzzle';
import { shuffle } from './arrayUtils';

function getInversionCount(puzzle: number[], emptyPieceId: number) {
  // An inversion is when a tile comes before another tile with a lower number
  // EX: [3, 4, 1, 2] : 4 has the inversion of 1 and 2; 3 has the inversions 1 and 2
  let inversionCount = 0;
  for (let i = 0; i < puzzle.length - 1; i++) {
    // Skip over empty piece
    if (puzzle[i] === emptyPieceId) continue;

    // Add up number of tiles less than the piece ID at i
    for (let j = i + 1; j < puzzle.length; j++) {
      if (puzzle[j] !== emptyPieceId && puzzle[i] > puzzle[j]) {
        inversionCount++;
      }
    }
  }
  return inversionCount;
}

function getRowNumberFromBottom(
  columnSize: number,
  emptyPieceLocation: number,
) {
  const row = emptyPieceLocation / columnSize;
  return columnSize - row;
}

function isValidPuzzle(puzzle: number[], emptyPieceId: number) {
  // Check for inversion count
  const inversionCount = getInversionCount(puzzle, emptyPieceId);

  const size = Math.sqrt(puzzle.length);

  if (size % 2 === 1) {
    // Puzzle grid is odd: True if inversion count is even
    return inversionCount % 2 === 0;
  }

  const emptyPieceIndex = puzzle.indexOf(emptyPieceId);
  const emptyPieceRowNumber = getRowNumberFromBottom(size, emptyPieceIndex);
  if (size % 2 === 0 && emptyPieceRowNumber % 2 !== 0) {
    // Puzzle grid is even && empty piece is in an odd row (counting from bottom):
    // True if inversion count is even
    return inversionCount % 2 === 0;
  }

  if (emptyPieceRowNumber % 2 !== 0) {
    // Puzzle grid is even && empty piece is in an even row (counting from bottom):
    // True if inversion count is odd
    return inversionCount % 2 === 0;
  } else {
    return inversionCount % 2 !== 0;
  }
}

function swapPieces(puzzle: number[], emptyPieceId: number) {
  if (puzzle.length < 2) return;

  if (puzzle[0] !== emptyPieceId && puzzle[1] !== emptyPieceId) {
    // Swap first two
    const temp = puzzle[0];
    puzzle[0] = puzzle[1];
    puzzle[1] = temp;
  } else {
    // Swap last two
    const temp = puzzle[puzzle.length - 1];
    puzzle[puzzle.length - 1] = puzzle[puzzle.length - 2];
    puzzle[puzzle.length - 2] = temp;
  }
}

export function scramble(rowSize: number, columnSize: number): PuzzleState {
  // Create a 1-Dimensional array to represent the puzzle
  const arraySize = rowSize * columnSize;
  const puzzleArr = [];
  for (let i = 0; i < arraySize; i++) {
    // Using 1-based array for id's
    puzzleArr[i] = i + 1;
  }

  // Run Fisher-Yates shuffle on array
  const shuffledPuzzle = shuffle(puzzleArr);

  // Verify the puzzle is solvable
  const isSolvable = isValidPuzzle(shuffledPuzzle, arraySize);

  if (!isSolvable) {
    // If it's not solvable, then we need to change the count of inversions by 1
    swapPieces(shuffledPuzzle, arraySize);
  }

  // Get location of each piece, using the element number as the id
  const pieces: PuzzlePiece[] = [];
  let emptyIndex = -1;
  for (let i = 0; i < arraySize; i++) {
    // Using 1-based array for id's
    const id = i + 1;
    const pieceIndex = shuffledPuzzle.indexOf(id);
    // console.log(
    //   `${id} is at index ${pieceIndex} (row: ${Math.floor(
    //     pieceIndex / rowSize,
    //   )}, col: ${Math.floor(pieceIndex % columnSize)})`,
    // );
    const row = Math.floor(pieceIndex / rowSize);
    const column = Math.floor(pieceIndex % columnSize);
    pieces.push({
      id,
      row,
      column,
    });

    if (id === arraySize) {
      emptyIndex = pieceIndex;
    }
  }

  return {
    rowSize,
    columnSize,
    pieces,
    emptyLocation: {
      row: Math.floor(emptyIndex / rowSize),
      column: Math.floor(emptyIndex % columnSize),
    },
  };
}
