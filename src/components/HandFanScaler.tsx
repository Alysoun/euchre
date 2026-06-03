import React from 'react';
import styled from 'styled-components';

type HandFanScalerProps = {
  scale: number;
  baseWidth: number;
  baseHeight: number;
  children: React.ReactNode;
};

/** Reserve scaled layout space so the fan cannot overlap HUD text above it. */
const Wrap = styled.div<{ $width: number; $height: number }>`
  position: relative;
  width: ${(p) => p.$width}px;
  height: ${(p) => p.$height}px;
  margin: 4px auto 8px;
  overflow: visible;
`;

const ScaledInner = styled.div<{ $scale: number }>`
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%) scale(${(p) => p.$scale});
  transform-origin: center bottom;
  transform-style: preserve-3d;
`;

const HandFanScaler: React.FC<HandFanScalerProps> = ({
  scale,
  baseWidth,
  baseHeight,
  children,
}) => {
  const visualWidth = Math.ceil(baseWidth * scale);
  const visualHeight = Math.ceil(baseHeight * scale);

  return (
    <Wrap $width={visualWidth} $height={visualHeight}>
      <ScaledInner $scale={scale}>{children}</ScaledInner>
    </Wrap>
  );
};

export default HandFanScaler;
