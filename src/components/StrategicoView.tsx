/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * StrategicoView — modulo "Strategico" (società di marketing del gruppo).
 * Gestisce: Eventi & inviti (RSVP), Campagne & follow-up, Sondaggi/customer
 * satisfaction, calendario editoriale Social e un cruscotto Analisi.
 * Nodi Firebase: mktEvents, mktCampaigns, mktSurveys, mktSurveyResponses,
 * mktSocial, mktInvitesIndex (vedi §22 di CLAUDE.md). admin/manager.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, X, Calendar, MapPin, Users, Megaphone, ClipboardList, Share2, BarChart3,
  Trash2, Pencil, Mail, MessageCircle, CheckCircle2, XCircle, HelpCircle, Send,
  Star, Instagram, Facebook, Linkedin, Youtube, Clock, TrendingUp, ListChecks,
} from 'lucide-react';
import type {
  MarketingEvent, Campaign, Survey, SurveyResponse, SocialPost, ClientRecord,
  EventInvitee, RsvpStatus, CampaignStep, SurveyQuestion, CampaignChannel,
  SocialPlatform, SocialStatus,
} from '../types';
import { eur, safeUrl } from '../utils';

const ACCENT = '#b45309';
const IN = 'w-full h-10 px-3 text-[14px] border border-[#e2e2e2] rounded-lg bg-white outline-none focus:border-[#b45309]';
const uid = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 9000)}`;
const dtLocal = (ts?: number | null) => (ts ? new Date(ts - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
const parseDt = (s: string) => (s ? new Date(s).getTime() : 0);

const RSVP_META: Record<RsvpStatus, { label: string; cls: string }> = {
  invitato: { label: 'Invitato', cls: 'bg-stone-100 text-stone-600 border-stone-200' },
  accettato: { label: 'Accettato', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rifiutato: { label: 'Rifiutato', cls: 'bg-red-50 text-red-600 border-red-200' },
  forse: { label: 'Forse', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

interface Props {
  events: MarketingEvent[];
  campaigns: Campaign[];
  surveys: Survey[];
  social: SocialPost[];
  responses: Record<string, Record<string, SurveyResponse>>;
  clients: Record<string, ClientRecord>;
  onSaveEvent: (e: MarketingEvent) => void;
  onDeleteEvent: (id: string) => void;
  onSaveCampaign: (c: Campaign) => void;
  onDeleteCampaign: (id: string) => void;
  onSaveSurvey: (s: Survey) => void;
  onDeleteSurvey: (id: string) => void;
  onSaveSocialPost: (p: SocialPost) => void;
  onDeleteSocialPost: (id: string) => void;
}

type Tab = 'eventi' | 'campagne' | 'sondaggi' | 'social' | 'analisi';

export const StrategicoView: React.FC<Props> = (props) => {
  const { events, campaigns, surveys, social, responses, clients } = props;
  const [tab, setTab] = useState<Tab>('eventi');

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'eventi', label: 'Eventi', icon: Calendar },
    { id: 'campagne', label: 'Campagne', icon: Megaphone },
    { id: 'sondaggi', label: 'Sondaggi', icon: ClipboardList },
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'analisi', label: 'Analisi', icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col gap-5 text-left">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white" style={{ background: ACCENT }}><Megaphone className="w-5 h-5" /></div>
        <div>
          <h1 className="text-[20px] font-extrabold tracking-tight">Strategico</h1>
          <p className="text-[12.5px] text-stone-400">Marketing, eventi e comunicazione del gruppo Onirico</p>
        </div>
      </div>

      <div className="pillbar flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] self-start max-w-full overflow-x-auto">
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative text-[12px] font-extrabold px-4 py-1.5 rounded-full transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${active ? 'text-[#161616]' : 'text-[#8a8a8a] hover:text-[#161616]'}`}>
              {active && <motion.div layoutId="strTab" transition={{ type: 'spring', stiffness: 420, damping: 32 }} className="absolute inset-0 bg-white rounded-full z-0 shadow-xs" />}
              <span className="relative z-10 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'eventi' && <EventsTab events={events} clients={clients} onSave={props.onSaveEvent} onDelete={props.onDeleteEvent} />}
      {tab === 'campagne' && <CampaignsTab campaigns={campaigns} clients={clients} onSave={props.onSaveCampaign} onDelete={props.onDeleteCampaign} />}
      {tab === 'sondaggi' && <SurveysTab surveys={surveys} responses={responses} onSave={props.onSaveSurvey} onDelete={props.onDeleteSurvey} />}
      {tab === 'social' && <SocialTab social={social} campaigns={campaigns} onSave={props.onSaveSocialPost} onDelete={props.onDeleteSocialPost} />}
      {tab === 'analisi' && <AnalisiTab events={events} campaigns={campaigns} surveys={surveys} social={social} responses={responses} />}
    </div>
  );
};

