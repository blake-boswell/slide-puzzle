import { puzzleReducer } from '../pages/reducers/puzzleReducer';
import { MoveAction, PuzzleSlot, PuzzleState } from '../types/puzzle';
import MinQueue from './MinQueue';
import { puzzleToMatrix, puzzleToPuzzleState } from './puzzleUtils';

interface AStarNode {
  parentId: string | null;
  f: number;
  g: number;
  h: number;
}

interface NodePuzzleDetails extends AStarNode {
  id: string;
  puzzle: number[][];
  emptySlot: PuzzleSlot;
  actions: MoveAction[];
}

export function aStarSolve(
  puzzle: PuzzleState,
  goal: number[][],
): MoveAction[] {
  const { rowSize, columnSize, emptyLocation } = puzzle;
  const emptyPiece = puzzle.pieces.find(
    puzzlePiece =>
      puzzlePiece.row === emptyLocation.row &&
      puzzlePiece.column === emptyLocation.column,
  );
  const EMPTY_ID = emptyPiece ? emptyPiece.id : puzzle.pieces.length;

  // Hold the node details for each puzzleId
  const nodeIdToNodeDetailsMap = new Map<string, NodePuzzleDetails>();

  // DEBUG values
  const __debug_notSeenBefore = new Map<string, NodePuzzleDetails>();
  // Create Open Queue to represent the Nodes that have been visited but not expanded
  const openNodes = new MinQueue<string>();

  // Create Closed Set to represent the Puzzle Ids we have already visited and expanded
  const closedNodes = new Set<string>();

  // Pre-3. Push the starting node on the Open Array
  const puzzleMatrix = puzzleToMatrix(puzzle);
  const startPuzzleString = JSON.stringify(puzzleMatrix);
  const startingHValue = puzzleHeuristic(puzzleMatrix, goal);
  const startDetails: NodePuzzleDetails = {
    parentId: null,
    id: startPuzzleString,
    f: startingHValue,
    g: 0,
    h: startingHValue,
    puzzle: puzzleMatrix,
    emptySlot: puzzle.emptyLocation,
    actions: [],
  };

  nodeIdToNodeDetailsMap.set(startPuzzleString, startDetails);

  openNodes.push(startPuzzleString, startingHValue);

  // WHILE: the Open Array is not empty:
  while (openNodes.length > 0) {
    if (openNodes.length > 100000) {
      console.log('Stopping loop. Hit max nodes');
      break;
    }

    // a. Take from the open list the node node_current with the lowest f score
    const currentId = openNodes.pop();
    const currentNode = nodeIdToNodeDetailsMap.get(currentId);

    // b. If currentNode is goal, we have a solution.
    if (doPuzzlesMatch(currentNode.puzzle, goal)) {
      return currentNode.actions;
    }

    // c. Generate parent's 4 child options and set their parents to parent
    //             (Parent)
    //    /        |        |       \
    // (Left)   (Right)    (Up)   (Down)
    const children: NodePuzzleDetails[] = [];
    const rowMax = columnSize - 1;
    const columnMax = rowSize - 1;
    if (currentNode.emptySlot.column - 1 >= 0) {
      const left = createChildNode(
        currentNode,
        {
          type: 'move-left',
          id: EMPTY_ID,
        },
        EMPTY_ID,
      );
      children.push(left);
    }

    if (currentNode.emptySlot.column + 1 <= columnMax) {
      const right = createChildNode(
        currentNode,
        {
          type: 'move-right',
          id: EMPTY_ID,
        },
        EMPTY_ID,
      );
      children.push(right);
    }

    if (currentNode.emptySlot.row - 1 >= 0) {
      const up = createChildNode(
        currentNode,
        {
          type: 'move-up',
          id: EMPTY_ID,
        },
        EMPTY_ID,
      );
      children.push(up);
    }

    if (currentNode.emptySlot.row + 1 <= rowMax) {
      const down = createChildNode(
        currentNode,
        {
          type: 'move-down',
          id: EMPTY_ID,
        },
        EMPTY_ID,
      );
      children.push(down);
    }

    // d. FOR EACH: Child Option as child:
    for (const child of children) {
      child.g = currentNode.g + 1;
      // Check if it's already on the open list
      openNodes.contains(child.id);

      if (openNodes.contains(child.id)) {
        // Node should be on open list
        const existingNode = nodeIdToNodeDetailsMap.get(child.id);
        if (existingNode) {
          const { g } = existingNode;
          if (g <= child.g) {
            // We have not found a way to get here in less moves
            continue;
          } else {
            // We can get here in less moves
            existingNode.g = child.g;
            existingNode.parentId = child.parentId;
          }
        } else {
          console.error(
            'We claim to have this node as an open node, but have lost the details on it: ',
            child.id,
          );
        }
      } else if (closedNodes.has(child.id)) {
        // We have already closed this node out
        const closedNode = nodeIdToNodeDetailsMap.get(child.id);
        if (closedNode) {
          if (closedNode.g <= child.g) {
            // We have not found a way to get here in less moves
            continue;
          } else {
            // We can get here in less moves, let's reconsider this node (Move from closed -> open)
            const newFScore = closedNode.h + child.g;
            try {
              openNodes.push(child.id, newFScore);
            } catch (err) {
              console.log(err);
            }
            nodeIdToNodeDetailsMap.set(child.id, {
              ...child,
              h: closedNode.h,
              f: newFScore,
            });
            closedNodes.delete(child.id);
          }
        } else {
          console.error(
            'We have already closed this node out, but we have lost the details on it: ',
            child.id,
          );
        }
      } else {
        // Have not seen this one before
        // Add to the open list
        const newPuzzleString = JSON.stringify(child.puzzle);
        const newHeuristicValue = puzzleHeuristic(child.puzzle, goal);
        child.h = newHeuristicValue;
        const newFScore = child.h + child.g;
        child.f = newFScore;
        openNodes.push(child.id, newFScore);
        nodeIdToNodeDetailsMap.set(newPuzzleString, child);
      }
    }
    // END FOR (d)
    // e. Push parent on the Closed Array
    closedNodes.add(currentId);
  }
  // END WHILE

  // Exception
  // Creating some debugging information...
  let __debug_notSeenData: Record<
    string,
    { count: number; values: NodePuzzleDetails[] }
  >;
  // Find duplicates (indicating bug)
  __debug_notSeenBefore.forEach((value, key, map) => {
    __debug_notSeenData === undefined
      ? (__debug_notSeenData = {})
      : (__debug_notSeenData = __debug_notSeenData);
    __debug_notSeenData[key] === undefined
      ? (__debug_notSeenData[key] = { count: 1, values: [value] })
      : (__debug_notSeenData[key] = {
          count: __debug_notSeenData[key].count + 1,
          values: [...__debug_notSeenData[key].values, value],
        });
  });
  const __debug_notSeenDuplicates = Object.keys(__debug_notSeenData)
    .map(key => ({ key, value: __debug_notSeenData[key] }))
    .filter(data => data.value.count > 1);
  console.log(__debug_notSeenDuplicates);

  let __debug_closedNodes: Record<string, number>;
  // Find duplicates (indicating bug)
  closedNodes.forEach((value, key, map) => {
    __debug_closedNodes === undefined
      ? (__debug_closedNodes = {})
      : (__debug_closedNodes = __debug_closedNodes);
    __debug_closedNodes[value] === undefined
      ? (__debug_closedNodes[value] = 1)
      : (__debug_closedNodes[value] = __debug_closedNodes[value]++);
  });
  const __debug_closedNodesDuplicates = Object.keys(__debug_closedNodes)
    .map(key => ({ key, count: __debug_closedNodes[key] }))
    .filter(data => data.count > 1);
  console.log(__debug_closedNodesDuplicates);

  throw new Error('Exhausted all options and found no result.');
}

