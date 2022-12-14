import { puzzleReducer } from '../pages/reducers/puzzleReducer';
import {
  Direction,
  PuzzleAction,
  PuzzlePiece,
  PuzzleSlot,
  PuzzleState,
} from '../types/puzzle';
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

function solveLastPieceInRow(
  puzzle: PuzzleState,
  pieceId: number,
  target: PuzzleSlot,
): [PuzzleAction[], PuzzleState] {
  console.log('Solving for last piece in row');
  console.log(puzzleToString(puzzle));
  // Solve for final slot in row
  const actions: PuzzleAction[] = [];
  // Pre. Make target slot to the left of the original target slot to aim for that rotational path
  const offsetTarget: PuzzleSlot = {
    row: target.row,
    column: target.column - 1,
  };
  const pieceIndex = puzzle.pieces.findIndex(piece => piece.id === pieceId);
  // 1. Walk from empty slot to POI (Piece of interest)
  let [newActions, shadowPuzzle] = walkEmptyToPiece(
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
  const ringSize = shadowPuzzle.rowSize - target.column;
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
      let dRow = Math.abs(shadowPuzzle.emptyLocation.row - target.row + 1);
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
  // Pre. Make target slot -1, -1 from the original target slot
  // 1. Walk from empty slot to POI (Piece of interest)
  // 2. Perform rotations to get POI into a rotational path w/ the target slot
  // 3. Walk empty space into the rotational path
  // 4. Rotate rowLen x rowLen ring clock-wise
  // 5. Move POI left (into the ring)
  // 6. Move empty slot to original target slot + 1 colspace
  // 7. Full rotation counter clock-wise
  console.log('Solving for last piece in column');
  console.log(puzzleToString(puzzle));
  // Solve for final slot in row
  const actions: PuzzleAction[] = [];
  // Pre. Make target slot up and to the right of the original target slot to aim for that rotational path
  const offsetTarget: PuzzleSlot = {
    row: target.row - 1,
    column: target.column + 1,
  };
  const pieceIndex = puzzle.pieces.findIndex(piece => piece.id === pieceId);
  // 1. Walk from empty slot to POI (Piece of interest)
  let [newActions, shadowPuzzle] = walkEmptyToPiece(
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

  // 5. Move in CCW ring until empty space is left of POI
  // - Move down until last column
  for (
    let dCol = Math.abs(
      shadowPuzzle.rowSize - shadowPuzzle.emptyLocation.column,
    );
    dCol > 0;
    dCol--
  ) {
    const moveEmptyRightAction = createMoveEmptyRightAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAction);
    actions.push(moveEmptyRightAction);
  }

  // - Move up {ringSize} rows
  for (let dRow = ringSize; dRow > 0; dRow--) {
    const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
    actions.push(moveEmptyUpAction);
  }

  // - Move left {ringSize} columns
  for (let dCol = ringSize; dCol > 0; dCol--) {
    const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
    actions.push(moveEmptyLeftAction);
  }

  // - Move down until row of POI
  for (let dRow = shadowPuzzle.pieces[pieceIndex].row; dRow > 0; dRow--) {
    const moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
    actions.push(moveEmptyDownAction);
  }

  // 6. Move POI left
  const movePieceLeftAction: PuzzleAction = { id: pieceId, type: 'move-left' };
  shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceLeftAction);
  actions.push(movePieceLeftAction);

  // 7. CW rotation of ring
  // - Move empty down
  let moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
  shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
  actions.push(moveEmptyDownAction);

  const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
  shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
  actions.push(moveEmptyLeftAction);

  // - Move up {ringSize} rows
  for (let dRow = ringSize; dRow > 0; dRow--) {
    const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
    shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
    actions.push(moveEmptyUpAction);
  }

  // - Move right to last column
  for (
    let dCol = shadowPuzzle.rowSize - shadowPuzzle.emptyLocation.column;
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

  return [actions, shadowPuzzle];
}

function isInSquareRing(
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
    // Return -1 to indicate it is not in the ring path
    return false;
  }

  // Check 2x2 ring
  const validRowStart = targetRow;
  const validRowEnd = targetRow + 1;
  const validColStart = targetCol;
  const validColEnd = targetCol + 1;
  if (validRowEnd < rowSize && validColEnd < columnSize) {
    if (
      ((piece.column === validColStart || piece.column === validColEnd) &&
        (validRowStart <= piece.row && piece.row <= validRowEnd)) ||
      ((piece.row === validRowStart || piece.row === validRowEnd) &&
        (validColStart <= piece.column && piece.column <= validColEnd))
    ) {
      // Piece is in the square rotational ring path. Return ring size
      return true;
    }
  }

  // Return -1 to indicate it is not in the ring path
  return false;
}

function getDeltaRow(piece: PuzzlePiece, targetRow: number) {
  return targetRow - piece.row;
}

