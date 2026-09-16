// Grain pastel background (paper shaders) — JSX port of the
// beui.dev ShaderBackground wrapper, trimmed to what we use.
// No path alias / no extra utils needed.
import { GrainGradient } from '@paper-design/shaders-react';
import { useReducedMotion } from 'motion/react';

function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function ShaderBackground({
  colors,
  colorBack,
  shape = 'wave',
  softness = 1,
  intensity = 0.5,
  noise = 0.4,
  speed = 0.5,
  className,
  style,
}) {
  const reducedMotion = useReducedMotion();
  return (
    <GrainGradient
      colors={colors}
      colorBack={colorBack}
      shape={shape}
      softness={softness}
      intensity={intensity}
      noise={noise}
      speed={reducedMotion ? 0 : speed}
      className={cn('shader-bg-fill', className)}
      style={style}
    />
  );
}
