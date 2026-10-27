import { useEffect, useState } from 'react';
import { WELCOME_TITLE } from '../data/prompts';

/**
 * 落地页欢迎标题：打字机逐字动画 + 闪烁光标（仿百炼）。
 */
export function WelcomeHero() {
  const [count, setCount] = useState(0);
  const done = count >= WELCOME_TITLE.length;

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => setCount((c) => c + 1), 70);
    return () => window.clearTimeout(t);
  }, [count, done]);

  return (
    <h1 className="hero-in hero-title text-2xl md:text-3xl font-semibold text-center leading-snug px-4 min-h-[2.4em] md:min-h-[1.6em]">
      {WELCOME_TITLE.slice(0, count)}
      {/* 打字完成后光标淡出隐藏 */}
      <span className={`type-caret ${done ? 'type-caret--done' : ''}`} aria-hidden />
    </h1>
  );
}
