import { puzzleReducer } from '../pages/reducers/puzzleReducer';
import { MoveAction } from '../types/puzzle';
import {
  Direction,
  PuzzleAction,
  PuzzlePiece,
  PuzzleSlot,
  PuzzleState,
} from '../types/puzzle';
import { shuffle } from './arrayUtils';
import { aStarSolve } from './aStar';

export function getInversionCount(puzzle: number[], emptyPieceId: number) {
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

export function getRowNumberFromBottom(
  columnSize: number,
  emptyPieceLocation: number,
) {
  const row = Math.floor(emptyPieceLocation / columnSize);
  return columnSize - row;
}

export function isValidPuzzle(puzzle: number[], emptyPieceId: number) {
  // Check for inversion count
  const inversionCount = getInversionCount(puzzle, emptyPieceId);
  console.log('Inversion count: ', inversionCount);

  const size = Math.sqrt(puzzle.length);

  if (size % 2 === 1) {
    // Puzzle grid is odd: True if inversion count is even
    return inversionCount % 2 === 0;
  }
  // Puzzle grid is even

  const emptyPieceIndex = puzzle.indexOf(emptyPieceId);
  const emptyPieceRowNumber = getRowNumberFromBottom(size, emptyPieceIndex);
  console.log('Empty piece row num: ', emptyPieceRowNumber);
  if (emptyPieceRowNumber % 2 !== 0) {
    // Empty piece is in an odd row (counting from bottom):
    // True if inversion count is even
    return inversionCount % 2 === 0;
  } else {
    // Empty piece is in an even row (counting from bottom):
    // True if inversion count is odd
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
    console.log('Generated an unsolvable puzzle. Swapping pieces to fix this...');
    swapPieces(shuffledPuzzle, arraySize);
    console.log('Pieces swapped! Solvable: ', isValidPuzzle(shuffledPuzzle, arraySize));
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

export function isPuzzleSolved(puzzle: PuzzleState) {
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
}

function solveLastPieceInRow(
  puzzle: PuzzleState,
  pieceId: number,
  target: PuzzleSlot,
): [PuzzleAction[], PuzzleState] {
  console.log('Solving for last piece in row');
  console.log(puzzleToString(puzzle));
  // Solve for final slot in row
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  const actions: PuzzleAction[] = [];
  const pieceIndex = puzzle.pieces.findIndex(piece => piece.id === pieceId);

  if (
    isDirectlyAbovePiece(target, puzzle.pieces[pieceIndex]) &&
    puzzle.emptyLocation.row === target.row &&
    puzzle.emptyLocation.column === target.column
  ) {
    // Target slot is empty and immediately above
    const movePieceUpAction: PuzzleAction = {
      id: pieceId,
      type: 'move-up',
    };
    actions.push(movePieceUpAction);
    shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceUpAction);
    return [actions, shadowPuzzle];
  }

  let newActions: PuzzleAction[] = [];
  // Pre. Make target slot to the left of the original target slot to aim for that rotational path
  const offsetTarget: PuzzleSlot = {
    row: target.row,
    column: target.column - 1,
  };
  // 1. Walk from empty slot to POI (Piece of interest)
  [newActions, shadowPuzzle] = walkEmptyToPiece(
    puzzle,
    puzzle.pieces[pieceIndex],
  );
  actions.push(...newActions);
  // 2. Perform slope walk to get POI into a rotational path w/ offset target
  [newActions, shadowPuzzle] = slopeWalkToTarget(
    shadowPuzzle,
    pieceId,
    offsetTarget,
  );
  actions.push(...newActions);
  // 3. Rotate solved row CCW 1 space
  const ringSize = target.column + 1 - target.row;
  // - Move empty space to (targetRow + 1, 0)
  if (
    isRightOfPiece(shadowPuzzle.emptyLocation, shadowPuzzle.pieces[pieceIndex])
  ) {
    const moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
    actions.push(moveEmptyDownAction);
  }

  // Move left until first column in {ringSize}
  const firstColumnInRing = shadowPuzzle.rowSize - ringSize;
  for (
    let dCol = shadowPuzzle.emptyLocation.column - firstColumnInRing;
    dCol > 0;
    dCol--
  ) {
    const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
    actions.push(moveEmptyLeftAction);
  }

  if (shadowPuzzle.emptyLocation.row > target.row + 1) {
    // Move up until at target.row + 1
    for (
      let dRow = Math.abs(shadowPuzzle.emptyLocation.row - (target.row + 1));
      dRow > 0;
      dRow--
    ) {
      const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
      actions.push(moveEmptyUpAction);
    }
  }

  // 4. Walk empty space up and across to the offset target
  const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
  shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
  actions.push(moveEmptyUpAction);

  // - Move right until at offset target
  for (let dCol = offsetTarget.column; dCol > 0; dCol--) {
    const moveEmptyRightAction = createMoveEmptyRightAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAction);
    actions.push(moveEmptyRightAction);
  }

  // 4. Rotate POI into offset target
  console.log('Rotating POI into offset target');
  console.log(puzzleToString(shadowPuzzle));
  const results = rotate(
    shadowPuzzle,
    shadowPuzzle.pieces[pieceIndex],
    offsetTarget,
  );
  newActions = results[0];
  shadowPuzzle = results[1];
  actions.push(...newActions);

  // 5. Move empty space to original target slot
  // | P | E1|
  // | E2|   |, E1 is already solved
  if (
    !isDirectlyRightOfPiece(
      shadowPuzzle.emptyLocation,
      shadowPuzzle.pieces[pieceIndex],
    )
  ) {
    // E2
    const moveEmptyRightAction = createMoveEmptyRightAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAction);
    actions.push(moveEmptyRightAction);

    const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
    actions.push(moveEmptyUpAction);
  }

  console.log('Rotation complete. Performing ring walk');
  console.log(puzzleToString(shadowPuzzle));
  // 6. Walk to first in row slot (0, 0 for first row)
  // - Move empty piece to (targetRow + 1, 0)
  //   - Move left until first column in {ringSize} ring
  for (
    let dCol = shadowPuzzle.emptyLocation.column - firstColumnInRing;
    dCol > 0;
    dCol--
  ) {
    const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
    actions.push(moveEmptyLeftAction);
  }

  //  - Move empty down
  const moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
  shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
  actions.push(moveEmptyDownAction);

  return [actions, shadowPuzzle];
}

