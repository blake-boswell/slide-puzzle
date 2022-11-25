export function matrixSwap(
  matrix: any[][],
  aPair: [number, number],
  bPair: [number, number],
) {
  /**
   * [row 0, col 0] [row 0, col 1] [row 0, col 2]
   * [row 1, col 0] [row 1, col 1] [row 1, col 2]
   * [row 2, col 0] [row 2, col 1] [row 2, col 2]
   * arr[0, 2] --> row 0, col 2;
   * arr[row, col]
   */
  const [aRow, aCol] = aPair;
  const [bRow, bCol] = bPair;

  // Check bounds
  const matrixRowSize = matrix[0].length;
  const matrixColSize = matrix.length;
  if (
    aRow >= matrixRowSize ||
    bRow >= matrixRowSize ||
    aCol >= matrixColSize ||
    bCol >= matrixColSize
  ) {
    throw new Error(
      `Attempted to swap with an out of bounds location: ${{
        aPair,
        bPair,
        matrix,
      }}`,
    );
  }

  // Copy matrix
  const copy: any[][] = [];
  matrix.forEach((row, rowIndex) => {
    row.forEach((item, colIndex) => {
      if (Array.isArray(copy[rowIndex])) {
        copy[rowIndex][colIndex] = item;
      } else {
        copy[rowIndex] = [item];
      }
    });
  });

  // Swap
  const temp = copy[aRow][aCol];
  copy[aRow][aCol] = copy[bRow][bCol];
  copy[bRow][bCol] = temp;
  return copy;
}

// Fisher-Yates shuffle
export function shuffle(arr: any[]) {
  let numToShuffle = arr.length;

  // While there are elements to shuffle
  while (numToShuffle) {
    // Pick a random item
    const randIndex = Math.floor(Math.random() * numToShuffle);
    numToShuffle--;

    // Swap item with the current element
    const temp = arr[numToShuffle];
    arr[numToShuffle] = arr[randIndex];
    arr[randIndex] = temp;
  }

  return arr;
}
