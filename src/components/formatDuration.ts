// Format a second count as M:SS under ten minutes, MM:SS at or above ten
// minutes. Fractional seconds are floored; negatives clamp to zero.
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
