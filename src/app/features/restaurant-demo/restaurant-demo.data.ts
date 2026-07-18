import { DemoSeedOrder, MenuItem, MerchantProfile } from './restaurant-demo.models';

export const MERCHANT: MerchantProfile = {
  name: 'Al Manara Kitchen',
  nameAr: 'مطبخ المنارة',
  branch: 'Al Quoz Industrial Area 3, Dubai',
  trn: '100312345600003',
  address: 'Warehouse 14, Street 8',
  city: 'Dubai, UAE',
  phone: '+971 4 338 2201',
  currency: 'AED',
  vatRate: 5,
};

export const MENU: MenuItem[] = [
  { id: 'm1', name: 'Chicken Mandi', nameAr: 'مندي دجاج', price: 42, category: 'Mains' },
  { id: 'm2', name: 'Lamb Kabsa', nameAr: 'كبسة لحم', price: 58, category: 'Mains' },
  { id: 'm3', name: 'Mixed Grill Platter', nameAr: 'مشاوي مشكلة', price: 75, category: 'Mains' },
  { id: 'm4', name: 'Hummus with Bread', nameAr: 'حمص بخبز', price: 16, category: 'Starters' },
  { id: 'm5', name: 'Fattoush Salad', nameAr: 'فتوش', price: 18, category: 'Starters' },
  { id: 'm6', name: 'Fresh Lemon Mint', nameAr: 'ليمون بالنعناع', price: 12, category: 'Drinks' },
  { id: 'm7', name: 'Arabic Coffee (2 cups)', nameAr: 'قهوة عربية', price: 10, category: 'Drinks' },
  { id: 'm8', name: 'Kunafa Slice', nameAr: 'كنافة', price: 22, category: 'Desserts' },
];

/** Pre-seeded orders already on screen when demo opens (walk-in ready + one paid earlier). */
export const INITIAL_ORDERS: DemoSeedOrder[] = [
  {
    channel: 'walkin',
    channelOrderId: 'WI-1042',
    customerName: 'Walk-in Counter',
    itemIds: [
      { itemId: 'm1', qty: 1 },
      { itemId: 'm6', qty: 2 },
    ],
    delayMs: 0,
    status: 'new',
  },
  {
    channel: 'talabat',
    channelOrderId: 'TLB-882901',
    customerName: 'Sara Al Hashimi',
    itemIds: [
      { itemId: 'm2', qty: 1 },
      { itemId: 'm5', qty: 1 },
      { itemId: 'm6', qty: 1 },
    ],
    delayMs: 0,
    status: 'paid',
    paid: true,
  },
  {
    channel: 'keeta',
    channelOrderId: 'KT-441208',
    customerName: 'Omar Farouk',
    itemIds: [
      { itemId: 'm3', qty: 1 },
      { itemId: 'm4', qty: 1 },
    ],
    delayMs: 0,
    status: 'paid',
    paid: true,
  },
];

/** Timed live arrivals for recording (Start live feed). */
export const LIVE_ARRIVALS: DemoSeedOrder[] = [
  {
    channel: 'talabat',
    channelOrderId: 'TLB-883014',
    customerName: 'Layla Mansour',
    itemIds: [
      { itemId: 'm1', qty: 2 },
      { itemId: 'm7', qty: 1 },
      { itemId: 'm8', qty: 1 },
    ],
    delayMs: 2500,
  },
  {
    channel: 'keeta',
    channelOrderId: 'KT-441315',
    customerName: 'Hassan Ibrahim',
    itemIds: [
      { itemId: 'm3', qty: 1 },
      { itemId: 'm6', qty: 2 },
    ],
    delayMs: 5500,
  },
];

export const CHANNEL_LABELS: Record<string, string> = {
  talabat: 'Talabat',
  keeta: 'Keeta',
  walkin: 'Walk-in',
};

export const TALABAT_COMMISSION_RATE = 0.22;
export const TALABAT_COMMISSION_VAT_RATE = 0.05;