function getDeltaColumn(piece: PuzzlePiece, targetColumn: number) {
  return targetColumn - piece.column;
}

function isDirectlyAbovePiece(slot: PuzzleSlot, piece: PuzzlePiece) {
  if (slot.row + 1 === piece.row && slot.column === piece.column) {
    return true;
  }
  return false;
}

function isDirectlyBelowPiece(slot: PuzzleSlot, piece: PuzzlePiece) {
  if (slot.row === piece.row + 1 && slot.column === piece.column) {
    return true;
  }
  return false;
}

function isDirectlyLeftOfPiece(slot: PuzzleSlot, piece: PuzzlePiece) {
  if (slot.column + 1 === piece.column && slot.row === piece.row) {
    return true;
  }
  return false;
}

function isDirectlyRightOfPiece(slot: PuzzleSlot, piece: PuzzlePiece) {
  if (slot.column === piece.column + 1 && slot.row === piece.row) {
    return true;
  }
  return false;
}

function isRightOfPiece(slot: PuzzleSlot, piece: PuzzlePiece) {
  if (slot.column > piece.column && slot.row === piece.row) {
    return true;
  }
  return false;
}

function getPieceAt(puzzle: PuzzleState, row: number, column: number) {
  const piece = puzzle.pieces.find(
    puzzlePiece => puzzlePiece.row === row && puzzlePiece.column === column,
  );
  return piece;
}

function getPieceIdAt(puzzle: PuzzleState, row: number, column: number) {
  const piece = getPieceAt(puzzle, row, column);
  if (piece) return piece.id;
  return -1;
}

function createMoveEmptyUpAction(puzzle: PuzzleState): PuzzleAction {
  return {
    id: getPieceIdAt(
      puzzle,
      puzzle.emptyLocation.row - 1,
      puzzle.emptyLocation.column,
    ),
    type: 'move-down',
  };
}

function createMoveEmptyDownAction(puzzle: PuzzleState): PuzzleAction {
  return {
    id: getPieceIdAt(
      puzzle,
      puzzle.emptyLocation.row + 1,
      puzzle.emptyLocation.column,
    ),
    type: 'move-up',
  };
}

function createMoveEmptyRightAction(puzzle: PuzzleState): PuzzleAction {
  return {
    id: getPieceIdAt(
      puzzle,
      puzzle.emptyLocation.row,
      puzzle.emptyLocation.column + 1,
    ),
    type: 'move-left',
  };
}

function createMoveEmptyLeftAction(puzzle: PuzzleState): PuzzleAction {
  return {
    id: getPieceIdAt(
      puzzle,
      puzzle.emptyLocation.row,
      puzzle.emptyLocation.column - 1,
    ),
    type: 'move-right',
  };
}

