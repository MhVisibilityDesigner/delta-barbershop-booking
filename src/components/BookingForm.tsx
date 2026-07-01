/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, MessageSquare, MapPin, Calendar, Clock, Scissors, Info, Send, CheckCircle2, Wallet, CreditCard, Coins, QrCode, Copy, Check, UploadCloud, X, FileImage, ChevronDown, ChevronUp, Zap, AlertCircle } from 'lucide-react';
import { HAIR_STYLES, PRICE_TIERS, WHATSAPP_NUMBER, OWNER_NAME } from '../data';
import { BookingData, SavedBooking } from '../types';
import { getBookings, saveBooking } from '../utils/db';
import L from 'leaflet';

interface BookingFormProps {
  selectedStyle: string;
  selectedDistance: string;
  onClearSelections: () => void;
}

export default function BookingForm({ selectedStyle, selectedDistance, onClearSelections }: BookingFormProps) {
  // Main form states
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [hairStyleInput, setHairStyleInput] = useState('');
  const [numPeople, setNumPeople] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BCA' | 'DANA' | 'QRIS'>('COD');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(null);
  const [bcaCopied, setBcaCopied] = useState(false);
  const [danaCopied, setDanaCopied] = useState(false);
  const [estimatedDistance, setEstimatedDistance] = useState('0 – 5 KM');

  // Advanced feature states
  const [isRepeated, setIsRepeated] = useState(false);
  const [bookedSlotsForDate, setBookedSlotsForDate] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [priorityService, setPriorityService] = useState(false);

  // Interactive UI states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Auto Price Calculation & Routing States
  const BARBER_LOCATION = {
    lat: -6.108,
    lng: 106.880,
    address: "Tanjung Priok Kalibaru"
  };
  const HAIR_CUT_PRICE = 85000;

  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [customerCoords, setCustomerCoords] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // Try to extract lat/lng from Google Maps link
  const extractCoordsFromUrl = (url: string): { lat: number; lng: number } | null => {
    if (!url) return null;
    try {
      const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const matchAt = url.match(regexAt);
      if (matchAt) {
        return { lat: parseFloat(matchAt[1]), lng: parseFloat(matchAt[2]) };
      }

      const regexPlace = /place\/(-?\d+\.\d+),(-?\d+\.\d+)/;
      const matchPlace = url.match(regexPlace);
      if (matchPlace) {
        return { lat: parseFloat(matchPlace[1]), lng: parseFloat(matchPlace[2]) };
      }

      const regexQ = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
      const matchQ = url.match(regexQ);
      if (matchQ) {
        return { lat: parseFloat(matchQ[1]), lng: parseFloat(matchQ[2]) };
      }

      const regexSimple = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
      const matchSimple = url.match(regexSimple);
      if (matchSimple) {
        return { lat: parseFloat(matchSimple[1]), lng: parseFloat(matchSimple[2]) };
      }
    } catch (e) {
      console.error("Error parsing maps link:", e);
    }
    return null;
  };

  // Sync props
  useEffect(() => {
    if (selectedStyle) {
      const found = HAIR_STYLES.find(
        (s) => s.name.toLowerCase() === selectedStyle.toLowerCase() || s.id === selectedStyle.toLowerCase()
      );
      if (found) {
        setHairStyleInput(found.name);
      } else {
        setHairStyleInput(selectedStyle);
      }
    }
  }, [selectedStyle]);

  // Handle selectedDistance mapping to dynamic price simulation
  useEffect(() => {
    if (selectedDistance) {
      setEstimatedDistance(selectedDistance);
      // Pre-populate realistic numeric coordinates and distance on selection to prevent blocking
      switch (selectedDistance) {
        case '0 – 5 KM':
          setDistance(3);
          setDuration(8);
          break;
        case '5 – 15 KM':
          setDistance(10);
          setDuration(22);
          break;
        case '15 – 30 KM':
          setDistance(22);
          setDuration(45);
          break;
        case '30 – 50 KM':
          setDistance(40);
          setDuration(75);
          break;
        case '50 KM+':
          setDistance(60);
          setDuration(110);
          break;
        default:
          break;
      }
    }
  }, [selectedDistance]);

  // Geocoding and Routing Calculation Effect
  useEffect(() => {
    const targetAddress = fullAddress.trim();
    const targetLink = googleMapsLink.trim();

    if (!targetAddress && !targetLink) {
      // Do not reset if selectedDistance has initialized a fallback distance
      if (!selectedDistance) {
        setDistance(null);
        setDuration(null);
        setCustomerCoords(null);
        setRouteCoords([]);
        setCalcError(null);
      }
      setIsCalculating(false);
      return;
    }

    setIsCalculating(true);
    setCalcError(null);

    const debounceTimer = setTimeout(async () => {
      try {
        let lat: number | null = null;
        let lng: number | null = null;

        // 1. Try to extract from Google Maps Link first
        const coordsFromLink = extractCoordsFromUrl(targetLink) || extractCoordsFromUrl(targetAddress);
        
        if (coordsFromLink) {
          lat = coordsFromLink.lat;
          lng = coordsFromLink.lng;
        } else if (targetAddress) {
          // 2. Geocode using OpenStreetMap Nominatim
          let query = targetAddress;
          if (!query.toLowerCase().includes('jakarta') && 
              !query.toLowerCase().includes('tangerang') && 
              !query.toLowerCase().includes('bekasi') && 
              !query.toLowerCase().includes('depok') && 
              !query.toLowerCase().includes('bogor')) {
            query += ', Jakarta, Indonesia';
          } else if (!query.toLowerCase().includes('indonesia')) {
            query += ', Indonesia';
          }

          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
            {
              headers: {
                'Accept-Language': 'id',
                'User-Agent': 'DeltaInHomeBooking/1.0'
              }
            }
          );

          if (!response.ok) {
            throw new Error('Gagal menghubungi server pencari lokasi (OpenStreetMap).');
          }

          const data = await response.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          } else {
            throw new Error('Alamat tidak ditemukan di peta. Pastikan menulis kelurahan/kecamatan/kota dengan benar, atau gunakan Link Google Maps.');
          }
        }

        if (lat !== null && lng !== null) {
          setCustomerCoords([lat, lng]);

          // 3. Fetch driving route from OSRM Routing Service
          const routingResponse = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${BARBER_LOCATION.lng},${BARBER_LOCATION.lat};${lng},${lat}?overview=full&geometries=geojson`
          );

          if (!routingResponse.ok) {
            throw new Error('Gagal menghubungkan dengan server navigasi rute.');
          }

          const routingData = await routingResponse.json();
          if (routingData && routingData.routes && routingData.routes.length > 0) {
            const route = routingData.routes[0];
            const routeDist = route.distance / 1000; // Meters to Kilometers
            const routeDuration = route.duration / 60; // Seconds to Minutes

            setDistance(routeDist);
            setDuration(routeDuration);

            if (route.geometry && route.geometry.coordinates) {
              const coords: [number, number][] = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
              setRouteCoords(coords);
            } else {
              setRouteCoords([[BARBER_LOCATION.lat, BARBER_LOCATION.lng], [lat, lng]]);
            }
            setCalcError(null);
          } else {
            throw new Error('Rute kendaraan ke lokasi Anda tidak ditemukan.');
          }
        } else {
          throw new Error('Alamat tidak valid.');
        }
      } catch (err: any) {
        console.error('Routing/Geocoding error:', err);
        setCalcError(err.message || 'Terjadi kesalahan saat menghitung rute.');
        setDistance(null);
        setDuration(null);
        setCustomerCoords(null);
        setRouteCoords([]);
      } finally {
        setIsCalculating(false);
      }
    }, 1200);

    return () => clearTimeout(debounceTimer);
  }, [fullAddress, googleMapsLink]);

  // Leaflet Map Initialization and Rendering Effect
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear all existing markers & polylines
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const barberIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-6 w-6 rounded-full bg-amber-500/30 animate-ping"></span>
          <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-neutral-950 shadow-md"></span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const customerIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-6 w-6 rounded-full bg-white/30 animate-pulse"></span>
          <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-white border border-neutral-950 shadow-md"></span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([BARBER_LOCATION.lat, BARBER_LOCATION.lng], { icon: barberIcon })
      .addTo(map)
      .bindPopup(`<strong class="text-neutral-950 font-sans text-xs font-bold">DELTA BARBER BASE</strong><br/><span class="text-neutral-600 text-[10px]">${BARBER_LOCATION.address}</span>`);

    const bounds = L.latLngBounds([[BARBER_LOCATION.lat, BARBER_LOCATION.lng]]);

    if (customerCoords) {
      L.marker(customerCoords, { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<strong class="text-neutral-950 font-sans text-xs font-bold">LOKASI ANDA</strong>`);
      
      bounds.extend(customerCoords);

      if (routeCoords.length > 0) {
        L.polyline(routeCoords, {
          color: '#D4AF37',
          weight: 4,
          opacity: 0.9,
          lineJoin: 'round'
        }).addTo(map);

        routeCoords.forEach(c => bounds.extend(c));
      } else {
        L.polyline([[BARBER_LOCATION.lat, BARBER_LOCATION.lng], customerCoords], {
          color: '#D4AF37',
          weight: 2,
          dashArray: '5, 10',
          opacity: 0.6
        }).addTo(map);
      }

      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
    } else {
      map.setView([BARBER_LOCATION.lat, BARBER_LOCATION.lng], 13);
    }
  }, [customerCoords, routeCoords]);

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const ADD_ON_PRICES: { [key: string]: number } = {
    'Hair Wash': 20000,
    'Beard Trim': 25000,
    'Hair Styling': 30000,
  };

  const distanceKm = distance !== null ? parseFloat(distance.toFixed(1)) : 0;
  const transportCost = distanceKm > 3 ? Math.round((distanceKm - 3) * 5000) : 0;
  const haircutSubtotal = numPeople * HAIR_CUT_PRICE;
  const addOnsCost = selectedAddOns.reduce((sum, item) => sum + (ADD_ON_PRICES[item] || 0), 0);
  const priorityCost = priorityService ? 50000 : 0;
  const totalPrice = haircutSubtotal + transportCost + addOnsCost + priorityCost;
  const minutesEst = duration !== null ? Math.ceil(duration) : 0;

  // Auto payment method validation based on distance
  useEffect(() => {
    if (distance !== null && distance > 5) {
      if (paymentMethod === 'COD') {
        setPaymentMethod('BCA');
      }
    }
  }, [distance, paymentMethod]);

  // Load booked slots for selected date
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!bookingDate) {
        setBookedSlotsForDate([]);
        return;
      }
      try {
        const all = await getBookings();
        const booked = all
          .filter((b) => b.bookingDate === bookingDate)
          .map((b) => b.bookingTime);
        setBookedSlotsForDate(booked);
      } catch (err) {
        console.error('Failed to fetch booked slots:', err);
      }
    };
    fetchBookedSlots();
  }, [bookingDate]);

  // Check customer history by phone number
  useEffect(() => {
    const checkCustomerHistory = async () => {
      const cleanNum = whatsappNumber.replace(/\D/g, '');
      if (cleanNum.length >= 9) {
        try {
          const all = await getBookings();
          const userBookings = all.filter((b) => b.whatsappNumber.replace(/\D/g, '') === cleanNum);
          if (userBookings.length > 0) {
            setIsRepeated(true);
            const lastBooking = userBookings[userBookings.length - 1];
            // Auto fill only if fields are empty
            setFullName((prev) => prev.trim() ? prev : lastBooking.fullName);
            setFullAddress((prev) => prev.trim() ? prev : lastBooking.fullAddress);
            setGoogleMapsLink((prev) => prev.trim() ? prev : lastBooking.googleMapsLink || '');
          } else {
            setIsRepeated(false);
          }
        } catch (err) {
          console.error('History check failed:', err);
        }
      } else {
        setIsRepeated(false);
      }
    };
    const timeout = setTimeout(checkCustomerHistory, 500);
    return () => clearTimeout(timeout);
  }, [whatsappNumber]);

  const isSubmitDisabled = isSubmitting || isCalculating || (fullAddress.trim() !== '' && distance === null);

  const timeSlots = [
    '09:00 WIB',
    '10:00 WIB',
    '11:00 WIB',
    '12:00 WIB',
    '13:00 WIB',
    '14:00 WIB',
    '15:00 WIB',
    '16:00 WIB',
    '17:00 WIB',
    '18:00 WIB',
    '19:00 WIB',
    '20:00 WIB',
    '21:00 WIB',
  ];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!fullName.trim()) newErrors.fullName = 'Nama lengkap wajib diisi.';
    
    // WhatsApp validation: must have numbers and look like a phone number
    const phoneClean = whatsappNumber.replace(/\D/g, '');
    if (!whatsappNumber.trim()) {
      newErrors.whatsappNumber = 'Nomor WhatsApp wajib diisi.';
    } else if (phoneClean.length < 9) {
      newErrors.whatsappNumber = 'Nomor WhatsApp tidak valid.';
    }

    if (!fullAddress.trim()) newErrors.fullAddress = 'Alamat lengkap lokasi cukur wajib diisi.';
    if (!bookingDate) newErrors.bookingDate = 'Pilih tanggal pengerjaan.';
    if (!bookingTime) newErrors.bookingTime = 'Pilih waktu pengerjaan.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Focus first error element
      const firstErrorKey = Object.keys(errors)[0];
      const element = document.getElementById(`booking-field-${firstErrorKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    const styleLabel = hairStyleInput.trim() || '-';
    const addOnsText = selectedAddOns.length > 0 ? selectedAddOns.join(', ') : 'Tidak ada';
    const priorityText = priorityService ? 'Ya (+Rp50.000)' : 'Tidak';
    const dpRequired = distance !== null && distance > 5;
    const dpMin = dpRequired ? Math.round(totalPrice * 0.3) : 0;
    const dpStatusText = dpRequired 
      ? `Wajib DP 30% (Minimal ${formatRupiah(dpMin)})` 
      : `Lunas / Bayar di Tempat (DP opsional karena jarak ≤ 5 KM)`;

    const newBooking: SavedBooking = {
      id: `booking_${Date.now()}`,
      fullName,
      whatsappNumber,
      fullAddress,
      googleMapsLink,
      bookingDate,
      bookingTime,
      hairStyle: styleLabel,
      estimatedDistance: distance !== null ? `${distance.toFixed(1)} KM` : undefined,
      numPeople,
      paymentMethod,
      totalPrice,
      addOns: selectedAddOns,
      priorityService,
    };

    // Save the reservation to database (this auto-locks the date and time slot!)
    saveBooking(newBooking)
      .then(() => {
        // Reload booked slots instantly for current chosen date
        const fetchBookedSlots = async () => {
          try {
            const all = await getBookings();
            const booked = all
              .filter((b) => b.bookingDate === bookingDate)
              .map((b) => b.bookingTime);
            setBookedSlotsForDate(booked);
          } catch (err) {
            console.error('Failed to reload slots:', err);
          }
        };
        fetchBookedSlots();
      })
      .catch((err) => console.error('Failed to save reservation:', err));

    // Simulate luxury loader sequence
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);

      // WhatsApp format template:
      const message = `Halo Barber Delta, saya ingin booking haircut.

Nama: ${fullName}
Nomor WA: ${whatsappNumber}
Alamat: ${fullAddress}
Jumlah Orang: ${numPeople} Orang
Tanggal: ${bookingDate}
Jam: ${bookingTime}
Model Rambut: ${styleLabel}
Jarak: ${distance !== null ? `${distance.toFixed(1)} KM` : 'Belum terhitung'}
Subtotal Haircut: ${formatRupiah(haircutSubtotal)}
Biaya Transport: ${distance !== null ? (transportCost === 0 ? 'Gratis' : formatRupiah(transportCost)) : '-'}
Add-ons: ${addOnsText}
Priority Service: ${priorityText}
Total Harga: ${formatRupiah(totalPrice)}
Metode Pembayaran: ${paymentMethod}
Status DP: ${dpStatusText}`;

      // Format WhatsApp API Link
      // Standard number 08385064581 is Indonesian. Use 62 instead of 0 for international format.
      const cleanedNumber = WHATSAPP_NUMBER.startsWith('0')
        ? `62${WHATSAPP_NUMBER.substring(1)}`
        : WHATSAPP_NUMBER;

      const whatsappUrl = `https://wa.me/${cleanedNumber}?text=${encodeURIComponent(message)}`;

      // Execute redirect after showing the success pop-up
      setTimeout(() => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        setShowSuccessModal(false);
        // Clear forms or reset
        onClearSelections();
      }, 3000);

    }, 1200);
  };

  return (
    <section id="booking" className="bg-neutral-950 py-24 border-t border-neutral-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3.5 py-1 mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="font-mono text-[10px] sm:text-xs font-semibold text-amber-400 tracking-widest uppercase">
              Delta Reservation
            </span>
          </motion.div>
          <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Form Pemesanan Haircut
          </h2>
          <p className="mt-4 text-sm sm:text-base text-neutral-400 font-sans leading-relaxed">
            Isi data Anda dengan lengkap. Sistem akan otomatis memformat pesan konfirmasi untuk dikirim langsung ke WhatsApp Barber Delta.
          </p>
        </div>

        {/* Form Container Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Subtle decoration lines */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Jumlah Orang & Model Rambut */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-neutral-200 tracking-wider uppercase flex items-center gap-2">
                <Scissors className="h-4.5 w-4.5 text-amber-500" />
                1. Jumlah Orang & Model Rambut
              </label>

              {selectedStyle && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-amber-400 font-medium">
                    Model terpilih dari Portfolio: <strong>{selectedStyle}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={onClearSelections}
                    className="text-[10px] font-mono underline hover:text-amber-300 text-neutral-400"
                  >
                    Reset Pilihan
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-neutral-950/40 p-5 rounded-2xl border border-neutral-800/80">
                {/* Plus/Minus Counter Premium */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-400">
                    Jumlah Orang yang Ingin Dicukur <span className="text-amber-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={numPeople <= 1}
                      onClick={() => setNumPeople(Math.max(1, numPeople - 1))}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-black text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-95"
                    >
                      &minus;
                    </button>
                    
                    <div className="flex-1 min-h-[44px] flex items-center justify-center bg-neutral-950 rounded-xl border border-neutral-800 px-4 font-mono font-bold text-sm text-amber-400">
                      {numPeople} Orang
                    </div>

                    <button
                      type="button"
                      disabled={numPeople >= 20}
                      onClick={() => setNumPeople(Math.min(20, numPeople + 1))}
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-black text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-95"
                    >
                      &#43;
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-normal">
                    Minimum 1, maksimum 20 orang.
                  </p>
                </div>

                {/* Model Rambut (Optional Text Field) */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-400">
                    Model Rambut <span className="text-neutral-500">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={hairStyleInput}
                    onChange={(e) => setHairStyleInput(e.target.value)}
                    placeholder="Contoh: Fade / Potong biasa / Undercut"
                    className="w-full min-h-[44px] bg-neutral-950 text-white placeholder-neutral-600 border border-neutral-800 focus:border-amber-500 rounded-xl px-4 text-xs sm:text-sm focus:outline-none transition-colors"
                  />
                  <p className="text-[10px] text-neutral-500 leading-normal">
                    Boleh kosong. Contoh: Fade, Undercut, Two Block, dll.
                  </p>
                </div>
              </div>

              {/* Layanan Tambahan (Add-ons) & Layanan Prioritas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-neutral-950/40 p-5 rounded-2xl border border-neutral-800/80 mt-5">
                {/* Add-ons checkboxes */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Layanan Tambahan (Add-ons)
                  </label>
                  <div className="space-y-2.5">
                    {[
                      { name: 'Hair Wash', price: 20000, desc: 'Keramas bersih setelah cukur' },
                      { name: 'Beard Trim', price: 25000, desc: 'Cukur / rapikan jenggot & kumis' },
                      { name: 'Hair Styling', price: 30000, desc: 'Styling pomade / hair powder premium' }
                    ].map((item) => {
                      const isChecked = selectedAddOns.includes(item.name);
                      return (
                        <label
                          key={item.name}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-amber-500/10 border-amber-500/40'
                              : 'bg-neutral-950/40 border-neutral-800/60 hover:border-neutral-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedAddOns(selectedAddOns.filter(x => x !== item.name));
                              } else {
                                setSelectedAddOns([...selectedAddOns, item.name]);
                              }
                            }}
                            className="mt-0.5 rounded border-neutral-800 text-amber-500 focus:ring-amber-500 bg-neutral-950 h-4 w-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{item.name}</span>
                              <span className="text-xs font-mono font-bold text-amber-400">+{formatRupiah(item.price)}</span>
                            </div>
                            <p className="text-[10px] text-neutral-500 mt-0.5 leading-normal">{item.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Service Toggle */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                      Layanan Darurat / Prioritas
                    </label>
                    <label
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer select-none h-full ${
                        priorityService
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                          : 'bg-neutral-950/40 border-neutral-800/60 hover:border-neutral-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={priorityService}
                        onChange={() => setPriorityService(!priorityService)}
                        className="mt-0.5 rounded border-neutral-800 text-amber-500 focus:ring-amber-500 bg-neutral-950 h-4 w-4 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                            Priority Service
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-400">+Rp50.000</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                          Prioritas pengerjaan darurat / urgent. Barber akan memprioritaskan jadwal Anda dan berangkat sesegera mungkin (contoh: tiba dalam 1 jam).
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Customer Personal Info */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-neutral-200 tracking-wider uppercase flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-amber-500" />
                2. Data Lengkap Pelanggan
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div id="booking-field-fullName">
                  <label className="block text-xs font-semibold text-neutral-400 mb-2">
                    Nama Lengkap <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors({ ...errors, fullName: '' });
                      }}
                      placeholder="Masukkan nama lengkap"
                      className={`w-full min-h-[48px] bg-neutral-950 text-white placeholder-neutral-600 border rounded-xl pl-11 pr-4 text-xs sm:text-sm focus:outline-none transition-colors ${
                        errors.fullName ? 'border-red-500 focus:border-red-500' : 'border-neutral-800 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1.5 text-xs text-red-500 font-sans">{errors.fullName}</p>
                  )}
                </div>

                {/* WhatsApp Number */}
                <div id="booking-field-whatsappNumber">
                  <label className="block text-xs font-semibold text-neutral-400 mb-2 flex items-center justify-between">
                    <span>Nomor WhatsApp <span className="text-amber-500">*</span></span>
                    {isRepeated && (
                      <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                        Welcome back, pelanggan lama 👋
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500 font-mono text-xs">
                      WA
                    </div>
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => {
                        setWhatsappNumber(e.target.value);
                        if (errors.whatsappNumber) setErrors({ ...errors, whatsappNumber: '' });
                      }}
                      placeholder="Contoh: 08385064581"
                      className={`w-full min-h-[48px] bg-neutral-950 text-white placeholder-neutral-600 border rounded-xl pl-11 pr-4 text-xs sm:text-sm focus:outline-none transition-colors font-mono ${
                        errors.whatsappNumber ? 'border-red-500 focus:border-red-500' : 'border-neutral-800 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.whatsappNumber && (
                    <p className="mt-1.5 text-xs text-red-500 font-sans">{errors.whatsappNumber}</p>
                  )}
                </div>
              </div>

              {/* Full Address */}
              <div id="booking-field-fullAddress">
                <label className="block text-xs font-semibold text-neutral-400 mb-2">
                  Alamat Lengkap Lokasi Cukur <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3.5 left-3.5 text-neutral-500">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <textarea
                    rows={3}
                    value={fullAddress}
                    onChange={(e) => {
                      setFullAddress(e.target.value);
                      if (errors.fullAddress) setErrors({ ...errors, fullAddress: '' });
                    }}
                    placeholder="Masukkan nama jalan, nomor rumah, RT/RW, kecamatan, kota, dan patokan rumah."
                    className={`w-full bg-neutral-950 text-white placeholder-neutral-600 border rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm focus:outline-none transition-colors ${
                      errors.fullAddress ? 'border-red-500 focus:border-red-500' : 'border-neutral-800 focus:border-amber-500'
                    }`}
                  />
                </div>
                {errors.fullAddress && (
                  <p className="mt-1.5 text-xs text-red-500 font-sans">{errors.fullAddress}</p>
                )}
              </div>

              {/* Google Maps Link (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">
                  Link Share Location Google Maps <span className="text-neutral-500">(Opsional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <MapPin className="h-4.5 w-4.5 text-amber-500/50" />
                  </div>
                  <input
                    type="url"
                    value={googleMapsLink}
                    onChange={(e) => setGoogleMapsLink(e.target.value)}
                    placeholder="Contoh: https://maps.app.goo.gl/..."
                    className="w-full min-h-[48px] bg-neutral-950 text-white placeholder-neutral-600 border border-neutral-800 focus:border-amber-500 rounded-xl pl-11 pr-4 text-xs sm:text-sm focus:outline-none transition-colors"
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-neutral-500 leading-relaxed">
                  Menambahkan link lokasi maps memudahkan Barber langsung bernavigasi ke rumah Anda dengan cepat dan presisi.
                </p>
              </div>

              {/* Real-time Distance & Pricing Card */}
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {isCalculating && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-center gap-3"
                    >
                      <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-mono text-amber-400 tracking-wider">Menghitung jarak dan rute...</span>
                    </motion.div>
                  )}

                  {calcError && !isCalculating && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3"
                    >
                      <Info className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-red-400 block">Alamat Tidak Valid / Rute Gagal Dihitung</span>
                        <span className="text-[11px] text-neutral-400 mt-0.5 block leading-relaxed">
                          {calcError}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {distance !== null && !isCalculating && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="bg-neutral-950 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden animate-pulse"
                      style={{ animationDuration: '3s' }}
                    >
                      <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                      
                      <h4 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Rincian Biaya Realtime
                      </h4>

                      <div className="space-y-2.5 text-xs sm:text-sm font-sans">
                        <div className="flex justify-between items-center text-neutral-400">
                          <span>Harga per Orang</span>
                          <span className="font-mono text-neutral-200 font-medium">Rp85.000</span>
                        </div>

                        <div className="flex justify-between items-center text-neutral-400">
                          <span>Jumlah Orang</span>
                          <span className="font-mono text-neutral-200 font-medium">{numPeople}</span>
                        </div>

                        <div className="flex justify-between items-center text-neutral-400">
                          <span>Subtotal Haircut</span>
                          <span className="font-mono text-neutral-200 font-medium">{formatRupiah(haircutSubtotal)}</span>
                        </div>

                        <div className="flex justify-between items-center text-neutral-400">
                          <span>Jarak Customer</span>
                          <span className="font-mono text-neutral-200 font-medium">{distance.toFixed(1)} KM</span>
                        </div>

                        <div className="flex justify-between items-center text-neutral-400">
                          <span>Biaya Transport</span>
                          <span className="font-mono text-neutral-200 font-medium">
                            {transportCost === 0 ? (
                              <span className="text-emerald-500 font-bold uppercase text-[10px] tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-md animate-pulse">
                                Gratis (≤ 3 KM)
                              </span>
                            ) : (
                              formatRupiah(transportCost)
                            )}
                          </span>
                        </div>

                        {addOnsCost > 0 && (
                          <div className="flex justify-between items-center text-neutral-400">
                            <span>Layanan Tambahan (Add-ons)</span>
                            <span className="font-mono text-neutral-200 font-medium">+{formatRupiah(addOnsCost)}</span>
                          </div>
                        )}

                        {priorityService && (
                          <div className="flex justify-between items-center text-neutral-400">
                            <span>Layanan Prioritas (Urgent)</span>
                            <span className="font-mono text-neutral-200 font-medium">+{formatRupiah(priorityCost)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-neutral-400">
                          <span>Estimasi Waktu</span>
                          <span className="font-mono text-neutral-200 font-medium">{minutesEst} menit</span>
                        </div>

                        <div className="h-px bg-neutral-800/80 my-3" />

                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-xs sm:text-sm">TOTAL</span>
                          <span className="font-mono text-amber-400 text-base sm:text-lg font-black tracking-wide">
                            {formatRupiah(totalPrice)}
                          </span>
                        </div>

                        {distance !== null && distance > 5 && (
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 mt-2 flex items-start gap-2.5">
                            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-[10px] sm:text-xs leading-relaxed text-neutral-300">
                              <span className="font-bold text-amber-400 block">Wajib Down Payment (DP) 30%</span>
                              Jarak Anda &gt; 5 KM. Pembayaran COD dinonaktifkan. Harap bayar DP minimal <strong className="text-white font-mono">{formatRupiah(Math.round(totalPrice * 0.3))}</strong> via Transfer di bawah.
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mini Map */}
                <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950/40 relative">
                  <div className="p-3 bg-neutral-900/60 border-b border-neutral-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-amber-500" />
                      Mini Map Rute Navigasi
                    </span>
                    {customerCoords && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Rute Terkoneksi
                      </span>
                    )}
                  </div>
                  
                  <div 
                    ref={mapContainerRef} 
                    className="h-[200px] w-full z-10" 
                    style={{ background: '#0a0a0a' }}
                  />

                  <div className="p-2.5 bg-neutral-900/40 text-[10px] text-neutral-500 flex items-center justify-between">
                    <span>Marker Barber (Gold), Marker Customer (White)</span>
                    <span>Tanjung Priok Kalibaru</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Schedule Selection */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-bold text-neutral-200 tracking-wider uppercase flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-amber-500" />
                  3. Atur Jadwal Kedatangan
                </label>
                <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  Jam Operasional: 09:00 - 21:00 WIB
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Date Selection */}
                <div id="booking-field-bookingDate">
                  <label className="block text-xs font-semibold text-neutral-400 mb-2">
                    Tanggal Pengerjaan <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => {
                        setBookingDate(e.target.value);
                        setBookingTime(''); // Reset selected time when date changes
                        if (errors.bookingDate) setErrors({ ...errors, bookingDate: '' });
                      }}
                      className={`w-full min-h-[48px] bg-neutral-950 text-white border rounded-xl px-4 text-xs sm:text-sm focus:outline-none transition-colors dark:[color-scheme:dark] ${
                        errors.bookingDate ? 'border-red-500 focus:border-red-500' : 'border-neutral-800 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {errors.bookingDate && (
                    <p className="mt-1.5 text-xs text-red-500 font-sans">{errors.bookingDate}</p>
                  )}
                </div>

                {/* Time Slot Selection (Cards) */}
                <div id="booking-field-bookingTime">
                  <label className="block text-xs font-semibold text-neutral-400 mb-2">
                    Pilih Jam Kedatangan <span className="text-amber-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((slot) => {
                      const isBooked = bookedSlotsForDate.includes(slot);
                      const isSelected = bookingTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          onClick={() => {
                            setBookingTime(slot);
                            if (errors.bookingTime) setErrors({ ...errors, bookingTime: '' });
                          }}
                          className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                            isBooked
                              ? 'bg-neutral-900/40 border-neutral-900 text-neutral-600 cursor-not-allowed opacity-50'
                              : isSelected
                              ? 'bg-amber-500 text-neutral-950 border-amber-500 font-extrabold shadow-md'
                              : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                          }`}
                          style={{ minHeight: '44px' }}
                        >
                          <span>{slot.replace(' WIB', '')}</span>
                          <span className={`text-[8px] px-1 py-0.25 rounded-md uppercase tracking-wider font-extrabold ${
                            isBooked 
                              ? 'bg-red-500/10 text-red-500 border border-red-500/25' 
                              : isSelected 
                              ? 'bg-neutral-950/20 text-neutral-950 font-black' 
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {isBooked ? 'Booked' : 'Available'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.bookingTime && (
                    <p className="mt-1.5 text-xs text-red-500 font-sans">{errors.bookingTime}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Payment Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-neutral-200 tracking-wider uppercase flex items-center gap-2">
                <Wallet className="h-4.5 w-4.5 text-amber-500" />
                4. Metode Pembayaran
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* COD */}
                <button
                  type="button"
                  disabled={distance !== null && distance > 5}
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 text-center gap-2 relative overflow-hidden group ${
                    distance !== null && distance > 5
                      ? 'opacity-30 cursor-not-allowed bg-neutral-950/20 border-neutral-900 text-neutral-600'
                      : paymentMethod === 'COD'
                      ? 'bg-neutral-950 border-amber-500 shadow-md shadow-amber-500/5 text-white'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700/60'
                  }`}
                  style={{ minHeight: '90px' }}
                >
                  <Coins className={`h-5 w-5 ${paymentMethod === 'COD' && !(distance !== null && distance > 5) ? 'text-amber-400' : 'text-neutral-500'}`} />
                  <span className="text-xs font-bold font-sans">COD</span>
                  <span className="text-[9px] leading-none text-neutral-500">
                    {distance !== null && distance > 5 ? 'Jarak > 5KM (N/A)' : 'Bayar di Tempat'}
                  </span>
                </button>

                {/* BCA */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BCA')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 text-center gap-2 relative overflow-hidden group ${
                    paymentMethod === 'BCA'
                      ? 'bg-neutral-950 border-amber-500 shadow-md shadow-amber-500/5 text-white'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700/60'
                  }`}
                  style={{ minHeight: '90px' }}
                >
                  <CreditCard className={`h-5 w-5 ${paymentMethod === 'BCA' ? 'text-amber-400' : 'text-neutral-500'}`} />
                  <span className="text-xs font-bold font-sans">Transfer BCA</span>
                  <span className="text-[9px] text-neutral-500 leading-none">Delta Barber</span>
                </button>

                {/* DANA */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('DANA')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 text-center gap-2 relative overflow-hidden group ${
                    paymentMethod === 'DANA'
                      ? 'bg-neutral-950 border-amber-500 shadow-md shadow-amber-500/5 text-white'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700/60'
                  }`}
                  style={{ minHeight: '90px' }}
                >
                  <Wallet className={`h-5 w-5 ${paymentMethod === 'DANA' ? 'text-amber-400' : 'text-neutral-500'}`} />
                  <span className="text-xs font-bold font-sans">DANA</span>
                  <span className="text-[9px] text-neutral-500 leading-none">0878-9980-4147</span>
                </button>

                {/* QRIS */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 text-center gap-2 relative overflow-hidden group ${
                    paymentMethod === 'QRIS'
                      ? 'bg-neutral-950 border-amber-500 shadow-md shadow-amber-500/5 text-white'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700/60'
                  }`}
                  style={{ minHeight: '90px' }}
                >
                  <QrCode className={`h-5 w-5 ${paymentMethod === 'QRIS' ? 'text-amber-400' : 'text-neutral-500'}`} />
                  <span className="text-xs font-bold font-sans">QRIS</span>
                  <span className="text-[9px] text-neutral-500 leading-none">Scan Otomatis</span>
                </button>
              </div>

              {/* Payment Details Container */}
              <AnimatePresence mode="wait">
                {paymentMethod !== 'COD' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-4 overflow-hidden"
                  >
                    {paymentMethod === 'BCA' && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-500 block">Transfer Rekening BCA</span>
                          <span className="text-sm font-bold text-white block">Delta Barber</span>
                          <span className="text-base font-mono font-black text-amber-400 tracking-wider block font-bold">2941084780</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('2941084780');
                            setBcaCopied(true);
                            setTimeout(() => setBcaCopied(false), 2000);
                          }}
                          className="min-h-[44px] px-4 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all self-start sm:self-auto active:scale-95 cursor-pointer"
                        >
                          {bcaCopied ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-500" />
                              Tersalin
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 text-amber-500" />
                              Copy Nomor Rekening
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {paymentMethod === 'DANA' && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-500 block">Transfer DANA</span>
                          <span className="text-sm font-bold text-white block">Delta Barber</span>
                          <span className="text-base font-mono font-black text-amber-400 tracking-wider block font-bold">087899804147</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('087899804147');
                            setDanaCopied(true);
                            setTimeout(() => setDanaCopied(false), 2000);
                          }}
                          className="min-h-[44px] px-4 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all self-start sm:self-auto active:scale-95 cursor-pointer"
                        >
                          {danaCopied ? (
                            <>
                              <Check className="h-4 w-4 text-emerald-500" />
                              Tersalin
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 text-amber-500" />
                              Copy Nomor DANA
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {paymentMethod === 'QRIS' && (
                      <div className="flex flex-col items-center justify-center text-center p-3 gap-3">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-amber-500 block">Scan Kode QRIS di Bawah Ini</span>
                        <div className="relative bg-white p-3 rounded-2xl w-48 h-48 flex items-center justify-center border border-neutral-800 overflow-hidden shadow-inner">
                          <img
                            src="/assets/images/qris.png"
                            alt="QRIS Code"
                            className="w-full h-full object-contain"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'text-xs text-neutral-900 font-bold px-4 text-center';
                                fallback.innerText = 'QRIS segera tersedia';
                                parent.appendChild(fallback);
                              }
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-500 max-w-xs leading-relaxed mt-1">
                          Aplikasi dompet digital (GOPAY, OVO, DANA, LinkAja, ShopeePay, M-Banking) apa pun dapat memproses kode QR ini.
                        </span>
                      </div>
                    )}

                    {/* Image Upload for Transfer Proof (Optional) */}
                    <div className="pt-2 border-t border-neutral-900">
                      <label className="block text-xs font-semibold text-neutral-400 mb-2.5 flex items-center gap-1.5">
                        <FileImage className="h-4 w-4 text-amber-500" />
                        Upload Bukti Transfer <span className="text-neutral-500">(Opsional)</span>
                      </label>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Interactive File Drop Area */}
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
                              setProofImage(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProofImagePreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="border-2 border-dashed border-neutral-800 hover:border-amber-500/40 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center bg-neutral-950/60 relative group"
                          onClick={() => document.getElementById('payment-proof-upload')?.click()}
                        >
                          <input
                            id="payment-proof-upload"
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setProofImage(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setProofImagePreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                          <UploadCloud className="h-8 w-8 text-neutral-500 group-hover:text-amber-500 transition-colors mb-2" />
                          <span className="text-xs text-neutral-300 font-bold block">Drag & Drop atau Klik</span>
                          <span className="text-[10px] text-neutral-500 mt-1 block">Support: JPG, PNG, WEBP</span>
                        </div>

                        {/* File Preview */}
                        <div className="border border-neutral-800 rounded-xl bg-neutral-950/40 p-3 flex items-center justify-center min-h-[110px] relative overflow-hidden">
                          {proofImagePreview ? (
                            <div className="relative w-full h-full max-h-[140px] flex items-center justify-center rounded-lg overflow-hidden group">
                              <img
                                src={proofImagePreview}
                                alt="Preview Bukti Bayar"
                                className="object-cover max-h-[120px] rounded-lg border border-neutral-800"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProofImage(null);
                                  setProofImagePreview(null);
                                }}
                                className="absolute top-1 right-1 p-1.5 bg-red-600/90 text-white rounded-full hover:bg-red-700 transition-all shadow-md cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center text-neutral-600 space-y-1">
                              <FileImage className="h-6 w-6 mx-auto opacity-30" />
                              <span className="text-[10px] block">Pratinjau bukti transfer muncul di sini</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Note before submit */}
            <div className="flex items-start gap-3 bg-neutral-950/40 border border-neutral-800 rounded-2xl p-4.5">
              <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="font-sans text-xs text-neutral-400 leading-relaxed">
                <span className="font-bold text-neutral-300">Bagaimana proses selanjutnya?</span>
                <ol className="list-decimal pl-4 mt-1.5 space-y-1">
                  <li>Klik tombol <strong className="text-amber-400">KIRIM BOOKING KE WHATSAPP</strong> di bawah.</li>
                  <li>Sistem akan mengalihkan Anda ke WhatsApp dengan pesan yang sudah terisi otomatis.</li>
                  <li>Kirimkan pesan tersebut tanpa merubah isinya ke Barber Delta.</li>
                  <li>Barber akan membalas untuk konfirmasi kesiapan jadwal & rincian rute navigasi.</li>
                </ol>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full min-h-[52px] py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 text-neutral-950 font-black tracking-widest rounded-2xl shadow-xl shadow-amber-500/10 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                id="booking-submit-button"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    MEMPROSES RESERVASI...
                  </>
                ) : isCalculating ? (
                  <>
                    <div className="h-5 w-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    MENGHITUNG JARAK...
                  </>
                ) : fullAddress.trim() !== '' && distance === null ? (
                  <>
                    ALAMAT INVALID / GAGAL DIHITUNG
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    KIRIM BOOKING KE WHATSAPP
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Success Modal / Loading overlay */}
        <AnimatePresence>
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-neutral-900 border border-amber-500/20 rounded-3xl p-8 max-w-md text-center shadow-2xl"
                id="booking-success-modal"
              >
                <div className="mx-auto h-16 w-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 mb-6">
                  <CheckCircle2 className="h-8 w-8 animate-bounce" />
                </div>
                
                <h3 className="font-sans text-xl font-bold text-white tracking-tight">
                  Booking Berhasil Diproses!
                </h3>
                <p className="font-sans text-sm text-neutral-400 mt-3 leading-relaxed">
                  Menyiapkan format konfirmasi booking... <br />
                  Anda akan dialihkan secara otomatis ke nomor WhatsApp <strong>{OWNER_NAME}</strong> sekarang.
                </p>

                {/* Progress bar spacer */}
                <div className="w-full bg-neutral-950 h-1.5 rounded-full mt-6 overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2 }}
                    className="h-full bg-amber-500"
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* FAQ Accordion Section */}
        <div className="mt-20 border-t border-neutral-900 pt-16">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h3 className="font-sans text-xl sm:text-2xl font-black text-white tracking-tight">
              Pertanyaan yang Sering Diajukan (FAQ)
            </h3>
            <p className="font-sans text-xs sm:text-sm text-neutral-400 mt-2 leading-relaxed">
              Temukan jawaban cepat seputar reservasi, metode pembayaran, ongkos perjalanan, dan wilayah layanan.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {[
              {
                q: 'Apakah bisa COD (Bayar di Tempat)?',
                a: 'Bisa, layanan COD / Bayar di Tempat tersedia gratis untuk customer yang berada dalam radius ≤ 5 KM dari lokasi barber (Tanjung Priok Kalibaru).'
              },
              {
                q: 'Mengapa saya wajib membayar DP?',
                a: 'Untuk menjaga komitmen reservasi dan efisiensi rute perjalanan barber, customer dengan jarak di atas 5 KM diwajibkan melakukan Down Payment (DP) minimal 30% melalui transfer bank BCA atau saldo DANA sebelum jadwal pengerjaan.'
              },
              {
                q: 'Berapa lama estimasi waktu kedatangan barber?',
                a: 'Secara standar, barber akan tiba tepat waktu sesuai jam reservasi yang Anda pilih. Jika Anda memerlukan kedatangan mendadak/cepat, Anda dapat mengaktifkan "Priority Service" agar barber langsung berangkat dalam kurun waktu kurang dari 1 jam.'
              },
              {
                q: 'Apakah jam operasional mendukung booking malam?',
                a: 'Ya, kami melayani pemesanan haircut setiap hari mulai pukul 09:00 WIB hingga pukul 21:00 WIB sesuai jadwal slot yang tersedia pada form reservasi.'
              },
              {
                q: 'Bagaimana jika saya ingin membatalkan booking?',
                a: 'Anda dapat melakukan pembatalan atau perubahan jadwal secara fleksibel dengan menghubungi barber via WhatsApp secara langsung secepat mungkin.'
              }
            ].map((item, index) => {
              const isOpen = activeFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700/80 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaqIndex(isOpen ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 font-sans text-xs sm:text-sm font-bold text-neutral-200 hover:text-white transition-colors cursor-pointer select-none"
                  >
                    <span>{item.q}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-amber-500 shrink-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="px-5 pb-5 pt-1 font-sans text-xs text-neutral-400 leading-relaxed border-t border-neutral-900/60 bg-neutral-950/20">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
