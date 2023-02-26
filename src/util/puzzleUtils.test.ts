import { describe, expect, it } from 'vitest';
import { PuzzlePiece, PuzzleState } from '../types/puzzle';
import {
  getColumnIds,
  getDeltaColumn,
  getDeltaRow,
  getPieceAt,
  getPieceIdAt,
  getRowIds,
  getRowNumberFromBottom,
  isDirectlyAbovePiece,
  isDirectlyBelowPiece,
  isDirectlyLeftOfPiece,
  isDirectlyRightOfPiece,
  isInSquareRing,
  isRightOfPiece,
  puzzleToMatrix,
  puzzleToPuzzleState,
  slicePuzzle,
} from './puzzleUtils';

describe('getRowNumberFromBottom', () => {
  it('Returns 1 when empty piece is anywhere on the last row', () => {
    expect(getRowNumberFromBottom(5, 24)).toStrictEqual(1);
    expect(getRowNumberFromBottom(5, 23)).toStrictEqual(1);
    expect(getRowNumberFromBottom(5, 22)).toStrictEqual(1);
    expect(getRowNumberFromBottom(5, 21)).toStrictEqual(1);
    expect(getRowNumberFromBottom(5, 20)).toStrictEqual(1);
    expect(getRowNumberFromBottom(4, 15)).toStrictEqual(1);
    expect(getRowNumberFromBottom(4, 14)).toStrictEqual(1);
    expect(getRowNumberFromBottom(4, 13)).toStrictEqual(1);
    expect(getRowNumberFromBottom(4, 12)).toStrictEqual(1);
    expect(getRowNumberFromBottom(3, 8)).toStrictEqual(1);
    expect(getRowNumberFromBottom(3, 7)).toStrictEqual(1);
    expect(getRowNumberFromBottom(3, 6)).toStrictEqual(1);
  });

  it('Returns 2 when empty piece is anywhere on the second-to-last row', () => {
    expect(getRowNumberFromBottom(5, 19)).toStrictEqual(2);
    expect(getRowNumberFromBottom(5, 18)).toStrictEqual(2);
    expect(getRowNumberFromBottom(5, 17)).toStrictEqual(2);
    expect(getRowNumberFromBottom(5, 16)).toStrictEqual(2);
    expect(getRowNumberFromBottom(5, 15)).toStrictEqual(2);
    expect(getRowNumberFromBottom(4, 11)).toStrictEqual(2);
    expect(getRowNumberFromBottom(4, 10)).toStrictEqual(2);
    expect(getRowNumberFromBottom(4, 9)).toStrictEqual(2);
    expect(getRowNumberFromBottom(4, 8)).toStrictEqual(2);
    expect(getRowNumberFromBottom(3, 5)).toStrictEqual(2);
    expect(getRowNumberFromBottom(3, 4)).toStrictEqual(2);
    expect(getRowNumberFromBottom(3, 3)).toStrictEqual(2);
  });

  it('Returns 3 when empty piece is anywhere on the third-to-last row', () => {
    expect(getRowNumberFromBottom(5, 14)).toStrictEqual(3);
    expect(getRowNumberFromBottom(5, 13)).toStrictEqual(3);
    expect(getRowNumberFromBottom(5, 12)).toStrictEqual(3);
    expect(getRowNumberFromBottom(5, 11)).toStrictEqual(3);
    expect(getRowNumberFromBottom(5, 10)).toStrictEqual(3);
    expect(getRowNumberFromBottom(4, 7)).toStrictEqual(3);
    expect(getRowNumberFromBottom(4, 6)).toStrictEqual(3);
    expect(getRowNumberFromBottom(4, 5)).toStrictEqual(3);
    expect(getRowNumberFromBottom(4, 4)).toStrictEqual(3);
    expect(getRowNumberFromBottom(3, 2)).toStrictEqual(3);
    expect(getRowNumberFromBottom(3, 1)).toStrictEqual(3);
    expect(getRowNumberFromBottom(3, 0)).toStrictEqual(3);
  });

  it('Returns 4 when empty piece is anywhere on the fourth-to-last row', () => {
    expect(getRowNumberFromBottom(5, 9)).toStrictEqual(4);
    expect(getRowNumberFromBottom(5, 8)).toStrictEqual(4);
    expect(getRowNumberFromBottom(5, 7)).toStrictEqual(4);
    expect(getRowNumberFromBottom(5, 6)).toStrictEqual(4);
    expect(getRowNumberFromBottom(5, 5)).toStrictEqual(4);
    expect(getRowNumberFromBottom(4, 3)).toStrictEqual(4);
    expect(getRowNumberFromBottom(4, 2)).toStrictEqual(4);
    expect(getRowNumberFromBottom(4, 1)).toStrictEqual(4);
    expect(getRowNumberFromBottom(4, 0)).toStrictEqual(4);
  });
});

