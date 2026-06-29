/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Scissors } from 'lucide-react';
import { ASSETS } from '../data';

interface LoaderProps {
  isLoading: boolean;
}

export default function Loader({ isLoading }: LoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isLoading ? 1 : 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      onAnimationComplete={() => {
        if (!isLoading) {
          document.body.style.overflow = 'unset';
        }
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950 text-white ${
        !isLoading ? 'pointer-events-none' : ''
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Golden Rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="absolute -inset-8 rounded-full border-2 border-t-amber-500 border-r-amber-500/30 border-b-amber-500/10 border-l-amber-500/40 opacity-75"
        />
        
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
          className="absolute -inset-12 rounded-full border-2 border-t-white/20 border-r-white/40 border-b-white/10 border-l-white/60 opacity-50"
        />

        {/* Brand Logo/Icon Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-amber-500 bg-neutral-900 p-2 shadow-2xl shadow-amber-500/20"
        >
          <img
            src={ASSETS.logo}
            alt="Delta Logo"
            className="h-full w-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8 text-center"
        >
          <h1 className="font-sans text-2xl font-bold tracking-[0.25em] text-amber-500 uppercase">
            DELTA
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-2 uppercase tracking-[0.15em]">
            Premium In-Home Haircut
          </p>
        </motion.div>

        {/* Loading Indicator */}
        <div className="mt-8 flex items-center gap-1.5">
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
            className="h-2 w-2 rounded-full bg-amber-500"
          />
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
            className="h-2 w-2 rounded-full bg-amber-400"
          />
          <motion.div
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
            className="h-2 w-2 rounded-full bg-amber-300"
          />
        </div>
      </div>
    </motion.div>
  );
}
