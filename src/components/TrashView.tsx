/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TrashView — Cestino condiviso (nodo trash/<id>).
 * Gli elementi eliminati da ogni sezione restano qui 60 giorni (purge automatico
 * in App), con ripristino al volo o eliminazione definitiva (doppia conferma).
 */
import React, { useMemo, useState } from 'react';
import { Trash2, RotateCcw, Clock } from 'lucide-react';
import { TrashItem } from '../types';

export const TRASH_RETENTION_DAYS = 60;

/** Etichette leggibili delle sezioni di provenienza. */
const SECTION_LABEL: Record<string, string> = {
  progetti: 'Progetti',
  task: 'Agenda & Task',
  preventivi: 'Preventivi & Parcelle',
  fatture_attive: 'Fatture attive',
  fatture_passive: 'Fatture passive',
  scadenze: 'Scadenziario',
  movimenti: 'Movimenti',
  documenti: 'Documenti',
  arredi: 'Arredi & Moodboard',
  appuntamenti: 'Appuntamenti',
  materico: 'Richieste Materico',
  estimates: 'Preventivi Materico',
  rubrica: 'Rubrica clienti',
  crm_lead: 'CRM — Lead',
  crm_supplier: 'CRM — Fornitori',
  unico: 'Unico — Operazioni',
  cantieri: 'Cantieri',
  cantiere: 'Cantiere — voci',
  impresa: 'Area Impresa',
  ferie: 'Ferie & assenze'
};

export const sectionLabel = (s: string) => SECTION_LABEL[s] || s;

const fmtWhen = (t: number) =>
  new Date(t).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

const daysLeft = (deletedAt: number) =>
  Math.max(0, TRASH_RETENTION_DAYS - Math.floor((Date.now() - deletedAt) / 86400000));

interface TrashViewProps {
  trash: Record<string, TrashItem>;
  onRestore: (item: TrashItem) => void;
  onDeleteForever: (item: TrashItem) => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ trash, onRestore, onDeleteForever }) => {
  const [section, setSection] = useState<string>('tutti');

  const all = useMemo(() => Object.values(trash).sort((a, b) => b.deletedAt - a.deletedAt), [trash]);
  const sections = useMemo(() => Array.from(new Set(all.map((t) => t.section))), [all]);
  const list = section === 'tutti' ? all : all.filter((t) => t.section === section);

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[22px] font-black tracking-tight text-[#161616] leading-none flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Cestino
          </h2>
          <p className="text-[12.5px] text-[#8a8a8a] font-semibold mt-1.5">
            Gli elementi eliminati restano qui {TRASH_RETENTION_DAYS} giorni, poi vengono rimossi definitivamente in automatico.
          </p>
        </div>
        <span className="text-[11px] font-extrabold text-[#161616] bg-[#f0f0f0] border border-[#e2e2e2] px-3 py-1.5 rounded-full">
          {all.length} {all.length === 1 ? 'elemento' : 'elementi'}
        </span>
      </div>

      {/* Barra sezioni (pillole, come le altre sezioni) */}
      {sections.length > 0 && (
        <div className="flex items-center bg-[#f0f0f0] border border-[#e2e2e2] p-[3px] rounded-full gap-[2px] flex-wrap w-fit max-w-full">
          {['tutti', ...sections].map((s) => {
            const active = section === s;
            return (
              <button
                key={s}
                onClick={() => setSection(s)}
                className={`text-[12px] font-bold px-3.5 py-1.5 rounded-full cursor-pointer border-none transition-all whitespace-nowrap ${
                  active ? 'bg-[#161616] text-white shadow-xs font-extrabold' : 'text-[#8a8a8a] bg-transparent hover:text-[#161616]'
                }`}
              >
                {s === 'tutti' ? 'Tutti' : sectionLabel(s)}
              </button>
            );
          })}
        </div>
      )}

      {/* Lista */}
      {list.length === 0 ? (
        <div className="bg-white border border-dashed border-[#e2e2e2] rounded-[24px] p-10 text-center">
          <Trash2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[13.5px] text-[#8a8a8a] font-semibold">Il cestino è vuoto.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {list.map((t) => {
            const left = daysLeft(t.deletedAt);
            return (
              <div key={t.id} className="bg-white border border-[#e2e2e2] rounded-[22px] p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#f0f0f0] text-[#6b6b6b] px-2 py-0.5 rounded-full">
                      {sectionLabel(t.section)}
                    </span>
                    <b className="text-[13.5px] font-extrabold text-[#161616] truncate">{t.label}</b>
                  </div>
                  <div className="text-[11.5px] text-[#8a8a8a] mt-1 flex items-center gap-2 flex-wrap">
                    <span>Eliminato il {fmtWhen(t.deletedAt)}{t.deletedByName ? ` da ${t.deletedByName}` : ''}</span>
                    {t.detail && <span>· {t.detail}</span>}
                    <span className={`inline-flex items-center gap-1 font-bold ${left <= 7 ? 'text-rose-600' : 'text-[#8a8a8a]'}`}>
                      <Clock className="w-3 h-3" /> {left === 0 ? 'in eliminazione' : `${left} ${left === 1 ? 'giorno' : 'giorni'} rimasti`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onRestore(t)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161616] hover:bg-black text-white text-[12px] font-bold cursor-pointer border-none transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Ripristina
                  </button>
                  <button
                    onClick={() => onDeleteForever(t)}
                    className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-600 cursor-pointer transition-colors"
                    title="Elimina definitivamente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
