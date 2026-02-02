import { KeyringItem } from '../types';

export const KEYRING_ITEMS: KeyringItem[] = [
  {
    id: 'car-1',
    name: 'Industrial Carabiner',
    category: 'carabiners',
    price: 15000,
  },
  {
    id: 'car-2',
    name: 'Titanium Loop',
    category: 'carabiners',
    price: 22000,
  },
  {
    id: 'car-3',
    name: 'Cyber Hook',
    category: 'carabiners',
    price: 18000,
  },
  {
    id: 'car-4',
    name: 'Mil-Spec Clip',
    category: 'carabiners',
    price: 25000,
  },
  {
    id: 'cha-1',
    name: 'Snake Chain',
    category: 'chains',
    price: 8000,
  },
  {
    id: 'cha-2',
    name: 'Ball Chain',
    category: 'chains',
    price: 6000,
  },
  {
    id: 'cha-3',
    name: 'Link Chain',
    category: 'chains',
    price: 10000,
  },
  {
    id: 'cha-4',
    name: 'Cable Chain',
    category: 'chains',
    price: 12000,
  },
  {
    id: 'chm-1',
    name: 'Cyber Star Charm',
    category: 'charms',
    price: 12000,
  },
  {
    id: 'chm-2',
    name: 'Circuit Board Tag',
    category: 'charms',
    price: 15000,
  },
  {
    id: 'chm-3',
    name: 'Metal Skull',
    category: 'charms',
    price: 18000,
  },
  {
    id: 'chm-4',
    name: 'Hexagon Plate',
    category: 'charms',
    price: 14000,
  },
  {
    id: 'chm-5',
    name: 'Blade Pendant',
    category: 'charms',
    price: 20000,
  },
  {
    id: 'add-1',
    name: 'LED Module',
    category: 'addons',
    price: 35000,
  },
  {
    id: 'add-2',
    name: 'Mini Utility Tool',
    category: 'addons',
    price: 28000,
  },
  {
    id: 'add-3',
    name: 'QR Code Tag',
    category: 'addons',
    price: 9000,
  },
  {
    id: 'add-4',
    name: 'Whistle Attachment',
    category: 'addons',
    price: 7000,
  },
];

export const CATEGORIES = [
  { id: 'carabiners', label: 'CARABINERS' },
  { id: 'chains', label: 'CHAINS' },
  { id: 'charms', label: 'CHARMS' },
  { id: 'addons', label: 'ADD-ONS' },
] as const;