function solveLastPieceInColumn(
  puzzle: PuzzleState,
  pieceId: number,
  target: PuzzleSlot,
): [PuzzleAction[], PuzzleState] {
  // Solve for final slot in column
  console.log('Solving for last piece in column');
  console.log(puzzleToString(puzzle));
  // Solve for final slot in row
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  const actions: PuzzleAction[] = [];
  const pieceIndex = puzzle.pieces.findIndex(piece => piece.id === pieceId);

  if (
    isDirectlyLeftOfPiece(target, puzzle.pieces[pieceIndex]) &&
    puzzle.emptyLocation.row === target.row &&
    puzzle.emptyLocation.column === target.column
  ) {
    // Target slot is empty and immediately to the left
    const movePieceLeftAction: PuzzleAction = {
      id: pieceId,
      type: 'move-left',
    };
    actions.push(movePieceLeftAction);
    shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceLeftAction);
    return [actions, shadowPuzzle];
  }

  let newActions: PuzzleAction[] = [];

  // Pre. Make target slot up and to the right of the original target slot to aim for that rotational path
  const offsetTarget: PuzzleSlot = {
    row: target.row - 1,
    column: target.column + 1,
  };
  // 1. Walk from empty slot to POI (Piece of interest)
  [newActions, shadowPuzzle] = walkEmptyToPiece(
    puzzle,
    puzzle.pieces[pieceIndex],
  );
  actions.push(...newActions);
  // 2. Perform slope walk to get POI into a rotational path w/ offset target
  [newActions, shadowPuzzle] = slopeWalkToTarget(
    shadowPuzzle,
    pieceId,
    offsetTarget,
  );
  actions.push(...newActions);
  // 3. Rotate piece into offset Target position
  [newActions, shadowPuzzle] = rotate(
    shadowPuzzle,
    shadowPuzzle.pieces[pieceIndex],
    offsetTarget,
  );
  actions.push(...newActions);

  // 4. Move empty slot into ring
  // - Get ring size
  const ringSize = shadowPuzzle.rowSize - target.column;
  // - Move empty slot to the bottom of the puzzle
  // | x | E1| x |
  // | x | P | E2|
  // | T | E3| x | <-- Bottom row
  if (
    isDirectlyAbovePiece(
      shadowPuzzle.emptyLocation,
      shadowPuzzle.pieces[pieceIndex],
    )
  ) {
    // E1
    const moveEmptyRightAction = createMoveEmptyRightAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAction);
    actions.push(moveEmptyRightAction);
  }

  // Move down until bottom row
  for (
    let dRow = Math.abs(
      shadowPuzzle.columnSize - shadowPuzzle.emptyLocation.row,
    );
    dRow > 0;
    dRow--
  ) {
    const moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
    actions.push(moveEmptyDownAction);
  }

  console.log('[Step 4] Empty slot has been moved into the ring:');
  console.log(puzzleToString(shadowPuzzle));

  // 5. Move in CCW ring until empty space is left of POI
  // - Move down until last column
  for (
    let dCol = Math.abs(
      shadowPuzzle.rowSize - (shadowPuzzle.emptyLocation.column + 1),
    );
    dCol > 0;
    dCol--
  ) {
    const moveEmptyRightAction = createMoveEmptyRightAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAction);
    actions.push(moveEmptyRightAction);
  }

  // - Move up {ringSize} rows
  for (let dRow = ringSize - 1; dRow > 0; dRow--) {
    const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
    actions.push(moveEmptyUpAction);
  }

  // - Move left {ringSize} columns
  for (let dCol = ringSize - 1; dCol > 0; dCol--) {
    const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
    actions.push(moveEmptyLeftAction);
  }

  // - Move down until row of POI
  for (
    let dRow =
      shadowPuzzle.pieces[pieceIndex].row - shadowPuzzle.emptyLocation.row;
    dRow > 0;
    dRow--
  ) {
    const moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
    actions.push(moveEmptyDownAction);
  }

  if (
    !isDirectlyLeftOfPiece(
      shadowPuzzle.emptyLocation,
      shadowPuzzle.pieces[pieceIndex],
    )
  ) {
    console.error(
      'The empty piece should be to the left of the piece of interest, but it is not.',
    );
    console.error(puzzleToString(shadowPuzzle));
  }

  console.log('[Step 5] Opened slot for the piece of interest:');
  console.log(puzzleToString(shadowPuzzle));

  // 6. Move POI left
  const movePieceLeftAction: PuzzleAction = { id: pieceId, type: 'move-left' };
  shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceLeftAction);
  actions.push(movePieceLeftAction);

  console.log('[Step 6] inserted piece of interest:');
  console.log(puzzleToString(shadowPuzzle));

  // 7. CW rotation of ring
  // - Move empty down
  let moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
  shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
  actions.push(moveEmptyDownAction);

  const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
  shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
  actions.push(moveEmptyLeftAction);

  // - Move up {ringSize} rows
  for (let dRow = ringSize - 1; dRow > 0; dRow--) {
    const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
    actions.push(moveEmptyUpAction);
  }

  // - Move right to last column
  for (
    let dCol = shadowPuzzle.rowSize - (shadowPuzzle.emptyLocation.column + 1);
    dCol > 0;
    dCol--
  ) {
    const moveEmptyRightAction = createMoveEmptyRightAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAction);
    actions.push(moveEmptyRightAction);
  }

  // - Move empty down
  moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
  shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
  actions.push(moveEmptyDownAction);

  console.log('Completed solution for last in column for piece ', pieceId);
  console.log(puzzleToString(shadowPuzzle));

  return [actions, shadowPuzzle];
}

export function isInSquareRing(
  puzzle: PuzzleState,
  piece: PuzzlePiece,
  targetRow: number,
  targetCol: number,
) {
  // In the path if you are in the same row, column, or in the same row/col of a diagonal piece to target slot
  const { rowSize, columnSize } = puzzle;

  if (
    targetRow < 0 ||
    targetRow >= rowSize ||
    targetCol < 0 ||
    targetCol >= columnSize
  ) {
    // Out of bounds
    return false;
  }

  if (targetRow === piece.row && targetCol === piece.column) {
    // Piece is in the target slot
    return true;
  }

  // Check 2x2 ring
  const validRowStart = targetRow;
  const validRowEnd = targetRow + 1;
  const validColStart = targetCol;
  const validColEnd = targetCol + 1;
  if (
    ((piece.column === validColStart || piece.column === validColEnd) &&
      (validRowStart <= piece.row && piece.row <= validRowEnd)) ||
    ((piece.row === validRowStart || piece.row === validRowEnd) &&
      (validColStart <= piece.column && piece.column <= validColEnd))
  ) {
    // Piece is in the square rotational ring path
    return true;
  }

  return false;
}

export function getTargetRowFromId(id: number, rowSize: number) {
  return Math.floor((id - 1) / rowSize);
}

export function getTargetColumnFromId(id: number, rowSize: number) {
  return (id - 1) % rowSize;
}

export function getRowIds(rowNumber: number, rowSize: number): number[] {
  const rowIds = [];
  const startId = rowNumber * rowSize + 1;
  const endId = (rowNumber + 1) * rowSize;
  for (let id = startId; id <= endId; id++) {
    rowIds.push(id);
  }
  return rowIds;
}

export function getColumnIds(
  columnNumber: number,
  columnSize: number,
  rowSize: number = columnSize,
): number[] {
  const columnIds = [];
  let row = 0;
  while (row < columnSize) {
    const id = columnNumber + 1 + row * rowSize;
    columnIds.push(id);
    row++;
  }

  return columnIds;
}

export function getDeltaRow(
  puzzle: PuzzleState,
  pieceId: number,
  targetRow: number,
) {
  const piece = puzzle.pieces.find(puzzlePiece => puzzlePiece.id === pieceId);
  if (!piece) return 0;

  return targetRow - piece.row;
}

export function getDeltaColumn(
  puzzle: PuzzleState,
  pieceId: number,
  targetColumn: number,
) {
  const piece = puzzle.pieces.find(puzzlePiece => puzzlePiece.id === pieceId);
  if (!piece) return 0;

  return targetColumn - piece.column;
}

export function isDirectlyAbovePiece(slot: PuzzleSlot, piece: PuzzlePiece) {
  if (slot.row + 1 === piece.row && slot.column === piece.column) {
    return true;
  }
  return false;
}

export function isDirectlyBelowPiece(slot: PuzzleSlot, piece: PuzzlePiece) {
  if (slot.row === piece.row + 1 && slot.column === piece.column) {
    return true;
  }
  return false;
}

export function isDirectlyLeftOfPiece(slot: PuzzleSlot, piece: PuzzlePiece) {
  if (slot.column + 1 === piece.column && slot.row === piece.row) {
    return true;
  }
  return false;
}

