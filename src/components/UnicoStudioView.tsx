/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * UnicoStudioView — modulo "Unico" lato studio (interno).
 * Gestisce le operazioni immobiliari (acquisto → ristrutturazione → rivendita),
 * gli investitori e i numeri (capitale raccolto, profitto atteso, ROI/margine).
 * Vive come sotto-sezione della divisione UNICO dentro Progetti.
 * Persistenza Firebase: nodo `unicoDeals` (admin/manager).
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, X, MapPin, TrendingUp, Users, Coins, Trash2, Pencil, Building2,
  Tag, PiggyBank, Percent, Wallet, ArrowUpRight, Gem,
} from 'lucide-react';
import type { UnicoDeal, UnicoInvestor, UnicoDealStatus, Project } from '../types';
import { eur } from '../utils';

const IN = 'w-full h-10 px-3 text-[14px] border border-[#e2e2e2] rounded-lg bg-white outline-none focus:border-[#161616]';

const STATUS: Record<UnicoDealStatus, { label: string; cls: string; dot: string }> = {
  valutazione: { label: 'Valutazione', cls: 'bg-stone-100 text-stone-600 border-stone-200', dot: '#a8a29e' },
  acquisizione: { label: 'Acquisizione', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: '#4338ca' },
  ristrutturazione: { label: 'Ristrutturazione', cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: '#c2410c' },
  vendita: { label: 'In vendita', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: '#2563eb' },
  concluso: { label: 'Concluso', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#059669' },
};
const STATUS_ORDER: UnicoDealStatus[] = ['valutazione', 'acquisizione', 'ristrutturazione', 'vendita', 'concluso'];

const raisedOf = (d: UnicoDeal) => (d.investors || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
const profitOf = (d: UnicoDeal) => (Number(d.targetSalePrice) || 0) - (Number(d.acquisitionCost) || 0) - (Number(d.renovationBudget) || 0);
const marginOf = (d: UnicoDeal) => {
  const base = (Number(d.acquisitionCost) || 0) + (Number(d.renovationBudget) || 0);
  return base ? (profitOf(d) / base) * 100 : 0;
};

interface Props {
  deals: UnicoDeal[];
  onSave: (deals: UnicoDeal[]) => void;
  projects: Project[];
  canEdit: boolean;
}

export const UnicoStudioView: React.FC<Props> = ({ deals, onSave, projects, canEdit }) => {
  const [tab, setTab] = useState<'operazioni' | 'investitori'>('operazioni');
  const [editing, setEditing] = useState<UnicoDeal | null>(null);
  const [isNew, setIsNew] = useState(false);

  const totals = useMemo(() => {
    const raised = deals.reduce((s, d) => s + raisedOf(d), 0);
    const goal = deals.reduce((s, d) => s + (Number(d.capitalGoal) || 0), 0);
    const profit = deals.reduce((s, d) => s + profitOf(d), 0);
    const portfolio = deals.reduce((s, d) => s + (Number(d.acquisitionCost) || 0) + (Number(d.renovationBudget) || 0), 0);
    const investors = deals.reduce((s, d) => s + (d.investors?.length || 0), 0);
    return { raised, goal, profit, portfolio, investors };
  }, [deals]);

  const openNew = () => {
    setIsNew(true);
    setEditing({
      id: `u-${Date.now()}`,
      title: '', type: 'Trullo', location: '',
      status: 'valutazione',
      acquisitionCost: 0, renovationBudget: 0, targetSalePrice: 0, capitalGoal: 0,
      minInvestment: 10000, targetRoi: 10, durationMonths: 18,
      investors: [], matericoProjectId: null, published: false, notes: '',
      createdAt: Date.now(),
    });
  };

  const saveDeal = (d: UnicoDeal) => {
    const next = isNew ? [...deals, { ...d, createdAt: d.createdAt || Date.now() }] : deals.map((x) => (x.id === d.id ? { ...d, updatedAt: Date.now() } : x));
    onSave(next);
    setEditing(null); setIsNew(false);
  };
  const deleteDeal = (id: string) => {
    if (!confirm('Eliminare questa operazione immobiliare?')) return;
    onSave(deals.filter((d) => d.id !== id));
  };

  return (
    <div className="flex flex-col gap-5 text-left">
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Building2 className="w-4 h-4" />} label="Operazioni" value={String(deals.length)} sub={`${deals.filter(d => d.status !== 'concluso').length} attive`} />
        <Kpi icon={<Wallet className="w-4 h-4" />} label="Capitale raccolto" value={eur(totals.raised)} sub={`obiettivo ${eur(totals.goal)}`} accent="#4338ca" />
        <Kpi icon={<TrendingUp className="w-4 h-4" />} label="Profitto atteso" value={eur(totals.profit)} sub={`portafoglio ${eur(totals.portfolio)}`} accent="#059669" />
        <Kpi icon={<Users className="w-4 h-4" />} label="Investitori" value={String(totals.investors)} sub="conferimenti totali" />
      </div>

      {/* Tabs + azione */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px]">
          {([{ id: 'operazioni', label: 'Operazioni' }, { id: 'investitori', label: 'Investitori' }] as const).map((t) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative text-[12px] font-extrabold px-4 py-1.5 rounded-full transition-colors border-none bg-transparent cursor-pointer ${active ? 'text-[#161616]' : 'text-[#8a8a8a] hover:text-[#161616]'}`}>
                {active && <motion.div layoutId="unicoSubTab" transition={{ type: 'spring', stiffness: 420, damping: 32 }} className="absolute inset-0 bg-white rounded-full z-0 shadow-xs" />}
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
        {canEdit && tab === 'operazioni' && (
          <button onClick={openNew} className="flex items-center gap-1.5 bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold text-[13px] h-10 px-4 rounded-xl border-none cursor-pointer transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Nuova operazione
          </button>
        )}
      </div>

      {tab === 'operazioni' ? (
        deals.length === 0 ? (
          <Empty onNew={canEdit ? openNew : undefined} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {deals.map((d) => (
              <DealCard key={d.id} deal={d} canEdit={canEdit} onEdit={() => { setIsNew(false); setEditing(d); }} onDelete={() => deleteDeal(d.id)} />
            ))}
          </div>
        )
      ) : (
        <InvestorsTable deals={deals} />
      )}

      <AnimatePresence>
        {editing && (
          <DealModal
            deal={editing}
            projects={projects}
            canEdit={canEdit}
            onClose={() => { setEditing(null); setIsNew(false); }}
            onSave={saveDeal}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------- KPI ---------- */
const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string }> = ({ icon, label, value, sub, accent }) => (
  <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-4">
    <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{icon}{label}</span>
    <b className="block text-[22px] mt-1.5 leading-none tracking-tight" style={accent ? { color: accent } : undefined}>{value}</b>
    {sub && <span className="text-[11px] text-stone-400 mt-1 inline-block">{sub}</span>}
  </div>
);

/* ---------- Card operazione ---------- */
const DealCard: React.FC<{ deal: UnicoDeal; canEdit: boolean; onEdit: () => void; onDelete: () => void }> = ({ deal: d, canEdit, onEdit, onDelete }) => {
  const raised = raisedOf(d);
  const fundedPct = d.capitalGoal ? Math.min(100, Math.round((raised / d.capitalGoal) * 100)) : 0;
  const st = STATUS[d.status];
  const margin = marginOf(d);
  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[22px] p-5 shadow-sm hover:shadow-md transition-all border-l-[5px]" style={{ borderLeftColor: st.dot }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{d.type}</span>
          <b className="block text-[16px] tracking-tight truncate">{d.title || 'Senza nome'}</b>
          <span className="flex items-center gap-1 text-[12px] text-stone-500 mt-0.5"><MapPin className="w-3.5 h-3.5" /> {d.location || '—'}</span>
        </div>
        <span className={`shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <Mini label="Acquisto" value={eur(d.acquisitionCost)} />
        <Mini label="Ristrutt." value={eur(d.renovationBudget)} />
        <Mini label="Vendita" value={eur(d.targetSalePrice)} />
      </div>

      <div className="flex items-center justify-between mt-3 text-[12px]">
        <span className="flex items-center gap-1 text-stone-500 font-semibold"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Profitto {eur(profitOf(d))}</span>
        <span className="font-bold" style={{ color: margin >= 0 ? '#059669' : '#dc2626' }}>{margin.toFixed(1)}%</span>
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full bg-[#eee] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${fundedPct}%`, background: '#4338ca' }} />
        </div>
        <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5 font-semibold">
          <span>{eur(raised)} / {eur(d.capitalGoal)}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {d.investors?.length || 0}</span>
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#f0f0f0]">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#1b1b1b] hover:bg-black text-white text-[12.5px] font-bold border-none cursor-pointer">
            <Pencil className="w-3.5 h-3.5" /> Gestisci
          </button>
          <button onClick={onDelete} className="w-9 h-9 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

const Mini: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-[#fafafa] border border-[#ececec] rounded-xl py-2">
    <span className="block text-[9.5px] uppercase tracking-wide text-stone-400 font-bold">{label}</span>
    <b className="block text-[12.5px] mt-0.5">{value}</b>
  </div>
);

/* ---------- Tabella investitori ---------- */
const InvestorsTable: React.FC<{ deals: UnicoDeal[] }> = ({ deals }) => {
  const rows = deals.flatMap((d) =>
    (d.investors || []).map((i) => ({ ...i, dealTitle: d.title, dealGoal: d.capitalGoal }))
  ).sort((a, b) => (b.amount || 0) - (a.amount || 0));
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  if (rows.length === 0) {
    return <div className="bg-white border border-[#e2e2e2] rounded-[20px] p-8 text-center text-stone-400 text-[13.5px]">Nessun investitore registrato. Aggiungili dal dettaglio di un’operazione.</div>;
  }
  return (
    <div className="bg-white border border-[#e2e2e2] rounded-[20px] overflow-hidden">
      <div className="grid grid-cols-[1.4fr_1.4fr_0.9fr_0.7fr] gap-2 px-4 py-3 bg-[#fafafa] border-b border-[#ececec] text-[10.5px] font-bold uppercase tracking-wide text-stone-400">
        <span>Investitore</span><span>Operazione</span><span className="text-right">Conferito</span><span className="text-right">Quota</span>
      </div>
      {rows.map((r) => {
        const quota = r.dealGoal ? (r.amount / r.dealGoal) * 100 : 0;
        return (
          <div key={r.id} className="grid grid-cols-[1.4fr_1.4fr_0.9fr_0.7fr] gap-2 px-4 py-3 border-b border-[#f3f3f3] items-center text-[13px]">
            <b className="truncate">{r.name}</b>
            <span className="text-stone-500 truncate">{r.dealTitle}</span>
            <span className="text-right font-semibold">{eur(r.amount)}</span>
            <span className="text-right text-stone-500">{quota.toFixed(1)}%</span>
          </div>
        );
      })}
      <div className="flex items-center justify-between px-4 py-3 bg-[#fafafa] text-[13px] font-bold">
        <span>Totale ({rows.length})</span><span>{eur(total)}</span>
      </div>
    </div>
  );
};

/* ---------- Empty ---------- */
const Empty: React.FC<{ onNew?: () => void }> = ({ onNew }) => (
  <div className="bg-white border border-[#e2e2e2] rounded-[24px] p-10 text-center">
    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4338ca] flex items-center justify-center mx-auto mb-3"><Gem className="w-6 h-6" /></div>
    <b className="block text-[16px]">Nessuna operazione immobiliare</b>
    <p className="text-[13px] text-stone-500 mt-1.5 max-w-[420px] mx-auto">Crea la prima operazione Unico: acquisto, ristrutturazione e rivendita con investitori.</p>
    {onNew && (
      <button onClick={onNew} className="inline-flex items-center gap-1.5 bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold text-[13px] h-10 px-5 rounded-xl border-none cursor-pointer mt-4">
        <Plus className="w-4 h-4" /> Nuova operazione
      </button>
    )}
  </div>
);

/* ---------- Modale dettaglio/edit ---------- */
const TYPES = ['Trullo', 'Masseria', 'Villa', 'Palazzo', 'Appartamento', 'Attico', 'Corte', 'Terreno', 'Altro'];

const DealModal: React.FC<{
  deal: UnicoDeal; projects: Project[]; canEdit: boolean;
  onClose: () => void; onSave: (d: UnicoDeal) => void;
}> = ({ deal, projects, canEdit, onClose, onSave }) => {
  const [d, setD] = useState<UnicoDeal>({ ...deal, investors: deal.investors || [] });
  const [invName, setInvName] = useState('');
  const [invAmount, setInvAmount] = useState('');

  const set = (patch: Partial<UnicoDeal>) => setD((p) => ({ ...p, ...patch }));
  const num = (v: string) => (v === '' ? 0 : Number(v));

  const addInvestor = () => {
    if (!invName.trim() || !invAmount) return;
    const inv: UnicoInvestor = { id: `inv-${Date.now()}`, name: invName.trim(), amount: Number(invAmount), at: Date.now() };
    set({ investors: [...(d.investors || []), inv] });
    setInvName(''); setInvAmount('');
  };
  const removeInvestor = (id: string) => set({ investors: (d.investors || []).filter((i) => i.id !== id) });

  const raised = raisedOf(d);
  const fundedPct = d.capitalGoal ? Math.min(100, Math.round((raised / d.capitalGoal) * 100)) : 0;
  const unicoProjects = projects.filter((p) => p.division === 'unico' || p.division === 'materico');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <motion.div initial={{ y: 30, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }} onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-[680px] max-h-[92vh] overflow-y-auto rounded-t-[26px] sm:rounded-[26px] shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ececec] sticky top-0 bg-white z-10">
          <b className="text-[16px] tracking-tight">{deal.title ? deal.title : 'Nuova operazione'}</b>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500"><X className="w-4.5 h-4.5" /></button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldEl label="Titolo" full>
              <input className={IN} value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Es. Masseria Lucia" disabled={!canEdit} />
            </FieldEl>
            <FieldEl label="Tipologia">
              <select className={IN} value={d.type} onChange={(e) => set({ type: e.target.value })} disabled={!canEdit}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FieldEl>
            <FieldEl label="Località">
              <input className={IN} value={d.location} onChange={(e) => set({ location: e.target.value })} placeholder="Es. Cisternino (BR)" disabled={!canEdit} />
            </FieldEl>
            <FieldEl label="Stato" full>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_ORDER.map((s) => (
                  <button key={s} disabled={!canEdit} onClick={() => set({ status: s })}
                    className={`text-[11.5px] font-bold px-3 py-1.5 rounded-full border cursor-pointer ${d.status === s ? STATUS[s].cls : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}>
                    {STATUS[s].label}
                  </button>
                ))}
              </div>
            </FieldEl>
          </div>

          {/* Numeri operazione */}
          <div className="border-t border-[#ececec] pt-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> Economics</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <FieldEl label="Acquisto €"><input type="number" className={IN} value={d.acquisitionCost || ''} onChange={(e) => set({ acquisitionCost: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
              <FieldEl label="Ristrutt. €"><input type="number" className={IN} value={d.renovationBudget || ''} onChange={(e) => set({ renovationBudget: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
              <FieldEl label="Vendita €"><input type="number" className={IN} value={d.targetSalePrice || ''} onChange={(e) => set({ targetSalePrice: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
              <FieldEl label="Capitale obiettivo €"><input type="number" className={IN} value={d.capitalGoal || ''} onChange={(e) => set({ capitalGoal: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-[12.5px]">
              <span className="flex items-center gap-1.5 font-semibold"><TrendingUp className="w-4 h-4 text-emerald-600" /> Profitto atteso: <b>{eur(profitOf(d))}</b></span>
              <span className="flex items-center gap-1.5 font-semibold"><Percent className="w-4 h-4 text-[#4338ca]" /> Margine: <b style={{ color: marginOf(d) >= 0 ? '#059669' : '#dc2626' }}>{marginOf(d).toFixed(1)}%</b></span>
            </div>
          </div>

          {/* Parametri vetrina */}
          <div className="border-t border-[#ececec] pt-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Parametri vetrina (investitori)</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <FieldEl label="Quota minima €"><input type="number" className={IN} value={d.minInvestment || ''} onChange={(e) => set({ minInvestment: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
              <FieldEl label="ROI atteso %/anno"><input type="number" className={IN} value={d.targetRoi || ''} onChange={(e) => set({ targetRoi: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
              <FieldEl label="Durata (mesi)"><input type="number" className={IN} value={d.durationMonths || ''} onChange={(e) => set({ durationMonths: num(e.target.value) })} disabled={!canEdit} /></FieldEl>
            </div>
            <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
              <input type="checkbox" checked={!!d.published} onChange={(e) => set({ published: e.target.checked })} disabled={!canEdit} className="w-4 h-4 accent-[#4338ca]" />
              <span className="text-[12.5px] text-stone-600">Pubblica nella vetrina Unico (visibile ai clienti)</span>
            </label>
          </div>

          {/* Commessa Materico collegata */}
          <FieldEl label="Commessa collegata (ristrutturazione)" full>
            <select className={IN} value={d.matericoProjectId || ''} onChange={(e) => set({ matericoProjectId: e.target.value || null })} disabled={!canEdit}>
              <option value="">— Nessuna —</option>
              {unicoProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FieldEl>

          {/* Investitori */}
          <div className="border-t border-[#ececec] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 flex items-center gap-1.5"><PiggyBank className="w-3.5 h-3.5" /> Investitori</span>
              <span className="text-[12px] font-bold text-[#4338ca]">{eur(raised)} / {eur(d.capitalGoal)} · {fundedPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#eee] rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full" style={{ width: `${fundedPct}%`, background: '#4338ca' }} />
            </div>

            <div className="flex flex-col gap-2 mt-3">
              {(d.investors || []).map((i) => (
                <div key={i.id} className="flex items-center gap-2 bg-[#fafafa] border border-[#ececec] rounded-xl px-3 py-2">
                  <Users className="w-4 h-4 text-stone-400 shrink-0" />
                  <b className="text-[13px] flex-1 truncate">{i.name}</b>
                  <span className="text-[13px] font-semibold">{eur(i.amount)}</span>
                  {canEdit && <button onClick={() => removeInvestor(i.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center"><X className="w-4 h-4" /></button>}
                </div>
              ))}
              {(d.investors || []).length === 0 && <span className="text-[12.5px] italic text-stone-400">Nessun investitore.</span>}
            </div>

            {canEdit && (
              <div className="flex items-center gap-2 mt-3">
                <input className={`${IN} flex-1`} value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="Nome investitore" />
                <input type="number" className={`${IN} w-32`} value={invAmount} onChange={(e) => setInvAmount(e.target.value)} placeholder="€" />
                <button onClick={addInvestor} className="h-10 px-3 rounded-lg bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] border-none cursor-pointer flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Aggiungi
                </button>
              </div>
            )}
          </div>

          <FieldEl label="Note" full>
            <textarea className={`${IN} h-auto py-2 min-h-[64px]`} value={d.notes || ''} onChange={(e) => set({ notes: e.target.value })} disabled={!canEdit} placeholder="Annotazioni interne sull'operazione…" />
          </FieldEl>
        </div>

        {canEdit && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#ececec] sticky bottom-0 bg-white">
            <button onClick={onClose} className="h-10 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#161616] font-bold text-[13px] border-none cursor-pointer">Annulla</button>
            <button onClick={() => onSave(d)} disabled={!d.title.trim()} className="h-10 px-5 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold text-[13px] border-none cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
              <ArrowUpRight className="w-4 h-4" /> Salva operazione
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const FieldEl: React.FC<{ label: string; children: React.ReactNode; full?: boolean }> = ({ label, children, full }) => (
  <div className={`flex flex-col gap-1 ${full ? 'col-span-2 sm:col-span-4' : ''}`}>
    <label className="text-[11px] font-bold text-[#555]">{label}</label>
    {children}
  </div>
);
