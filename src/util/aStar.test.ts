import { describe, expect, it } from 'vitest';
import { MoveAction, PuzzleState } from '../types/puzzle';
import { aStarSolve } from './aStar';

describe('AStarSearch', () => {
  it('Should solve puzzle [[ -1, 1, 3 ], [ 4, 2, 5 ]] with moves (R-D-R) for the empty slot', () => {
    const state: PuzzleState = {
      pieces: [
        { id: 1, row: 0, column: 1 },
        { id: 2, row: 1, column: 1 },
        { id: 3, row: 0, column: 2 },
        { id: 4, row: 1, column: 0 },
        { id: 5, row: 1, column: 2 },
        { id: 6, row: 0, column: 0 },
      ],
      rowSize: 3,
      columnSize: 2,
      emptyLocation: { row: 0, column: 0 },
    };

    const goal = [[1, 2, 3], [4, 5, -1]];

    const expectedMoves: MoveAction[] = [
      { type: 'move-right', id: 6 },
      { type: 'move-down', id: 6 },
      { type: 'move-right', id: 6 },
    ];

    const moves = aStarSolve(state, goal);
    expect(moves).toMatchObject(expectedMoves);
  });
});
