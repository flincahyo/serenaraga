'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Frown,
  Meh,
  Smile,
  Heart,
  Angry,
} from 'lucide-react';

export type EmojiRatingValue = 1 | 2 | 3 | 4 | 5;

interface RatingEmojiProps {
  value?: number;
  onChange?: (val: EmojiRatingValue) => void;
  disabled?: boolean;
  className?: string;
}

const RATINGS: {
  value: EmojiRatingValue;
  label: string;
  sublabel: string;
  icon: any;
  color: string;
  activeBg: string;
  borderColor: string;
  emoji: string;
}[] = [
  {
    value: 1,
    label: 'Kecewa',
    sublabel: 'Perlu banyak perbaikan',
    icon: Angry,
    color: 'text-rose-500',
    activeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300',
    borderColor: 'border-rose-400 dark:border-rose-700',
    emoji: '😡',
  },
  {
    value: 2,
    label: 'Kurang',
    sublabel: 'Kurang memuaskan',
    icon: Frown,
    color: 'text-orange-500',
    activeBg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300',
    borderColor: 'border-orange-400 dark:border-orange-700',
    emoji: '🙁',
  },
  {
    value: 3,
    label: 'Cukup',
    sublabel: 'Standar / biasa saja',
    icon: Meh,
    color: 'text-amber-500',
    activeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300',
    borderColor: 'border-amber-400 dark:border-amber-700',
    emoji: '😐',
  },
  {
    value: 4,
    label: 'Puas',
    sublabel: 'Pelayanan bagus & rapi',
    icon: Smile,
    color: 'text-emerald-500',
    activeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300',
    borderColor: 'border-emerald-400 dark:border-emerald-700',
    emoji: '😊',
  },
  {
    value: 5,
    label: 'Sangat Puas!',
    sublabel: 'Luar biasa istimewa',
    icon: Heart,
    color: 'text-earth-primary',
    activeBg: 'bg-earth-primary/10 dark:bg-earth-primary/20 text-earth-primary',
    borderColor: 'border-earth-primary dark:border-earth-primary/80',
    emoji: '😍',
  },
];

export function RatingEmoji({
  value = 5,
  onChange,
  disabled = false,
  className = '',
}: RatingEmojiProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const activeRating = RATINGS.find((r) => r.value === (hovered ?? value)) || RATINGS[4];

  return (
    <div className={`flex flex-col items-center gap-3.5 ${className}`}>
      {/* Emoji Buttons Row */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        {RATINGS.map((item) => {
          const isSelected = value === item.value;
          const isHovered = hovered === item.value;
          const isHighlighted = isSelected || isHovered;

          return (
            <motion.button
              key={item.value}
              type="button"
              disabled={disabled}
              whileHover={{ scale: disabled ? 1 : 1.15 }}
              whileTap={{ scale: disabled ? 1 : 0.92 }}
              onClick={() => onChange?.(item.value)}
              onMouseEnter={() => !disabled && setHovered(item.value)}
              onMouseLeave={() => !disabled && setHovered(null)}
              className={`relative size-11 sm:size-12 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                isSelected
                  ? `${item.activeBg} ${item.borderColor} shadow-xs scale-110 font-bold`
                  : isHovered
                  ? `${item.activeBg} border-zinc-300/80 dark:border-zinc-700 scale-105`
                  : 'bg-white/70 dark:bg-zinc-800/50 border-zinc-200/70 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 opacity-80 hover:opacity-100'
              }`}
            >
              <span className="text-xl sm:text-2xl select-none leading-none">{item.emoji}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Dynamic Label Feedback */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRating.value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="text-center"
        >
          <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
            {activeRating.label}
          </span>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {activeRating.sublabel}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
