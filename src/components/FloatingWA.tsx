/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { MessageCircle, PhoneCall } from 'lucide-react';
import { WHATSAPP_NUMBER, OWNER_NAME } from '../data';

export default function FloatingWA() {
  const handleClick = () => {
    const message = `Hallo Muhammad Hidayat, saya ingin bertanya tentang layanan haircut Delta in Home.`;
    const cleanedNumber = WHATSAPP_NUMBER.startsWith('0')
      ? `62${WHATSAPP_NUMBER.substring(1)}`
      : WHATSAPP_NUMBER;
    const url = `https://wa.me/${cleanedNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2, duration: 0.5 }}
      className="fixed bottom-6 right-6 z-40"
      id="floating-whatsapp-container"
    >
      <button
        onClick={handleClick}
        className="relative group h-14 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border border-emerald-400/20 cursor-pointer"
        style={{ minWidth: '56px', minHeight: '56px' }}
        id="floating-whatsapp-button"
        title="Hubungi WhatsApp"
      >
        {/* Pulsing visual halo */}
        <span className="absolute -inset-1.5 rounded-full bg-emerald-500/30 animate-ping opacity-60 pointer-events-none" />

        {/* WhatsApp Icon */}
        <MessageCircle className="h-7 w-7 transition-transform group-hover:rotate-12" />

        {/* Floating tooltip on hover */}
        <span className="absolute right-16 bg-neutral-950 text-white font-sans text-xs font-semibold py-1.5 px-3.5 rounded-xl border border-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-xl">
          Tanya {OWNER_NAME}
        </span>
      </button>
    </motion.div>
  );
}