function rotate(
  puzzle: PuzzleState,
  piece: PuzzlePiece,
  target: PuzzleSlot,
): [PuzzleAction[], PuzzleState] {
  let actions: PuzzleAction[] = [];
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  if (isDirectlyLeftOfPiece(target, piece)) {
    // Target is directly left of piece
    // | T | P | E1|
    // | x | E2|   | , where E1 and E2 are possible empty slots to get P where it is
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
    } else if (isDirectlyRightOfPiece(shadowPuzzle.emptyLocation, piece)) {
      // E1
      const moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
      actions.push(moveEmptyDownAction);

      const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
      actions.push(moveEmptyLeftAction);

      const moveEmptyLeftAgainAction = createMoveEmptyLeftAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAgainAction);
      actions.push(moveEmptyLeftAgainAction);

      const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
      actions.push(moveEmptyUpAction);

      const movePieceLeftAction: PuzzleAction = {
        id: piece.id,
        type: 'move-left',
      };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceLeftAction);
      actions.push(movePieceLeftAction);
    } else if (isDirectlyBelowPiece(shadowPuzzle.emptyLocation, piece)) {
      // E2
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
    } else {
      // Error. I should not go here
      console.error('Cannot rotate piece to target ', target);
      logPuzzle(shadowPuzzle);
    }
  } else if (isDirectlyAbovePiece(target, piece)) {
    // Target is directly above piece
    // |   | T | x |
    // | E3| P | E1|
    // |   | E2|   | , where E1 and E2 are possible empty slots to get P where it is
    if (
      target.row === shadowPuzzle.emptyLocation.row &&
      target.column === shadowPuzzle.emptyLocation.column
    ) {
      // Target slot is the empty slot
      const movePieceUpAction: PuzzleAction = { id: piece.id, type: 'move-up' };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceUpAction);
      actions.push(movePieceUpAction);
    } else if (isDirectlyRightOfPiece(shadowPuzzle.emptyLocation, piece)) {
      // E1
      const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
      actions.push(moveEmptyUpAction);

      const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
      actions.push(moveEmptyLeftAction);

      const movePieceUpAction: PuzzleAction = { id: piece.id, type: 'move-up' };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceUpAction);
      actions.push(movePieceUpAction);
    } else if (isDirectlyBelowPiece(shadowPuzzle.emptyLocation, piece)) {
      // E2
      const moveEmptyRightAction = createMoveEmptyRightAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAction);
      actions.push(moveEmptyRightAction);

      const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
      actions.push(moveEmptyUpAction);

      const moveEmptyUpAgainAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAgainAction);
      actions.push(moveEmptyUpAgainAction);

      const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
      actions.push(moveEmptyLeftAction);

      const movePieceUpAction: PuzzleAction = { id: piece.id, type: 'move-up' };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceUpAction);
      actions.push(movePieceUpAction);
    } else if (isDirectlyLeftOfPiece(shadowPuzzle.emptyLocation, piece)) {
      // E3
      const moveEmptyDownAction = createMoveEmptyDownAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyDownAction);
      actions.push(moveEmptyDownAction);

      const moveEmptyRightAction = createMoveEmptyRightAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAction);
      actions.push(moveEmptyRightAction);

      const moveEmptyRightAgainAction = createMoveEmptyRightAction(
        shadowPuzzle,
      );
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyRightAgainAction);
      actions.push(moveEmptyRightAgainAction);

      const moveEmptyUpAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAction);
      actions.push(moveEmptyUpAction);

      const moveEmptyUpAgainAction = createMoveEmptyUpAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyUpAgainAction);
      actions.push(moveEmptyUpAgainAction);

      const moveEmptyLeftAction = createMoveEmptyLeftAction(shadowPuzzle);
      shadowPuzzle = puzzleReducer(shadowPuzzle, moveEmptyLeftAction);
      actions.push(moveEmptyLeftAction);

      const movePieceUpAction: PuzzleAction = { id: piece.id, type: 'move-up' };
      shadowPuzzle = puzzleReducer(shadowPuzzle, movePieceUpAction);
      actions.push(movePieceUpAction);
    } else {
      // Error. I should not go here
      console.error('Cannot rotate piece to target ', target);
      logPuzzle(shadowPuzzle);
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

  return [actions, shadowPuzzle];
}

function walkEmptyToPiece(
  puzzle: PuzzleState,
  piece: PuzzlePiece,
): [PuzzleAction[], PuzzleState] {
  // Locate empty slot
  const { row: emptyRow, column: emptyCol } = puzzle.emptyLocation;
  const { row: initialRow, column: initialColumn, id: pieceId } = piece;

  // Solve for row
  const actions: PuzzleAction[] = [];
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));

  // Find delta row and delta col
  // (-) row points up, (-) col points left
  const dRow = emptyRow - initialRow;
  const dCol = emptyCol - initialColumn;
  // Check if we can skip this step
  if (dRow !== 0 || dCol !== 0) {
    let touchingTargetPiece = false;
    // Move up/down
    let direction: PuzzleAction['type'] = dRow > 0 ? 'move-down' : 'move-up';
    for (
      let remainingRowMoves = Math.abs(dRow);
      remainingRowMoves > 0 && !touchingTargetPiece;
      remainingRowMoves--
    ) {
      if (remainingRowMoves === 1 && direction === 'move-up') {
        // Prevent upwards movement if on the row below the target
        // This is done to ensure we don't mess with any slots already solved
        break;
      }

      console.log('Move up/down. Remaining moves: ', remainingRowMoves);
      logPuzzle(shadowPuzzle);
      const currentEmptyCol = shadowPuzzle.emptyLocation.column;
      const currentEmptyRow = shadowPuzzle.emptyLocation.row;
      // Get piece ID above/below empty space
      const verticalDiff = direction === 'move-up' ? -1 : 1;
      const pieceToMove = shadowPuzzle.pieces.find(
        piece =>
          piece.column === currentEmptyCol &&
          piece.row + verticalDiff === currentEmptyRow,
      );
      if (pieceToMove) {
        if (pieceToMove.id === pieceId) {
          // Stop. Don't intend to move target piece in this step
          touchingTargetPiece = true;
        } else {
          const action: PuzzleAction = {
            id: pieceToMove.id,
            type: direction,
          };
          // Update shadow puzzle
          shadowPuzzle = puzzleReducer(shadowPuzzle, action);
          actions.push(action);
        }
      }
    }

    // Move left/right
    direction = dCol > 0 ? 'move-right' : 'move-left';
    for (
      let remainingColMoves = Math.abs(dCol);
      remainingColMoves > 0 && !touchingTargetPiece;
      remainingColMoves--
    ) {
      console.log('Move left/right. Remaining moves: ', remainingColMoves);
      logPuzzle(shadowPuzzle);
      const currentEmptyCol = shadowPuzzle.emptyLocation.column;
      const currentEmptyRow = shadowPuzzle.emptyLocation.row;
      // Get piece ID left/right empty space
      const horizontalDiff = direction === 'move-left' ? -1 : 1;
      const pieceToMove = shadowPuzzle.pieces.find(
        piece =>
          piece.column + horizontalDiff === currentEmptyCol &&
          piece.row === currentEmptyRow,
      );
      if (pieceToMove) {
        if (pieceToMove.id === pieceId) {
          // Stop. Don't intend to move target piece in this step
          touchingTargetPiece = true;
        } else {
          const action: PuzzleAction = {
            id: pieceToMove.id,
            type: direction,
          };
          // Update shadow puzzle
          shadowPuzzle = puzzleReducer(shadowPuzzle, action);
          actions.push(action);
        }
      }
    }
  }

  return [actions, shadowPuzzle];
}

