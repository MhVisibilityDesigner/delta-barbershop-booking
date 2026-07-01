/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import logoUrl from './assets/images/logo_1782752165908.jpg';
import heroUrl from './assets/images/hero_barber_1782752180059.jpg';
import fadeUrl from './assets/images/haircut_fade_1782752193081.jpg';
import taperUrl from './assets/images/haircut_taper_1782752205588.jpg';

import { HairStyle, PriceTier, GalleryItem } from './types';

export const ASSETS = {
  logo: logoUrl,
  hero: heroUrl,
  fade: fadeUrl,
  taper: taperUrl,
};

export const HAIR_STYLES: HairStyle[] = [
  {
    id: 'fade',
    name: 'Fade',
    description: 'Gradasi super tipis di bagian samping dengan transisi halus dan presisi tinggi.',
    image: fadeUrl,
  },
  {
    id: 'taper',
    name: 'Taper',
    description: 'Gaya klasik yang memudar secara bertahap pada garis rambut alami untuk tampilan rapi yang maskulin.',
    image: taperUrl,
  },
  {
    id: 'undercut',
    name: 'Undercut',
    description: 'Bagian samping dipotong sangat pendek, kontras tajam dengan bagian atas yang lebih panjang.',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    id: 'pompadour',
    name: 'Pompadour',
    description: 'Bagian atas disisir ke belakang untuk menciptakan volume yang bervolume tinggi, retro luxury vibe.',
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    id: 'buzzcut',
    name: 'Buzz Cut',
    description: 'Potongan rambut ultra-pendek seragam yang maskulin, tegas, dan sangat low-maintenance.',
    image: 'https://images.unsplash.com/photo-1605497746445-97d1b0a9eaf4?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    id: 'custom',
    name: 'Custom Style',
    description: 'Diskusikan model rambut impian Anda langsung dengan Barber profesional kami.',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&h=400&q=80',
  },
];

export const PRICE_TIERS: PriceTier[] = [
  {
    range: '0 – 5 KM',
    price: 80000,
    description: 'Sangat cocok untuk area sekitar, kedatangan super cepat langsung ke rumah Anda.',
  },
  {
    range: '5 – 15 KM',
    price: 150000,
    description: 'Layanan home service premium standar dengan jangkauan wilayah menengah.',
  },
  {
    range: '15 – 30 KM',
    price: 250000,
    description: 'Jangkauan wilayah luas, menjamin kenyamanan Anda tanpa perlu keluar rumah.',
  },
  {
    range: '30 – 50 KM',
    price: 350000,
    description: 'Solusi terbaik untuk area sub-urban demi kualitas potongan rambut kelas premium.',
  },
  {
    range: '50 KM+',
    price: 500000,
    description: 'Layanan eksklusif jarak jauh, Barber profesional kami meluncur langsung khusus untuk Anda.',
  },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g1',
    title: 'High Skin Fade',
    category: 'Fade',
    imageUrl: fadeUrl,
  },
  {
    id: 'g2',
    title: 'Premium Textured Taper',
    category: 'Taper',
    imageUrl: taperUrl,
  },
  {
    id: 'g3',
    title: 'Modern Undercut Styling',
    category: 'Undercut',
    imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&h=800&q=80',
  },
  {
    id: 'g4',
    title: 'Classic Pompadour Blend',
    category: 'Pompadour',
    imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&h=800&q=80',
  },
  {
    id: 'g5',
    title: 'Minimalist Sharp Buzz Cut',
    category: 'Buzz Cut',
    imageUrl: 'https://images.unsplash.com/photo-1605497746445-97d1b0a9eaf4?auto=format&fit=crop&w=600&h=800&q=80',
  },
  {
    id: 'g6',
    title: 'Premium Executive Haircut',
    category: 'Custom',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&h=800&q=80',
  },
];

export const WHATSAPP_NUMBER = '08385064581';
export const OWNER_NAME = 'Barber Profesional';
export const INSTAGRAM_URL = 'https://www.instagram.com/bobberybob.id/';
