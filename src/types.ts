/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HairStyle {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface PriceTier {
  range: string;
  price: number;
  description: string;
}

export interface BookingData {
  fullName: string;
  whatsappNumber: string;
  fullAddress: string;
  googleMapsLink?: string;
  bookingDate: string;
  bookingTime: string;
  hairStyle: string;
  customStyleDetails?: string;
  estimatedDistance?: string;
}

export interface SavedBooking extends BookingData {
  id: string;
  numPeople: number;
  paymentMethod: string;
  totalPrice: number;
  addOns?: string[];
  priorityService?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  isNew?: boolean;
  caption?: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number; // 1 to 5
  comment?: string;
  date: string;
  isPinned?: boolean;
  isHidden?: boolean;
  whatsappNumber?: string;
}