function slopeWalkToTarget(
  puzzle: PuzzleState,
  pieceId: number,
  target: PuzzleSlot,
): [PuzzleAction[], PuzzleState] {
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
      const dRow = getDeltaRow(pieceOfInterest, targetRow);
      const dCol = getDeltaColumn(pieceOfInterest, targetCol);
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
    console.log(`[${pieceId}] Before: `, puzzleToString(puzzle));
    let [newActions, shadowPuzzle] = walkEmptyToPiece(
      puzzle,
      puzzle.pieces[pieceIndex],
    );
    actions.push(...newActions);
    console.log(`[${pieceId}] After: `, puzzleToString(shadowPuzzle));

    // Right now we are garuanteed to be touching the POI (left, right, above, below)

    // 2. Perform rotations/slope walk to get POI into a square rotational path w/ the target slot in the top left
    // Loop:
    console.log(`Slope walk to ${{ row: targetRow, column: targetCol }}`);
    console.log(`[${pieceId}] Before: `, puzzleToString(shadowPuzzle));
    [newActions, shadowPuzzle] = slopeWalkToTarget(shadowPuzzle, pieceId, {
      row: targetRow,
      column: targetCol,
    });
    actions.push(...newActions);
    console.log(`[${pieceId}] After: `, puzzleToString(shadowPuzzle));

    // 3. Rotate POI into target slot
    console.log(
      `Rotating ${pieceId} into slot ${{ row: targetRow, column: targetCol }}`,
    );
    console.log(`[${pieceId}] Before: `, puzzleToString(shadowPuzzle));
    [newActions, shadowPuzzle] = rotate(
      shadowPuzzle,
      shadowPuzzle.pieces[pieceIndex],
      {
        row: targetRow,
        column: targetCol,
      },
    );
    actions.push(...newActions);
    console.log(`[${pieceId}] After: `, puzzleToString(shadowPuzzle));

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

  // Iterate from slot along the diagonal to end of row
  // |a1|a2|a3|
  // |  |b1|b2|
  // |  |  |c1|, where a corresponds to row 0, b to row 1, c to row 2. Diagonal of a1, b1, c1.
  const { columnSize } = puzzle;
  const end = rowNumber * columnSize + columnSize;
  for (let i = 1; i <= end; i++) {
    const id = rowNumber * columnSize + i + rowNumber;
    [newActions, shadowPuzzle] = solvePiece(shadowPuzzle, id);
    actions.push(...newActions);
  }

  return [actions, shadowPuzzle];
}

function solveColumn(
  puzzle: PuzzleState,
  colNumber: number, // 0 - (rowSize - 1)
): [PuzzleAction[], PuzzleState] {
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  let newActions: PuzzleAction[] = [];
  const actions: PuzzleAction[] = [];

  // Iterate from slot below the diagonal to end of column
  // |  |  |  |
  // |a1|  |  |
  // |a2|b1|  |, where a corresponds to col 0, b to col 1.
  const { rowSize } = puzzle;
  for (let i = 1; i <= rowSize - colNumber; i++) {
    const id = rowSize * (i + colNumber) + colNumber + 1;
    [newActions, shadowPuzzle] = solvePiece(shadowPuzzle, id);
    actions.push(...newActions);
  }

  return [actions, shadowPuzzle];
}

export function solvePuzzle(puzzle: PuzzleState): PuzzleAction[] {
  let shadowPuzzle: PuzzleState = JSON.parse(JSON.stringify(puzzle));
  let newActions: PuzzleAction[] = [];
  const actions: PuzzleAction[] = [];
  for (let i = 0; i < puzzle.rowSize; i++) {
    [newActions, shadowPuzzle] = solveRow(shadowPuzzle, i);
    actions.push(...newActions);
    [newActions, shadowPuzzle] = solveColumn(shadowPuzzle, i);
    actions.push(...newActions);
  }

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

export function logPuzzle(puzzle: PuzzleState) {
  console.log(puzzleToString(puzzle), puzzle);
}
