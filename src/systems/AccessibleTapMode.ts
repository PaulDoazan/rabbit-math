export interface Vec {
  x: number;
  y: number;
}

export function computeVelocityForTarget(
  start: Vec,
  target: Vec,
  gravity: number,
  timeOfFlight: number,
): Vec {
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  return {
    x: dx / timeOfFlight,
    y: (dy - 0.5 * gravity * timeOfFlight * timeOfFlight) / timeOfFlight,
  };
}
