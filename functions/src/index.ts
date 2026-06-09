/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cloud Functions — automazioni Onirico Studio OS.
 *  - onQuoteStatusChange : notifica + email quando un preventivo passa ad "accettato".
 *  - dailyReminders      : reminder ferie (7 gg prima) e scadenze finanziarie (entro 3 gg).
 *  - weeklyReport        : report attività completate per collaboratore (lunedì).
 *  - monthlyReport       : report mensile (1° del mese).
 *
 * Email via SendGrid (secret SENDGRID_KEY). Le notifiche in-app sono scritte su
 * notifications/<uid> (lette dall'app, vedi App.tsx). Vedi README.md per il deploy.
 */
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { onValueWritten } from 'firebase-functions/v2/database';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { setGlobalOptions } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import sgMail from '@sendgrid/mail';

initializeApp();
const db = getDatabase();

// Regione coerente con la RTDB del progetto (vedi src/firebase.ts)
setGlobalOptions({ region: 'europe-west1' });
const DB_INSTANCE = 'oniricoapp-48953-default-rtdb';

const SENDGRID_KEY = defineSecret('SENDGRID_KEY');
// TODO: sostituire con un mittente VERIFICATO su SendGrid (Single Sender o dominio autenticato)
const FROM_EMAIL = 'noreply@giorgiopascalistudio.it';

interface Member { uid: string; name: string; email?: string; role: string; }

const iso = (d: Date) => d.toISOString().slice(0, 10);
const arr = (v: any): any[] => (v ? Object.values(v).filter(Boolean) : []);

async function studioMembers(): Promise<Member[]> {
  const snap = await db.ref('users').get();
  const users = snap.val() || {};
  return Object.entries<any>(users)
    .filter(([, u]) => u && u.active === true && u.role !== 'cliente' && u.role !== 'partner')
    .map(([uid, u]) => ({ uid, name: u.name || 'Membro', email: u.email, role: u.role }));
}

async function pushNotification(uid: string, payload: { type: string; title: string; body?: string; link?: string }) {
  const id = `ntf-${Date.now()}-${Math.floor(Math.random() * 9000)}`;
  await db.ref(`notifications/${uid}/${id}`).set({
    id, type: payload.type, title: payload.title, body: payload.body || null, link: payload.link || null,
    read: false, at: Date.now(), by: 'system', byName: 'Sistema'
  });
}

async function sendEmail(to: string, subject: string, text: string) {
  const key = SENDGRID_KEY.value();
  if (!key) { logger.warn('SENDGRID_KEY non configurata: email non inviata.'); return; }
  try {
    sgMail.setApiKey(key);
    await sgMail.send({ to, from: FROM_EMAIL, subject, text });
  } catch (e: any) {
    logger.error('Invio email fallito', e?.message || e);
  }
}

async function emailMembers(members: Member[], subject: string, text: string) {
  await Promise.all(members.filter((m) => m.email).map((m) => sendEmail(m.email!, subject, text)));
}

// ---- 1. Preventivo accettato ----
export const onQuoteStatusChange = onValueWritten(
  { ref: '/quotes/{quoteId}/status', instance: DB_INSTANCE, secrets: [SENDGRID_KEY] },
  async (event) => {
    const after = event.data.after.val();
    const before = event.data.before.val();
    if (after === before || after !== 'accettato') return;
    const snap = await db.ref(`quotes/${event.params.quoteId}`).get();
    const q = snap.val();
    if (!q) return;
    const title = `Preventivo accettato: ${q.number}`;
    const body = `${q.clientName} · € ${Number(q.total || 0).toLocaleString('it-IT')}`;
    const members = await studioMembers();
    await Promise.all(members.map((m) => pushNotification(m.uid, { type: 'preventivo', title, body, link: '#preventivi' })));
    await emailMembers(members, title, `${body}\n\nApri Onirico OS per emettere acconto/rate dal piano pagamenti.`);
  }
);

// ---- 2. Reminder giornalieri (ferie 7gg + scadenze 3gg) ----
export const dailyReminders = onSchedule(
  { schedule: 'every day 08:00', timeZone: 'Europe/Rome', secrets: [SENDGRID_KEY] },
  async () => {
    const members = await studioMembers();
    const today = new Date();
    const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
    const in3 = new Date(today); in3.setDate(in3.getDate() + 3);

    // ferie che iniziano esattamente fra 7 giorni
    const leaves = arr((await db.ref('teamLeave').get()).val());
    for (const l of leaves) {
      if (l.dateFrom === iso(in7)) {
        const title = `Promemoria assenza: ${l.name} (${l.type}) dal ${l.dateFrom}`;
        await Promise.all(members.map((m) => pushNotification(m.uid, { type: 'ferie', title, link: '#calendario' })));
        await emailMembers(members, title, `${l.name} sarà assente (${l.type}) dal ${l.dateFrom} al ${l.dateTo}.`);
      }
    }

    // scadenze finanziarie aperte entro 3 giorni → admin/manager
    const scad = arr((await db.ref('finScadenze').get()).val());
    const due = scad.filter((s: any) => s.status !== 'pagato' && s.dueDate && s.dueDate >= iso(today) && s.dueDate <= iso(in3));
    if (due.length) {
      const adminMgr = members.filter((m) => m.role === 'admin' || m.role === 'manager');
      const title = `Scadenze in arrivo (${due.length}) entro 3 giorni`;
      const lines = due.map((s: any) => `• ${s.desc || 'Scadenza'} — € ${Number(s.amount || 0).toLocaleString('it-IT')} — ${s.dueDate}`).join('\n');
      await Promise.all(adminMgr.map((m) => pushNotification(m.uid, { type: 'scadenza', title, body: `${due.length} scadenze entro 3 giorni`, link: '#finanze' })));
      await emailMembers(adminMgr, title, lines);
    }
  }
);

// ---- 3/4. Report attività per collaboratore ----
async function buildReport(sinceMs: number, label: string) {
  const members = await studioMembers();
  const tasks = arr((await db.ref('tasks').get()).val());
  for (const m of members) {
    const mine = tasks.filter((t: any) => t.assignee === m.uid);
    const done = mine.filter((t: any) => t.done && (t.updatedAt || 0) >= sinceMs);
    const open = mine.filter((t: any) => !t.done);
    const title = `Report ${label}: ${done.length} attività completate`;
    await pushNotification(m.uid, { type: 'report', title, body: `${open.length} ancora aperte`, link: '#calendario' });
    if (m.email) await sendEmail(m.email, title, `Ciao ${m.name},\nnel periodo ${label} hai completato ${done.length} attività. Ancora aperte: ${open.length}.`);
  }
}

export const weeklyReport = onSchedule(
  { schedule: 'every monday 08:00', timeZone: 'Europe/Rome', secrets: [SENDGRID_KEY] },
  async () => { await buildReport(Date.now() - 7 * 86400000, 'settimanale'); }
);

export const monthlyReport = onSchedule(
  { schedule: '1 of month 08:00', timeZone: 'Europe/Rome', secrets: [SENDGRID_KEY] },
  async () => { await buildReport(Date.now() - 30 * 86400000, 'mensile'); }
);
