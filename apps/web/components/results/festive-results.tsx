'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { Trophy, Award, BarChart3, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import type { ElectionResults } from '@/services/results';
import { fadeUp } from '@/lib/animations';

function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <span>{display.toLocaleString('id-ID')}</span>;
}

export function FireConfetti() {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
    const t1 = setTimeout(
      () => confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0 } }),
      300,
    );
    const t2 = setTimeout(
      () => confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1 } }),
      600,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return null;
}

export function FestiveResults({ results }: { results: ElectionResults }) {
  const winner = results.candidates[0];
  const podium = results.candidates.slice(0, 3);
  const totalVotes = results.total_votes || 0;

  return (
    <div className="space-y-8">
      {/* Winner Spotlight Card */}
      {winner && (
        <motion.div
          {...fadeUp()}
          className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/15 via-card/90 to-card p-8 sm:p-10 text-center shadow-xl backdrop-blur-md"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background: 'radial-gradient(circle at 50% 0%, var(--primary), transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-sm mb-4">
              <Trophy className="h-8 w-8" />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Pemenang Terpilih · Nomor Urut {winner.candidateNumber}</span>
            </div>

            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {winner.chairman_name}
            </h2>
            {winner.vice_chairman_name && (
              <p className="mt-1 font-heading text-lg sm:text-xl font-medium text-muted-foreground">
                &amp; {winner.vice_chairman_name}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-background/80 px-5 py-2.5 shadow-2xs">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="font-mono text-base font-bold text-foreground">
                  <CountUp value={winner.votes} /> Suara
                </span>
                <span className="font-mono text-sm text-muted-foreground font-semibold">
                  ({winner.percentage}%)
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Podium Showcase */}
      {podium.length > 1 && (
        <motion.div
          {...fadeUp(0.1)}
          className="rounded-3xl border border-border/80 bg-card/85 p-6 sm:p-8 shadow-sm backdrop-blur-md"
        >
          <div className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground flex items-center justify-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-primary" /> PODIUM PEROLEHAN SUARA
            </p>
            <h3 className="mt-1 font-heading text-2xl font-bold text-foreground">
              Peringkat Teratas
            </h3>
          </div>

          <div className="mt-8 flex items-end justify-center gap-3 sm:gap-6">
            {podium
              .slice()
              .sort((a, b) => b.votes - a.votes)
              .map((c, i) => {
                const order = [1, 0, 2];
                const position = order[i] ?? i;
                const heights = ['h-32 sm:h-36', 'h-44 sm:h-48', 'h-24 sm:h-28'];
                const medalIcons = ['🥇', '🥈', '🥉'];
                const borderStyles = [
                  'border-amber-400/50 bg-amber-400/5',
                  'border-slate-400/50 bg-slate-400/5',
                  'border-amber-700/40 bg-amber-700/5',
                ];

                return (
                  <motion.div
                    key={c.candidateNumber}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: 0.2 + position * 0.15,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                    className={`flex w-28 sm:w-36 flex-col items-center justify-between rounded-2xl border ${borderStyles[position]} p-3 shadow-xs ${heights[position]}`}
                  >
                    <div className="text-center">
                      <span className="text-2xl sm:text-3xl">{medalIcons[i]}</span>
                      <p className="mt-1 w-full min-w-0 truncate px-1 text-center font-heading text-xs sm:text-sm font-bold text-foreground">
                        {c.chairman_name}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="font-mono text-xs sm:text-sm font-bold text-foreground">
                        <CountUp value={c.votes} />
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground font-semibold">
                        {c.percentage}%
                      </p>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* Proportional Vote Distribution Chart */}
      <motion.div
        {...fadeUp(0.15)}
        className="rounded-3xl border border-border/80 bg-card/85 p-6 sm:p-8 shadow-sm backdrop-blur-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-primary" /> REKAPITULASI RESMI
            </p>
            <h3 className="mt-1 font-heading text-xl sm:text-2xl font-bold text-foreground">
              Grafik Perolehan Suara
            </h3>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>
              Total:{' '}
              <strong>
                <CountUp value={totalVotes} />
              </strong>{' '}
              Suara Sah
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {results.candidates.map((c, i) => {
            // Proportional width calculation: based on actual percentage of total votes
            const widthPercentage = totalVotes > 0 ? (c.votes / totalVotes) * 100 : 0;

            return (
              <div key={c.candidateNumber} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary">
                      {c.candidateNumber}
                    </span>
                    <span className="font-heading font-semibold text-foreground">
                      {c.chairman_name}
                      {c.vice_chairman_name ? (
                        <span className="font-normal text-muted-foreground">
                          {' '}
                          &amp; {c.vice_chairman_name}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <span className="font-mono text-xs sm:text-sm font-semibold text-foreground">
                    <CountUp value={c.votes} /> suara{' '}
                    <span className="text-muted-foreground font-normal">({c.percentage}%)</span>
                  </span>
                </div>

                <div className="h-5 w-full overflow-hidden rounded-xl bg-muted/60 p-0.5 border border-border/40">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${widthPercentage}%` }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.9,
                      delay: 0.15 * i,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                    className={`h-full rounded-lg ${
                      i === 0
                        ? 'bg-gradient-to-r from-primary to-primary/80 shadow-xs'
                        : 'bg-gradient-to-r from-muted-foreground/60 to-muted-foreground/40'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
