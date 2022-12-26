export interface PuzzleSlot {
  row: number;
  column: number;
}

export interface PuzzlePiece extends PuzzleSlot {
  id: number;
}

export interface PuzzleState {
  rowSize: number;
  columnSize: number;
  pieces: PuzzlePiece[];
  emptyLocation: PuzzleSlot;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface ResizeAction {
  type: 'resize';
  size: {
    rowSize: number;
    colSize: number;
  };
}

export interface MoveAction {
  id: number;
  type: 'move-up' | 'move-down' | 'move-left' | 'move-right';
}

export interface ControlAction {
  type: 'reset' | 'auto-complete' | 'solve';
}

export type PuzzleAction = ResizeAction | MoveAction | ControlAction;
