/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Instagram, MessageCircle, Mail, MapPin, ShieldAlert, Heart } from 'lucide-react';
import { ASSETS, WHATSAPP_NUMBER, OWNER_NAME, INSTAGRAM_URL } from '../data';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleWhatsApp = () => {
    const message = `Halo Barber Delta, saya ingin booking haircut Delta in Home.`;
    const cleanedNumber = WHATSAPP_NUMBER.startsWith('0')
      ? `62${WHATSAPP_NUMBER.substring(1)}`
      : WHATSAPP_NUMBER;
    const url = `https://wa.me/${cleanedNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="bg-neutral-950 text-neutral-400 border-t border-neutral-900 py-16" id="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Segment */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start pb-12 border-b border-neutral-900">
          
          {/* Column 1: Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-amber-500 bg-neutral-900 p-0.5">
                <img
                  src={ASSETS.logo}
                  alt="Delta Logo"
                  className="h-full w-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-base font-black tracking-widest text-white">
                  DELTA<span className="text-amber-500">.</span>INHOME
                </span>
                <span className="font-mono text-[9px] text-amber-500 tracking-wider font-semibold uppercase">
                  In-Home Haircut Booking
                </span>
              </div>
            </div>
            
            <p className="font-sans text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed">
              Layanan potong rambut premium langsung ke lokasi Anda oleh Barber profesional berpengalaman. Solusi cukur elite tanpa ribet keluar rumah.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-amber-400 hover:border-amber-500/30 transition-all active:scale-90"
                aria-label="Instagram"
                id="footer-instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <button
                onClick={handleWhatsApp}
                className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all active:scale-90 cursor-pointer"
                aria-label="WhatsApp"
                id="footer-whatsapp"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-sans text-xs font-bold text-white uppercase tracking-widest">
              Navigasi Halaman
            </h4>
            <ul className="space-y-2.5 font-sans text-xs sm:text-sm">
              <li>
                <a href="#home" className="hover:text-amber-400 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#portfolio" className="hover:text-amber-400 transition-colors">
                  Portfolio Model
                </a>
              </li>
              <li>
                <a href="#prices" className="hover:text-amber-400 transition-colors">
                  Daftar Harga Jarak
                </a>
              </li>
              <li>
                <a href="#booking" className="hover:text-amber-400 transition-colors">
                  Reservasi Jadwal
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Info */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-sans text-xs font-bold text-white uppercase tracking-widest">
              Layanan Pelanggan
            </h4>
            <div className="space-y-3 font-sans text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Home Service Area, Jawa Timur, ID</span>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>WA: {WHATSAPP_NUMBER} (Fast Response)</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Owner: Delta Barber</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Segment: Copyright & Credits */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
          <p className="text-center sm:text-left">
            Copyright © 2025 bobberybob.id. All Rights Reserved.
          </p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1 text-center justify-center">
            Crafted with <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" /> for luxury lifestyle.
          </p>
        </div>

      </div>
    </footer>
  );
}