// Puzzle relative location
describe('isInSquareRing', () => {
  // | x| y| n|
  // | y| y| n|
  // | n| n| n|
  it('should return true ONLY for the piece directly to the right of, below, and diagonally to the target, along with the target slot', () => {
    const puzzle: PuzzleState = {
      columnSize: 3,
      rowSize: 3,
      emptyLocation: {
        row: 2,
        column: 2,
      },
      pieces: [
        { row: 0, column: 0, id: 1 },
        { row: 0, column: 1, id: 2 },
        { row: 0, column: 2, id: 3 },
        { row: 1, column: 0, id: 4 },
        { row: 1, column: 1, id: 5 },
        { row: 1, column: 2, id: 6 },
        { row: 2, column: 0, id: 7 },
        { row: 2, column: 1, id: 8 },
        { row: 2, column: 2, id: 9 },
      ],
    };

    // | x| y| n|
    // | y| y| n|
    // | n| n| n|
    expect(
      isInSquareRing(puzzle, { row: 0, column: 0, id: 1 }, 0, 0),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 1, id: 2 }, 0, 0),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 2, id: 3 }, 0, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 0, id: 4 }, 0, 0),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 1, id: 5 }, 0, 0),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 2, id: 6 }, 0, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 0, id: 7 }, 0, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 1, id: 8 }, 0, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 2, id: 9 }, 0, 0),
    ).toStrictEqual(false);

    // | n| x| y|
    // | n| y| y|
    // | n| n| n|
    expect(
      isInSquareRing(puzzle, { row: 0, column: 0, id: 1 }, 0, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 1, id: 2 }, 0, 1),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 2, id: 3 }, 0, 1),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 0, id: 4 }, 0, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 1, id: 5 }, 0, 1),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 2, id: 6 }, 0, 1),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 0, id: 7 }, 0, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 1, id: 8 }, 0, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 2, id: 9 }, 0, 1),
    ).toStrictEqual(false);

    // | n| n| x|
    // | n| n| y|
    // | n| n| n|
    expect(
      isInSquareRing(puzzle, { row: 0, column: 0, id: 1 }, 0, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 1, id: 2 }, 0, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 2, id: 3 }, 0, 2),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 0, id: 4 }, 0, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 1, id: 5 }, 0, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 2, id: 6 }, 0, 2),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 0, id: 7 }, 0, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 1, id: 8 }, 0, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 2, id: 9 }, 0, 2),
    ).toStrictEqual(false);

    // | n| n| n|
    // | x| y| n|
    // | y| y| n|
    expect(
      isInSquareRing(puzzle, { row: 0, column: 0, id: 1 }, 1, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 1, id: 2 }, 1, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 2, id: 3 }, 1, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 0, id: 4 }, 1, 0),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 1, id: 5 }, 1, 0),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 2, id: 6 }, 1, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 0, id: 7 }, 1, 0),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 1, id: 8 }, 1, 0),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 2, id: 9 }, 1, 0),
    ).toStrictEqual(false);

    // | n| n| n|
    // | n| x| y|
    // | n| y| y|
    expect(
      isInSquareRing(puzzle, { row: 0, column: 0, id: 1 }, 1, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 1, id: 2 }, 1, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 2, id: 3 }, 1, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 0, id: 4 }, 1, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 1, id: 5 }, 1, 1),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 2, id: 6 }, 1, 1),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 0, id: 7 }, 1, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 1, id: 8 }, 1, 1),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 2, id: 9 }, 1, 1),
    ).toStrictEqual(true);

    // | n| n| n|
    // | n| n| x|
    // | n| n| y|
    expect(
      isInSquareRing(puzzle, { row: 0, column: 0, id: 1 }, 1, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 1, id: 2 }, 1, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 2, id: 3 }, 1, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 0, id: 4 }, 1, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 1, id: 5 }, 1, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 2, id: 6 }, 1, 2),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 0, id: 7 }, 1, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 1, id: 8 }, 1, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 2, id: 9 }, 1, 2),
    ).toStrictEqual(true);

    // | n| n| n|
    // | n| n| n|
    // | x| y| n|
    expect(
      isInSquareRing(puzzle, { row: 0, column: 0, id: 1 }, 2, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 1, id: 2 }, 2, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 2, id: 3 }, 2, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 0, id: 4 }, 2, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 1, id: 5 }, 2, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 2, id: 6 }, 2, 0),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 0, id: 7 }, 2, 0),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 1, id: 8 }, 2, 0),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 2, id: 9 }, 2, 0),
    ).toStrictEqual(false);

    // | n| n| n|
    // | n| n| n|
    // | n| x| y|
    expect(
      isInSquareRing(puzzle, { row: 0, column: 0, id: 1 }, 2, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 1, id: 2 }, 2, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 2, id: 3 }, 2, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 0, id: 4 }, 2, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 1, id: 5 }, 2, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 2, id: 6 }, 2, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 0, id: 7 }, 2, 1),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 1, id: 8 }, 2, 1),
    ).toStrictEqual(true);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 2, id: 9 }, 2, 1),
    ).toStrictEqual(true);

    // | n| n| n|
    // | n| n| n|
    // | n| n| x|
    expect(
      isInSquareRing(puzzle, { row: 0, column: 0, id: 1 }, 2, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 1, id: 2 }, 2, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 0, column: 2, id: 3 }, 2, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 0, id: 4 }, 2, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 1, id: 5 }, 2, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 1, column: 2, id: 6 }, 2, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 0, id: 7 }, 2, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 1, id: 8 }, 2, 2),
    ).toStrictEqual(false);
    expect(
      isInSquareRing(puzzle, { row: 2, column: 2, id: 9 }, 2, 2),
    ).toStrictEqual(true);
  });
});