export function isDirectlyRightOfPiece(slot: PuzzleSlot, piece: PuzzlePiece) {
  if (slot.column === piece.column + 1 && slot.row === piece.row) {
    return true;
  }
  return false;
}

export function isRightOfPiece(slot: PuzzleSlot, piece: PuzzlePiece) {
  if (slot.column > piece.column && slot.row === piece.row) {
    return true;
  }
  return false;
}

export function getPieceAt(puzzle: PuzzleState, row: number, column: number) {
  const piece = puzzle.pieces.find(
    puzzlePiece => puzzlePiece.row === row && puzzlePiece.column === column,
  );
  return piece;
}

export function getPieceIdAt(puzzle: PuzzleState, row: number, column: number) {
  const piece = getPieceAt(puzzle, row, column);
  if (piece) return piece.id;
  return -1;
}

export function createMoveEmptyUpAction(puzzle: PuzzleState): PuzzleAction {
  return {
    id: getPieceIdAt(
      puzzle,
      puzzle.emptyLocation.row - 1,
      puzzle.emptyLocation.column,
    ),
    type: 'move-down',
  };
}

export function createMoveEmptyDownAction(puzzle: PuzzleState): PuzzleAction {
  return {
    id: getPieceIdAt(
      puzzle,
      puzzle.emptyLocation.row + 1,
      puzzle.emptyLocation.column,
    ),
    type: 'move-up',
  };
}

export function createMoveEmptyRightAction(puzzle: PuzzleState): PuzzleAction {
  return {
    id: getPieceIdAt(
      puzzle,
      puzzle.emptyLocation.row,
      puzzle.emptyLocation.column + 1,
    ),
    type: 'move-left',
  };
}

export function createMoveEmptyLeftAction(puzzle: PuzzleState): PuzzleAction {
  return {
    id: getPieceIdAt(
      puzzle,
      puzzle.emptyLocation.row,
      puzzle.emptyLocation.column - 1,
    ),
    type: 'move-right',
  };
}

export function rotate(
  puzzle: PuzzleState,
  piece: PuzzlePiece,
  target: PuzzleSlot,
): [PuzzleAction[], PuzzleState] {
  console.log('Starting rotation of ', piece, ' to: ', target);
  console.log(puzzleToString(puzzle));
  let actions: PuzzleAction[] = [];
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  if (isDirectlyLeftOfPiece(target, piece)) {
    // Target is directly left of piece
    // | x | E1| E2
    // | T | P | E3|
    // | x | E5| E4| , where E1 and E2 are possible empty slots to get P where it is
    if (
      target.row === shadowPuzzle.emptyLocation.row &&
      target.column === shadowPuzzle.emptyLocation.column
    ) {
      // Target slot is the empty slot
      const movePieceLeftAction: PuzzleAction = {
        id: piece.id,
        type: 'move-left',
      };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceLeftAction);
      actions.push(movePieceLeftAction);
    } else {
      const numActionsBefore = actions.length;

      if (isDirectlyAbovePiece(shadowPuzzle.emptyLocation, piece)) {
        // E1
        const moveEmptyRightAction = createMoveEmptyRightAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAction);
        actions.push(moveEmptyRightAction);
      }

      if (
        shadowPuzzle.emptyLocation.column === piece.column + 1 &&
        shadowPuzzle.emptyLocation.row === piece.row - 1
      ) {
        // E2
        const moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
        actions.push(moveEmptyDownAction);
      }

      if (isDirectlyRightOfPiece(shadowPuzzle.emptyLocation, piece)) {
        // E3
        const moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
        actions.push(moveEmptyDownAction);
      }

      if (
        shadowPuzzle.emptyLocation.column === piece.column + 1 &&
        shadowPuzzle.emptyLocation.row === piece.row + 1
      ) {
        // E4
        const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
        actions.push(moveEmptyLeftAction);
      }

      if (isDirectlyBelowPiece(shadowPuzzle.emptyLocation, piece)) {
        // E5
        const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
        actions.push(moveEmptyLeftAction);

        const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
        actions.push(moveEmptyUpAction);

        const movePieceLeftAction: PuzzleAction = {
          id: piece.id,
          type: 'move-left',
        };
        shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceLeftAction);
        actions.push(movePieceLeftAction);
      }

      if (numActionsBefore === actions.length) {
        // We haven't done any new actions. We are in an unexpected state
        // Error. I should not go here
        console.error('Cannot rotate piece to target ', target);
        logPuzzle(shadowPuzzle);
      }
    }
  } else if (isDirectlyAbovePiece(target, piece)) {
    // Target is directly above piece
    // | E7| T | E1|
    // | E6| P | E2|
    // | E5| E4| E3| , where E1 and E2 are possible empty slots to get P where it is
    if (
      target.row === shadowPuzzle.emptyLocation.row &&
      target.column === shadowPuzzle.emptyLocation.column
    ) {
      // Target slot is the empty slot
      const movePieceUpAction: PuzzleAction = { id: piece.id, type: 'move-up' };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceUpAction);
      actions.push(movePieceUpAction);
    } else {
      const numActionsBefore = actions.length;

      if (
        shadowPuzzle.emptyLocation.column === piece.column - 1 &&
        shadowPuzzle.emptyLocation.row === piece.row - 1
      ) {
        // E7
        const moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
        actions.push(moveEmptyDownAction);
      }

      if (isDirectlyLeftOfPiece(shadowPuzzle.emptyLocation, piece)) {
        // E6
        const moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
        actions.push(moveEmptyDownAction);
      }

      if (
        shadowPuzzle.emptyLocation.column === piece.column - 1 &&
        shadowPuzzle.emptyLocation.row === piece.row + 1
      ) {
        // E5
        const moveEmptyRightAction = createMoveEmptyRightAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAction);
        actions.push(moveEmptyRightAction);
      }

      if (isDirectlyBelowPiece(shadowPuzzle.emptyLocation, piece)) {
        // E4
        const moveEmptyRightAction = createMoveEmptyRightAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAction);
        actions.push(moveEmptyRightAction);
      }

      if (
        shadowPuzzle.emptyLocation.column === piece.column + 1 &&
        shadowPuzzle.emptyLocation.row === piece.row + 1
      ) {
        // E3
        const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
        actions.push(moveEmptyUpAction);
      }

      if (isDirectlyRightOfPiece(shadowPuzzle.emptyLocation, piece)) {
        // E2
        const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
        actions.push(moveEmptyUpAction);
      }

      if (
        shadowPuzzle.emptyLocation.column === piece.column + 1 &&
        shadowPuzzle.emptyLocation.row === piece.row - 1
      ) {
        // E1
        const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
        shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
        actions.push(moveEmptyLeftAction);

        const movePieceUpAction: PuzzleAction = {
          id: piece.id,
          type: 'move-up',
        };
        shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceUpAction);
        actions.push(movePieceUpAction);
      }

      if (numActionsBefore === actions.length) {
        // Error. I should not go here
        console.error('Cannot rotate piece to target ', target);
        logPuzzle(shadowPuzzle);
      }
    }
  } else if (
    piece.row === target.row + 1 &&
    piece.column === target.column + 1
  ) {
    // Down 1 and to the right 1
    // | T | E4|
    // | E1| P | E2
    // |   | E3|
    if (
      target.row === shadowPuzzle.emptyLocation.row &&
      target.column === shadowPuzzle.emptyLocation.column
    ) {
      // Target slot is the empty slot
      const moveEmptyRightAction = createMoveEmptyRightAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAction);
      actions.push(moveEmptyRightAction);

      const movePieceUpAction: PuzzleAction = { id: piece.id, type: 'move-up' };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceUpAction);
      actions.push(movePieceUpAction);

      const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
      actions.push(moveEmptyLeftAction);

      const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
      actions.push(moveEmptyUpAction);

      const movePieceLeftAction: PuzzleAction = {
        id: piece.id,
        type: 'move-left',
      };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceLeftAction);
      actions.push(movePieceLeftAction);
    } else if (isDirectlyLeftOfPiece(shadowPuzzle.emptyLocation, piece)) {
      // E1
      const movePieceLeftAction: PuzzleAction = {
        id: piece.id,
        type: 'move-left',
      };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceLeftAction);
      actions.push(movePieceLeftAction);

      const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
      actions.push(moveEmptyUpAction);

      const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
      actions.push(moveEmptyLeftAction);

      const movePieceUpAction: PuzzleAction = { id: piece.id, type: 'move-up' };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceUpAction);
      actions.push(movePieceUpAction);
    } else if (isDirectlyRightOfPiece(shadowPuzzle.emptyLocation, piece)) {
      // E2
      const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
      actions.push(moveEmptyUpAction);

      const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
      actions.push(moveEmptyLeftAction);

      const movePieceUpAction: PuzzleAction = { id: piece.id, type: 'move-up' };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceUpAction);
      actions.push(movePieceUpAction);

      const moveEmptyLeftAgainAction = createMoveEmptyLeftAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAgainAction);
      actions.push(moveEmptyLeftAgainAction);

      const moveEmptyUpAgainAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAgainAction);
      actions.push(moveEmptyUpAgainAction);

      const movePieceLeftAction: PuzzleAction = {
        id: piece.id,
        type: 'move-left',
      };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceLeftAction);
      actions.push(movePieceLeftAction);
    } else if (isDirectlyBelowPiece(shadowPuzzle.emptyLocation, piece)) {
      // E3
      const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
      actions.push(moveEmptyLeftAction);

      const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
      actions.push(moveEmptyUpAction);

      const movePieceLeftAction: PuzzleAction = {
        id: piece.id,
        type: 'move-left',
      };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceLeftAction);
      actions.push(movePieceLeftAction);

      const moveEmptyUpAgainAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAgainAction);
      actions.push(moveEmptyUpAgainAction);

      const moveEmptyLeftAgainAction = createMoveEmptyLeftAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAgainAction);
      actions.push(moveEmptyLeftAgainAction);

      const movePieceUpAction: PuzzleAction = { id: piece.id, type: 'move-up' };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceUpAction);
      actions.push(movePieceUpAction);
    } else if (isDirectlyAbovePiece(shadowPuzzle.emptyLocation, piece)) {
      // E4
      const movePieceUpAction: PuzzleAction = { id: piece.id, type: 'move-up' };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceUpAction);
      actions.push(movePieceUpAction);

      const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
      actions.push(moveEmptyLeftAction);

      const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
      actions.push(moveEmptyUpAction);

      const movePieceLeftAction: PuzzleAction = {
        id: piece.id,
        type: 'move-left',
      };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceLeftAction);
      actions.push(movePieceLeftAction);
    }
  }

  console.log('Completed rotation of ', piece.id, ' to: ', target);
  console.log(puzzleToString(shadowPuzzle));
  return [actions, shadowPuzzle];
}

