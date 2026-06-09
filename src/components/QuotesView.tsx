/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * QuotesView — Preventivi & Amministrazione (studio).
 * Registro preventivi con macro-voci, stati, piano pagamenti (acconto/rate/saldo) e
 * collegamento a fatturazione/incassi (le rate "emesse" generano fattura attiva + scadenza in Finanze).
 */
import React, { useMemo, useState } from 'react';
import {
  FileSignature, Plus, X, Trash2, Euro, CheckCircle2, Clock, Send, Receipt, ChevronDown, ChevronUp
} from 'lucide-react';
import { Quote, QuoteLine, QuoteMacro, PaymentMilestone, ClientRecord, Project } from '../types';
import { eur } from '../utils';

const MACRO_LABEL: Record<QuoteMacro, string> = {
  progettazione: 'Progettazione', consulenza: 'Consulenza', opere_edili: 'Opere edili',
  impiantistica: 'Impiantistica', materiali: 'Materiali', altro: 'Altro'
};
const STATUS_LABEL: Record<Quote['status'], string> = {
  elaborato: 'Elaborato', in_attesa: 'In attesa', accettato: 'Accettato', rifiutato: 'Rifiutato'
};
const STATUS_STYLE: Record<Quote['status'], string> = {
  elaborato: 'bg-[#f1f1f1] text-[#6b6b6b]', in_attesa: 'bg-amber-50 text-amber-700',
  accettato: 'bg-emerald-50 text-emerald-700', rifiutato: 'bg-rose-50 text-rose-700'
};
const newId = (p: string) => `${p}-${Date.now()}-${Math.floor(Math.random() * 900)}`;
const num = (v: any) => Number(String(v).replace(',', '.')) || 0;

interface QuotesViewProps {
  quotes: Record<string, Quote>;
  clients: Record<string, ClientRecord>;
  projects: Project[];
  myUid: string;
  onSaveQuote: (q: Quote) => void;
  onDeleteQuote: (id: string) => void;
  onSetStatus: (id: string, status: Quote['status']) => void;
  onEmitMilestone: (quoteId: string, milestoneId: string) => void;
}

const emptyDraft = (): Quote => ({
  id: newId('qt'), number: '', clientRecordId: null, clientName: '', projectId: null,
  division: 'studio', status: 'elaborato', lines: [], total: 0, paymentPlan: [], validUntil: null, notes: null,
  createdAt: Date.now()
});