describe('getRowIds', () => {
  it('returns all the IDs for the first row', () => {
    const firstRow3x3 = [1, 2, 3];
    const firstRow4x4 = [1, 2, 3, 4];
    const firstRow5x5 = [1, 2, 3, 4, 5];
    const firstRow20x20 = [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
    ];

    expect(getRowIds(0, 3)).toMatchObject(firstRow3x3);
    expect(getRowIds(0, 4)).toMatchObject(firstRow4x4);
    expect(getRowIds(0, 5)).toMatchObject(firstRow5x5);
    expect(getRowIds(0, 20)).toMatchObject(firstRow20x20);
  });

  it('returns all the IDs for the second row', () => {
    const secondRow3x3 = [4, 5, 6];
    const secondRow4x4 = [5, 6, 7, 8];
    const secondRow5x5 = [6, 7, 8, 9, 10];
    const secondRow20x20 = [
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36,
      37,
      38,
      39,
      40,
    ];

    expect(getRowIds(1, 3)).toMatchObject(secondRow3x3);
    expect(getRowIds(1, 4)).toMatchObject(secondRow4x4);
    expect(getRowIds(1, 5)).toMatchObject(secondRow5x5);
    expect(getRowIds(1, 20)).toMatchObject(secondRow20x20);
  });

  it('returns all the IDs for any given row n', () => {
    for (let n = 0; n < 3; n++) {
      const nthRow3x3 = [3 * n + 1, 3 * n + 2, 3 * n + 3];
      expect(getRowIds(n, 3)).toMatchObject(nthRow3x3);
    }

    for (let n = 0; n < 4; n++) {
      const nthRow4x4 = [4 * n + 1, 4 * n + 2, 4 * n + 3, 4 * n + 4];
      expect(getRowIds(n, 4)).toMatchObject(nthRow4x4);
    }

    for (let n = 0; n < 5; n++) {
      const nthRow5x5 = [5 * n + 1, 5 * n + 2, 5 * n + 3, 5 * n + 4, 5 * n + 5];
      expect(getRowIds(n, 5)).toMatchObject(nthRow5x5);
    }

    for (let size = 6; size < 20; size++) {
      for (let n = 0; n < size; n++) {
        const nthRowSizexSize = [];
        for (let col = 0; col < size; col++) {
          nthRowSizexSize.push(size * n + col + 1);
        }
        expect(getRowIds(n, size)).toMatchObject(nthRowSizexSize);
      }
    }

    for (let n = 0; n < 20; n++) {
      const nthRow20x20 = [];
      for (let col = 0; col < 20; col++) {
        nthRow20x20.push(20 * n + col + 1);
      }
      expect(getRowIds(n, 20)).toMatchObject(nthRow20x20);
    }
  });

  it('returns all the IDs for the last row', () => {
    const lastRow3x3 = [7, 8, 9];
    const lastRow4x4 = [13, 14, 15, 16];
    const lastRow5x5 = [21, 22, 23, 24, 25];
    const lastRow20x20 = [
      381,
      382,
      383,
      384,
      385,
      386,
      387,
      388,
      389,
      390,
      391,
      392,
      393,
      394,
      395,
      396,
      397,
      398,
      399,
      400,
    ];

    expect(getRowIds(2, 3)).toMatchObject(lastRow3x3);
    expect(getRowIds(3, 4)).toMatchObject(lastRow4x4);
    expect(getRowIds(4, 5)).toMatchObject(lastRow5x5);
    expect(getRowIds(19, 20)).toMatchObject(lastRow20x20);
  });
});