function createChildNode(
  parent: NodePuzzleDetails,
  action: MoveAction,
  emptyId?: number,
): NodePuzzleDetails {
  const { actions, id: parentId, puzzle, g } = parent;
  const puzzleState = puzzleToPuzzleState(puzzle, emptyId);
  const newPuzzleState = puzzleReducer(puzzleState, action);
  const newPuzzle = puzzleToMatrix(newPuzzleState);

  return {
    id: JSON.stringify(newPuzzle),
    f: -1,
    g: g + 1,
    h: -1,
    parentId,
    puzzle: newPuzzle,
    emptySlot: newPuzzleState.emptyLocation,
    actions: [...actions, action],
  };
}

interface Point {
  x: number;
  y: number;
}

function manhattenDistance(from: Point, to: Point): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

function getRow(puzzle: number[][], id: number) {
  if (puzzle.length === 0 || puzzle[0].length === 0) {
    return -1;
  }

  const rowCount = puzzle.length;
  const columnCount = puzzle[0].length;

  for (let row = 0; row < rowCount; row++) {
    for (let column = 0; column < columnCount; column++) {
      if (id === puzzle[row][column]) {
        return row;
      }
    }
  }
}

function getColumn(puzzle: number[][], id: number) {
  if (puzzle.length === 0 || puzzle[0].length === 0) {
    return -1;
  }

  const rowCount = puzzle.length;
  const columnCount = puzzle[0].length;

  for (let row = 0; row < rowCount; row++) {
    for (let column = 0; column < columnCount; column++) {
      if (id === puzzle[row][column]) {
        return column;
      }
    }
  }
}

function puzzleHeuristic(puzzle: number[][], goal: number[][]): number {
  if (puzzle.length === 0 || puzzle[0].length === 0) {
    return Number.MAX_SAFE_INTEGER;
  }

  // Add up the distance each piece is from their target piece
  let sum = 0;
  const rowCount = puzzle.length;
  const columnCount = puzzle[0].length;

  for (let row = 0; row < rowCount; row++) {
    for (let column = 0; column < columnCount; column++) {
      const pieceId = puzzle[row][column];
      const goalRow = getRow(goal, pieceId);
      const goalColumn = getColumn(goal, pieceId);
      const from: Point = { x: column, y: row };
      const to: Point = { x: goalColumn, y: goalRow };
      sum += manhattenDistance(from, to);
    }
  }
  return sum;
}

function doPuzzlesMatch(puzzle: number[][], goal: number[][]): boolean {
  if (puzzle.length !== goal.length) {
    return false;
  }

  if (
    puzzle.length > 0 &&
    goal.length > 0 &&
    puzzle[0].length !== goal[0].length
  ) {
    return false;
  }

  const rowCount = puzzle.length;
  const columnCount = puzzle[0].length;
  for (let row = 0; row < rowCount; row++) {
    for (let column = 0; column < columnCount; column++) {
      if (puzzle[row][column] !== goal[row][column]) {
        return false;
      }
    }
  }

  return true;
}