/* ============================== KPI / UI shared ============================== */
const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string }> = ({ icon, label, value, sub, accent }) => (
  <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
    <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{icon}{label}</span>
    <b className="block text-[22px] mt-1.5 leading-none tracking-tight" style={accent ? { color: accent } : undefined}>{value}</b>
    {sub && <span className="text-[11px] text-stone-400 mt-1 inline-block">{sub}</span>}
  </div>
);
const Field: React.FC<{ label: string; children: React.ReactNode; full?: boolean }> = ({ label, children, full }) => (
  <div className={`flex flex-col gap-1 ${full ? 'col-span-2' : ''}`}>
    <label className="text-[11px] font-bold text-[#555]">{label}</label>
    {children}
  </div>
);
const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, footer, wide }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
    <motion.div initial={{ y: 30, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }} onClick={(e) => e.stopPropagation()}
      className={`bg-white w-full ${wide ? 'sm:max-w-[760px]' : 'sm:max-w-[620px]'} max-h-[92vh] overflow-y-auto rounded-t-[26px] sm:rounded-[26px] shadow-2xl`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#ececec] sticky top-0 bg-white z-10">
        <b className="text-[16px] tracking-tight">{title}</b>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"><X className="w-4.5 h-4.5" /></button>
      </div>
      <div className="p-6 flex flex-col gap-4">{children}</div>
      {footer && <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#ececec] sticky bottom-0 bg-white">{footer}</div>}
    </motion.div>
  </motion.div>
);
const AddBtn: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 text-white font-bold text-[13px] h-10 px-4 rounded-xl border-none cursor-pointer transition-all active:scale-95" style={{ background: ACCENT }}>
    <Plus className="w-4 h-4" /> {label}
  </button>
);
const SaveBtn: React.FC<{ onClick: () => void; disabled?: boolean; label?: string }> = ({ onClick, disabled, label }) => (
  <button onClick={onClick} disabled={disabled} className="h-10 px-5 rounded-xl text-white font-bold text-[13px] border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50" style={{ background: ACCENT }}>
    <Send className="w-4 h-4" /> {label || 'Salva'}
  </button>
);
const EmptyBox: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-10 text-center">
    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#b45309] flex items-center justify-center mx-auto mb-3">{icon}</div>
    <b className="block text-[16px]">{title}</b>
    <p className="text-[13px] text-stone-500 mt-1.5 max-w-[420px] mx-auto">{text}</p>
  </div>
);