describe('getColumnIds', () => {
  it('returns all the IDs for the first column', () => {
    const firstColumn3x3 = [1, 4, 7];
    const firstColumn4x4 = [1, 5, 9, 13];
    const firstColumn5x5 = [1, 6, 11, 16, 21];
    const firstColumn20x20 = [
      1,
      21,
      41,
      61,
      81,
      101,
      121,
      141,
      161,
      181,
      201,
      221,
      241,
      261,
      281,
      301,
      321,
      341,
      361,
      381,
    ];

    expect(getColumnIds(0, 3)).toMatchObject(firstColumn3x3);
    expect(getColumnIds(0, 4)).toMatchObject(firstColumn4x4);
    expect(getColumnIds(0, 5)).toMatchObject(firstColumn5x5);
    expect(getColumnIds(0, 20)).toMatchObject(firstColumn20x20);
  });

  it('returns all the IDs for the second column', () => {
    const secondColumn3x3 = [2, 5, 8];
    const secondColumn4x4 = [2, 6, 10, 14];
    const secondColumn5x5 = [2, 7, 12, 17, 22];
    const secondColumn20x20 = [
      2,
      22,
      42,
      62,
      82,
      102,
      122,
      142,
      162,
      182,
      202,
      222,
      242,
      262,
      282,
      302,
      322,
      342,
      362,
      382,
    ];

    expect(getColumnIds(1, 3)).toMatchObject(secondColumn3x3);
    expect(getColumnIds(1, 4)).toMatchObject(secondColumn4x4);
    expect(getColumnIds(1, 5)).toMatchObject(secondColumn5x5);
    expect(getColumnIds(1, 20)).toMatchObject(secondColumn20x20);
  });

  it('returns all the IDs for the nth column', () => {
    for (let n = 0; n < 3; n++) {
      const nthColumn3x3 = [1 + n, 4 + n, 7 + n];
      expect(getColumnIds(n, 3)).toMatchObject(nthColumn3x3);
    }

    for (let n = 0; n < 4; n++) {
      const nthColumn4x4 = [1 + n, 5 + n, 9 + n, 13 + n];
      expect(getColumnIds(n, 4)).toMatchObject(nthColumn4x4);
    }

    for (let n = 0; n < 5; n++) {
      const nthColumn5x5 = [1 + n, 6 + n, 11 + n, 16 + n, 21 + n];
      expect(getColumnIds(n, 5)).toMatchObject(nthColumn5x5);
    }

    for (let size = 6; size < 20; size++) {
      for (let n = 0; n < size; n++) {
        const nthColumnSizexSize = [];
        for (let col = 0; col < size; col++) {
          nthColumnSizexSize.push(1 + col * size + n);
        }
        expect(getColumnIds(n, size)).toMatchObject(nthColumnSizexSize);
      }
    }

    for (let n = 0; n < 20; n++) {
      const nthColumn20x20 = [
        1 + n,
        21 + n,
        41 + n,
        61 + n,
        81 + n,
        101 + n,
        121 + n,
        141 + n,
        161 + n,
        181 + n,
        201 + n,
        221 + n,
        241 + n,
        261 + n,
        281 + n,
        301 + n,
        321 + n,
        341 + n,
        361 + n,
        381 + n,
      ];
      expect(getColumnIds(n, 20)).toMatchObject(nthColumn20x20);
    }
  });

  it('returns all the IDs for the last column', () => {
    const lastColumn3x3 = [3, 6, 9];
    const lastColumn4x4 = [4, 8, 12, 16];
    const lastColumn5x5 = [5, 10, 15, 20, 25];
    const lastColumn20x20 = [
      20,
      40,
      60,
      80,
      100,
      120,
      140,
      160,
      180,
      200,
      220,
      240,
      260,
      280,
      300,
      320,
      340,
      360,
      380,
      400,
    ];

    expect(getColumnIds(2, 3)).toMatchObject(lastColumn3x3);
    expect(getColumnIds(3, 4)).toMatchObject(lastColumn4x4);
    expect(getColumnIds(4, 5)).toMatchObject(lastColumn5x5);
    expect(getColumnIds(19, 20)).toMatchObject(lastColumn20x20);
  });
});