function moveEmptyInDirection(
  puzzle: PuzzleState,
  spaces: number,
  direction: MoveAction['type'],
): [PuzzleAction[], PuzzleState] {
  const actions: PuzzleAction[] = [];
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  const emptyPiece = shadowPuzzle.pieces.find((piece) => piece.row === shadowPuzzle.emptyLocation.row && piece.column === shadowPuzzle.emptyLocation.column);
  const emptyId = emptyPiece?.id || shadowPuzzle.pieces.length;

  for (let remainingMoves = spaces; remainingMoves > 0; remainingMoves--) {
    // if (remainingMoves === 1 && direction === 'move-down') {
    //   // Prevent upwards movement of the empty space if it is on the row below the target
    //   // This is done to ensure we don't mess with any slots already solved
    //   break;
    // }

    console.log(`Empty movement (${direction}). Remaining moves: `, remainingMoves);
    console.log(puzzleToString(shadowPuzzle));
    const action: PuzzleAction = {
      id: emptyId,
      type: direction,
    };
    // Update shadow puzzle
    shadowPuzzle = puzzleReducer(shadowPuzzle, action);
    actions.push(action);
  }

  return [actions, shadowPuzzle];
}

function walkEmptyToPiece(
  puzzle: PuzzleState,
  piece: PuzzlePiece,
): [PuzzleAction[], PuzzleState] {
  console.log('Starting to walk the empty slot to target: ', piece);
  console.log(puzzleToString(puzzle));

  // Locate empty slot
  const { row: emptyRow, column: emptyCol } = puzzle.emptyLocation;
  const { row: targetRow, column: targetColumn, id: pieceId } = piece;

  // Solve for row
  const actions: PuzzleAction[] = [];
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  let newActions: PuzzleAction[] = [];

  // Find delta row and delta col
  // (-) row points up, (-) col points left
  const dRow = emptyRow - targetRow;
  const dCol = emptyCol - targetColumn;
  // Check if we can skip this step
  if (dRow !== 0 || dCol !== 0) {
    // Prioritize moves (down >= right > up >= left)
    const yDirection = dRow < 0 ? 'move-down' : 'move-up';
    const xDirection = dCol < 0 ? 'move-right' : 'move-left';

    if (yDirection === 'move-down') {
      let spaces = Math.abs(dRow);
      if (emptyCol === targetColumn) {
        // Go one less; we just want to be touching the piece
        spaces--;
      }
      [newActions, shadowPuzzle] = moveEmptyInDirection(
        shadowPuzzle,
        spaces,
        'move-down',
      );
      actions.push(...newActions);
    }

    if (xDirection === 'move-right') {
      let spaces = Math.abs(dCol);
      if (emptyRow === targetRow) {
        // Go one less; we just want to be touching the piece
        spaces--;
      }
      [newActions, shadowPuzzle] = moveEmptyInDirection(
        shadowPuzzle,
        spaces,
        'move-right',
      );
      actions.push(...newActions);
    }

    if (yDirection === 'move-up') {
      let spaces = Math.abs(dRow);
      if (emptyCol === targetColumn) {
        // Go one less; we just want to be touching the piece
        spaces--;
      }
      [newActions, shadowPuzzle] = moveEmptyInDirection(
        shadowPuzzle,
        spaces,
        'move-up',
      );
      actions.push(...newActions);
    }

    if (xDirection === 'move-left') {
      let spaces = Math.abs(dCol);
      if (emptyRow === targetRow) {
        // Go one less; we just want to be touching the piece
        spaces--;
      }
      [newActions, shadowPuzzle] = moveEmptyInDirection(
        shadowPuzzle,
        spaces,
        'move-left',
      );
      actions.push(...newActions);
    }
    // for (
    //   let remainingRowMoves = Math.abs(dRow);
    //   remainingRowMoves > 0 && !touchingTargetPiece;
    //   remainingRowMoves--
    // ) {
    //   if (remainingRowMoves === 1 && direction === 'move-down') {
    //     // Prevent upwards movement of the empty space if it is on the row below the target
    //     // This is done to ensure we don't mess with any slots already solved
    //     break;
    //   }

    //   console.log('Move up/down. Remaining moves: ', remainingRowMoves);
    //   logPuzzle(shadowPuzzle);
    //   const currentEmptyCol = shadowPuzzle.emptyLocation.column;
    //   const currentEmptyRow = shadowPuzzle.emptyLocation.row;
    //   // Get piece ID above/below empty space
    //   const verticalDiff = direction === 'move-up' ? -1 : 1;
    //   const pieceToMove = shadowPuzzle.pieces.find(
    //     piece =>
    //       piece.column === currentEmptyCol &&
    //       piece.row + verticalDiff === currentEmptyRow,
    //   );
    //   if (pieceToMove) {
    //     if (pieceToMove.id === pieceId) {
    //       // Stop. Don't intend to move target piece in this step
    //       touchingTargetPiece = true;
    //     } else {
    //       const action: PuzzleAction = {
    //         id: pieceToMove.id,
    //         type: direction,
    //       };
    //       // Update shadow puzzle
    //       shadowPuzzle = puzzleReducer(shadowPuzzle, action);
    //       actions.push(action);
    //     }
    //   }
    // }

    // // Move left/right
    // direction = dCol > 0 ? 'move-right' : 'move-left';
    // for (
    //   let remainingColMoves = Math.abs(dCol);
    //   remainingColMoves > 0 && !touchingTargetPiece;
    //   remainingColMoves--
    // ) {
    //   console.log('Move left/right. Remaining moves: ', remainingColMoves);
    //   logPuzzle(shadowPuzzle);
    //   const currentEmptyCol = shadowPuzzle.emptyLocation.column;
    //   const currentEmptyRow = shadowPuzzle.emptyLocation.row;
    //   // Get piece ID left/right empty space
    //   const horizontalDiff = direction === 'move-left' ? -1 : 1;
    //   const pieceToMove = shadowPuzzle.pieces.find(
    //     piece =>
    //       piece.column + horizontalDiff === currentEmptyCol &&
    //       piece.row === currentEmptyRow,
    //   );
    //   if (pieceToMove) {
    //     if (pieceToMove.id === pieceId) {
    //       // Stop. Don't intend to move target piece in this step
    //       touchingTargetPiece = true;
    //     } else {
    //       const action: PuzzleAction = {
    //         id: pieceToMove.id,
    //         type: direction,
    //       };
    //       // Update shadow puzzle
    //       shadowPuzzle = puzzleReducer(shadowPuzzle, action);
    //       actions.push(action);
    //     }
    //   }
    // }
  }

  console.log('Completed walking the empty slot to target: ', piece);
  console.log(puzzleToString(shadowPuzzle));
  return [actions, shadowPuzzle];
}

