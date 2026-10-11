/**
 * Switches theme with a circle that grows from the toggle button (or the
 * screen centre when there is none) and reveals the new theme.
 * Falls back to an instant switch without View Transitions or when the
 * visitor prefers reduced motion.
 */
export function revealTheme(apply: () => void, origin?: HTMLElement | null) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce) {
    apply();
    return;
  }
  const rect = origin?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const root = document.documentElement;
  root.classList.add('theme-revealing');
  const transition = document.startViewTransition(apply);
  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        },
        {
          duration: 600,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => {
      // Transition skipped; the theme has still been applied.
    });
  transition.finished.finally(() => root.classList.remove('theme-revealing'));
}