describe('getDeltaRow', () => {
  it("should return the difference between the piece's row and the target slot's row", () => {
    const puzzle: PuzzleState = {
      columnSize: 3,
      rowSize: 3,
      emptyLocation: {
        row: 2,
        column: 2,
      },
      pieces: [
        { row: 0, column: 0, id: 1 },
        { row: 0, column: 1, id: 2 },
        { row: 0, column: 2, id: 3 },
        { row: 1, column: 0, id: 4 },
        { row: 1, column: 1, id: 5 },
        { row: 1, column: 2, id: 6 },
        { row: 2, column: 0, id: 7 },
        { row: 2, column: 1, id: 8 },
        { row: 2, column: 2, id: 9 },
      ],
    };

    expect(getDeltaRow(puzzle, 1, 0)).toStrictEqual(0);
    expect(getDeltaRow(puzzle, 1, 1)).toStrictEqual(1);
    expect(getDeltaRow(puzzle, 1, 2)).toStrictEqual(2);
    expect(getDeltaRow(puzzle, 4, 0)).toStrictEqual(-1);
    expect(getDeltaRow(puzzle, 4, 1)).toStrictEqual(0);
    expect(getDeltaRow(puzzle, 4, 2)).toStrictEqual(1);
    expect(getDeltaRow(puzzle, 7, 0)).toStrictEqual(-2);
    expect(getDeltaRow(puzzle, 7, 1)).toStrictEqual(-1);
    expect(getDeltaRow(puzzle, 7, 2)).toStrictEqual(0);
  });

  it('should not be affected by the column of the piece', () => {
    const puzzle: PuzzleState = {
      columnSize: 3,
      rowSize: 3,
      emptyLocation: {
        row: 2,
        column: 2,
      },
      pieces: [
        { row: 0, column: 0, id: 1 },
        { row: 0, column: 1, id: 2 },
        { row: 0, column: 2, id: 3 },
        { row: 1, column: 0, id: 4 },
        { row: 1, column: 1, id: 5 },
        { row: 1, column: 2, id: 6 },
        { row: 2, column: 0, id: 7 },
        { row: 2, column: 1, id: 8 },
        { row: 2, column: 2, id: 9 },
      ],
    };

    expect(getDeltaRow(puzzle, 1, 0)).toStrictEqual(0);
    expect(getDeltaRow(puzzle, 2, 0)).toStrictEqual(0);
    expect(getDeltaRow(puzzle, 3, 0)).toStrictEqual(0);
    expect(getDeltaRow(puzzle, 4, 0)).toStrictEqual(-1);
    expect(getDeltaRow(puzzle, 5, 0)).toStrictEqual(-1);
    expect(getDeltaRow(puzzle, 6, 0)).toStrictEqual(-1);
    expect(getDeltaRow(puzzle, 7, 0)).toStrictEqual(-2);
    expect(getDeltaRow(puzzle, 8, 0)).toStrictEqual(-2);
    expect(getDeltaRow(puzzle, 9, 0)).toStrictEqual(-2);
  });

  it('should work for any puzzle size', () => {
    const puzzle4x4: PuzzleState = {
      columnSize: 4,
      rowSize: 4,
      emptyLocation: {
        row: 3,
        column: 3,
      },
      pieces: [
        { row: 0, column: 0, id: 1 },
        { row: 0, column: 1, id: 2 },
        { row: 0, column: 2, id: 3 },
        { row: 0, column: 3, id: 4 },
        { row: 1, column: 0, id: 5 },
        { row: 1, column: 1, id: 6 },
        { row: 1, column: 2, id: 7 },
        { row: 1, column: 3, id: 8 },
        { row: 2, column: 0, id: 9 },
        { row: 2, column: 1, id: 10 },
        { row: 2, column: 2, id: 11 },
        { row: 2, column: 3, id: 12 },
        { row: 3, column: 0, id: 13 },
        { row: 3, column: 1, id: 14 },
        { row: 3, column: 2, id: 15 },
        { row: 3, column: 3, id: 16 },
      ],
    };

    for (let row = 0; row < 4; row++) {
      expect(getDeltaRow(puzzle4x4, row * 4 + 1, 0)).toStrictEqual(0 - row);
      expect(getDeltaRow(puzzle4x4, row * 4 + 1, 1)).toStrictEqual(1 - row);
      expect(getDeltaRow(puzzle4x4, row * 4 + 1, 2)).toStrictEqual(2 - row);
      expect(getDeltaRow(puzzle4x4, row * 4 + 1, 3)).toStrictEqual(3 - row);
    }

    const pieces10x10: PuzzlePiece[] = [];
    for (let row = 0; row < 10; row++) {
      for (let column = 0; column < 10; column++) {
        pieces10x10.push({
          row,
          column,
          id: row * 10 + column + 1,
        });
      }
    }

    const puzzle10x10: PuzzleState = {
      columnSize: 10,
      rowSize: 10,
      emptyLocation: {
        row: 9,
        column: 9,
      },
      pieces: pieces10x10,
    };

    for (let row = 0; row < 10; row++) {
      expect(getDeltaRow(puzzle10x10, row * 10 + 1, 0)).toStrictEqual(0 - row);
      expect(getDeltaRow(puzzle10x10, row * 10 + 1, 1)).toStrictEqual(1 - row);
      expect(getDeltaRow(puzzle10x10, row * 10 + 1, 2)).toStrictEqual(2 - row);
      expect(getDeltaRow(puzzle10x10, row * 10 + 1, 3)).toStrictEqual(3 - row);
      expect(getDeltaRow(puzzle10x10, row * 10 + 1, 4)).toStrictEqual(4 - row);
      expect(getDeltaRow(puzzle10x10, row * 10 + 1, 5)).toStrictEqual(5 - row);
      expect(getDeltaRow(puzzle10x10, row * 10 + 1, 6)).toStrictEqual(6 - row);
      expect(getDeltaRow(puzzle10x10, row * 10 + 1, 7)).toStrictEqual(7 - row);
      expect(getDeltaRow(puzzle10x10, row * 10 + 1, 8)).toStrictEqual(8 - row);
      expect(getDeltaRow(puzzle10x10, row * 10 + 1, 9)).toStrictEqual(9 - row);
    }
  });
});

