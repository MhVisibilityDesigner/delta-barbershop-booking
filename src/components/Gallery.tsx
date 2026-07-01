/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Maximize2, X, CheckCircle2, CalendarRange, Lock, LockOpen, 
  Plus, Trash2, Edit3, Image as ImageIcon, Upload, Loader2, Sparkles, Check
} from 'lucide-react';
import { GALLERY_ITEMS } from '../data';
import { GalleryItem } from '../types';
import { 
  getCustomGalleryItems, 
  saveCustomGalleryItem, 
  deleteCustomGalleryItem, 
  updateCustomGalleryItem 
} from '../utils/db';
import { compressAndConvertToWebp } from '../utils/image';

interface GalleryProps {
  onSelectStyle: (styleName: string) => void;
}

export default function Gallery({ onSelectStyle }: GalleryProps) {
  // DB & State items
  const [customItems, setCustomItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  // Admin Authorization States
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showAdminLogin, setShowAdminLogin] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');

  // Upload Panel States
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadCategory, setUploadCategory] = useState<string>('Fade');
  const [uploadCaption, setUploadCaption] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');

  // Edit Caption States
  const [isEditingCaption, setIsEditingCaption] = useState<boolean>(false);
  const [editCaptionValue, setEditCaptionValue] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categories = ['All', 'Fade', 'Taper', 'Undercut', 'Pompadour', 'Buzz Cut'];

  // Load custom items on mount and listen to changes
  useEffect(() => {
    loadGalleryItems();
    // Check if user was previously logged in as admin
    const storedAdmin = sessionStorage.getItem('delta_admin_logged_in');
    if (storedAdmin === 'true') {
      setIsAdmin(true);
    }

    // Secret entry: check for admin=true in search or #admin in hash
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || window.location.hash === '#admin') {
      setShowAdminLogin(true);
    }
  }, []);

  const loadGalleryItems = async () => {
    try {
      const items = await getCustomGalleryItems();
      setCustomItems(items);
    } catch (e) {
      console.error('Failed to load custom gallery items:', e);
    }
  };

  // Combine static data with custom uploads
  // Custom items are displayed first with a "New" badge
  const allGalleryItems: GalleryItem[] = [
    ...customItems.map(item => ({ ...item, isNew: true })),
    ...GALLERY_ITEMS
  ];

  const filteredItems = activeFilter === 'All'
    ? allGalleryItems
    : allGalleryItems.filter((item) => item.category.toLowerCase() === activeFilter.toLowerCase());

  const handleBookStyle = (styleName: string) => {
    onSelectStyle(styleName);
    setSelectedItem(null);
    
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

  // Admin passcode login ("admin123")
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setIsAdmin(true);
      sessionStorage.setItem('delta_admin_logged_in', 'true');
      setShowAdminLogin(false);
      setAdminPassword('');
      setAdminError('');
    } else {
      setAdminError('Passcode salah. Silakan coba lagi.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('delta_admin_logged_in');
  };

  // Client-side image validation and upload handler
  const handleFileChange = (file: File) => {
    setUploadError('');
    
    // Validate file size (limit: 10MB)
    const limitBytes = 10 * 1024 * 1024;
    if (file.size > limitBytes) {
      setUploadError('Ukuran file melebihi batas 10MB.');
      return;
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Format tidak didukung. Harap gunakan JPG, PNG, atau WEBP.');
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) {
      setUploadError('Foto dan Model Rambut wajib diisi.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setUploadError('');

    try {
      // Step 1: Compress and convert to WebP client-side
      setUploadProgress(40);
      const webpBase64 = await compressAndConvertToWebp(uploadFile);
      
      setUploadProgress(75);
      const newItem: GalleryItem = {
        id: `custom_${Date.now()}`,
        title: uploadTitle.trim(),
        category: uploadCategory,
        imageUrl: webpBase64,
        caption: uploadCaption.trim() || undefined
      };

      // Step 2: Save to IndexedDB (stable and fast storage)
      await saveCustomGalleryItem(newItem);
      
      setUploadProgress(100);
      setTimeout(() => {
        // Reset upload fields
        setUploadFile(null);
        setUploadPreview(null);
        setUploadTitle('');
        setUploadCaption('');
        setIsUploading(false);
        setUploadProgress(0);
        
        // Reload items
        loadGalleryItems();
      }, 500);

    } catch (err: any) {
      console.error('Upload process failed:', err);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadError(err.message || 'Gagal memproses gambar. Harap coba lagi.');
    }
  };

  // Delete uploaded custom photo
  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus foto ini dari galeri?')) {
      try {
        await deleteCustomGalleryItem(id);
        setSelectedItem(null);
        loadGalleryItems();
      } catch (e) {
        console.error('Delete photo failed:', e);
      }
    }
  };

  // Edit Caption handler
  const handleSaveCaption = async () => {
    if (!selectedItem) return;
    try {
      await updateCustomGalleryItem(
        selectedItem.id,
        selectedItem.title,
        selectedItem.category,
        editCaptionValue
      );
      setSelectedItem({
        ...selectedItem,
        caption: editCaptionValue
      });
      setIsEditingCaption(false);
      loadGalleryItems();
    } catch (e) {
      console.error('Failed to update caption:', e);
    }
  };

  return (
    <section id="portfolio" className="bg-neutral-950 py-24 border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title Section & Admin Toggle */}
        <div className="flex flex-col items-center text-center max-w-xl mx-auto mb-10 relative">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5 }}
              onClick={() => !isAdmin && setShowAdminLogin(true)}
              className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3.5 py-1 cursor-pointer select-none active:scale-95 transition-transform"
              id="secret-admin-trigger"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-mono text-[10px] sm:text-xs font-semibold text-amber-400 tracking-widest uppercase">
                Delta Portfolio
              </span>
            </motion.div>

            {/* Admin Toggle button (only shown when already logged in as Admin to allow easy logout) */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleAdminLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full border transition-all cursor-pointer bg-amber-500 text-neutral-950 border-amber-500 shadow-md shadow-amber-500/20"
                id="admin-logout-btn"
              >
                <LockOpen className="h-3 w-3" />
                Logout Admin
              </button>
            )}
          </div>

          <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Inspirasi Model Rambut
          </h2>
          <p className="mt-4 text-sm sm:text-base text-neutral-400 font-sans leading-relaxed">
            Koleksi hasil cukuran presisi tinggi dan terpopuler dari Barber Delta.
          </p>
        </div>

        {/* 1. ADMIN PASSPHRASE MODAL */}
        <AnimatePresence>
          {showAdminLogin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAdminLogin(false)}
                className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-neutral-900 border border-neutral-800 p-6 sm:p-8 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl z-10 text-center"
              >
                <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-500">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Verifikasi Akses Admin</h3>
                <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                  Masukkan passcode khusus admin untuk membuka kontrol galeri & moderasi ulasan. (Gunakan: <code className="text-amber-400 font-bold bg-neutral-950 px-1 py-0.5 rounded">admin123</code>)
                </p>

                <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                  <input
                    type="password"
                    required
                    placeholder="Masukkan passcode"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full min-h-[44px] bg-neutral-950 border border-neutral-800 focus:border-amber-500 text-white placeholder-neutral-700 rounded-xl px-4 text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  {adminError && <p className="text-xs text-red-500 font-medium">{adminError}</p>}
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdminLogin(false)}
                      className="flex-1 min-h-[44px] bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 min-h-[44px] bg-amber-500 hover:bg-amber-600 text-neutral-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
                    >
                      Verifikasi
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 2. GALLERY MANAGEMENT UPLOAD PANEL (ADMIN ONLY) */}
        <AnimatePresence>
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-14 bg-neutral-900/60 border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-6 border-b border-neutral-800/80 pb-4">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">Gallery Management Panel</h3>
                  <p className="text-[10px] text-neutral-400 leading-none">Unggah dan kelola hasil cukuran barber Anda secara langsung.</p>
                </div>
              </div>

              <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Drag and Drop Zone */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-300">Unggah Foto Hasil Haircut</label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-800 hover:border-amber-500/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center bg-neutral-950/80 relative min-h-[190px] group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChange(file);
                      }}
                      className="hidden"
                    />

                    {uploadPreview ? (
                      <div className="absolute inset-2 rounded-xl overflow-hidden bg-neutral-950">
                        <img 
                          src={uploadPreview} 
                          alt="Pratinjau upload" 
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadFile(null);
                            setUploadPreview(null);
                          }}
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-600/95 text-white flex items-center justify-center hover:bg-red-700 transition-all shadow-md cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="h-11 w-11 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-400 group-hover:text-amber-400 group-hover:border-amber-500/20 transition-all">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-neutral-300 block">Drag & Drop atau Klik untuk Upload</span>
                          <span className="text-[10px] text-neutral-500 mt-1 block">Mendukung JPG, PNG, WEBP (Max 10MB)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meta Inputs */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Model Rambut <span className="text-amber-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          placeholder="Contoh: Low Burst Fade"
                          className="w-full min-h-[44px] bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-4 text-xs text-white placeholder-neutral-700 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Kategori Filter</label>
                        <select
                          value={uploadCategory}
                          onChange={(e) => setUploadCategory(e.target.value)}
                          className="w-full min-h-[44px] bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl px-4 text-xs text-white focus:outline-none transition-colors cursor-pointer"
                        >
                          {categories.filter(c => c !== 'All').map(cat => (
                            <option key={cat} value={cat} className="bg-neutral-905">{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">Keterangan / Caption <span className="text-neutral-500">(Opsional)</span></label>
                      <textarea
                        rows={2}
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        placeholder="Detail tambahan potongan rambut, pomade yang dipakai, dll."
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-xs text-white placeholder-neutral-700 focus:outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {uploadError && <p className="text-xs text-red-500 font-semibold">{uploadError}</p>}
                    
                    {isUploading ? (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-400 flex items-center gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                            Memproses foto (Auto-compress & WebP)...
                          </span>
                          <span className="font-mono text-amber-500 font-bold">{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-amber-500" 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={!uploadFile || !uploadTitle.trim()}
                        className="w-full min-h-[44px] bg-amber-50 hover:bg-amber-500 text-neutral-950 hover:text-neutral-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer"
                      >
                        <Plus className="h-4.5 w-4.5" />
                        UNGGAH KE GALERI
                      </button>
                    )}
                  </div>
                </div>

              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 overflow-x-auto pb-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`min-h-[44px] px-5 py-2.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                activeFilter === cat
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-lg shadow-amber-500/15'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700'
              }`}
              style={{ minHeight: '44px' }}
              id={`filter-${cat.toLowerCase().replace(' ', '-')}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Portfolio Masonry-style Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                whileHover={{ y: -6 }}
                onClick={() => {
                  setSelectedItem(item);
                  setEditCaptionValue(item.caption || '');
                  setIsEditingCaption(false);
                }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800/60 aspect-[3/4]"
                id={`gallery-item-${item.id}`}
              >
                {/* Image */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Custom "New" Badge */}
                {item.isNew && (
                  <div className="absolute top-3 left-3 bg-amber-500 text-neutral-950 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-md shadow-black/40 flex items-center gap-1 z-10 animate-pulse">
                    <Sparkles className="h-2.5 w-2.5" />
                    NEW
                  </div>
                )}

                {/* Admin Quick Action (Delete) */}
                {isAdmin && item.id.startsWith('custom_') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                    className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-red-600/90 border border-red-500 text-white flex items-center justify-center hover:bg-red-700 hover:scale-110 active:scale-95 transition-all shadow-lg"
                    title="Hapus foto dari galeri"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                {/* Dark Overlay & Luxury Highlights */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                
                {/* Visual Glow borders on Hover */}
                <div className="absolute inset-0 border border-amber-500/0 group-hover:border-amber-500/30 rounded-2xl transition-all duration-300" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 flex flex-col justify-end">
                  <span className="font-mono text-[9px] font-semibold text-amber-500 tracking-wider uppercase mb-1">
                    {item.category}
                  </span>
                  <h3 className="font-sans text-xs sm:text-base md:text-lg font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  {item.caption && (
                    <p className="font-sans text-[10px] text-neutral-400 mt-1 truncate max-w-[180px]">
                      {item.caption}
                    </p>
                  )}
                  
                  {/* Subtle Maximize Icon */}
                  <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-neutral-950/80 border border-neutral-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Maximize2 className="h-4 w-4 text-amber-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Fullscreen Lightbox Modal */}
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Overlay background */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedItem(null)}
                className="absolute inset-0 bg-neutral-950/95 backdrop-blur-md"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black z-10"
                id="gallery-lightbox-modal"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 h-10 w-10 rounded-full bg-neutral-950/70 border border-neutral-800 hover:border-amber-500 text-white flex items-center justify-center hover:text-amber-500 transition-all active:scale-90 focus:outline-none cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Lightbox Content */}
                <div className="flex flex-col sm:flex-row h-full">
                  {/* Image wrapper */}
                  <div className="w-full sm:w-1/2 bg-neutral-950 flex items-center justify-center aspect-[4/5] sm:aspect-auto">
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Text Details & Action */}
                  <div className="w-full sm:w-1/2 p-6 sm:p-8 flex flex-col justify-between bg-neutral-900">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="inline-block bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-0.5">
                          <span className="font-mono text-[10px] font-semibold text-amber-400 tracking-widest uppercase">
                            {selectedItem.category}
                          </span>
                        </div>
                        
                        {/* Admin Action inside lightbox */}
                        {isAdmin && selectedItem.id.startsWith('custom_') && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setIsEditingCaption(!isEditingCaption);
                              }}
                              className="h-8 w-8 rounded-full bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                              title="Edit caption"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(selectedItem.id)}
                              className="h-8 w-8 rounded-full bg-red-950 hover:bg-red-900 border border-red-900/60 text-red-400 hover:text-red-300 flex items-center justify-center transition-all cursor-pointer"
                              title="Hapus foto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-sans text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                        {selectedItem.title}
                      </h3>
                      
                      {/* Caption display or edit input */}
                      {isEditingCaption ? (
                        <div className="space-y-2 pt-2">
                          <textarea
                            rows={3}
                            value={editCaptionValue}
                            onChange={(e) => setEditCaptionValue(e.target.value)}
                            className="w-full text-xs bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-700 focus:border-amber-500 focus:outline-none resize-none"
                            placeholder="Tulis keterangan baru..."
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setIsEditingCaption(false)}
                              className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 text-[10px] text-neutral-400 rounded-lg cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              onClick={handleSaveCaption}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="h-3 w-3" /> Simpan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-neutral-300 text-xs sm:text-sm font-sans italic leading-relaxed">
                          {selectedItem.caption ? `"${selectedItem.caption}"` : 'Karya pengerjaan berkualitas premium dan berkelas tinggi.'}
                        </div>
                      )}

                      <div className="mt-4 space-y-2.5 border-t border-neutral-850 pt-4">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          <span className="font-sans text-xs text-neutral-400">
                            Potongan simetris, presisi, disesuaikan dengan kontur wajah.
                          </span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          <span className="font-sans text-xs text-neutral-400">
                            Menggunakan clipper dan razor steril berstandar premium.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <button
                        onClick={() => handleBookStyle(selectedItem.category)}
                        className="w-full min-h-[48px] py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        id="lightbox-book-style"
                      >
                        <CalendarRange className="h-4.5 w-4.5" />
                        PILIH MODEL INI
                      </button>
                      <p className="mt-2 text-center text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                        Akan mengisi model rambut di form booking
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
