
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { animate, createScope, onScroll, stagger, svg } from 'animejs';
import { PRODUCT_CARDS } from '@/features/marketing/config';
import { OrbMark } from '@/components/brand/orb-mark';
import { cn } from '@/lib/utils';
import { LEGEND } from './legend';
import { ScrollWords } from './scroll-words';

// Diagram space is 1200 × 700. Three products flank the orb on each side;
// each connector runs from a point on the orb out to its card's inner edge.
const ROWS = [
  { card: 120, orbY: 215 },
  { card: 350, orbY: 330 },
  { card: 580, orbY: 445 },
];

const ORBIT = PRODUCT_CARDS.map((p, i) => {
  const side = i < 3 ? 'left' : 'right';
  const row = ROWS[i % 3];
  const path =
    side === 'left'
      ? `M582 ${row.orbY} C 480 ${row.orbY}, 410 ${row.card}, 300 ${row.card}`
      : `M618 ${row.orbY} C 720 ${row.orbY}, 790 ${row.card}, 900 ${row.card}`;
  return { ...p, side, top: (row.card / 700) * 100, path };
});

export function Connected() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const scope = createScope({
      root,
      mediaQueries: { reduceMotion: '(prefers-reduced-motion: reduce)' },
    }).add((self) => {
      if (self?.matches.reduceMotion) return;

      const scrub = () =>
        onScroll({
          target: '[data-orbit]',
          enter: 'bottom top+=10%',
          leave: 'center center',
          sync: 0.45,
        });

      // The orb wakes up and grows as the diagram scrolls in.
      animate('[data-orb]', {
        opacity: [0, 1],
        scale: [0.7, 1],
        ease: 'linear',
        autoplay: scrub(),
      });

      // Connectors draw outward from the orb, then the cards arrive.
      animate(svg.createDrawable('[data-link]'), {
        draw: ['0 0', '0 1'],
        ease: 'inOutQuad',
        delay: stagger(70),
        autoplay: scrub(),
      });
      animate('[data-card="left"]', {
        x: [-70, 0],
        opacity: [0, 1],
        ease: 'outQuad',
        delay: stagger(90),
        autoplay: scrub(),
      });
      animate('[data-card="right"]', {
        x: [70, 0],
        opacity: [0, 1],
        ease: 'outQuad',
        delay: stagger(90),
        autoplay: scrub(),
      });

      // Idle life: the orb breathes and light keeps flowing out to each product.
      animate('[data-orb-float]', {
        y: [-8, 8],
        duration: 3200,
        ease: 'inOutSine',
        alternate: true,
        loop: true,
      });
      animate('[data-pulse]', {
        strokeDashoffset: [0, -100],
        duration: 2400,
        ease: 'linear',
        loop: true,
        delay: stagger(380),
      });
    });

    return () => scope.revert();
  }, []);

  return (
    <section ref={root} className="overflow-hidden bg-mk-bg text-mk-fg">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-mk-accent">
            five elements · one hub · one orb
          </p>
          <ScrollWords
            as="h2"
            className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl"
          >
            Five elements, a Kokotiam and one orb.
          </ScrollWords>
          <ScrollWords className="mx-auto mt-5 max-w-2xl text-lg text-mk-muted">
            Api, Air, Daun, Taufan and Gempa are the five elemental powers of your business. Kokotiam is the hub where they all meet. Ochobot, the little orb at the centre, rides along on every screen and carries what one product learns over to the others.
          </ScrollWords>
        </div>

        <div
          data-orbit
          className="relative mx-auto mt-14 max-w-6xl lg:mt-20 lg:aspect-[12/7]"
        >
          {/* Ochobot */}
          <div className="relative mx-auto h-80 w-44 bg-mk-bg lg:absolute lg:inset-y-0 lg:left-1/2 lg:h-full lg:w-[33%] lg:-translate-x-1/2">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(50%_45%_at_50%_45%,rgba(16,185,129,0.28),transparent)]"
            />
            <div data-orb-float className="grid size-full place-items-center pb-12">
              <div data-orb className="size-full max-h-72 will-change-transform">
                <OrbMark className="size-full text-mk-accent" />
              </div>
            </div>
            <p className="absolute inset-x-0 bottom-0 text-center lg:bottom-[3%]">
              <span className="block text-lg font-bold">Ochobot</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-mk-accent">
                the shared assistant
              </span>
            </p>
          </div>

          <svg
            viewBox="0 0 1200 700"
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden size-full lg:block"
            fill="none"
            strokeLinecap="round"
          >
            {ORBIT.map((p) => (
              <g key={p.key}>
                <path
                  data-link
                  d={p.path}
                  style={{ stroke: `var(--mk-product-${p.key})` }}
                  strokeOpacity="0.45"
                  strokeWidth="1.5"
                />
                <path
                  data-pulse
                  d={p.path}
                  pathLength={100}
                  style={{ stroke: `var(--mk-product-${p.key})` }}
                  strokeWidth="2.5"
                  strokeDasharray="6 94"
                />
              </g>
            ))}
          </svg>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:block">
            {ORBIT.map((p) => {
              const Icon = p.icon;
              return (
                <li
                  key={p.key}
                  className={cn(
                    'min-w-0 lg:absolute lg:w-[25%] lg:-translate-y-1/2',
                    p.side === 'left' ? 'lg:left-0' : 'lg:right-0',
                  )}
                  style={
                    {
                      top: `${p.top}%`,
                      '--pc': `var(--mk-product-${p.key})`,
                    } as React.CSSProperties
                  }
                >
                  <Link
                    to={p.href}
                    data-card={p.side}
                    className="group block rounded-2xl border border-mk-border bg-mk-surface/90 p-4 backdrop-blur transition-colors duration-300 hover:border-(--pc)/70 hover:bg-mk-surface dark:bg-mk-surface-2/90 dark:hover:bg-[#0f1a16]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--pc)/12 text-(--pc) transition-colors group-hover:bg-(--pc) group-hover:text-mk-bg">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-lg font-bold leading-tight">
                          {p.name}
                        </p>
                        <p className="truncate font-mono text-[11px] text-mk-subtle">
                          {LEGEND[p.key].name} · {p.category}
                        </p>
                      </div>
                      <ArrowUpRight className="ml-auto size-4 shrink-0 text-mk-subtle dark:text-mk-fg/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-(--pc)" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-mk-fg/85">
                      {p.tagline}
                    </p>
                    <p className="mt-1 truncate font-mono text-[11px] text-mk-subtle">
                      {p.features.join(' · ')}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 text-center sm:grid-cols-2 sm:text-left lg:mt-20">
          <div className="rounded-2xl border border-mk-border bg-mk-surface p-6 dark:bg-mk-fg/[0.03]">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mk-accent">
              why OpenKuasa
            </p>
            <p className="mt-2 text-mk-fg/70">
              <span className="font-semibold text-mk-fg">Kuasa</span> is Malay
              for power. OpenKuasa puts the power to run a business in the
              open: free software anyone can read, host and change.
            </p>
          </div>
          <div className="rounded-2xl border border-mk-border bg-mk-surface p-6 dark:bg-mk-fg/[0.03]">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mk-accent">
              why Ochobot
            </p>
            <p className="mt-2 text-mk-fg/70">
              Ochobot is the helper that rides along on every screen. Ask it
              anything in any product and it already knows the rest of your
              business.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
