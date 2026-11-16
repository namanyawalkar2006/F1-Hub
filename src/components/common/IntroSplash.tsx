import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface IntroSplashProps {
  onEnter: () => void;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ onEnter }) => {
  const [isExiting, setIsExiting] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const enterDuration = prefersReducedMotion ? 0.01 : 0.72;

  return (
    <motion.main
      role="dialog"
      aria-modal="true"
      aria-label="F1 Hub intro"
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-white"
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={
        isExiting
          ? { opacity: 1, backgroundColor: '#080808' }
          : { opacity: 1, backgroundColor: '#ffffff' }
      }
      transition={{ duration: isExiting ? enterDuration : 0.45, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => {
        if (isExiting) onEnter();
      }}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600"
        initial={{ opacity: 0, scale: 0 }}
        animate={isExiting ? { opacity: [0, 0.16, 0], scale: [0, 90, 110] } : { opacity: 0, scale: 0 }}
        transition={{ duration: enterDuration, ease: 'easeOut' }}
      />

      <motion.button
        type="button"
        aria-label="Enter F1 Hub"
        className="group relative z-10 flex cursor-pointer flex-col items-center gap-3 rounded-xl px-8 py-8 text-center outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-8 focus-visible:ring-offset-white"
        style={{ top: '5vh' }}
        onClick={() => setIsExiting(true)}
        disabled={isExiting}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
        animate={
          isExiting
            ? { opacity: 0, y: -24, scale: 1.06, filter: 'blur(3px)' }
            : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
        }
        transition={{ duration: isExiting ? enterDuration : 0.65, ease: [0.16, 1, 0.3, 1] }}
        whileHover={prefersReducedMotion || isExiting ? undefined : { scale: 1.035 }}
        whileTap={prefersReducedMotion || isExiting ? undefined : { scale: 0.97 }}
      >
        <span
          aria-hidden="true"
          className="relative block overflow-hidden"
          style={{ width: 'min(200px, 70vw)', aspectRatio: '6.55 / 1' }}
        >
          <motion.img
            src="/assets/f1-logo.jpg"
            alt=""
            draggable={false}
            className="h-full w-full select-none object-cover"
            style={{
              filter: 'grayscale(1) brightness(4) contrast(100) invert(1)',
              mixBlendMode: 'multiply',
              objectPosition: 'center',
            }}
            animate={isExiting ? { x: 14, scaleX: 1.08 } : { x: 0, scaleX: 1 }}
            transition={{ duration: enterDuration, ease: [0.16, 1, 0.3, 1] }}
          />
        </span>
        <span className="font-racing text-xs font-bold uppercase tracking-[0.65em] text-neutral-500">
          Born to Race
        </span>
      </motion.button>
    </motion.main>
  );
};