/* ============================== EVENTI ============================== */
const EventsTab: React.FC<{ events: MarketingEvent[]; clients: Record<string, ClientRecord>; onSave: (e: MarketingEvent) => void; onDelete: (id: string) => void }> = ({ events, clients, onSave, onDelete }) => {
  const [editing, setEditing] = useState<MarketingEvent | null>(null);
  const sorted = [...events].sort((a, b) => (b.date || 0) - (a.date || 0));
  const upcoming = sorted.filter((e) => (e.date || 0) >= Date.now()).length;
  const totInv = sorted.reduce((s, e) => s + Object.keys(e.invitees || {}).length, 0);
  const totAcc = sorted.reduce((s, e) => s + Object.values(e.invitees || {}).filter((i) => i.status === 'accettato').length, 0);

  const blank = (): MarketingEvent => ({ id: uid('ev'), title: '', date: Date.now() + 7 * 864e5, location: '', kind: '', description: '', capacity: null, invitees: {}, status: 'bozza', createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Calendar className="w-4 h-4" />} label="Eventi" value={String(events.length)} sub={`${upcoming} in arrivo`} />
        <Kpi icon={<Users className="w-4 h-4" />} label="Invitati" value={String(totInv)} accent={ACCENT} />
        <Kpi icon={<CheckCircle2 className="w-4 h-4" />} label="Conferme" value={String(totAcc)} accent="#059669" />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Tasso adesione" value={`${totInv ? Math.round((totAcc / totInv) * 100) : 0}%`} />
      </div>
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuovo evento" /></div>

      {sorted.length === 0 ? (
        <EmptyBox icon={<Calendar className="w-6 h-6" />} title="Nessun evento" text="Crea il primo evento e invita clienti e partner dalla rubrica: traccerai le risposte in tempo reale." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((e) => {
            const inv = Object.values(e.invitees || {});
            const acc = inv.filter((i) => i.status === 'accettato').length;
            const past = (e.date || 0) < Date.now();
            return (
              <div key={e.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm border-l-[5px]" style={{ borderLeftColor: ACCENT }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {e.kind && <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{e.kind}</span>}
                    <b className="block text-[16px] tracking-tight truncate">{e.title || 'Senza titolo'}</b>
                    <span className="flex items-center gap-1 text-[12px] text-stone-500 mt-0.5"><Clock className="w-3.5 h-3.5" /> {e.date ? new Date(e.date).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    {e.location && <span className="flex items-center gap-1 text-[12px] text-stone-500 mt-0.5"><MapPin className="w-3.5 h-3.5" /> {e.location}</span>}
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${past ? 'bg-stone-100 text-stone-500 border-stone-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{past ? 'Concluso' : (e.status === 'pubblicato' ? 'Pubblicato' : 'Bozza')}</span>
                </div>
                <div className="flex items-center gap-3 mt-3 text-[12px] text-stone-500">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {inv.length} invitati</span>
                  <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> {acc}</span>
                  {e.capacity ? <span className="text-stone-400">/ {e.capacity} posti</span> : null}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
                  <button onClick={() => setEditing(e)} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold border-none cursor-pointer"><Pencil className="w-3.5 h-3.5" /> Gestisci</button>
                  <button onClick={() => onDelete(e.id)} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && <EventModal event={editing} clients={clients} onClose={() => setEditing(null)} onSave={(e) => { onSave(e); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
};

const EventModal: React.FC<{ event: MarketingEvent; clients: Record<string, ClientRecord>; onClose: () => void; onSave: (e: MarketingEvent) => void }> = ({ event, clients, onClose, onSave }) => {
  const [e, setE] = useState<MarketingEvent>({ ...event, invitees: event.invitees || {} });
  const [pick, setPick] = useState('');
  const set = (p: Partial<MarketingEvent>) => setE((x) => ({ ...x, ...p }));

  const addFromClient = (cid: string) => {
    const c = clients[cid];
    if (!c) return;
    const key = c.accountUid || cid;
    if (e.invitees[key]) return;
    set({ invitees: { ...e.invitees, [key]: { name: c.name, email: c.email || null, clientId: cid, uid: c.accountUid || null, status: 'invitato' } } });
  };
  const removeInvitee = (k: string) => { const n = { ...e.invitees }; delete n[k]; set({ invitees: n }); };

  const clientList = Object.values(clients).filter((c) => c.category !== 'partner');
  const inv = Object.entries(e.invitees);

  return (
    <ModalShell title={event.title ? 'Gestisci evento' : 'Nuovo evento'} onClose={onClose} wide
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(e)} disabled={!e.title.trim()} label="Salva evento" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Titolo" full><input className={IN} value={e.title} onChange={(ev) => set({ title: ev.target.value })} placeholder="Es. Open day showroom Materico" /></Field>
        <Field label="Data e ora"><input type="datetime-local" className={IN} value={dtLocal(e.date)} onChange={(ev) => set({ date: parseDt(ev.target.value) })} /></Field>
        <Field label="Tipo"><input className={IN} value={e.kind || ''} onChange={(ev) => set({ kind: ev.target.value })} placeholder="Open day, webinar…" /></Field>
        <Field label="Luogo"><input className={IN} value={e.location || ''} onChange={(ev) => set({ location: ev.target.value })} /></Field>
        <Field label="Capienza"><input type="number" className={IN} value={e.capacity || ''} onChange={(ev) => set({ capacity: ev.target.value ? Number(ev.target.value) : null })} /></Field>
        <Field label="Descrizione" full><textarea className={`${IN} h-auto py-2 min-h-[60px]`} value={e.description || ''} onChange={(ev) => set({ description: ev.target.value })} /></Field>
        <Field label="Stato" full>
          <div className="flex gap-1.5">
            {(['bozza', 'pubblicato', 'concluso'] as const).map((s) => (
              <button key={s} onClick={() => set({ status: s })} className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full border cursor-pointer capitalize ${e.status === s ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-stone-500 border-stone-200'}`}>{s}</button>
            ))}
          </div>
        </Field>
      </div>

      <div className="border-t border-[#ececec] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Invitati ({inv.length})</span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <select className={`${IN} flex-1`} value={pick} onChange={(ev) => { setPick(''); if (ev.target.value) addFromClient(ev.target.value); }}>
            <option value="">Aggiungi dalla rubrica clienti…</option>
            {clientList.map((c) => <option key={c.id} value={c.id}>{c.name}{c.tier ? ` · fascia ${c.tier}` : ''}{c.accountUid ? ' · portale' : ''}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2 mt-3">
          {inv.map(([k, i]) => (
            <div key={k} className="flex items-center gap-2 bg-[#fafafa] border border-[#ececec] rounded-xl px-3 py-2">
              <b className="text-[13px] flex-1 truncate">{i.name}{i.uid && <span className="text-[10px] text-[#b45309] ml-1.5">portale</span>}</b>
              <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${RSVP_META[i.status].cls}`}>{RSVP_META[i.status].label}</span>
              <button onClick={() => removeInvitee(k)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
          ))}
          {inv.length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessun invitato. Aggiungi dalla rubrica: gli invitati con account portale riceveranno l'invito e potranno rispondere.</span>}
        </div>
      </div>
    </ModalShell>
  );
};

/* ============================== CAMPAGNE ============================== */
const CHANNELS: { id: CampaignChannel; label: string }[] = [
  { id: 'email', label: 'Email' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'social', label: 'Social' }, { id: 'misto', label: 'Misto' },
];
const CampaignsTab: React.FC<{ campaigns: Campaign[]; clients: Record<string, ClientRecord>; onSave: (c: Campaign) => void; onDelete: (id: string) => void }> = ({ campaigns, clients, onSave, onDelete }) => {
  const [editing, setEditing] = useState<Campaign | null>(null);
  const sorted = [...campaigns].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const active = sorted.filter((c) => c.status === 'attiva').length;
  const blank = (): Campaign => ({ id: uid('cmp'), name: '', channel: 'email', season: '', goal: '', audienceTiers: [], message: '', steps: [], status: 'bozza', sentCount: 0, responses: 0, createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi icon={<Megaphone className="w-4 h-4" />} label="Campagne" value={String(campaigns.length)} sub={`${active} attive`} accent={ACCENT} />
        <Kpi icon={<Send className="w-4 h-4" />} label="Invii (manuali)" value={String(sorted.reduce((s, c) => s + (c.sentCount || 0), 0))} />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Risposte" value={String(sorted.reduce((s, c) => s + (c.responses || 0), 0))} accent="#059669" />
      </div>
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuova campagna" /></div>

      {sorted.length === 0 ? (
        <EmptyBox icon={<Megaphone className="w-6 h-6" />} title="Nessuna campagna" text="Pianifica campagne stagionali e follow-up. I contatti si generano dalla rubrica come link email/WhatsApp pronti all'invio." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((c) => (
            <div key={c.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{c.channel}{c.season ? ` · ${c.season}` : ''}</span>
                  <b className="block text-[16px] tracking-tight truncate">{c.name || 'Senza nome'}</b>
                  {c.goal && <span className="text-[12px] text-stone-500">{c.goal}</span>}
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border capitalize ${c.status === 'attiva' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : c.status === 'conclusa' ? 'bg-stone-100 text-stone-500 border-stone-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{c.status}</span>
              </div>
              <div className="flex items-center gap-3 mt-3 text-[12px] text-stone-500">
                <span className="flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" /> {(c.steps || []).length} follow-up</span>
                <span className="flex items-center gap-1"><Send className="w-3.5 h-3.5" /> {c.sentCount || 0} invii</span>
                <span className="flex items-center gap-1 text-emerald-600"><TrendingUp className="w-3.5 h-3.5" /> {c.responses || 0}</span>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
                <button onClick={() => setEditing(c)} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold border-none cursor-pointer"><Pencil className="w-3.5 h-3.5" /> Gestisci</button>
                <button onClick={() => onDelete(c.id)} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && <CampaignModal campaign={editing} clients={clients} onClose={() => setEditing(null)} onSave={(c) => { onSave(c); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
};

const CampaignModal: React.FC<{ campaign: Campaign; clients: Record<string, ClientRecord>; onClose: () => void; onSave: (c: Campaign) => void }> = ({ campaign, clients, onClose, onSave }) => {
  const [c, setC] = useState<Campaign>({ ...campaign, steps: campaign.steps || [], audienceTiers: campaign.audienceTiers || [] });
  const set = (p: Partial<Campaign>) => setC((x) => ({ ...x, ...p }));
  const toggleTier = (t: number) => set({ audienceTiers: (c.audienceTiers || []).includes(t) ? (c.audienceTiers || []).filter((x) => x !== t) : [...(c.audienceTiers || []), t] });
  const addStep = () => set({ steps: [...(c.steps || []), { id: uid('st'), offsetDays: 3, channel: c.channel, message: '' }] });
  const setStep = (id: string, p: Partial<CampaignStep>) => set({ steps: (c.steps || []).map((s) => (s.id === id ? { ...s, ...p } : s)) });
  const delStep = (id: string) => set({ steps: (c.steps || []).filter((s) => s.id !== id) });

  // Destinatari dalla rubrica secondo le fasce selezionate → link pronti
  const audience = Object.values(clients).filter((cl) => cl.category !== 'partner' && ((c.audienceTiers || []).length === 0 || (cl.tier != null && (c.audienceTiers || []).includes(cl.tier))));
  const enc = encodeURIComponent(c.message || '');

  return (
    <ModalShell title={campaign.name ? 'Gestisci campagna' : 'Nuova campagna'} onClose={onClose} wide
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(c)} disabled={!c.name.trim()} label="Salva campagna" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome" full><input className={IN} value={c.name} onChange={(e) => set({ name: e.target.value })} placeholder="Es. Promo primavera ristrutturazioni" /></Field>
        <Field label="Canale"><select className={IN} value={c.channel} onChange={(e) => set({ channel: e.target.value as CampaignChannel })}>{CHANNELS.map((ch) => <option key={ch.id} value={ch.id}>{ch.label}</option>)}</select></Field>
        <Field label="Stagionalità"><input className={IN} value={c.season || ''} onChange={(e) => set({ season: e.target.value })} placeholder="Es. Natale 2026" /></Field>
        <Field label="Obiettivo" full><input className={IN} value={c.goal || ''} onChange={(e) => set({ goal: e.target.value })} placeholder="Es. Riattivare clienti fascia 2" /></Field>
        <Field label="Messaggio" full><textarea className={`${IN} h-auto py-2 min-h-[70px]`} value={c.message || ''} onChange={(e) => set({ message: e.target.value })} placeholder="Testo del messaggio (usato nei link email/WhatsApp)…" /></Field>
        <Field label="Stato"><select className={IN} value={c.status} onChange={(e) => set({ status: e.target.value as Campaign['status'] })}><option value="bozza">Bozza</option><option value="attiva">Attiva</option><option value="conclusa">Conclusa</option></select></Field>
        <Field label="Fasce destinatarie">
          <div className="flex gap-1.5 items-center h-10">
            {[1, 2, 3].map((t) => <button key={t} onClick={() => toggleTier(t)} className={`text-[12px] font-bold w-9 h-9 rounded-lg border cursor-pointer ${(c.audienceTiers || []).includes(t) ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-stone-500 border-stone-200'}`}>{t}</button>)}
            <span className="text-[11px] text-stone-400 ml-1">{(c.audienceTiers || []).length === 0 ? 'tutte' : ''}</span>
          </div>
        </Field>
      </div>

      {/* Follow-up */}
      <div className="border-t border-[#ececec] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5" /> Follow-up pianificati</span>
          <button onClick={addStep} className="text-[12px] font-bold text-[#b45309] flex items-center gap-1 bg-transparent border-none cursor-pointer"><Plus className="w-3.5 h-3.5" /> Aggiungi</button>
        </div>
        <div className="flex flex-col gap-2 mt-3">
          {(c.steps || []).map((s) => (
            <div key={s.id} className="flex items-center gap-2 bg-[#fafafa] border border-[#ececec] rounded-xl px-3 py-2">
              <span className="text-[11px] text-stone-500 shrink-0">+</span>
              <input type="number" className="w-14 h-8 px-2 text-[13px] border border-[#e2e2e2] rounded-md" value={s.offsetDays} onChange={(e) => setStep(s.id, { offsetDays: Number(e.target.value) })} />
              <span className="text-[11px] text-stone-500 shrink-0">gg</span>
              <input className="flex-1 h-8 px-2 text-[13px] border border-[#e2e2e2] rounded-md" value={s.message} onChange={(e) => setStep(s.id, { message: e.target.value })} placeholder="Messaggio di follow-up" />
              <button onClick={() => delStep(s.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
            </div>
          ))}
          {(c.steps || []).length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessun follow-up.</span>}
        </div>
      </div>

      {/* Destinatari + link pronti */}
      <div className="border-t border-[#ececec] pt-4">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Destinatari ({audience.length})</span>
        <div className="flex flex-col gap-1.5 mt-3 max-h-[180px] overflow-y-auto">
          {audience.map((cl) => (
            <div key={cl.id} className="flex items-center gap-2 text-[13px] bg-[#fafafa] border border-[#ececec] rounded-lg px-3 py-1.5">
              <b className="flex-1 truncate">{cl.name}</b>
              {cl.email && <a href={safeUrl(`mailto:${cl.email}?subject=${encodeURIComponent(c.name)}&body=${enc}`) || '#'} className="w-7 h-7 rounded-lg bg-white border border-[#e2e2e2] flex items-center justify-center text-stone-600 hover:text-[#b45309]" title="Email"><Mail className="w-3.5 h-3.5" /></a>}
              {(cl.whatsapp || cl.phone) && <a href={safeUrl(`https://wa.me/${(cl.whatsapp || cl.phone || '').replace(/[^0-9]/g, '')}?text=${enc}`) || '#'} target="_blank" rel="noreferrer" className="w-7 h-7 rounded-lg bg-white border border-[#e2e2e2] flex items-center justify-center text-stone-600 hover:text-emerald-600" title="WhatsApp"><MessageCircle className="w-3.5 h-3.5" /></a>}
            </div>
          ))}
          {audience.length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessun contatto in rubrica per queste fasce.</span>}
        </div>
      </div>
    </ModalShell>
  );
};

/* ============================== SONDAGGI ============================== */
const SurveysTab: React.FC<{ surveys: Survey[]; responses: Record<string, Record<string, SurveyResponse>>; onSave: (s: Survey) => void; onDelete: (id: string) => void }> = ({ surveys, responses, onSave, onDelete }) => {
  const [editing, setEditing] = useState<Survey | null>(null);
  const [resultsFor, setResultsFor] = useState<Survey | null>(null);
  const sorted = [...surveys].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const totResp = Object.values(responses).reduce((s, r) => s + Object.keys(r || {}).length, 0);
  const blank = (): Survey => ({ id: uid('sv'), title: '', intro: '', questions: [], audience: 'clienti', active: true, createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi icon={<ClipboardList className="w-4 h-4" />} label="Sondaggi" value={String(surveys.length)} sub={`${sorted.filter((s) => s.active).length} attivi`} accent={ACCENT} />
        <Kpi icon={<Users className="w-4 h-4" />} label="Risposte totali" value={String(totResp)} accent="#059669" />
        <Kpi icon={<Star className="w-4 h-4" />} label="Domande" value={String(sorted.reduce((s, x) => s + (x.questions || []).length, 0))} />
      </div>
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuovo sondaggio" /></div>

      {sorted.length === 0 ? (
        <EmptyBox icon={<ClipboardList className="w-6 h-6" />} title="Nessun sondaggio" text="Crea sondaggi di customer satisfaction: i clienti li compilano dal portale e vedi i risultati aggregati qui." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((s) => {
            const n = Object.keys(responses[s.id] || {}).length;
            return (
              <div key={s.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <b className="block text-[16px] tracking-tight truncate">{s.title || 'Senza titolo'}</b>
                    <span className="text-[12px] text-stone-500">{(s.questions || []).length} domande · destinatari: {s.audience}</span>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${s.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>{s.active ? 'Attivo' : 'Chiuso'}</span>
                </div>
                <div className="flex items-center gap-2 mt-3 text-[12px] text-stone-500"><Users className="w-3.5 h-3.5" /> {n} risposte</div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
                  <button onClick={() => setResultsFor(s)} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white border border-[#e2e2e2] hover:border-stone-400 text-[12.5px] font-bold cursor-pointer"><BarChart3 className="w-3.5 h-3.5" /> Risultati</button>
                  <button onClick={() => setEditing(s)} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold border-none cursor-pointer"><Pencil className="w-3.5 h-3.5" /> Modifica</button>
                  <button onClick={() => onDelete(s.id)} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editing && <SurveyModal survey={editing} onClose={() => setEditing(null)} onSave={(s) => { onSave(s); setEditing(null); }} />}
        {resultsFor && <SurveyResults survey={resultsFor} responses={responses[resultsFor.id] || {}} onClose={() => setResultsFor(null)} />}
      </AnimatePresence>
    </div>
  );
};

const SurveyModal: React.FC<{ survey: Survey; onClose: () => void; onSave: (s: Survey) => void }> = ({ survey, onClose, onSave }) => {
  const [s, setS] = useState<Survey>({ ...survey, questions: survey.questions || [] });
  const set = (p: Partial<Survey>) => setS((x) => ({ ...x, ...p }));
  const addQ = (type: SurveyQuestion['type']) => set({ questions: [...s.questions, { id: uid('q'), text: '', type, options: type === 'choice' ? ['', ''] : undefined }] });
  const setQ = (id: string, p: Partial<SurveyQuestion>) => set({ questions: s.questions.map((q) => (q.id === id ? { ...q, ...p } : q)) });
  const delQ = (id: string) => set({ questions: s.questions.filter((q) => q.id !== id) });

  return (
    <ModalShell title={survey.title ? 'Modifica sondaggio' : 'Nuovo sondaggio'} onClose={onClose} wide
      footer={<><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(s)} disabled={!s.title.trim() || s.questions.length === 0} label="Salva sondaggio" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Titolo" full><input className={IN} value={s.title} onChange={(e) => set({ title: e.target.value })} placeholder="Es. Soddisfazione fine lavori" /></Field>
        <Field label="Introduzione" full><textarea className={`${IN} h-auto py-2 min-h-[50px]`} value={s.intro || ''} onChange={(e) => set({ intro: e.target.value })} /></Field>
        <Field label="Destinatari"><select className={IN} value={s.audience} onChange={(e) => set({ audience: e.target.value as Survey['audience'] })}><option value="clienti">Clienti</option><option value="partner">Partner</option><option value="tutti">Tutti</option></select></Field>
        <Field label="Stato"><label className="flex items-center gap-2 h-10 cursor-pointer"><input type="checkbox" checked={s.active} onChange={(e) => set({ active: e.target.checked })} className="w-4 h-4 accent-[#b45309]" /><span className="text-[13px] text-stone-600">Attivo (visibile nel portale)</span></label></Field>
      </div>

      <div className="border-t border-[#ececec] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400">Domande ({s.questions.length})</span>
          <div className="flex gap-1.5">
            <button onClick={() => addQ('rating')} className="text-[11.5px] font-bold text-[#b45309] border border-amber-200 bg-amber-50 rounded-lg px-2 py-1 cursor-pointer">+ Voto</button>
            <button onClick={() => addQ('choice')} className="text-[11.5px] font-bold text-[#b45309] border border-amber-200 bg-amber-50 rounded-lg px-2 py-1 cursor-pointer">+ Scelta</button>
            <button onClick={() => addQ('text')} className="text-[11.5px] font-bold text-[#b45309] border border-amber-200 bg-amber-50 rounded-lg px-2 py-1 cursor-pointer">+ Testo</button>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-3">
          {s.questions.map((q, idx) => (
            <div key={q.id} className="bg-[#fafafa] border border-[#ececec] rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-stone-400 shrink-0">{idx + 1}.</span>
                <input className="flex-1 h-9 px-2.5 text-[13px] border border-[#e2e2e2] rounded-md bg-white" value={q.text} onChange={(e) => setQ(q.id, { text: e.target.value })} placeholder="Testo della domanda" />
                <span className="text-[10.5px] font-bold uppercase text-stone-400 shrink-0">{q.type === 'rating' ? 'voto 1-5' : q.type}</span>
                <button onClick={() => delQ(q.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
              </div>
              {q.type === 'choice' && (
                <div className="flex flex-col gap-1.5 mt-2 pl-6">
                  {(q.options || []).map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input className="flex-1 h-8 px-2 text-[12.5px] border border-[#e2e2e2] rounded-md bg-white" value={opt} onChange={(e) => setQ(q.id, { options: (q.options || []).map((o, j) => (j === oi ? e.target.value : o)) })} placeholder={`Opzione ${oi + 1}`} />
                      <button onClick={() => setQ(q.id, { options: (q.options || []).filter((_, j) => j !== oi) })} className="w-6 h-6 rounded hover:bg-red-50 text-red-400 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <button onClick={() => setQ(q.id, { options: [...(q.options || []), ''] })} className="self-start text-[11.5px] font-bold text-[#b45309] bg-transparent border-none cursor-pointer flex items-center gap-1"><Plus className="w-3 h-3" /> opzione</button>
                </div>
              )}
            </div>
          ))}
          {s.questions.length === 0 && <span className="text-[12.5px] italic text-stone-400">Aggiungi almeno una domanda.</span>}
        </div>
      </div>
    </ModalShell>
  );
};

const SurveyResults: React.FC<{ survey: Survey; responses: Record<string, SurveyResponse>; onClose: () => void }> = ({ survey, responses, onClose }) => {
  const rows = Object.values(responses);
  return (
    <ModalShell title={`Risultati · ${survey.title}`} onClose={onClose} wide footer={<button onClick={onClose} className="h-10 px-5 rounded-xl bg-[#1b1b1b] text-white font-bold text-[13px] border-none cursor-pointer">Chiudi</button>}>
      <span className="text-[13px] text-stone-500">{rows.length} risposte</span>
      {survey.questions.map((q) => {
        const vals = rows.map((r) => r.answers[q.id]).filter((v) => v != null && v !== '');
        return (
          <div key={q.id} className="border border-[#ececec] rounded-xl p-3">
            <b className="text-[13.5px] block mb-2">{q.text}</b>
            {q.type === 'rating' ? (
              <span className="text-[20px] font-extrabold" style={{ color: ACCENT }}>{vals.length ? (vals.reduce((s, v) => s + Number(v), 0) / vals.length).toFixed(1) : '—'}<span className="text-[12px] text-stone-400 font-normal"> / 5 media</span></span>
            ) : q.type === 'choice' ? (
              <div className="flex flex-col gap-1.5">
                {(q.options || []).map((opt) => {
                  const cnt = vals.filter((v) => v === opt).length;
                  const pct = vals.length ? Math.round((cnt / vals.length) * 100) : 0;
                  return (
                    <div key={opt}>
                      <div className="flex justify-between text-[12px]"><span>{opt || '—'}</span><span className="text-stone-400">{cnt} · {pct}%</span></div>
                      <div className="h-1.5 bg-[#eee] rounded-full overflow-hidden mt-0.5"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: ACCENT }} /></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                {vals.length === 0 ? <span className="text-[12.5px] italic text-stone-400">Nessuna risposta.</span> : vals.map((v, i) => <span key={i} className="text-[12.5px] bg-[#fafafa] border border-[#ececec] rounded-lg px-2.5 py-1.5">{String(v)}</span>)}
              </div>
            )}
          </div>
        );
      })}
    </ModalShell>
  );
};

/* ============================== SOCIAL ============================== */
const PLATFORMS: { id: SocialPlatform; label: string; icon: React.ElementType }[] = [
  { id: 'instagram', label: 'Instagram', icon: Instagram }, { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin }, { id: 'tiktok', label: 'TikTok', icon: Share2 }, { id: 'youtube', label: 'YouTube', icon: Youtube },
];
const SOCIAL_COLS: { id: SocialStatus; label: string }[] = [
  { id: 'idea', label: 'Idee' }, { id: 'bozza', label: 'Bozze' }, { id: 'programmato', label: 'Programmati' }, { id: 'pubblicato', label: 'Pubblicati' },
];
const SocialTab: React.FC<{ social: SocialPost[]; campaigns: Campaign[]; onSave: (p: SocialPost) => void; onDelete: (id: string) => void }> = ({ social, campaigns, onSave, onDelete }) => {
  const [editing, setEditing] = useState<SocialPost | null>(null);
  const blank = (): SocialPost => ({ id: uid('sp'), platform: 'instagram', caption: '', status: 'idea', scheduledAt: null, createdAt: Date.now() });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end"><AddBtn onClick={() => setEditing(blank())} label="Nuovo post" /></div>
      {social.length === 0 ? (
        <EmptyBox icon={<Share2 className="w-6 h-6" />} title="Calendario editoriale vuoto" text="Pianifica i contenuti social per le società del gruppo: idee, bozze, post programmati e pubblicati, con metriche." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {SOCIAL_COLS.map((col) => {
            const items = social.filter((p) => p.status === col.id).sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0));
            return (
              <div key={col.id} className="bg-[#f6f6f4] border border-[#e8e8e6] rounded-[18px] p-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <b className="text-[12.5px]">{col.label}</b>
                  <span className="text-[11px] text-stone-400 font-bold">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((p) => {
                    const Plat = (PLATFORMS.find((x) => x.id === p.platform) || PLATFORMS[0]).icon;
                    return (
                      <button key={p.id} onClick={() => setEditing(p)} className="text-left bg-white border border-[#ececec] rounded-xl p-3 cursor-pointer hover:shadow-sm transition-all">
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-1"><Plat className="w-3.5 h-3.5" /> {p.platform}{p.scheduledAt ? ` · ${new Date(p.scheduledAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}` : ''}</div>
                        <p className="text-[12.5px] line-clamp-3">{p.caption || '—'}</p>
                        {(p.reach != null || p.likes != null) && <div className="flex gap-2 mt-1.5 text-[10.5px] text-stone-400">{p.reach != null && <span>{p.reach} reach</span>}{p.likes != null && <span>{p.likes} like</span>}</div>}
                      </button>
                    );
                  })}
                  {items.length === 0 && <span className="text-[11.5px] italic text-stone-400 px-1">—</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AnimatePresence>
        {editing && <SocialModal post={editing} campaigns={campaigns} onClose={() => setEditing(null)} onSave={(p) => { onSave(p); setEditing(null); }} onDelete={(id) => { onDelete(id); setEditing(null); }} />}
      </AnimatePresence>
    </div>
  );
};

const SocialModal: React.FC<{ post: SocialPost; campaigns: Campaign[]; onClose: () => void; onSave: (p: SocialPost) => void; onDelete: (id: string) => void }> = ({ post, campaigns, onClose, onSave, onDelete }) => {
  const [p, setP] = useState<SocialPost>({ ...post });
  const set = (x: Partial<SocialPost>) => setP((v) => ({ ...v, ...x }));
  const exists = !!post.caption || !!post.mediaUrl;
  return (
    <ModalShell title={exists ? 'Modifica post' : 'Nuovo post'} onClose={onClose}
      footer={<><button onClick={() => onDelete(p.id)} className="h-10 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 font-bold text-[13px] cursor-pointer mr-auto">Elimina</button><button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 font-bold text-[13px] border-none cursor-pointer">Annulla</button><SaveBtn onClick={() => onSave(p)} disabled={!p.caption.trim()} label="Salva" /></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Piattaforma"><select className={IN} value={p.platform} onChange={(e) => set({ platform: e.target.value as SocialPlatform })}>{PLATFORMS.map((pl) => <option key={pl.id} value={pl.id}>{pl.label}</option>)}</select></Field>
        <Field label="Stato"><select className={IN} value={p.status} onChange={(e) => set({ status: e.target.value as SocialStatus })}>{SOCIAL_COLS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
        <Field label="Caption" full><textarea className={`${IN} h-auto py-2 min-h-[80px]`} value={p.caption} onChange={(e) => set({ caption: e.target.value })} placeholder="Testo del post + hashtag…" /></Field>
        <Field label="Pilastro/tema"><input className={IN} value={p.pillar || ''} onChange={(e) => set({ pillar: e.target.value })} placeholder="Es. Dietro le quinte" /></Field>
        <Field label="Data programmata"><input type="datetime-local" className={IN} value={dtLocal(p.scheduledAt)} onChange={(e) => set({ scheduledAt: parseDt(e.target.value) || null })} /></Field>
        <Field label="Link media/asset" full><input className={IN} value={p.mediaUrl || ''} onChange={(e) => set({ mediaUrl: e.target.value })} placeholder="https://…" /></Field>
        <Field label="Campagna collegata" full><select className={IN} value={p.campaignId || ''} onChange={(e) => set({ campaignId: e.target.value || null })}><option value="">— Nessuna —</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Reach (metrica)"><input type="number" className={IN} value={p.reach ?? ''} onChange={(e) => set({ reach: e.target.value ? Number(e.target.value) : null })} /></Field>
        <Field label="Like (metrica)"><input type="number" className={IN} value={p.likes ?? ''} onChange={(e) => set({ likes: e.target.value ? Number(e.target.value) : null })} /></Field>
      </div>
    </ModalShell>
  );
};

/* ============================== ANALISI ============================== */
const AnalisiTab: React.FC<{ events: MarketingEvent[]; campaigns: Campaign[]; surveys: Survey[]; social: SocialPost[]; responses: Record<string, Record<string, SurveyResponse>> }> = ({ events, campaigns, surveys, social, responses }) => {
  const stats = useMemo(() => {
    const inv = events.reduce((s, e) => s + Object.keys(e.invitees || {}).length, 0);
    const acc = events.reduce((s, e) => s + Object.values(e.invitees || {}).filter((i) => i.status === 'accettato').length, 0);
    const resp = events.reduce((s, e) => s + Object.values(e.invitees || {}).filter((i) => i.status !== 'invitato').length, 0);
    const sent = campaigns.reduce((s, c) => s + (c.sentCount || 0), 0);
    const cresp = campaigns.reduce((s, c) => s + (c.responses || 0), 0);
    const totResp = Object.values(responses).reduce((s, r) => s + Object.keys(r || {}).length, 0);
    // Media voti (NPS-like) su tutte le domande rating
    let ratingSum = 0, ratingN = 0;
    surveys.forEach((sv) => {
      const ratingQ = (sv.questions || []).filter((q) => q.type === 'rating').map((q) => q.id);
      Object.values(responses[sv.id] || {}).forEach((r) => ratingQ.forEach((qid) => { const v = Number(r.answers[qid]); if (v) { ratingSum += v; ratingN++; } }));
    });
    const pub = social.filter((p) => p.status === 'pubblicato');
    const reach = pub.reduce((s, p) => s + (p.reach || 0), 0);
    return {
      invRate: inv ? Math.round((acc / inv) * 100) : 0,
      respRate: inv ? Math.round((resp / inv) * 100) : 0,
      inv, acc, sent, cresp,
      convRate: sent ? Math.round((cresp / sent) * 100) : 0,
      totResp, avgRating: ratingN ? (ratingSum / ratingN) : 0,
      pub: pub.length, reach,
    };
  }, [events, campaigns, surveys, social, responses]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Users className="w-4 h-4" />} label="Adesione eventi" value={`${stats.invRate}%`} sub={`${stats.acc}/${stats.inv} conferme`} accent="#059669" />
        <Kpi icon={<Send className="w-4 h-4" />} label="Tasso risposta inviti" value={`${stats.respRate}%`} accent={ACCENT} />
        <Kpi icon={<Megaphone className="w-4 h-4" />} label="Conversione campagne" value={`${stats.convRate}%`} sub={`${stats.cresp}/${stats.sent}`} />
        <Kpi icon={<Star className="w-4 h-4" />} label="Soddisfazione media" value={stats.avgRating ? `${stats.avgRating.toFixed(1)}/5` : '—'} sub={`${stats.totResp} risposte`} accent="#059669" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi icon={<Share2 className="w-4 h-4" />} label="Post pubblicati" value={String(stats.pub)} />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Reach totale (social)" value={stats.reach.toLocaleString('it-IT')} accent={ACCENT} />
        <Kpi icon={<ClipboardList className="w-4 h-4" />} label="Sondaggi attivi" value={String(surveys.filter((s) => s.active).length)} />
      </div>

      <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-5">
        <b className="text-[14px] flex items-center gap-1.5 mb-3"><BarChart3 className="w-4 h-4" style={{ color: ACCENT }} /> Performance per campagna</b>
        {campaigns.length === 0 ? <span className="text-[13px] italic text-stone-400">Nessuna campagna da analizzare.</span> : (
          <div className="flex flex-col gap-2">
            {campaigns.map((c) => {
              const conv = c.sentCount ? Math.round(((c.responses || 0) / c.sentCount) * 100) : 0;
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-[12.5px] w-40 truncate shrink-0">{c.name}</span>
                  <div className="flex-1 h-2 bg-[#eee] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, conv)}%`, background: ACCENT }} /></div>
                  <span className="text-[12px] text-stone-500 w-24 text-right shrink-0">{c.responses || 0}/{c.sentCount || 0} · {conv}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
