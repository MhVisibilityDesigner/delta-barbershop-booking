/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GalleryItem, Review, SavedBooking } from '../types';

const DB_NAME = 'BarberDeltaDB';
const DB_VERSION = 2;
const GALLERY_STORE = 'gallery';
const REVIEWS_STORE = 'reviews';
const BOOKINGS_STORE = 'bookings';

// Default mock baseline reviews to match user requirement (127 reviews with high rating)
const DEFAULT_REVIEWS_BASELINE: Review[] = [
  {
    id: 'r_base_1',
    name: 'Andi Saputra',
    rating: 5,
    comment: 'Haircut rapi sekali, pengerjaan cepat dan sangat profesional. Barber ramah!',
    date: '2026-06-28',
    isPinned: true
  },
  {
    id: 'r_base_2',
    name: 'Budi Santoso',
    rating: 5,
    comment: 'Sangat puas dengan model undercut-nya. Sangat presisi dan rapi. Recomended!',
    date: '2026-06-27',
    isPinned: false
  },
  {
    id: 'r_base_3',
    name: 'Rian Wijaya',
    rating: 4,
    comment: 'Cukuran rapi dan wangi. Pelayanan mantap, booking-nya gampang.',
    date: '2026-06-26',
    isPinned: false
  },
  {
    id: 'r_base_4',
    name: 'Hendra',
    rating: 5,
    comment: 'Langganan terbaik! Selalu puas dengan hasil potongan rambutnya, rapi dan konsisten.',
    date: '2026-06-25',
    isPinned: true
  }
];

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(GALLERY_STORE)) {
        db.createObjectStore(GALLERY_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(REVIEWS_STORE)) {
        db.createObjectStore(REVIEWS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(BOOKINGS_STORE)) {
        db.createObjectStore(BOOKINGS_STORE, { keyPath: 'id' });
      }
    };
  });
}

// Fallbacks using LocalStorage if IndexedDB fails
const localStorageFallback = {
  getGallery: (): GalleryItem[] => {
    try {
      const data = localStorage.getItem('barber_custom_gallery');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveGallery: (items: GalleryItem[]) => {
    try {
      localStorage.setItem('barber_custom_gallery', JSON.stringify(items));
    } catch (e) {
      console.error('LocalStorage write failed', e);
    }
  },
  getReviews: (): Review[] => {
    try {
      const data = localStorage.getItem('barber_custom_reviews');
      return data ? JSON.parse(data) : [...DEFAULT_REVIEWS_BASELINE];
    } catch {
      return [...DEFAULT_REVIEWS_BASELINE];
    }
  },
  saveReviews: (items: Review[]) => {
    try {
      localStorage.setItem('barber_custom_reviews', JSON.stringify(items));
    } catch (e) {
      console.error('LocalStorage write failed', e);
    }
  },
  getBookings: (): SavedBooking[] => {
    try {
      const data = localStorage.getItem('barber_custom_bookings');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  saveBookings: (items: SavedBooking[]) => {
    try {
      localStorage.setItem('barber_custom_bookings', JSON.stringify(items));
    } catch (e) {
      console.error('LocalStorage write failed', e);
    }
  }
};

export async function getCustomGalleryItems(): Promise<GalleryItem[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(GALLERY_STORE, 'readonly');
      const store = transaction.objectStore(GALLERY_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        resolve(localStorageFallback.getGallery());
      };
    });
  } catch {
    return localStorageFallback.getGallery();
  }
}

export async function saveCustomGalleryItem(item: GalleryItem): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(GALLERY_STORE, 'readwrite');
      const store = transaction.objectStore(GALLERY_STORE);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const items = localStorageFallback.getGallery();
        const index = items.findIndex(i => i.id === item.id);
        if (index > -1) items[index] = item;
        else items.push(item);
        localStorageFallback.saveGallery(items);
        resolve();
      };
    });
  } catch {
    const items = localStorageFallback.getGallery();
    const index = items.findIndex(i => i.id === item.id);
    if (index > -1) items[index] = item;
    else items.push(item);
    localStorageFallback.saveGallery(items);
  }
}

export async function deleteCustomGalleryItem(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(GALLERY_STORE, 'readwrite');
      const store = transaction.objectStore(GALLERY_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const items = localStorageFallback.getGallery().filter(i => i.id !== id);
        localStorageFallback.saveGallery(items);
        resolve();
      };
    });
  } catch {
    const items = localStorageFallback.getGallery().filter(i => i.id !== id);
    localStorageFallback.saveGallery(items);
  }
}