function slopeWalkToTarget(
  puzzle: PuzzleState,
  pieceId: number,
  target: PuzzleSlot,
): [PuzzleAction[], PuzzleState] {
  console.log('Starting slope walk for ', pieceId, ' to target: ', target);
  console.log(puzzleToString(puzzle));
  const actions: PuzzleAction[] = [];
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  const { row: targetRow, column: targetCol } = target;

  const pieceOfInterestIndex = shadowPuzzle.pieces.findIndex(
    piece => piece.id === pieceId,
  );
  if (pieceOfInterestIndex > -1) {
    let isPieceSolved = false;
    let currentDirection: Direction;
    let lastDirection: Direction;
    let iterationCount = 0;
    while (!isPieceSolved && iterationCount < 25) {
      iterationCount++;
      const pieceOfInterest = shadowPuzzle.pieces[pieceOfInterestIndex];
      const dRow = getDeltaRow(shadowPuzzle, pieceId, targetRow);
      const dCol = getDeltaColumn(shadowPuzzle, pieceId, targetCol);
      // - Perform a Slope Walk
      // 1. Check if POI is in a square rotational path with target slot being top left
      const inSquareRing = isInSquareRing(
        shadowPuzzle,
        pieceOfInterest,
        targetRow,
        targetCol,
      );

      console.log(inSquareRing);

      if (inSquareRing) {
        // EXIT CONDITION
        return [actions, shadowPuzzle];
      } else {
        // 1b. Walk in slope direction
        // a. Walk empty space into next slot we want POI to go (alternate btwn d_r and d_c)
        // Get Direction we want to move in
        if (!lastDirection) {
          if (
            dRow < -1 ||
            (dRow === -1 && pieceOfInterest.column >= targetCol)
          ) {
            currentDirection = 'up';
          } else if (dRow >= 0) {
            currentDirection = 'down';
          } else if (
            dCol < -1 ||
            (dCol === -1 && pieceOfInterest.row >= targetRow)
          ) {
            currentDirection = 'left';
          } else if (dCol >= 0) {
            currentDirection = 'right';
          } else {
            console.error(
              'It looks like we are right where we needed to be...',
            );
          }
        } else {
          if (lastDirection === 'up' || lastDirection === 'down') {
            if (
              dCol < -1 ||
              (dCol === -1 && pieceOfInterest.row >= targetRow)
            ) {
              currentDirection = 'left';
            } else {
              // Even if dCol is 0, we want to go away from the solved portion
              currentDirection = 'right';
            }
          } else {
            if (
              dRow < -1 ||
              (dRow === -1 && pieceOfInterest.column >= targetCol)
            ) {
              currentDirection = 'up';
            } else {
              // Even if dRow is 0, we want to go away from the solved portion
              currentDirection = 'down';
            }
          }
        }

        console.log(pieceOfInterest, currentDirection);
        // Move empty space to this slot if not already there (L and 7 movements)
        if (currentDirection === 'up') {
          if (
            isDirectlyBelowPiece(shadowPuzzle.emptyLocation, pieceOfInterest)
          ) {
            // Move around POI, prefer right side
            // - Can go to right?
            const { columnSize } = shadowPuzzle;
            if (shadowPuzzle.emptyLocation.column + 1 < columnSize) {
              // Can go right. Go around on right side
              const moveEmptyRight = createMoveEmptyRightAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRight);
              actions.push(moveEmptyRight);

              const moveEmptyUp = createMoveEmptyUpAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUp);
              actions.push(moveEmptyUp);

              const moveEmptyUpAgain = createMoveEmptyUpAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAgain);
              actions.push(moveEmptyUpAgain);

              const moveEmptyLeft = createMoveEmptyLeftAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeft);
              actions.push(moveEmptyLeft);
            } else {
              // Go around on the left side
              const moveEmptyLeft = createMoveEmptyLeftAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeft);
              actions.push(moveEmptyLeft);

              const moveEmptyUp = createMoveEmptyUpAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUp);
              actions.push(moveEmptyUp);

              const moveEmptyUpAgain = createMoveEmptyUpAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAgain);
              actions.push(moveEmptyUpAgain);

              const moveEmptyRight = createMoveEmptyRightAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRight);
              actions.push(moveEmptyRight);
            }
          } else if (
            isDirectlyLeftOfPiece(shadowPuzzle.emptyLocation, pieceOfInterest)
          ) {
            const moveEmptyUp = createMoveEmptyUpAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUp);
            actions.push(moveEmptyUp);

            const moveEmptyRight = createMoveEmptyRightAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRight);
            actions.push(moveEmptyRight);
          } else if (
            isDirectlyRightOfPiece(shadowPuzzle.emptyLocation, pieceOfInterest)
          ) {
            const moveEmptyUp = createMoveEmptyUpAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUp);
            actions.push(moveEmptyUp);

            const moveEmptyLeft = createMoveEmptyLeftAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeft);
            actions.push(moveEmptyLeft);
          }

          // Move POI
          shadowPuzzle = puzzleReducer(shadowPuzzle, {
            id: pieceOfInterest.id,
            type: 'move-up',
          });
          actions.push({ id: pieceOfInterest.id, type: 'move-up' });
        } else if (currentDirection === 'down') {
          if (
            isDirectlyAbovePiece(shadowPuzzle.emptyLocation, pieceOfInterest)
          ) {
            // Move around POI, prefer right side
            // - Can go to right?
            const { columnSize } = shadowPuzzle;
            if (shadowPuzzle.emptyLocation.column + 1 < columnSize) {
              // Can go right. Go around on right side
              const moveEmptyRight = createMoveEmptyRightAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRight);
              actions.push(moveEmptyRight);

              const moveEmptyDown = createMoveEmptyDownAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDown);
              actions.push(moveEmptyDown);

              const moveEmptyDownAgain = createMoveEmptyDownAction(
                shadowPuzzle,
              );
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAgain);
              actions.push(moveEmptyDownAgain);

              const moveEmptyLeft = createMoveEmptyLeftAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeft);
              actions.push(moveEmptyLeft);
            } else {
              // Go around on the left side
              const moveEmptyLeft = createMoveEmptyLeftAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeft);
              actions.push(moveEmptyLeft);

              const moveEmptyDown = createMoveEmptyDownAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDown);
              actions.push(moveEmptyDown);

              const moveEmptyDownAgain = createMoveEmptyDownAction(
                shadowPuzzle,
              );
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAgain);
              actions.push(moveEmptyDownAgain);

              const moveEmptyRight = createMoveEmptyRightAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRight);
              actions.push(moveEmptyRight);
            }
          } else if (
            isDirectlyLeftOfPiece(shadowPuzzle.emptyLocation, pieceOfInterest)
          ) {
            const moveEmptyDown = createMoveEmptyDownAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDown);
            actions.push(moveEmptyDown);

            const moveEmptyRight = createMoveEmptyRightAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRight);
            actions.push(moveEmptyRight);
          } else if (
            isDirectlyRightOfPiece(shadowPuzzle.emptyLocation, pieceOfInterest)
          ) {
            const moveEmptyDown = createMoveEmptyDownAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDown);
            actions.push(moveEmptyDown);

            const moveEmptyLeft = createMoveEmptyLeftAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeft);
            actions.push(moveEmptyLeft);
          }

          // Move POI
          shadowPuzzle = puzzleReducer(shadowPuzzle, {
            id: pieceOfInterest.id,
            type: 'move-down',
          });
          actions.push({ id: pieceOfInterest.id, type: 'move-down' });
        } else if (currentDirection === 'left') {
          if (
            isDirectlyRightOfPiece(shadowPuzzle.emptyLocation, pieceOfInterest)
          ) {
            // Move around POI, prefer bottom side
            // - Can go below?
            const { rowSize } = shadowPuzzle;
            if (shadowPuzzle.emptyLocation.row + 1 < rowSize) {
              // Can go below. Go around on bottom side
              const moveEmptyDown = createMoveEmptyDownAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDown);
              actions.push(moveEmptyDown);

              const moveEmptyLeft = createMoveEmptyLeftAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeft);
              actions.push(moveEmptyLeft);

              const moveEmptyLeftAgain = createMoveEmptyLeftAction(
                shadowPuzzle,
              );
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAgain);
              actions.push(moveEmptyLeftAgain);

              const moveEmptyUp = createMoveEmptyUpAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUp);
              actions.push(moveEmptyUp);
            } else {
              // Go around on the top side
              const moveEmptyUp = createMoveEmptyUpAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUp);
              actions.push(moveEmptyUp);

              const moveEmptyLeft = createMoveEmptyLeftAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeft);
              actions.push(moveEmptyLeft);

              const moveEmptyLeftAgain = createMoveEmptyLeftAction(
                shadowPuzzle,
              );
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAgain);
              actions.push(moveEmptyLeftAgain);

              const moveEmptyDown = createMoveEmptyDownAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDown);
              actions.push(moveEmptyDown);
            }
          } else if (
            isDirectlyAbovePiece(shadowPuzzle.emptyLocation, pieceOfInterest)
          ) {
            const moveEmptyLeft = createMoveEmptyLeftAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeft);
            actions.push(moveEmptyLeft);

            const moveEmptyDown = createMoveEmptyDownAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDown);
            actions.push(moveEmptyDown);
          } else if (
            isDirectlyBelowPiece(shadowPuzzle.emptyLocation, pieceOfInterest)
          ) {
            const moveEmptyLeft = createMoveEmptyLeftAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeft);
            actions.push(moveEmptyLeft);

            const moveEmptyUp = createMoveEmptyUpAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUp);
            actions.push(moveEmptyUp);
          }

          // Move POI
          shadowPuzzle = puzzleReducer(shadowPuzzle, {
            id: pieceOfInterest.id,
            type: 'move-left',
          });
          actions.push({ id: pieceOfInterest.id, type: 'move-left' });
        } else if (currentDirection === 'right') {
          if (
            isDirectlyLeftOfPiece(shadowPuzzle.emptyLocation, pieceOfInterest)
          ) {
            // Move around POI, prefer bottom side
            // - Can go below?
            const { rowSize } = shadowPuzzle;
            if (shadowPuzzle.emptyLocation.row + 1 < rowSize) {
              // Can go below. Go around on bottom side
              const moveEmptyDown = createMoveEmptyDownAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDown);
              actions.push(moveEmptyDown);

              const moveEmptyRight = createMoveEmptyRightAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRight);
              actions.push(moveEmptyRight);

              const moveEmptyRightAgain = createMoveEmptyRightAction(
                shadowPuzzle,
              );
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAgain);
              actions.push(moveEmptyRightAgain);

              const moveEmptyUp = createMoveEmptyUpAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUp);
              actions.push(moveEmptyUp);
            } else {
              // Go around on the top side
              const moveEmptyUp = createMoveEmptyUpAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUp);
              actions.push(moveEmptyUp);

              const moveEmptyRight = createMoveEmptyRightAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRight);
              actions.push(moveEmptyRight);

              const moveEmptyRightAgain = createMoveEmptyRightAction(
                shadowPuzzle,
              );
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAgain);
              actions.push(moveEmptyRightAgain);

              const moveEmptyDown = createMoveEmptyDownAction(shadowPuzzle);
              shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDown);
              actions.push(moveEmptyDown);
            }
          } else if (
            isDirectlyAbovePiece(shadowPuzzle.emptyLocation, pieceOfInterest)
          ) {
            const moveEmptyRight = createMoveEmptyRightAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRight);
            actions.push(moveEmptyRight);

            const moveEmptyDown = createMoveEmptyDownAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDown);
            actions.push(moveEmptyDown);
          } else if (
            isDirectlyBelowPiece(shadowPuzzle.emptyLocation, pieceOfInterest)
          ) {
            const moveEmptyRight = createMoveEmptyRightAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRight);
            actions.push(moveEmptyRight);

            const moveEmptyUp = createMoveEmptyUpAction(shadowPuzzle);
            shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUp);
            actions.push(moveEmptyUp);
          }

          // Move POI
          shadowPuzzle = puzzleReducer(shadowPuzzle, {
            id: pieceOfInterest.id,
            type: 'move-right',
          });
          actions.push({ id: pieceOfInterest.id, type: 'move-right' });
        }

        lastDirection = currentDirection;
      }
    }
  }

  console.log('Completed slope walk for ', pieceId, ' to target: ', target);
  console.log(puzzleToString(shadowPuzzle));
  return [actions, shadowPuzzle];
}