export const QuotesView: React.FC<QuotesViewProps> = ({ quotes, clients, projects, myUid, onSaveQuote, onDeleteQuote, onSetStatus, onEmitMilestone }) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Quote>(emptyDraft());
  const [filter, setFilter] = useState<'all' | Quote['status']>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = useMemo(() => Object.values(quotes)
    .filter((q) => filter === 'all' || q.status === filter)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), [quotes, filter]);

  const kpi = useMemo(() => {
    const all = Object.values(quotes);
    const tot = all.reduce((s, q) => s + (q.total || 0), 0);
    const accepted = all.filter((q) => q.status === 'accettato');
    const acceptedTot = accepted.reduce((s, q) => s + (q.total || 0), 0);
    return { count: all.length, tot, acceptedCount: accepted.length, acceptedTot };
  }, [quotes]);

  const openNew = () => { setDraft(emptyDraft()); setEditorOpen(true); };
  const openEdit = (q: Quote) => { setDraft({ ...q, lines: [...(q.lines || [])], paymentPlan: [...(q.paymentPlan || [])] }); setEditorOpen(true); };

  const draftTotal = (draft.lines || []).reduce((s, l) => s + (l.amount || 0), 0);

  const save = () => {
    if (!draft.number.trim() || !draft.clientName.trim()) return;
    onSaveQuote({ ...draft, total: draftTotal, createdBy: draft.createdBy || myUid });
    setEditorOpen(false);
  };

  // -- line ops --
  const addLine = () => setDraft((d) => ({ ...d, lines: [...(d.lines || []), { id: newId('ln'), macro: 'progettazione', desc: '', qty: 1, unitPrice: 0, amount: 0 }] }));
  const updLine = (id: string, patch: Partial<QuoteLine>) => setDraft((d) => ({
    ...d, lines: (d.lines || []).map((l) => {
      if (l.id !== id) return l;
      const nl = { ...l, ...patch };
      nl.amount = num(nl.qty) * num(nl.unitPrice);
      return nl;
    })
  }));
  const delLine = (id: string) => setDraft((d) => ({ ...d, lines: (d.lines || []).filter((l) => l.id !== id) }));

  // -- payment plan ops --
  const addMilestone = () => setDraft((d) => ({ ...d, paymentPlan: [...(d.paymentPlan || []), { id: newId('ms'), label: 'Rata', percent: null, amount: 0, dueDate: null, status: 'da_emettere', invoiceId: null }] }));
  const updMilestone = (id: string, patch: Partial<PaymentMilestone>) => setDraft((d) => ({
    ...d, paymentPlan: (d.paymentPlan || []).map((m) => {
      if (m.id !== id) return m;
      const nm = { ...m, ...patch };
      if (patch.percent != null) nm.amount = Math.round(draftTotal * (num(patch.percent) / 100) * 100) / 100;
      return nm;
    })
  }));
  const delMilestone = (id: string) => setDraft((d) => ({ ...d, paymentPlan: (d.paymentPlan || []).filter((m) => m.id !== id) }));

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] leading-none flex items-center gap-2">
            <FileSignature className="w-5 h-5" /> Preventivi
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1.5">Registro preventivi con macro-voci, stati e piano pagamenti collegato alla fatturazione.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white text-[13px] font-bold cursor-pointer border-none">
          <Plus className="w-4 h-4" /> Nuovo preventivo
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Preventivi" value={String(kpi.count)} />
        <Kpi label="Valore totale" value={eur(kpi.tot)} />
        <Kpi label="Accettati" value={String(kpi.acceptedCount)} />
        <Kpi label="Valore accettato" value={eur(kpi.acceptedTot)} accent />
      </div>

      {/* Filtri stato */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {([['all', 'Tutti'], ['elaborato', 'Elaborato'], ['in_attesa', 'In attesa'], ['accettato', 'Accettato'], ['rifiutato', 'Rifiutato']] as const).map(([id, lbl]) => (
          <button key={id} onClick={() => setFilter(id as any)} className={`text-[11.5px] font-bold px-3 py-1 rounded-full border ${filter === id ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#6b6b6b] border-[#e2e2e2]'}`}>{lbl}</button>
        ))}
      </div>

      {/* Lista */}
      {list.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
          <FileSignature className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[13.5px] text-[#8a8a8a] font-semibold">Nessun preventivo. Creane uno con "Nuovo preventivo".</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {list.map((q) => {
            const open = expanded === q.id;
            const plan = q.paymentPlan || [];
            const fatturato = plan.filter((m) => m.status !== 'da_emettere').reduce((s, m) => s + m.amount, 0);
            return (
              <div key={q.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-extrabold text-[#161616]">{q.number || '(senza numero)'}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_STYLE[q.status]}`}>{STATUS_LABEL[q.status]}</span>
                    </div>
                    <div className="text-[12px] text-[#8a8a8a] mt-0.5">{q.clientName} · {eur(q.total)}{plan.length > 0 ? ` · fatturato ${eur(fatturato)}/${eur(q.total)}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select value={q.status} onChange={(e) => onSetStatus(q.id, e.target.value as Quote['status'])} className="px-2.5 py-1.5 rounded-xl border border-[#e2e2e2] text-[12px] font-bold outline-none">
                      {(['elaborato', 'in_attesa', 'accettato', 'rifiutato'] as Quote['status'][]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                    <button onClick={() => setExpanded(open ? null : q.id)} className="w-8 h-8 rounded-xl border border-[#e2e2e2] flex items-center justify-center text-[#6b6b6b]">{open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                    <button onClick={() => openEdit(q)} className="px-3 py-1.5 rounded-xl bg-[#161616] text-white text-[12px] font-bold">Modifica</button>
                    <button onClick={() => { if (confirm('Eliminare il preventivo?')) onDeleteQuote(q.id); }} className="w-8 h-8 rounded-xl border border-[#e2e2e2] flex items-center justify-center text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {open && (
                  <div className="mt-3 pt-3 border-t border-[#f2f2f2] flex flex-col gap-3">
                    {/* righe */}
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Voci</span>
                      <div className="mt-1.5 flex flex-col gap-1">
                        {(q.lines || []).map((l) => (
                          <div key={l.id} className="flex items-center justify-between gap-2 text-[12.5px] px-3 py-1.5 rounded-lg bg-[#fafafa] border border-[#f0f0f0]">
                            <span className="truncate"><span className="text-[10px] font-bold uppercase text-[#9a9a9a] mr-2">{MACRO_LABEL[l.macro]}</span>{l.desc}</span>
                            <span className="font-bold shrink-0">{eur(l.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* piano pagamenti */}
                    {plan.length > 0 && (
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Piano pagamenti</span>
                        <div className="mt-1.5 flex flex-col gap-1">
                          {plan.map((m) => (
                            <div key={m.id} className="flex items-center justify-between gap-2 text-[12.5px] px-3 py-1.5 rounded-lg border border-[#f0f0f0]">
                              <span className="truncate">{m.label}{m.dueDate ? ` · ${m.dueDate}` : ''}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-bold">{eur(m.amount)}</span>
                                {m.status === 'da_emettere' ? (
                                  <button onClick={() => onEmitMilestone(q.id, m.id)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"><Receipt className="w-3.5 h-3.5" /> Emetti</button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700">{m.status === 'incassato' ? 'Incassato' : 'Fatturato'}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {q.notes && <p className="text-[12px] text-[#6b6b6b] italic">{q.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* EDITOR */}
      {editorOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditorOpen(false)}>
          <div className="bg-white rounded-[24px] w-full max-w-[640px] max-h-[88vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-black text-[#161616]">{quotes[draft.id] ? 'Modifica preventivo' : 'Nuovo preventivo'}</h3>
              <button onClick={() => setEditorOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <L label="Numero *"><input value={draft.number} onChange={(e) => setDraft((d) => ({ ...d, number: e.target.value }))} placeholder="PRV-2026-001" className="qi font-mono" /></L>
                <L label="Validità (fino al)"><input type="date" value={draft.validUntil || ''} onChange={(e) => setDraft((d) => ({ ...d, validUntil: e.target.value || null }))} className="qi" /></L>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <L label="Cliente (rubrica)">
                  <select value={draft.clientRecordId || ''} onChange={(e) => { const c = clients[e.target.value]; setDraft((d) => ({ ...d, clientRecordId: e.target.value || null, clientName: c ? c.name : d.clientName })); }} className="qi">
                    <option value="">— seleziona / digita sotto —</option>
                    {Object.values(clients).sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </L>
                <L label="Nome cliente *"><input value={draft.clientName} onChange={(e) => setDraft((d) => ({ ...d, clientName: e.target.value }))} className="qi" /></L>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <L label="Divisione">
                  <select value={draft.division} onChange={(e) => setDraft((d) => ({ ...d, division: e.target.value as any }))} className="qi font-bold">
                    <option value="studio">Studio</option><option value="strategico">Strategico</option><option value="materico">Materico</option><option value="unico">Unico</option>
                  </select>
                </L>
                <L label="Collega progetto">
                  <select value={draft.projectId || ''} onChange={(e) => setDraft((d) => ({ ...d, projectId: e.target.value || null }))} className="qi">
                    <option value="">— nessuno —</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </L>
              </div>

              {/* righe macro-voci */}
              <div className="border border-[#eee] rounded-2xl p-3 bg-[#fafafa]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Voci per macro-categoria</span>
                  <button onClick={addLine} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#161616]"><Plus className="w-3.5 h-3.5" /> Riga</button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {(draft.lines || []).map((l) => (
                    <div key={l.id} className="flex items-center gap-1.5">
                      <select value={l.macro} onChange={(e) => updLine(l.id, { macro: e.target.value as QuoteMacro })} className="qi w-[120px] text-[11.5px]">
                        {(Object.keys(MACRO_LABEL) as QuoteMacro[]).map((m) => <option key={m} value={m}>{MACRO_LABEL[m]}</option>)}
                      </select>
                      <input value={l.desc} onChange={(e) => updLine(l.id, { desc: e.target.value })} placeholder="Descrizione" className="qi flex-1" />
                      <input value={l.qty} onChange={(e) => updLine(l.id, { qty: num(e.target.value) })} title="Qtà" className="qi w-14 text-center" />
                      <input value={l.unitPrice} onChange={(e) => updLine(l.id, { unitPrice: num(e.target.value) })} title="Prezzo unit." className="qi w-20 text-right" />
                      <span className="w-20 text-right text-[12px] font-bold shrink-0">{eur(l.amount)}</span>
                      <button onClick={() => delLine(l.id)} className="text-rose-600 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  {(draft.lines || []).length === 0 && <p className="text-[12px] italic text-[#9a9a9a]">Nessuna voce.</p>}
                </div>
                <div className="flex justify-end mt-2 pt-2 border-t border-[#eee] text-[13px] font-black text-[#161616]">Totale: {eur(draftTotal)}</div>
              </div>

              {/* piano pagamenti */}
              <div className="border border-[#eee] rounded-2xl p-3 bg-[#fafafa]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a9a9a]">Piano pagamenti (acconto / rate / saldo)</span>
                  <button onClick={addMilestone} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#161616]"><Plus className="w-3.5 h-3.5" /> Rata</button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {(draft.paymentPlan || []).map((m) => (
                    <div key={m.id} className="flex items-center gap-1.5">
                      <input value={m.label} onChange={(e) => updMilestone(m.id, { label: e.target.value })} placeholder="Acconto / Saldo…" className="qi flex-1" />
                      <input value={m.percent ?? ''} onChange={(e) => updMilestone(m.id, { percent: e.target.value ? num(e.target.value) : null })} placeholder="%" title="% del totale" className="qi w-14 text-center" />
                      <input value={m.amount} onChange={(e) => updMilestone(m.id, { amount: num(e.target.value) })} title="Importo" className="qi w-24 text-right" />
                      <input type="date" value={m.dueDate || ''} onChange={(e) => updMilestone(m.id, { dueDate: e.target.value || null })} className="qi w-[140px]" />
                      <button onClick={() => delMilestone(m.id)} className="text-rose-600 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  {(draft.paymentPlan || []).length === 0 && <p className="text-[12px] italic text-[#9a9a9a]">Nessuna rata. Aggiungi acconto/rate/saldo.</p>}
                </div>
              </div>

              <L label="Note"><textarea value={draft.notes || ''} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value || null }))} rows={2} className="qi resize-none" /></L>

              <button onClick={save} disabled={!draft.number.trim() || !draft.clientName.trim()} className="mt-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] disabled:opacity-40 border-none cursor-pointer">Salva preventivo</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.qi{height:36px;border:1px solid #e2e2e2;border-radius:10px;padding:0 10px;font-size:12.5px;background:#fff;outline:none}.qi:focus{border-color:#161616}textarea.qi{height:auto;padding:8px 10px}`}</style>
    </div>
  );
};

const L: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">{label}</span>
    {children}
  </label>
);
const Kpi: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div className={`rounded-2xl p-3.5 border ${accent ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white border-[#e2e2e2]'}`}>
    <div className={`text-[10px] font-bold uppercase tracking-wider ${accent ? 'text-white/60' : 'text-[#9a9a9a]'}`}>{label}</div>
    <div className="text-[18px] font-black mt-0.5">{value}</div>
  </div>
);
