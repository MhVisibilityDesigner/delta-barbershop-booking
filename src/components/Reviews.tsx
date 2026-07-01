/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, MessageSquare, Trash2, Pin, Eye, EyeOff, 
  Check, AlertTriangle, Sparkles, User, Loader2 
} from 'lucide-react';
import { getReviews, saveReview, deleteReview, togglePinReview, toggleHideReview } from '../utils/db';
import { Review } from '../types';

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    whatsappNumber: '',
    comment: '',
    rating: 5
  });
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Hydrate on mount & listen to admin changes via simple interval (to share auth state seamlessly)
  useEffect(() => {
    loadAllReviews();

    const interval = setInterval(() => {
      const isLogged = sessionStorage.getItem('delta_admin_logged_in') === 'true';
      if (isLogged !== isAdmin) {
        setIsAdmin(isLogged);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  const loadAllReviews = async () => {
    try {
      const data = await getReviews();
      setReviews(data);
    } catch (e) {
      console.error('Failed to load reviews:', e);
    }
  };

  // BASELINE AGGREGATION:
  // Baseline is 127 reviews. Let's seed baseline counts:
  // 5 stars: 121
  // 4 stars: 5
  // 3 stars: 1
  // 2 stars: 0
  // 1 star: 0
  const baselineDistribution = {
    5: 121,
    4: 5,
    3: 1,
    2: 0,
    1: 0
  };

  // Compute active database reviews (excluding default base items stored in the reviews table to avoid double counting)
  const userAddedReviews = reviews.filter(r => !r.id.startsWith('r_base_'));
  
  // Calculate total counts combining baseline & user added reviews
  const totalReviewsCount = 127 + userAddedReviews.length;

  const getStarCount = (star: 5 | 4 | 3 | 2 | 1): number => {
    const customCount = userAddedReviews.filter(r => r.rating === star && !r.isHidden).length;
    return baselineDistribution[star] + customCount;
  };

  const count5 = getStarCount(5);
  const count4 = getStarCount(4);
  const count3 = getStarCount(3);
  const count2 = getStarCount(2);
  const count1 = getStarCount(1);

  const totalSum = (count5 * 5) + (count4 * 4) + (count3 * 3) + (count2 * 2) + (count1 * 1);
  const averageRating = totalReviewsCount > 0 ? (totalSum / totalReviewsCount).toFixed(1) : '5.0';

  // Percentages for progress bar
  const getPercentage = (count: number): number => {
    if (totalReviewsCount === 0) return 0;
    return Math.round((count / totalReviewsCount) * 100);
  };

  const percent5 = getPercentage(count5);
  const percent4 = getPercentage(count4);
  const percent3 = getPercentage(count3);
  const percent2 = getPercentage(count2);
  const percent1 = getPercentage(count1);

  // Submit Review Form
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitSuccess(false);

    if (!formData.name.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }

    if (!formData.whatsappNumber.trim()) {
      setFormError('Nomor WhatsApp wajib diisi untuk verifikasi anti-spam.');
      return;
    }

    // Optional Anti-spam: check if number already reviewed
    const phoneClean = formData.whatsappNumber.replace(/[^0-9]/g, '');
    const alreadyReviewed = reviews.some(r => {
      const rNum = r.whatsappNumber?.replace(/[^0-9]/g, '') || '';
      return rNum !== '' && rNum === phoneClean;
    });

    if (alreadyReviewed) {
      setFormError('Nomor WhatsApp ini sudah digunakan untuk memberikan ulasan. Batas 1 ulasan per orang.');
      return;
    }

    setIsSubmitting(true);

    // Simulate luxury delay
    setTimeout(async () => {
      try {
        const newReview: Review = {
          id: `review_${Date.now()}`,
          name: formData.name.trim(),
          rating: formData.rating,
          comment: formData.comment.trim() || undefined,
          date: new Date().toISOString().split('T')[0],
          whatsappNumber: phoneClean,
          isPinned: false,
          isHidden: false
        };

        await saveReview(newReview);
        await loadAllReviews();

        // Reset form
        setFormData({
          name: '',
          whatsappNumber: '',
          comment: '',
          rating: 5
        });
        setSubmitSuccess(true);
        setIsSubmitting(false);

        // Fade success message after 4s
        setTimeout(() => setSubmitSuccess(false), 4000);
      } catch (err) {
        console.error('Submit review failed:', err);
        setFormError('Terjadi kesalahan saat mengirim ulasan. Coba lagi.');
        setIsSubmitting(false);
      }
    }, 1200);
  };

  // Moderation Handlers
  const handleDeleteReview = async (id: string) => {
    if (window.confirm('Hapus ulasan ini secara permanen?')) {
      await deleteReview(id);
      await loadAllReviews();
    }
  };

  const handleTogglePin = async (id: string) => {
    await togglePinReview(id);
    await loadAllReviews();
  };

  const handleToggleHide = async (id: string) => {
    await toggleHideReview(id);
    await loadAllReviews();
  };

  // Sort logic for display:
  // 1. Pinned reviews first.
  // 2. Then regular reviews by date desc / id desc.
  // For standard customers, filter out hidden reviews.
  const visibleReviews = reviews.filter(r => isAdmin || !r.isHidden);
  
  const sortedReviews = [...visibleReviews].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.id.localeCompare(a.id);
  });

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <section id="reviews" className="bg-neutral-950 py-24 border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Header */}
        <div className="text-center max-w-xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3.5 py-1 mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-mono text-[10px] sm:text-xs font-semibold text-amber-400 tracking-widest uppercase">
              Customer Reviews
            </span>
          </motion.div>
          <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Ulasan Kepuasan Pelanggan
          </h2>
          <p className="mt-4 text-sm sm:text-base text-neutral-400 font-sans leading-relaxed">
            Kepuasan Anda adalah prioritas utama kami. Berikut adalah ulasan asli dari para pelanggan Barber Delta.
          </p>
        </div>

        {/* Dynamic Summary Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Summary Score Card */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 h-32 w-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold mb-2 block">Rating Kumulatif</span>
            <div className="text-6xl sm:text-7xl font-sans font-black text-white tracking-tight leading-none mb-4 flex items-baseline gap-1">
              {averageRating}
              <span className="text-lg text-neutral-500 font-normal">/ 5</span>
            </div>

            {/* Glowing Stars Display */}
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`h-5 w-5 ${
                    star <= Math.round(parseFloat(averageRating))
                      ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]' 
                      : 'text-neutral-700'
                  }`} 
                />
              ))}
            </div>

            <span className="text-xs text-neutral-400 font-sans">
              Berdasarkan <strong className="text-white font-bold">{totalReviewsCount}</strong> Ulasan Pelanggan
            </span>
          </div>

          {/* Progress Bars Card */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 flex flex-col justify-center space-y-4 col-span-1 lg:col-span-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Distribusi Penilaian</h4>

            <div className="space-y-3">
              {/* 5 Stars */}
              <div className="flex items-center gap-4 text-xs sm:text-sm">
                <span className="w-14 font-medium text-neutral-300 font-mono flex items-center gap-1 shrink-0">
                  5 <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-2.5 bg-neutral-950 rounded-full overflow-hidden relative border border-neutral-900">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percent5}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="h-full bg-amber-500 rounded-full" 
                  />
                </div>
                <span className="w-10 text-right font-mono text-neutral-400">{percent5}%</span>
              </div>

              {/* 4 Stars */}
              <div className="flex items-center gap-4 text-xs sm:text-sm">
                <span className="w-14 font-medium text-neutral-300 font-mono flex items-center gap-1 shrink-0">
                  4 <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-2.5 bg-neutral-950 rounded-full overflow-hidden relative border border-neutral-900">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percent4}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="h-full bg-amber-500/80 rounded-full" 
                  />
                </div>
                <span className="w-10 text-right font-mono text-neutral-400">{percent4}%</span>
              </div>

              {/* 3 Stars */}
              <div className="flex items-center gap-4 text-xs sm:text-sm">
                <span className="w-14 font-medium text-neutral-300 font-mono flex items-center gap-1 shrink-0">
                  3 <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-2.5 bg-neutral-950 rounded-full overflow-hidden relative border border-neutral-900">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percent3}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="h-full bg-amber-500/60 rounded-full" 
                  />
                </div>
                <span className="w-10 text-right font-mono text-neutral-400">{percent3}%</span>
              </div>

              {/* 2 Stars */}
              <div className="flex items-center gap-4 text-xs sm:text-sm">
                <span className="w-14 font-medium text-neutral-300 font-mono flex items-center gap-1 shrink-0">
                  2 <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-2.5 bg-neutral-950 rounded-full overflow-hidden relative border border-neutral-900">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percent2}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="h-full bg-amber-500/30 rounded-full" 
                  />
                </div>
                <span className="w-10 text-right font-mono text-neutral-400">{percent2}%</span>
              </div>

              {/* 1 Star */}
              <div className="flex items-center gap-4 text-xs sm:text-sm">
                <span className="w-14 font-medium text-neutral-300 font-mono flex items-center gap-1 shrink-0">
                  1 <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-2.5 bg-neutral-950 rounded-full overflow-hidden relative border border-neutral-900">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${percent1}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="h-full bg-amber-500/10 rounded-full" 
                  />
                </div>
                <span className="w-10 text-right font-mono text-neutral-400">{percent1}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form and Reviews Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Submit Review */}
          <div className="lg:col-span-5 bg-neutral-900/30 border border-neutral-800 rounded-3xl p-6 sm:p-8 relative">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-amber-500" />
              Tulis Ulasan Anda
            </h3>
            <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
              Bagikan pengalaman berharga Anda setelah dicukur oleh Barber Delta.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Clickable Gold Stars Row */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">Rating Kepuasan Anda <span className="text-amber-500">*</span></label>
                <div className="flex gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = hoverRating !== null ? star <= hoverRating : star <= formData.rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 focus:outline-none cursor-pointer transition-transform duration-200 active:scale-90"
                      >
                        <Star 
                          className={`h-7 w-7 transition-colors duration-200 ${
                            isFilled 
                              ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]' 
                              : 'text-neutral-700'
                          }`} 
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">Nama Lengkap <span className="text-amber-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Andi Saputra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full min-h-[44px] bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-white placeholder-neutral-700 rounded-xl px-4 text-xs sm:text-sm focus:outline-none transition-colors"
                />
              </div>

              {/* WhatsApp Number (For anti-spam) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Nomor WhatsApp <span className="text-amber-500">*</span>
                  <span className="text-neutral-500 text-[10px] font-normal ml-1">(Hanya untuk verifikasi anti-spam)</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 08123456789"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full min-h-[44px] bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-white placeholder-neutral-700 rounded-xl px-4 text-xs sm:text-sm focus:outline-none transition-colors"
                />
              </div>

              {/* Comment / Review Area */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">Ulasan / Komentar <span className="text-neutral-500">(Opsional)</span></label>
                <textarea
                  rows={3}
                  placeholder="Pelayanan sangat memuaskan, sangat direkomendasikan!"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-white placeholder-neutral-700 rounded-xl p-3.5 text-xs sm:text-sm focus:outline-none transition-colors resize-none"
                />
              </div>

              {formError && (
                <div className="flex items-start gap-2 text-xs text-red-500 font-semibold bg-red-950/20 border border-red-900/40 p-3 rounded-xl">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit Buttons / Loading States */}
              {isSubmitting ? (
                <div className="w-full min-h-[44px] bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 text-xs font-bold gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  Mengirim ulasan...
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full min-h-[44px] bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95 text-xs sm:text-sm"
                >
                  KIRIM ULASAN SEKARANG
                </button>
              )}

              {/* Success Message */}
              <AnimatePresence>
                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/20 border border-emerald-900/40 p-3.5 rounded-xl"
                  >
                    <Check className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                    <span>Ulasan Anda berhasil dikirim! Terima kasih atas feedback Anda.</span>
                  </motion.div>
                )}
              </AnimatePresence>

            </form>
          </div>

          {/* Right Column: Reviews List */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Semua Ulasan ({sortedReviews.length})</h4>

            <div className="space-y-4 max-h-[560px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
              <AnimatePresence mode="popLayout">
                {sortedReviews.length === 0 ? (
                  <div className="text-center py-10 bg-neutral-900/10 border border-neutral-900/50 rounded-3xl">
                    <User className="h-8 w-8 mx-auto text-neutral-700 mb-2 opacity-55" />
                    <span className="text-xs text-neutral-500">Belum ada ulasan khusus. Berikan ulasan pertama Anda!</span>
                  </div>
                ) : (
                  sortedReviews.map((review) => {
                    return (
                      <motion.div
                        layout
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className={`p-5 rounded-2xl border relative overflow-hidden transition-all ${
                          review.isPinned 
                            ? 'bg-neutral-900 border-amber-500/30 shadow-md shadow-amber-500/5' 
                            : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-800'
                        }`}
                        style={{ opacity: review.isHidden ? 0.5 : 1 }}
                      >
                        {/* Pinned Badge Glow */}
                        {review.isPinned && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-neutral-950 font-mono font-black text-[8px] tracking-widest px-3 py-0.5 rounded-bl-md uppercase flex items-center gap-1 z-10">
                            <Pin className="h-2 w-2 fill-neutral-950 text-neutral-950" />
                            PINNED
                          </div>
                        )}

                        {/* Hidden Badge Indicator */}
                        {review.isHidden && (
                          <div className="absolute top-0 right-0 bg-red-600 text-white font-mono font-bold text-[8px] tracking-widest px-3 py-0.5 rounded-bl-md uppercase z-10">
                            TERSEMBUNYI
                          </div>
                        )}

                        <div className="flex items-start gap-4">
                          
                          {/* Circle Avatar Initials */}
                          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-tr from-amber-500/20 to-amber-600/5 border border-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-xs sm:text-sm shrink-0">
                            {getInitials(review.name)}
                          </div>

                          {/* Review Details */}
                          <div className="flex-1 space-y-1.5 min-w-0">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="font-sans text-xs sm:text-sm font-bold text-white block truncate">
                                {review.name}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-mono">
                                {review.date}
                              </span>
                            </div>

                            {/* Stars */}
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-3.5 w-3.5 ${
                                    star <= review.rating 
                                      ? 'fill-amber-400 text-amber-400' 
                                      : 'text-neutral-700'
                                  }`} 
                                />
                              ))}
                            </div>

                            {/* Comment Text */}
                            <p className="font-sans text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
                              {review.comment || <em className="text-neutral-500 text-xs">Pelayanan sangat memuaskan, sangat ramah!</em>}
                            </p>

                            {/* Admin Moderation Control Strip */}
                            {isAdmin && (
                              <div className="flex items-center gap-2 pt-3 mt-3 border-t border-neutral-900 z-10">
                                {/* Toggle Pin button */}
                                <button
                                  onClick={() => handleTogglePin(review.id)}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                                    review.isPinned 
                                      ? 'bg-amber-500 text-neutral-950 border-amber-500' 
                                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700/60'
                                  }`}
                                  title="Pin review terbaik di atas"
                                >
                                  <Pin className="h-2.5 w-2.5 fill-current" />
                                  {review.isPinned ? 'Unpin' : 'Pin'}
                                </button>

                                {/* Toggle Hide button */}
                                <button
                                  onClick={() => handleToggleHide(review.id)}
                                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                                    review.isHidden 
                                      ? 'bg-red-900/60 text-white border-red-900/85' 
                                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700/60'
                                  }`}
                                  title="Sembunyikan dari regular customer"
                                >
                                  {review.isHidden ? (
                                    <>
                                      <Eye className="h-2.5 w-2.5" />
                                      Tampilkan
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-2.5 w-2.5" />
                                      Sembunyikan
                                    </>
                                  )}
                                </button>

                                {/* Delete button */}
                                <button
                                  onClick={() => handleDeleteReview(review.id)}
                                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-red-950/20 border border-red-900/60 text-red-400 hover:bg-red-900/80 hover:text-white transition-all flex items-center gap-1 ml-auto cursor-pointer"
                                  title="Hapus permanen"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                  Hapus
                                </button>
                              </div>
                            )}

                          </div>

                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
