/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Sparkles, MapPin, CalendarDays, ArrowRight, MessageSquare, Award } from 'lucide-react';
import { ASSETS, WHATSAPP_NUMBER, OWNER_NAME } from '../data';

export default function Hero() {
  const handleScrollToBooking = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const element = document.querySelector('#booking');
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleWhatsAppChat = () => {
    const message = `Halo Barber Delta, saya ingin bertanya tentang layanan haircut Delta in Home.`;
    const url = `https://wa.me/62${WHATSAPP_NUMBER.substring(1)}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const coreFeatures = [
    {
      icon: <ShieldCheck className="h-5 w-5 text-amber-500" />,
      text: 'Higienis & Steril',
    },
    {
      icon: <Sparkles className="h-5 w-5 text-amber-500" />,
      text: 'Barber Profesional',
    },
    {
      icon: <MapPin className="h-5 w-5 text-amber-500" />,
      text: 'Hemat Waktu Anda',
    },
  ];

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center bg-neutral-950 overflow-hidden pt-16"
    >
      {/* Dynamic Background Image with Zoom Effect */}
      <div className="absolute inset-0 z-0">
        <motion.div
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.45 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${ASSETS.hero})` }}
        />
        {/* Rich Radial Gradient Mask to focus details and ensure maximum text contrast */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_20%,_#0a0a0a_85%] bg-neutral-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-neutral-950/80" />
      </div>

      {/* Decorative Gold Accent Light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-12 pb-20">
        {/* Premium Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm"
        >
          <Award className="h-4 w-4 text-amber-400" />
          <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-widest text-amber-300 uppercase">
            #1 Premium In-Home Haircut
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="font-sans text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.15]"
        >
          Booking Haircut <br />
          <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
            Premium di Rumah
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-6 text-base sm:text-lg md:text-xl text-neutral-300 font-sans max-w-2xl mx-auto leading-relaxed"
        >
          Layanan potong rambut premium langsung ke lokasi Anda. Rasakan kenyamanan maksimal dicukur oleh{' '}
          <span className="text-white font-medium underline decoration-amber-500 decoration-2 underline-offset-4">
            Stylist Profesional Kami
          </span>{' '}
          tanpa mengantre atau meninggalkan kenyamanan rumah.
        </motion.p>

        {/* Bullet Trust Factors */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
        >
          {coreFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-neutral-900/60 border border-neutral-800 rounded-full py-1.5 px-4 shadow-lg"
            >
              {feat.icon}
              <span className="font-sans text-xs sm:text-sm font-medium text-neutral-300">
                {feat.text}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0"
        >
          {/* Main Booking Button */}
          <button
            onClick={handleScrollToBooking}
            className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 rounded-xl font-bold tracking-wider shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer group"
            id="hero-book-now"
          >
            <CalendarDays className="h-5 w-5" />
            BOOK NOW
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>

          {/* WhatsApp Secondary Button */}
          <button
            onClick={handleWhatsAppChat}
            className="w-full sm:w-auto min-h-[48px] px-8 py-4 bg-neutral-900/80 hover:bg-neutral-800 text-white rounded-xl font-bold tracking-wider border border-neutral-800 hover:border-amber-500/30 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] cursor-pointer"
            id="hero-whatsapp"
          >
            <MessageSquare className="h-5 w-5 text-amber-500" />
            CONTACT WHATSAPP
          </button>
        </motion.div>
      </div>

      {/* Elegant Bottom Curve/Overlay to bleed into portfolio */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />
    </section>
  );
}
