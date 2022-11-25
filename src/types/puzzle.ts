export interface PuzzlePiece {
  id: number;
  row: number;
  column: number;
}

export interface PuzzleState {
  rowSize: number;
  columnSize: number;
  pieces: PuzzlePiece[];
  emptyLocation: {
    row: number;
    column: number;
  };
}

export interface PuzzleAction {
  id?: number;
  type:
    | 'move-up'
    | 'move-down'
    | 'move-left'
    | 'move-right'
    | 'reset'
    | 'resize';
  size?: {
    rowSize: number;
    colSize: number;
  };
}
