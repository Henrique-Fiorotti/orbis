export function getHorizontalQuoteAnimationMetrics({
  sectionWidth,
  trackWidth,
}) {
  const safeSectionWidth = Math.max(1, Number(sectionWidth) || 0);
  const safeTrackWidth = Math.max(1, Number(trackWidth) || 0);

  return {
    enterX: Math.round(safeSectionWidth * 0.3),
    settleX: -Math.max(
      Math.round(safeTrackWidth - safeSectionWidth * 0.75),
      Math.round(safeSectionWidth * 1.75),
    ),
    scrollDistance: Math.max(
      5000,
      Math.round(safeSectionWidth * 4),
      Math.round(safeTrackWidth * 1.45),
    ),
    orbExitProgress: 0.14,
    textStartProgress: 0.18,
    textFadeProgress: 0.08,
    textExitStartProgress: 0.9,
    orbReturnStartProgress: 0.94,
    orbReturnFadeProgress: 0.06,
    authorStartProgress: 0.64,
    authorEndProgress: 0.73,
    holdEndProgress: 0.94,
  };
}