export async function updateCustomGalleryItem(
  id: string,
  title: string,
  category: string,
  caption?: string
): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(GALLERY_STORE, 'readwrite');
      const store = transaction.objectStore(GALLERY_STORE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.title = title;
          item.category = category;
          item.caption = caption;
          const putRequest = store.put(item);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch {
    const items = localStorageFallback.getGallery();
    const item = items.find(i => i.id === id);
    if (item) {
      item.title = title;
      item.category = category;
      item.caption = caption;
      localStorageFallback.saveGallery(items);
    }
  }
}

export async function getReviews(): Promise<Review[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(REVIEWS_STORE, 'readonly');
      const store = transaction.objectStore(REVIEWS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        if (results.length === 0) {
          // Hydrate with default baseline
          const defaultTx = db.transaction(REVIEWS_STORE, 'readwrite');
          const defaultStore = defaultTx.objectStore(REVIEWS_STORE);
          DEFAULT_REVIEWS_BASELINE.forEach(r => defaultStore.put(r));
          resolve(DEFAULT_REVIEWS_BASELINE);
        } else {
          resolve(results);
        }
      };
      request.onerror = () => {
        resolve(localStorageFallback.getReviews());
      };
    });
  } catch {
    return localStorageFallback.getReviews();
  }
}

export async function saveReview(review: Review): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(REVIEWS_STORE, 'readwrite');
      const store = transaction.objectStore(REVIEWS_STORE);
      const request = store.put(review);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const reviews = localStorageFallback.getReviews();
        const index = reviews.findIndex(r => r.id === review.id);
        if (index > -1) reviews[index] = review;
        else reviews.push(review);
        localStorageFallback.saveReviews(reviews);
        resolve();
      };
    });
  } catch {
    const reviews = localStorageFallback.getReviews();
    const index = reviews.findIndex(r => r.id === review.id);
    if (index > -1) reviews[index] = review;
    else reviews.push(review);
    localStorageFallback.saveReviews(reviews);
  }
}

export async function deleteReview(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(REVIEWS_STORE, 'readwrite');
      const store = transaction.objectStore(REVIEWS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const reviews = localStorageFallback.getReviews().filter(r => r.id !== id);
        localStorageFallback.saveReviews(reviews);
        resolve();
      };
    });
  } catch {
    const reviews = localStorageFallback.getReviews().filter(r => r.id !== id);
    localStorageFallback.saveReviews(reviews);
  }
}

export async function togglePinReview(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(REVIEWS_STORE, 'readwrite');
      const store = transaction.objectStore(REVIEWS_STORE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.isPinned = !item.isPinned;
          store.put(item).onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch {
    const reviews = localStorageFallback.getReviews();
    const item = reviews.find(r => r.id === id);
    if (item) {
      item.isPinned = !item.isPinned;
      localStorageFallback.saveReviews(reviews);
    }
  }
}

export async function toggleHideReview(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(REVIEWS_STORE, 'readwrite');
      const store = transaction.objectStore(REVIEWS_STORE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.isHidden = !item.isHidden;
          store.put(item).onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch {
    const reviews = localStorageFallback.getReviews();
    const item = reviews.find(r => r.id === id);
    if (item) {
      item.isHidden = !item.isHidden;
      localStorageFallback.saveReviews(reviews);
    }
  }
}

export async function getBookings(): Promise<SavedBooking[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(BOOKINGS_STORE, 'readonly');
      const store = transaction.objectStore(BOOKINGS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        resolve(localStorageFallback.getBookings());
      };
    });
  } catch {
    return localStorageFallback.getBookings();
  }
}

export async function saveBooking(booking: SavedBooking): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(BOOKINGS_STORE, 'readwrite');
      const store = transaction.objectStore(BOOKINGS_STORE);
      const request = store.put(booking);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const bookings = localStorageFallback.getBookings();
        const index = bookings.findIndex(b => b.id === booking.id);
        if (index > -1) bookings[index] = booking;
        else bookings.push(booking);
        localStorageFallback.saveBookings(bookings);
        resolve();
      };
    });
  } catch {
    const bookings = localStorageFallback.getBookings();
    const index = bookings.findIndex(b => b.id === booking.id);
    if (index > -1) bookings[index] = booking;
    else bookings.push(booking);
    localStorageFallback.saveBookings(bookings);
  }
}
