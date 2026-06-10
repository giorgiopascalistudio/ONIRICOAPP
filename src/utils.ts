/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task } from './types';

// Giorni di permanenza nel Cestino prima del purge automatico (vive qui — e non
// in TrashView — così App può importarlo senza tirare il chunk lazy della vista).
export const TRASH_RETENTION_DAYS = 60;

// Italian locale formatter helper
const df = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('it-IT', options);

export function isoDate(d: Date | string | number): string {
  const x = new Date(d);
  if (isNaN(x.getTime())) return '';
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export function parseISO(s: string): Date {
  if (!s) return new Date(NaN);
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return isoDate(new Date());
}

export function addDays(d: Date | string, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfWeek(d: Date | string): Date {
  const x = new Date(d);
  const off = (x.getDay() + 6) % 7; // Monday-start adjustment
  x.setDate(x.getDate() - off);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function startOfMonth(d: Date | string): Date {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), 1);
}

export function sameDay(a: Date | string, b: Date | string): boolean {
  return isoDate(a) === isoDate(b);
}

export function fmtDay(s: string | Date): string {
  if (!s) return '—';
  const parsed = typeof s === 'string' ? parseISO(s) : s;
  if (isNaN(parsed.getTime())) return '—';
  return df({ day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
}

export function fmtDayLong(d: Date): string {
  if (isNaN(d.getTime())) return '—';
  return df({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export function fmtMonthYear(d: Date): string {
  if (isNaN(d.getTime())) return '—';
  return df({ month: 'long', year: 'numeric' }).format(d);
}

export function relDay(s: string): string {
  const t = todayISO();
  if (s === t) return 'Oggi';
  if (s === isoDate(addDays(new Date(), 1))) return 'Domani';
  if (s === isoDate(addDays(new Date(), -1))) return 'Ieri';
  return fmtDay(s);
}

export const DOW = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

/**
 * Sanifica gli URL inseriti dagli utenti prima di usarli come href
 * (whitelist di schema: blocca javascript:, data:, vbscript: → XSS).
 * Ritorna '' se l'URL non è sicuro: usare `safeUrl(u) || '#'` nei render.
 */
export function safeUrl(u?: string | null): string {
  const s = (u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^(mailto:|tel:)/i.test(s)) return s;
  return '';
}

export function eur(n: number | string | null | undefined): string {
  const val = typeof n === 'string' ? parseFloat(n) : (n || 0);
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
}

export function numIt(v: string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;
}

const AV_COLORS = [
  '#2a2a2a', // deep charcoal
  '#4a5568', // grayish blue
  '#2d3748', // slate 
  '#1a202c', // darker slate
  '#2c5282', // navy
  '#2b6cb0', // blue
  '#4c51bf', // indigo
  '#2c7a7b', // teal
  '#2f855a'  // forest green
];

export function avColor(name?: string | null): string {
  const s = name || '?';
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return AV_COLORS[h % AV_COLORS.length];
}

export function initials(name?: string | null): string {
  const p = (name || '?').trim().split(/\s+/);
  if (!p.length || !p[0]) return '?';
  const first = p[0][0] || '';
  const last = p.length > 1 ? (p[p.length - 1][0] || '') : '';
  return (first + last).toUpperCase() || '?';
}

export function occursOn(t: Task, iso: string): boolean {
  if (!t.date || iso < t.date) return false;
  const f = t.frequency || 'once';
  if (f === 'once') return iso === t.date;
  if (f === 'daily') return true;
  
  const a = parseISO(t.date);
  const d = parseISO(iso);
  if (isNaN(a.getTime()) || isNaN(d.getTime())) return false;
  
  const diffDays = Math.round((d.getTime() - a.getTime()) / 86400000);
  if (f === 'weekly') return diffDays % 7 === 0;
  if (f === 'monthly') {
    const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return d.getDate() === Math.min(a.getDate(), lastDayOfMonth);
  }
  return false;
}

export function taskDoneOn(t: Task, iso: string): boolean {
  const f = t.frequency || 'once';
  if (f === 'once') return !!t.done;
  return !!(t.completions && t.completions[iso]);
}
