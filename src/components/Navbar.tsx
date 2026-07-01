/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoExists, setLogoExists] = useState(false);
  const [isCheckingLogo, setIsCheckingLogo] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = '/assets/images/logo.png';
    img.onload = () => {
      setLogoExists(true);
      setIsCheckingLogo(false);
    };
    img.onerror = () => {
      setLogoExists(false);
      setIsCheckingLogo(false);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: 'Home', href: '#home' },
    { name: 'Portfolio', href: '#portfolio' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'Price List', href: '#prices' },
    { name: 'Book Now', href: '#booking', primary: true },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const offset = 80; // height of navbar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-neutral-950/90 backdrop-blur-md border-b border-amber-500/10 py-3 shadow-lg shadow-black/30'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo and Brand Name */}
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, '#home')}
              className="flex items-center group"
              id="navbar-logo-link"
            >
              {logoExists && !isCheckingLogo ? (
                <img
                  src="/assets/images/logo.png"
                  alt="Delta Barbershop.co"
                  className="h-auto max-h-[42px] sm:max-h-[52px] md:max-h-[52px] lg:max-h-[60px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-sans text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  Delta Barbershop<span className="text-amber-500">.</span>co
                </span>
              )}
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {menuItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`text-sm font-medium tracking-wider transition-all duration-200 ${
                    item.primary
                      ? 'bg-amber-500 hover:bg-amber-600 text-neutral-950 px-5 py-2.5 rounded-full shadow-lg shadow-amber-500/20 active:scale-95 font-semibold'
                      : 'text-neutral-300 hover:text-amber-400'
                  }`}
                  id={`nav-item-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  {item.name}
                </a>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center p-2 rounded-lg text-neutral-300 hover:text-amber-500 bg-neutral-900/50 border border-neutral-800 focus:outline-none transition-all active:scale-90"
                style={{ minWidth: '44px', minHeight: '44px' }}
                aria-label="Toggle menu"
                id="mobile-menu-toggle"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-neutral-950/95 border-b border-amber-500/10"
            >
              <div className="px-4 pt-2 pb-6 space-y-3">
                {menuItems.map((item, index) => (
                  <motion.a
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`block text-center text-base tracking-wider rounded-xl transition-all duration-200 ${
                      item.primary
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 py-3.5 font-bold shadow-lg shadow-amber-500/10'
                        : 'text-neutral-300 hover:text-amber-500 py-3 hover:bg-neutral-900/50 border border-transparent hover:border-neutral-800'
                    }`}
                    id={`mobile-nav-item-${item.name.toLowerCase().replace(' ', '-')}`}
                  >
                    {item.name}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
