/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Navigation, Info, ArrowRight, ShieldCheck } from 'lucide-react';
import { PRICE_TIERS } from '../data';

interface PriceListProps {
  onSelectDistance: (distance: string) => void;
}

export default function PriceList({ onSelectDistance }: PriceListProps) {
  const [distanceKm, setDistanceKm] = useState<number>(5);

  // Helper to determine which tier is active based on slider distance
  const getActiveTierIndex = (km: number) => {
    if (km <= 5) return 0;
    if (km <= 15) return 1;
    if (km <= 30) return 2;
    if (km <= 50) return 3;
    return 4;
  };

  const activeIndex = getActiveTierIndex(distanceKm);
  const activeTier = PRICE_TIERS[activeIndex];

  const handleSelectEstimator = () => {
    onSelectDistance(activeTier.range);
    
    // Smooth scroll directly to the booking section
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

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section id="prices" className="bg-neutral-900 py-24 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Block */}
        <div className="text-center max-w-xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3.5 py-1 mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="font-mono text-[10px] sm:text-xs font-semibold text-amber-400 tracking-widest uppercase">
              Daftar Harga & Jarak
            </span>
          </motion.div>
          <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Tarif Layanan Home Service
          </h2>
          <p className="mt-4 text-sm sm:text-base text-neutral-400 font-sans leading-relaxed">
            Biaya potongan rambut premium disesuaikan transparan berdasarkan jarak tempuh dari lokasi kami ke rumah Anda.
          </p>
        </div>

        {/* Interactive Estimator & List Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Distance Estimator */}
          <div className="lg:col-span-5 bg-neutral-950 border border-neutral-800/80 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                <Navigation className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-sans text-lg font-bold text-white">Kalkulator Jarak</h3>
                <p className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
                  Cek Estimasi Biaya Instant
                </p>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-6 mt-8">
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm text-neutral-300">Estimasi Jarak Rumah Anda:</span>
                <span className="font-mono text-xl font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-0.5">
                  {distanceKm === 55 ? '50+ KM' : `${distanceKm} KM`}
                </span>
              </div>

              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="55"
                  step="1"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                  id="distance-range-slider"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-2 px-1">
                  <span>0 KM</span>
                  <span>15 KM</span>
                  <span>30 KM</span>
                  <span>50 KM+</span>
                </div>
              </div>

              {/* Dynamic Price Box */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center mt-6 relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-amber-500/5 blur-2xl" />

                <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest block mb-1">
                  ESTIMASI TARIF JASA
                </span>
                
                {/* Scaled Text animation */}
                <motion.div
                  key={activeTier.price}
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="font-sans text-3xl sm:text-4xl font-black text-amber-500 tracking-tight"
                >
                  {formatRupiah(activeTier.price)}
                </motion.div>
                
                <span className="font-sans text-xs text-neutral-300 mt-2 block">
                  Kategori: <strong className="text-white">{activeTier.range}</strong>
                </span>
                <p className="font-sans text-[11px] text-neutral-400 mt-2 italic">
                  "{activeTier.description}"
                </p>
              </div>

              <button
                onClick={handleSelectEstimator}
                className="w-full min-h-[48px] py-4 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                id="estimator-select-distance"
              >
                BOOKING DENGAN JARAK INI
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Complete Price Table */}
          <div className="lg:col-span-7 space-y-3.5">
            {PRICE_TIERS.map((tier, idx) => {
              const isActive = idx === activeIndex;
              return (
                <motion.div
                  key={tier.range}
                  className={`relative flex items-center justify-between p-5 rounded-2xl transition-all duration-300 border ${
                    isActive
                      ? 'bg-neutral-950 border-amber-500 shadow-xl shadow-amber-500/5 scale-[1.01]'
                      : 'bg-neutral-950/40 border-neutral-800/80 hover:border-neutral-700/60'
                  }`}
                  id={`price-tier-card-${idx}`}
                >
                  {/* Highlight bar on left side of active card */}
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-amber-500 rounded-r-md" />
                  )}

                  <div className="flex flex-col pr-4">
                    <span className="font-sans text-base font-bold text-white">
                      Jarak {tier.range}
                    </span>
                    <span className="font-sans text-[11px] sm:text-xs text-neutral-400 mt-1 max-w-[280px] sm:max-w-md leading-relaxed">
                      {tier.description}
                    </span>
                  </div>

                  <div className="text-right shrink-0 flex flex-col justify-center items-end">
                    <span
                      className={`font-sans text-base sm:text-lg font-black transition-colors duration-200 ${
                        isActive ? 'text-amber-400' : 'text-white'
                      }`}
                    >
                      {formatRupiah(tier.price)}
                    </span>
                    {isActive && (
                      <span className="font-mono text-[9px] text-amber-500 font-semibold tracking-wider uppercase mt-1">
                        Terpilih di kalkulator
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Note alert */}
            <div className="flex items-start gap-3 bg-neutral-950/20 border border-neutral-800 rounded-2xl p-4.5 mt-4">
              <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="font-sans text-xs text-neutral-400 leading-relaxed">
                <strong className="text-neutral-300">Catatan Jarak Tempuh:</strong> Penentuan kategori jarak diukur menggunakan rute real-time Google Maps dari titik pusat barber. Anda juga dapat berkonsultasi mengenai detail alamat via WhatsApp jika berada di perbatasan wilayah.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