describe('getDeltaColumn', () => {
  it("should return the difference between the piece's column and the target slot's column", () => {
    const puzzle: PuzzleState = {
      columnSize: 3,
      rowSize: 3,
      emptyLocation: {
        row: 2,
        column: 2,
      },
      pieces: [
        { row: 0, column: 0, id: 1 },
        { row: 0, column: 1, id: 2 },
        { row: 0, column: 2, id: 3 },
        { row: 1, column: 0, id: 4 },
        { row: 1, column: 1, id: 5 },
        { row: 1, column: 2, id: 6 },
        { row: 2, column: 0, id: 7 },
        { row: 2, column: 1, id: 8 },
        { row: 2, column: 2, id: 9 },
      ],
    };

    expect(getDeltaColumn(puzzle, 1, 0)).toStrictEqual(0);
    expect(getDeltaColumn(puzzle, 1, 1)).toStrictEqual(1);
    expect(getDeltaColumn(puzzle, 1, 2)).toStrictEqual(2);
    expect(getDeltaColumn(puzzle, 2, 0)).toStrictEqual(-1);
    expect(getDeltaColumn(puzzle, 2, 1)).toStrictEqual(0);
    expect(getDeltaColumn(puzzle, 2, 2)).toStrictEqual(1);
    expect(getDeltaColumn(puzzle, 3, 0)).toStrictEqual(-2);
    expect(getDeltaColumn(puzzle, 3, 1)).toStrictEqual(-1);
    expect(getDeltaColumn(puzzle, 3, 2)).toStrictEqual(0);
  });

  it('should not be affected by the row of the piece', () => {
    const puzzle: PuzzleState = {
      columnSize: 3,
      rowSize: 3,
      emptyLocation: {
        row: 2,
        column: 2,
      },
      pieces: [
        { row: 0, column: 0, id: 1 },
        { row: 0, column: 1, id: 2 },
        { row: 0, column: 2, id: 3 },
        { row: 1, column: 0, id: 4 },
        { row: 1, column: 1, id: 5 },
        { row: 1, column: 2, id: 6 },
        { row: 2, column: 0, id: 7 },
        { row: 2, column: 1, id: 8 },
        { row: 2, column: 2, id: 9 },
      ],
    };

    expect(getDeltaColumn(puzzle, 1, 0)).toStrictEqual(0);
    expect(getDeltaColumn(puzzle, 2, 0)).toStrictEqual(-1);
    expect(getDeltaColumn(puzzle, 3, 0)).toStrictEqual(-2);
    expect(getDeltaColumn(puzzle, 4, 0)).toStrictEqual(0);
    expect(getDeltaColumn(puzzle, 5, 0)).toStrictEqual(-1);
    expect(getDeltaColumn(puzzle, 6, 0)).toStrictEqual(-2);
    expect(getDeltaColumn(puzzle, 7, 0)).toStrictEqual(0);
    expect(getDeltaColumn(puzzle, 8, 0)).toStrictEqual(-1);
    expect(getDeltaColumn(puzzle, 9, 0)).toStrictEqual(-2);
  });

  it('should work for any puzzle size', () => {
    const puzzle4x4: PuzzleState = {
      columnSize: 4,
      rowSize: 4,
      emptyLocation: {
        row: 3,
        column: 3,
      },
      pieces: [
        { row: 0, column: 0, id: 1 },
        { row: 0, column: 1, id: 2 },
        { row: 0, column: 2, id: 3 },
        { row: 0, column: 3, id: 4 },
        { row: 1, column: 0, id: 5 },
        { row: 1, column: 1, id: 6 },
        { row: 1, column: 2, id: 7 },
        { row: 1, column: 3, id: 8 },
        { row: 2, column: 0, id: 9 },
        { row: 2, column: 1, id: 10 },
        { row: 2, column: 2, id: 11 },
        { row: 2, column: 3, id: 12 },
        { row: 3, column: 0, id: 13 },
        { row: 3, column: 1, id: 14 },
        { row: 3, column: 2, id: 15 },
        { row: 3, column: 3, id: 16 },
      ],
    };

    for (let col = 0; col < 4; col++) {
      expect(getDeltaColumn(puzzle4x4, col + 1, 0)).toStrictEqual(0 - col);
      expect(getDeltaColumn(puzzle4x4, col + 1, 1)).toStrictEqual(1 - col);
      expect(getDeltaColumn(puzzle4x4, col + 1, 2)).toStrictEqual(2 - col);
      expect(getDeltaColumn(puzzle4x4, col + 1, 3)).toStrictEqual(3 - col);
    }

    const pieces10x10: PuzzlePiece[] = [];
    for (let row = 0; row < 10; row++) {
      for (let column = 0; column < 10; column++) {
        pieces10x10.push({
          row,
          column,
          id: row * 10 + column + 1,
        });
      }
    }

    const puzzle10x10: PuzzleState = {
      columnSize: 10,
      rowSize: 10,
      emptyLocation: {
        row: 9,
        column: 9,
      },
      pieces: pieces10x10,
    };

    for (let col = 0; col < 10; col++) {
      expect(getDeltaColumn(puzzle10x10, col + 1, 0)).toStrictEqual(0 - col);
      expect(getDeltaColumn(puzzle10x10, col + 1, 1)).toStrictEqual(1 - col);
      expect(getDeltaColumn(puzzle10x10, col + 1, 2)).toStrictEqual(2 - col);
      expect(getDeltaColumn(puzzle10x10, col + 1, 3)).toStrictEqual(3 - col);
      expect(getDeltaColumn(puzzle10x10, col + 1, 4)).toStrictEqual(4 - col);
      expect(getDeltaColumn(puzzle10x10, col + 1, 5)).toStrictEqual(5 - col);
      expect(getDeltaColumn(puzzle10x10, col + 1, 6)).toStrictEqual(6 - col);
      expect(getDeltaColumn(puzzle10x10, col + 1, 7)).toStrictEqual(7 - col);
      expect(getDeltaColumn(puzzle10x10, col + 1, 8)).toStrictEqual(8 - col);
      expect(getDeltaColumn(puzzle10x10, col + 1, 9)).toStrictEqual(9 - col);
    }
  });
});