export function solvePiece(
  puzzle: PuzzleState,
  pieceId: number,
): [PuzzleAction[], PuzzleState] {
  const { rowSize, columnSize } = puzzle;
  // Get piece
  const pieceIndex = puzzle.pieces.findIndex(piece => piece.id === pieceId);
  if (pieceIndex === -1) return [[], puzzle];

  // Get target col, row
  const targetRow = Math.floor((pieceId - 1) / rowSize);
  const targetCol = (pieceId - 1) % rowSize;
  if (
    targetRow < 0 ||
    targetCol < 0 ||
    targetRow >= rowSize ||
    targetCol >= columnSize
  ) {
    console.log('Target slot for ', pieceId, ' is out of bounds: ', {
      targetRow,
      targetCol,
      rowSize,
      columnSize,
    });
    return [[], puzzle];
  }

  const piece = puzzle.pieces[pieceIndex];
  if (targetRow === piece.row && targetCol === piece.column) {
    // Piece is already in target spot
    console.log(pieceId, ' is already in target spot.');
    return [[], puzzle];
  }

  if (targetCol === rowSize - 1) {
    // Last piece in row
    console.log(pieceId, ' is last piece in row.');
    const [actions, shadowPuzzle] = solveLastPieceInRow(puzzle, pieceId, {
      row: targetRow,
      column: targetCol,
    });
    return [actions, shadowPuzzle];
  } else if (targetRow === columnSize - 1) {
    // Last piece in column
    console.log(pieceId, ' is last piece in column.');
    const [actions, shadowPuzzle] = solveLastPieceInColumn(puzzle, pieceId, {
      row: targetRow,
      column: targetCol,
    });
    return [actions, shadowPuzzle];
  } else {
    console.log(pieceId, ' is a standard slot. Target: ', {
      targetRow,
      targetCol,
    });
    // All pieces in row except last
    const actions: PuzzleAction[] = [];
    // Solve for slot at col n < colLength - 1 ( not last piece in row )
    // 1. Walk from empty slot to POI (Piece of interest)
    console.log(`Walking from empty slot to ${pieceId}`);
    console.log(`[${pieceId}] Before:\n`, puzzleToString(puzzle));
    let [newActions, shadowPuzzle] = walkEmptyToPiece(
      puzzle,
      puzzle.pieces[pieceIndex],
    );
    actions.push(...newActions);
    console.log(`[${pieceId}] After:\n`, puzzleToString(shadowPuzzle));

    // Right now we are garuanteed to be touching the POI (left, right, above, below)

    // 2. Perform rotations/slope walk to get POI into a square rotational path w/ the target slot in the top left
    // Loop:
    console.log('Slope walk to: ', { row: targetRow, column: targetCol });
    console.log(`[${pieceId}] Before:\n`, puzzleToString(shadowPuzzle));
    [newActions, shadowPuzzle] = slopeWalkToTarget(shadowPuzzle, pieceId, {
      row: targetRow,
      column: targetCol,
    });
    actions.push(...newActions);
    console.log(`[${pieceId}] After:\n`, puzzleToString(shadowPuzzle));

    // 3. Rotate POI into target slot
    console.log('Rotating ${pieceId} into slot: ', {
      row: targetRow,
      column: targetCol,
    });
    console.log(`[${pieceId}] Before:\n`, puzzleToString(shadowPuzzle));
    [newActions, shadowPuzzle] = rotate(
      shadowPuzzle,
      shadowPuzzle.pieces[pieceIndex],
      {
        row: targetRow,
        column: targetCol,
      },
    );
    actions.push(...newActions);
    console.log(`[${pieceId}] After:\n`, puzzleToString(shadowPuzzle));

    return [actions, shadowPuzzle];
  }

  // Solve for final slot in row
  // Pre. Make target slot -1, -1 from the original target slot
  // 1. Walk from empty slot to POI (Piece of interest)
  // 2. Perform rotations to get POI into a rotational path w/ the target slot
  // 3. Walk empty space into the rotational path
  // 4. Walk POI to ID - 1 slot
  // 5. Rotate rowLen x rowLen ring counter clock-wise
  // 6. Walk empty space to the original target slot
  // 7. Walk to first in row slot (0, 0 for first row)

  // Solve for column

  // Same as non-last piece in row (above)

  // Solve for final slot in column
  // Pre. Make target slot -1, -1 from the original target slot
  // 1. Walk from empty slot to POI (Piece of interest)
  // 2. Perform rotations to get POI into a rotational path w/ the target slot
  // 3. Walk empty space into the rotational path
  // 4. Rotate rowLen x rowLen ring clock-wise
  // 5. Move POI left (into the ring)
  // 6. Move empty slot to original target slot + 1 colspace
  // 7. Full rotation counter clock-wise
}

