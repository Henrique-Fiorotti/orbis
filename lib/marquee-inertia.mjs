const DEFAULT_FRICTION = 0.006;
const DEFAULT_STOP_VELOCITY = 0.025;
const MAX_ELAPSED_MS = 48;

export function normalizeMarqueeOffset(offset, loopWidth) {
  if (!Number.isFinite(loopWidth) || loopWidth <= 0) {
    return offset;
  }

  return ((offset % loopWidth) + loopWidth) % loopWidth;
}

export function getMarqueeInertiaFrame({
  elapsedMs,
  friction = DEFAULT_FRICTION,
  offset,
  stopVelocity = DEFAULT_STOP_VELOCITY,
  velocity,
}) {
  if (Math.abs(velocity) <= stopVelocity) {
    return {
      done: true,
      offset,
      velocity: 0,
    };
  }

  const safeElapsedMs = Math.max(0, Math.min(elapsedMs, MAX_ELAPSED_MS));
  const decay = Math.exp(-friction * safeElapsedMs);
  const nextVelocity = velocity * decay;
  const averageVelocity = (velocity + nextVelocity) / 2;
  const nextOffset = offset + averageVelocity * safeElapsedMs;

  return {
    done: Math.abs(nextVelocity) <= stopVelocity,
    offset: nextOffset,
    velocity: Math.abs(nextVelocity) <= stopVelocity ? 0 : nextVelocity,
  };
}
