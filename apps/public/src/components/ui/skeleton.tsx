interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const roundedMap = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

export function Skeleton({ className = '', width, height, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: width ?? '100%',
        height: height ?? '16px',
        borderRadius: roundedMap[rounded],
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-6"
      style={{ background: 'var(--color-surface-1)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton width="160px" height="20px" />
          <Skeleton width="80px" height="16px" rounded="full" />
        </div>
        <Skeleton width="70px" height="24px" rounded="full" />
      </div>
      <Skeleton height="14px" />
      <Skeleton height="14px" width="80%" />
      <div className="mt-2 flex items-center gap-4">
        <Skeleton width="60px" height="12px" />
        <Skeleton width="80px" height="12px" />
        <Skeleton width="70px" height="12px" />
      </div>
    </div>
  );
}