function solveRow(
  puzzle: PuzzleState,
  rowNumber: number, // 0 - (columnSize - 1)
): [PuzzleAction[], PuzzleState] {
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  let newActions: PuzzleAction[] = [];
  const actions: PuzzleAction[] = [];

  const rowIds = getRowIds(rowNumber, puzzle.rowSize);
  rowIds.forEach(id => {
    console.log('[Row] Solving piece: ', id);
    [newActions, shadowPuzzle] = solvePiece(shadowPuzzle, id);
    actions.push(...newActions);
  });

  return [actions, shadowPuzzle];
}

function solveColumn(
  puzzle: PuzzleState,
  colNumber: number, // 0 - (rowSize - 1)
): [PuzzleAction[], PuzzleState] {
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  let newActions: PuzzleAction[] = [];
  const actions: PuzzleAction[] = [];

  const columnIds = getColumnIds(colNumber, puzzle.columnSize);
  columnIds.forEach(id => {
    console.log('[Column] Solving piece: ', id);
    [newActions, shadowPuzzle] = solvePiece(shadowPuzzle, id);
    actions.push(...newActions);
  });

  return [actions, shadowPuzzle];
}

export function solvePuzzleUpToId(
  puzzle: PuzzleState,
  id: number,
): PuzzleAction[] {
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  let newActions: PuzzleAction[] = [];
  const actions: PuzzleAction[] = [];
  const rowOfPiece = Math.floor((id - 1) / puzzle.columnSize);
  const colOfPiece = (id - 1) % puzzle.rowSize;
  console.log(`${id} belongs at { row: ${rowOfPiece}, col: ${colOfPiece} }`);
  for (let i = 0; i < Math.min(rowOfPiece, colOfPiece); i++) {
    if (i !== rowOfPiece) {
      [newActions, shadowPuzzle] = solveRow(shadowPuzzle, i);
      actions.push(...newActions);
    }
    if (i !== colOfPiece) {
      [newActions, shadowPuzzle] = solveColumn(shadowPuzzle, i);
      actions.push(...newActions);
    }
  }

  console.log('Starting piece by piece steps');

  // Piece by piece steps to get to piece with given ID

  let checkColumns = true;
  const rowIds = getRowIds(Math.min(rowOfPiece, colOfPiece), puzzle.rowSize);
  console.log('Ids in row: ', rowIds);
  for (const rowId of rowIds) {
    if (rowId === id) {
      console.log('Breaking out, on piece we want...');
      checkColumns = false;
      break;
    }
    console.log('[Row] Solving piece: ', rowId);
    [newActions, shadowPuzzle] = solvePiece(shadowPuzzle, rowId);
    actions.push(...newActions);
  }

  if (checkColumns) {
    const columnIds = getColumnIds(
      Math.min(rowOfPiece, colOfPiece),
      puzzle.columnSize,
    );
    for (const columnId of columnIds) {
      if (columnId === id) {
        break;
      }

      console.log('[Column] Solving piece: ', columnId);
      [newActions, shadowPuzzle] = solvePiece(shadowPuzzle, columnId);
      actions.push(...newActions);
    }
  }

  return actions;
}

