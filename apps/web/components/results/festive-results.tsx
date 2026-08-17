'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
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
  const maxVotes = Math.max(...results.candidates.map((c) => c.votes), 1);
  const winner = results.candidates[0];
  const podium = results.candidates.slice(0, 3);

  return (
    <div className="space-y-8">
      <motion.div {...fadeUp()} className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-success">🎉 Pemenang</p>
        {winner && (
          <>
            <h2 className="mt-2 font-heading text-3xl font-bold text-success sm:text-4xl">
              {winner.chairman_name}
            </h2>
            {winner.vice_chairman_name && (
              <p className="mt-1 text-muted-foreground">& {winner.vice_chairman_name}</p>
            )}
            <p className="mt-3 font-mono text-lg">
              <CountUp value={winner.votes} /> suara ({winner.percentage}%)
            </p>
          </>
        )}
      </motion.div>

      {podium.length > 1 && (
        <motion.div {...fadeUp(0.1)}>
          <h3 className="text-center font-heading text-xl font-semibold">Podium</h3>
          <div className="mt-6 flex items-end justify-center gap-3">
            {podium
              .slice()
              .sort((a, b) => b.votes - a.votes)
              .map((c, i) => {
                const order = [1, 0, 2];
                const position = order[i] ?? i;
                const heights = ['h-24', 'h-36', 'h-16'];
                const medal = ['🥇', '🥈', '🥉'];
                return (
                  <motion.div
                    key={c.candidateNumber}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: 0.2 + position * 0.15,
                      ease: [0.21, 0.47, 0.32, 0.98],
                    }}
                    className={`flex w-28 flex-col items-center rounded-t-xl border border-b-0 bg-card pt-3 shadow-sm ${heights[position]}`}
                  >
                    <span className="text-2xl">{medal[position]}</span>
                    <p className="mt-1 line-clamp-1 px-1 text-sm font-semibold">
                      {c.chairman_name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      <CountUp value={c.votes} />
                    </p>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>
      )}

      <motion.div {...fadeUp(0.15)} className="rounded-2xl border bg-card p-6 shadow-sm">
        <h3 className="font-heading text-xl font-semibold">Grafik Suara</h3>
        <div className="mt-5 space-y-4">
          {results.candidates.map((c, i) => (
            <div key={c.candidateNumber} className="flex items-center gap-3">
              <span className="w-8 shrink-0 text-right font-mono text-sm font-medium">
                {c.candidateNumber}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.chairman_name}</span>
                  <span className="font-mono text-muted-foreground">
                    <CountUp value={c.votes} /> · {c.percentage}%
                  </span>
                </div>
                <div className="mt-1.5 h-6 overflow-hidden rounded-md bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(c.votes / maxVotes) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.15 * i, ease: [0.21, 0.47, 0.32, 0.98] }}
                    className={`flex h-full items-center rounded-md pl-2 font-mono text-xs text-white ${
                      i === 0 ? 'bg-success' : 'bg-primary'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center font-mono text-sm text-muted-foreground">
          Total Suara: <CountUp value={results.total_votes} />
        </p>
      </motion.div>
    </div>
  );
}
