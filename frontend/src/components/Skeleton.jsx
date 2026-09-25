import React from 'react';

export const Skeleton = ({ width, height, borderRadius, style, className = '' }) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: borderRadius || '6px',
        ...style,
      }}
    />
  );
};

export const SkeletonText = ({ lines = 3, gap = '8px', className = '' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }} className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          width={i === lines - 1 && lines > 1 ? '65%' : '100%'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ height = '140px', className = '' }) => {
  return (
    <div
      className={`glass-panel ${className}`}
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width="36px" height="36px" borderRadius="8px" />
        <Skeleton width="40px" height="14px" />
      </div>
      <Skeleton width="50%" height="20px" />
      <SkeletonText lines={2} />
    </div>
  );
};

export default Skeleton;