export function solvePuzzle(puzzle: PuzzleState): PuzzleAction[] {
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  let newActions: PuzzleAction[] = [];
  const actions: PuzzleAction[] = [];

  const rowsToSolve = puzzle.columnSize - 2;
  const columnsToSolve = puzzle.rowSize - 3;

  for (let i = 0; i < rowsToSolve; i++) {
    [newActions, shadowPuzzle] = solveRow(shadowPuzzle, i);
    actions.push(...newActions);
    if (i < columnsToSolve) {
      [newActions, shadowPuzzle] = solveColumn(shadowPuzzle, i);
      actions.push(...newActions);
    }
  }

  console.log('Solving through A* method...');
  console.log(puzzleToString(shadowPuzzle));

  const slicedPuzzle = slicePuzzle(shadowPuzzle, rowsToSolve, columnsToSolve);
  const goal = getPuzzleGoal(slicedPuzzle);

  newActions = aStarSolve(slicedPuzzle, goal);
  actions.push(...newActions);

  // for (let i = 0; i < puzzle.rowSize; i++) {
  //   [newActions, shadowPuzzle] = solveRow(shadowPuzzle, i);
  //   actions.push(...newActions);
  //   [newActions, shadowPuzzle] = solveColumn(shadowPuzzle, i);
  //   actions.push(...newActions);
  // }

  return actions;
}

export function puzzleToString(puzzle: PuzzleState) {
  let puzzleString = '';
  const { rowSize, columnSize } = puzzle;
  const emptyId = rowSize * columnSize;
  const idMaxDigits = Math.floor(Math.log10(rowSize * columnSize) + 1);

  for (let i = 0; i < rowSize; i++) {
    puzzleString += '|';
    for (let j = 0; j < columnSize; j++) {
      const piece = puzzle.pieces.find(
        piece => piece.column === j && piece.row === i,
      );
      if (piece) {
        const digitsInId =
          piece.id === emptyId ? 0 : Math.floor(Math.log10(piece.id) + 1);
        const extraSpaces = idMaxDigits - digitsInId;
        for (let k = 0; k < extraSpaces; k++) {
          puzzleString += ' ';
        }
        if (piece.id === rowSize * columnSize) {
          // Empty
          puzzleString += '|';
        } else {
          puzzleString += `${piece.id}|`;
        }
      }
    }
    puzzleString += '\n';
  }
  return puzzleString;
}

type Range = { start: number; end: number };
type PuzzleSliceOption = number | Range;

export function slicePuzzle(
  puzzle: PuzzleState,
  rowSlice: PuzzleSliceOption,
  columnSlice: PuzzleSliceOption,
): PuzzleState {
  const { rowSize, columnSize, emptyLocation } = puzzle;
  const rowMax = columnSize - 1;
  const columnMax = rowSize - 1;

  let rowStart: number;
  let rowEnd: number;
  let columnStart: number;
  let columnEnd: number;
  if (typeof rowSlice === 'number') {
    rowStart = rowSlice;
    rowEnd = rowMax;
  } else {
    rowStart = rowSlice.start;
    rowEnd = rowSlice.end;
  }

  if (typeof columnSlice === 'number') {
    columnStart = columnSlice;
    columnEnd = columnMax;
  } else {
    columnStart = columnSlice.start;
    columnEnd = columnSlice.end;
  }

  if (
    emptyLocation.row < rowStart ||
    emptyLocation.row > rowEnd ||
    emptyLocation.column < columnStart ||
    emptyLocation.column > columnEnd
  ) {
    throw new Error(
      `Empty Location is outside of the area in the Puzzle that is being split. ${JSON.stringify(
        puzzle,
      )}`,
    );
  }

  const newSlice: PuzzleState = {
    rowSize: columnEnd - columnStart + 1,
    columnSize: rowEnd - rowStart + 1,
    emptyLocation,
    pieces: [],
  };

  let newRow = 0;
  let newColumn = 0;
  for (let row = rowStart; row <= rowEnd; row++) {
    for (let column = columnStart; column <= columnEnd; column++) {
      const piece = puzzle.pieces.find(
        puzzlePiece => puzzlePiece.row === row && puzzlePiece.column === column,
      );
      if (row === emptyLocation.row && column === emptyLocation.column) {
        newSlice.emptyLocation = { row: newRow, column: newColumn };
      }

      if (piece) {
        newSlice.pieces.push({
          id: piece.id,
          row: newRow,
          column: newColumn,
        });
      } else {
        throw new Error(
          `Trying to slice puzzle. No piece at ${JSON.stringify({
            row,
            column,
          })}. ${JSON.stringify(puzzle)}`,
        );
      }
      newColumn++;
    }
    newColumn = 0;
    newRow++;
  }

  return newSlice;
}

export function puzzleToMatrix(puzzle: PuzzleState): number[][] {
  const matrix: number[][] = [];
  const { pieces, columnSize } = puzzle;
  for (let i = 0; i < columnSize; i++) {
    matrix.push([]);
  }

  pieces.forEach((piece, i) => {
    const { row, column } = piece;
    if (
      puzzle.emptyLocation.row === row &&
      puzzle.emptyLocation.column === column
    ) {
      matrix[row][column] = -1;
    } else {
      matrix[row][column] = piece.id;
    }
  });
  return matrix;
}

export function isPuzzleMatrixSolved(puzzle: number[][]): boolean {
  if (puzzle.length === 0 || puzzle[0].length === 0) {
    return true;
  }

  // Add up the distance each piece is from their target piece
  const rowCount = puzzle.length;
  const columnCount = puzzle[0].length;

  for (let row = 0; row < rowCount; row++) {
    for (let column = 0; column < columnCount; column++) {
      const pieceId = puzzle[row][column];
      const goalRow = getTargetRowFromId(pieceId, columnCount);
      if (goalRow !== row) {
        return false;
      }
      const goalColumn = getTargetColumnFromId(pieceId, columnCount);
      if (goalColumn !== column) {
        return false;
      }
    }
  }

  return true;
}

export function puzzleToPuzzleState(
  puzzle: number[][],
  emptyId?: number,
): PuzzleState {
  let state: PuzzleState = {
    pieces: [],
    emptyLocation: { row: -1, column: -1 },
    rowSize: -1,
    columnSize: -1,
  };

  if (puzzle.length === 0 || puzzle[0].length === 0) {
    throw new Error(
      `Cannot create a puzzle with a 0 dimension (from ${JSON.stringify(
        puzzle,
      )}`,
    );
  }

  state.rowSize = puzzle[0].length;
  state.columnSize = puzzle.length;

  const rowCount = state.columnSize;
  const columnCount = state.rowSize;

  for (let row = 0; row < rowCount; row++) {
    for (let column = 0; column < columnCount; column++) {
      const pieceId = puzzle[row][column];
      if (pieceId === -1) {
        // Empty piece
        state.emptyLocation = { row, column };
        state.pieces.push({
          row,
          column,
          id: emptyId || state.rowSize * state.columnSize,
        });
      } else {
        state.pieces.push({
          row,
          column,
          id: pieceId,
        });
      }
    }
  }

  state.pieces.sort((a, b) => a.id - b.id);

  return state;
}

export function getPuzzleGoal(puzzle: PuzzleState): number[][] {
  const matrix: number[][] = [];
  const { columnSize, rowSize } = puzzle;
  for (let i = 0; i < columnSize; i++) {
    matrix.push([]);
  }

  const rowMax = columnSize - 1;
  const columnMax = rowSize - 1;

  const pieces = puzzle.pieces.map(piece => piece.id);
  pieces.sort();

  pieces.forEach((id, i) => {
    const row = Math.floor(i / rowSize);
    const column = i % rowSize;
    matrix[row][column] = id;
  });

  matrix[rowMax][columnMax] = -1;
  return matrix;
}

export function logPuzzle(puzzle: PuzzleState) {
  console.log(puzzleToString(puzzle), puzzle);
}
