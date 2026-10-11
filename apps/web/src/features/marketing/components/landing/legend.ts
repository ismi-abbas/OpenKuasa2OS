/**
 * What each product's elemental name stands for, and why it suits the product.
 * Keyed by product key.
 */
export const LEGEND: Record<string, { name: string; who: string; why: string }> = {
  command: {
    name: 'Kokotiam',
    who: 'Kokotiam is the hub where every element meets.',
    why: 'This is where you run the whole business.',
  },
  reach: {
    name: 'Api',
    who: 'Api is fire: bright, fast and impossible to ignore.',
    why: 'This is how your business gets noticed.',
  },
  crm: {
    name: 'Air',
    who: 'Air is water: it flows around obstacles and keeps things connected.',
    why: 'This is where customers and deals keep moving.',
  },
  people: {
    name: 'Daun',
    who: 'Daun is the leaf: it grows steadily and feeds the whole plant.',
    why: 'This is where your team grows and is looked after.',
  },
  hire: {
    name: 'Taufan',
    who: 'Taufan is wind: it carries new arrivals in.',
    why: 'This is where you find and hire your next people.',
  },
  finance: {
    name: 'Gempa',
    who: 'Gempa is earth: solid ground everything else stands on.',
    why: 'This is where the books are kept steady.',
  },
};
