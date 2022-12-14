interface PuzzlePieceProps {
  id: number;
  src: string;
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
  rowSize,
  columnSize,
  className = '',
}: PuzzlePieceProps) => {
  return (
    <div
      className={className}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: `${rowSize * 100}% ${columnSize * 100}%`,
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
      {src ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: 'var(--black)',
            width: 24,
            borderRadius: '50%',
            textAlign: 'center',
            fontSize: 'var(--text-sm, 14px)',
          }}
        >
          {id}
        </div>
      ) : (
        id
      )}
    </div>
  );
};

export default PuzzlePiece;
