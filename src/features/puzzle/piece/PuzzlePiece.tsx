import React, { CSSProperties } from 'react';

export interface PuzzlePieceProps {
  id: number;
  children: React.ReactNode;
  onClick: (id: number) => void;
  style?: CSSProperties;
}

const PuzzlePiece = ({ id, children, onClick, style }: PuzzlePieceProps) => {
  const handleClick = () => {
    onClick(id);
  };

  return (
    <div
      className={`puzzle-piece${id === -1 ? ' puzzle-piece--empty' : ''}`}
      onClick={handleClick}
      style={style}
      tabIndex={id}
    >
      {children}
    </div>
  );
};

export default PuzzlePiece;
