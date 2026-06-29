/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Gallery from './components/Gallery';
import Reviews from './components/Reviews';
import PriceList from './components/PriceList';
import BookingForm from './components/BookingForm';
import FloatingWA from './components/FloatingWA';
import Footer from './components/Footer';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Interactive global preselection states
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedDistance, setSelectedDistance] = useState('');

  useEffect(() => {
    // Premium loading sequence to allow assets to cache
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  const handleSelectStyle = (styleName: string) => {
    setSelectedStyle(styleName);
  };

  const handleSelectDistance = (distanceRange: string) => {
    setSelectedDistance(distanceRange);
  };

  const handleClearSelections = () => {
    setSelectedStyle('');
    setSelectedDistance('');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-amber-500 selection:text-neutral-950 font-sans antialiased overflow-x-hidden">
      {/* 1. Loader Screen */}
      <Loader isLoading={isLoading} />

      {/* Main Content (faded in when loader completes) */}
      <AnimatePresence>
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col min-h-screen"
          >
            {/* 2. Sticky Glassmorphic Navbar */}
            <Navbar />

            {/* 3. Hero Showcase */}
            <Hero />

            {/* 4. Luxury Portfolio Gallery with tap lightboxes */}
            <Gallery onSelectStyle={handleSelectStyle} />

            {/* 4.5 Customer Reviews and Ratings */}
            <Reviews />

            {/* 5. Interactive Price list based on distance */}
            <PriceList onSelectDistance={handleSelectDistance} />

            {/* 6. Form Booking Reservation with auto-WhatsApp */}
            <BookingForm
              selectedStyle={selectedStyle}
              selectedDistance={selectedDistance}
              onClearSelections={handleClearSelections}
            />

            {/* 7. Footer details */}
            <Footer />

            {/* 8. Floating Action WhatsApp Support */}
            <FloatingWA />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
