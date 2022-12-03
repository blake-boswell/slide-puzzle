interface PuzzlePieceProps {
  id: number;
  src: string;
  height: number;
  width: number;
  rowSize: number;
  columnSize: number;
  className?: string;
}

const getDiagonalDelayTime = (
  id: number,
  rowSize: number,
  columnSize: number,
) => {
  const row = (id - 1) % rowSize;
  const column = Math.floor((id - 1) / columnSize);
  return `${(row + column) * 0.1}s`;
};

const PuzzlePiece = ({
  id,
  src,
  height,
  width,
  rowSize,
  columnSize,
  className = '',
}: PuzzlePieceProps) => {
  return (
    <div
      className={className}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: `${width}px ${height}px`,
        backgroundRepeat: 'no-repeat',
        backgroundOrigin: 'border-box',
        backgroundPosition: `left ${((id - 1) % rowSize) *
          (1 / (rowSize - 1)) *
          100}% top ${Math.floor((id - 1) / columnSize) *
          (1 / (columnSize - 1)) *
          100}%`,
        animationDelay: getDiagonalDelayTime(id, rowSize, columnSize),
      }}
    >
      {!src && id}
    </div>
  );
};

export default PuzzlePiece;