describe('isDirectlyAbovePiece', () => {
  it('should return true ONLY for the slot above the piece', () => {
    expect(
      isDirectlyAbovePiece({ row: 0, column: 0 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isDirectlyAbovePiece({ row: 0, column: 1 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(true);
    expect(
      isDirectlyAbovePiece({ row: 0, column: 2 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);

    expect(
      isDirectlyAbovePiece({ row: 1, column: 0 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isDirectlyAbovePiece({ row: 1, column: 1 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isDirectlyAbovePiece({ row: 1, column: 2 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);

    expect(
      isDirectlyAbovePiece({ row: 2, column: 0 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isDirectlyAbovePiece({ row: 2, column: 1 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isDirectlyAbovePiece({ row: 2, column: 2 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
  });
});

describe('isDirectlyBelowPiece', () => {
  it('should return true ONLY for the slot below the piece', () => {
    expect(
      isDirectlyBelowPiece({ row: 0, column: 0 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isDirectlyBelowPiece({ row: 0, column: 1 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isDirectlyBelowPiece({ row: 0, column: 2 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);

    expect(
      isDirectlyBelowPiece({ row: 1, column: 0 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isDirectlyBelowPiece({ row: 1, column: 1 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isDirectlyBelowPiece({ row: 1, column: 2 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);

    expect(
      isDirectlyBelowPiece({ row: 2, column: 0 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isDirectlyBelowPiece({ row: 2, column: 1 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(true);
    expect(
      isDirectlyBelowPiece({ row: 2, column: 2 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
  });
});

describe('isDirectlyLeftOfPiece', () => {
  it('should return true ONLY for the slot left of the piece', () => {
    expect(
      isDirectlyLeftOfPiece(
        { row: 0, column: 0 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
    expect(
      isDirectlyLeftOfPiece(
        { row: 0, column: 1 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
    expect(
      isDirectlyLeftOfPiece(
        { row: 0, column: 2 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);

    expect(
      isDirectlyLeftOfPiece(
        { row: 1, column: 0 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(true);
    expect(
      isDirectlyLeftOfPiece(
        { row: 1, column: 1 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
    expect(
      isDirectlyLeftOfPiece(
        { row: 1, column: 2 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);

    expect(
      isDirectlyLeftOfPiece(
        { row: 2, column: 0 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
    expect(
      isDirectlyLeftOfPiece(
        { row: 2, column: 1 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
    expect(
      isDirectlyLeftOfPiece(
        { row: 2, column: 2 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
  });
});

describe('isDirectlyRightOfPiece', () => {
  it('should return true ONLY for the slot right of the piece', () => {
    expect(
      isDirectlyRightOfPiece(
        { row: 0, column: 0 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
    expect(
      isDirectlyRightOfPiece(
        { row: 0, column: 1 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
    expect(
      isDirectlyRightOfPiece(
        { row: 0, column: 2 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);

    expect(
      isDirectlyRightOfPiece(
        { row: 1, column: 0 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
    expect(
      isDirectlyRightOfPiece(
        { row: 1, column: 1 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
    expect(
      isDirectlyRightOfPiece(
        { row: 1, column: 2 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(true);

    expect(
      isDirectlyRightOfPiece(
        { row: 2, column: 0 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
    expect(
      isDirectlyRightOfPiece(
        { row: 2, column: 1 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
    expect(
      isDirectlyRightOfPiece(
        { row: 2, column: 2 },
        { row: 1, column: 1, id: 5 },
      ),
    ).toStrictEqual(false);
  });
});

describe('isRightOfPiece', () => {
  it('should return true for any slot right of the piece', () => {
    expect(
      isRightOfPiece({ row: 0, column: 0 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isRightOfPiece({ row: 0, column: 1 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isRightOfPiece({ row: 0, column: 2 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);

    expect(
      isRightOfPiece({ row: 1, column: 0 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isRightOfPiece({ row: 1, column: 1 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isRightOfPiece({ row: 1, column: 2 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(true);
    expect(
      isRightOfPiece({ row: 1, column: 3 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(true);
    expect(
      isRightOfPiece({ row: 1, column: 4 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(true);
    expect(
      isRightOfPiece({ row: 1, column: 5 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(true);

    expect(
      isRightOfPiece({ row: 2, column: 0 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isRightOfPiece({ row: 2, column: 1 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
    expect(
      isRightOfPiece({ row: 2, column: 2 }, { row: 1, column: 1, id: 5 }),
    ).toStrictEqual(false);
  });
});

describe('getPieceAt', () => {
  it('should return the piece at the given slot', () => {
    const puzzle: PuzzleState = {
      columnSize: 3,
      rowSize: 3,
      emptyLocation: {
        row: 2,
        column: 2,
      },
      pieces: [
        { row: 0, column: 0, id: 1 },
        { row: 0, column: 1, id: 2 },
        { row: 0, column: 2, id: 3 },
        { row: 1, column: 0, id: 4 },
        { row: 1, column: 1, id: 5 },
        { row: 1, column: 2, id: 6 },
        { row: 2, column: 0, id: 7 },
        { row: 2, column: 1, id: 8 },
        { row: 2, column: 2, id: 9 },
      ],
    };

    const pieceOne = getPieceAt(puzzle, 0, 0);
    const pieceTwo = getPieceAt(puzzle, 0, 1);
    const pieceThree = getPieceAt(puzzle, 0, 2);
    const pieceFour = getPieceAt(puzzle, 1, 0);
    const pieceFive = getPieceAt(puzzle, 1, 1);
    const pieceSix = getPieceAt(puzzle, 1, 2);
    const pieceSeven = getPieceAt(puzzle, 2, 0);
    const pieceEight = getPieceAt(puzzle, 2, 1);
    const pieceNine = getPieceAt(puzzle, 2, 2);

    expect(pieceOne.id).toStrictEqual(1);
    expect(pieceTwo.id).toStrictEqual(2);
    expect(pieceThree.id).toStrictEqual(3);
    expect(pieceFour.id).toStrictEqual(4);
    expect(pieceFive.id).toStrictEqual(5);
    expect(pieceSix.id).toStrictEqual(6);
    expect(pieceSeven.id).toStrictEqual(7);
    expect(pieceEight.id).toStrictEqual(8);
    expect(pieceNine.id).toStrictEqual(9);
  });
});

describe('getPieceIdAt', () => {
  it('should return the piece ID at the given slot', () => {
    const puzzle: PuzzleState = {
      columnSize: 3,
      rowSize: 3,
      emptyLocation: {
        row: 2,
        column: 2,
      },
      pieces: [
        { row: 0, column: 0, id: 1 },
        { row: 0, column: 1, id: 2 },
        { row: 0, column: 2, id: 3 },
        { row: 1, column: 0, id: 4 },
        { row: 1, column: 1, id: 5 },
        { row: 1, column: 2, id: 6 },
        { row: 2, column: 0, id: 7 },
        { row: 2, column: 1, id: 8 },
        { row: 2, column: 2, id: 9 },
      ],
    };

    const pieceOne = getPieceIdAt(puzzle, 0, 0);
    const pieceTwo = getPieceIdAt(puzzle, 0, 1);
    const pieceThree = getPieceIdAt(puzzle, 0, 2);
    const pieceFour = getPieceIdAt(puzzle, 1, 0);
    const pieceFive = getPieceIdAt(puzzle, 1, 1);
    const pieceSix = getPieceIdAt(puzzle, 1, 2);
    const pieceSeven = getPieceIdAt(puzzle, 2, 0);
    const pieceEight = getPieceIdAt(puzzle, 2, 1);
    const pieceNine = getPieceIdAt(puzzle, 2, 2);

    expect(pieceOne).toStrictEqual(1);
    expect(pieceTwo).toStrictEqual(2);
    expect(pieceThree).toStrictEqual(3);
    expect(pieceFour).toStrictEqual(4);
    expect(pieceFive).toStrictEqual(5);
    expect(pieceSix).toStrictEqual(6);
    expect(pieceSeven).toStrictEqual(7);
    expect(pieceEight).toStrictEqual(8);
    expect(pieceNine).toStrictEqual(9);
  });
});

// Puzzle action sets
// describe('rotate', () => {});

// describe('walkEmptyToPiece', () => {});

// describe('slopeWalkToTarget', () => {});

describe('puzzleToMatrix', () => {
  it('Should convert puzzle state to a full matrix with no undefined elements', () => {
    const state: PuzzleState = {
      pieces: [
        { id: 1, row: 0, column: 1 },
        { id: 2, row: 1, column: 1 },
        { id: 3, row: 0, column: 2 },
        { id: 4, row: 1, column: 0 },
        { id: 5, row: 1, column: 2 },
        { id: -1, row: 0, column: 0 },
      ],
      rowSize: 3,
      columnSize: 2,
      emptyLocation: { row: 0, column: 0 },
    };

    const expected = [[-1, 1, 3], [4, 2, 5]];

    const matrix = puzzleToMatrix(state);
    expect(matrix).toMatchObject(expected);
  });
});

describe('puzzleToPuzzleState', () => {
  it('Should convert the matrix to a PuzzleState object', () => {
    const matrix = [[-1, 4, 5], [7, 8, 6]];
    const expected: PuzzleState = {
      rowSize: 3,
      columnSize: 2,
      emptyLocation: { row: 0, column: 0 },
      pieces: [
        { id: 4, row: 0, column: 1 },
        { id: 5, row: 0, column: 2 },
        { id: 6, row: 1, column: 2 },
        { id: 7, row: 1, column: 0 },
        { id: 8, row: 1, column: 1 },
        { id: 9, row: 0, column: 0 },
      ],
    };

    expect(puzzleToPuzzleState(matrix, 9)).toMatchObject(expected);
  });
});

describe('slicePuzzle', () => {
  it('Should slice starting with the row & column provided', () => {
    const puzzleState: PuzzleState = {
      rowSize: 4,
      columnSize: 4,
      emptyLocation: { row: 3, column: 3 },
      pieces: [
        { id: 1, row: 0, column: 0 },
        { id: 2, row: 0, column: 1 },
        { id: 3, row: 0, column: 2 },
        { id: 4, row: 0, column: 3 },
        { id: 5, row: 1, column: 0 },
        { id: 6, row: 1, column: 1 },
        { id: 7, row: 1, column: 2 },
        { id: 8, row: 1, column: 3 },
        { id: 9, row: 2, column: 0 },
        { id: 10, row: 2, column: 1 },
        { id: 11, row: 2, column: 2 },
        { id: 12, row: 2, column: 3 },
        { id: 13, row: 3, column: 0 },
        { id: 14, row: 3, column: 1 },
        { id: 15, row: 3, column: 2 },
        { id: 16, row: 3, column: 3 },
      ],
    };

    const slice = slicePuzzle(puzzleState, 2, 1);

    const expectedState: PuzzleState = {
      rowSize: 3,
      columnSize: 2,
      emptyLocation: { row: 1, column: 2 },
      pieces: [
        { id: 10, row: 0, column: 0 },
        { id: 11, row: 0, column: 1 },
        { id: 12, row: 0, column: 2 },
        { id: 14, row: 1, column: 0 },
        { id: 15, row: 1, column: 1 },
        { id: 16, row: 1, column: 2 },
      ],
    };

    expect(slice).toMatchObject(expectedState);
  });
});
