/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ServicesShowcase — sezione "Scopri i servizi" del portale cliente.
 * Pagine VETRINA per Studio / Materico / Strategico / Unico, accanto ai
 * progetti personali. Unico include la vetrina degli immobili in cui investire
 * (dati fittizi, vedi src/showcaseData.ts).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, ArrowRight, LogOut, Briefcase, Check, MapPin, TrendingUp, Clock,
  Users, Coins, Building2, Hammer, Megaphone, Gem, Sparkles, X, CheckCircle2
} from 'lucide-react';
import type { UserProfile } from '../types';
import {
  SHOWCASE_SERVICES, UNICO_PROPERTIES, type ServiceKey, type InvestProperty, type PropertyStatus,
} from '../showcaseData';
import { eur } from '../utils';

const ICONS: Record<ServiceKey, React.ComponentType<any>> = {
  studio: Building2, materico: Hammer, strategico: Megaphone, unico: Gem,
};

const STATUS_META: Record<PropertyStatus, { label: string; cls: string }> = {
  aperto: { label: 'Raccolta aperta', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_corso: { label: 'In corso', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  completato: { label: 'Concluso', cls: 'bg-stone-100 text-stone-600 border-stone-200' },
  in_arrivo: { label: 'In arrivo', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

interface ShowcaseProps {
  profile: UserProfile;
  onBack: () => void;
  onLogout: () => void;
}

export const ServicesShowcase: React.FC<ShowcaseProps> = ({ profile, onBack, onLogout }) => {
  const [view, setView] = useState<'hub' | ServiceKey>('hub');
  const [selected, setSelected] = useState<InvestProperty | null>(null);

  const service = view !== 'hub' ? SHOWCASE_SERVICES.find((s) => s.key === view)! : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F3] text-[#161616] font-sans select-none pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-[#e5e5e5] sticky top-0 z-[45]">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-[20px] tracking-tight">
            Onirico<span className="opacity-60 font-normal"> · Servizi</span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="bg-[#1b1b1b] hover:bg-black text-white font-extrabold text-xs py-1.5 px-3.5 rounded-xl border-none flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Briefcase className="w-3.5 h-3.5" /> I miei progetti
          </button>
          <button
            onClick={onLogout}
            className="bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#161616] font-extrabold text-xs py-1.5 px-3.5 rounded-xl border-none flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" /> Esci
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-[1080px] mx-auto w-full p-4 md:p-6 text-left">
        {view === 'hub' && <Hub profile={profile} onOpen={(k) => { setView(k); setSelected(null); }} />}

        {service && service.key !== 'unico' && (
          <ServicePage service={service} onBack={() => setView('hub')} />
        )}

        {view === 'unico' && (
          <UnicoVetrina
            onBackHub={() => setView('hub')}
            onOpenProperty={(p) => setSelected(p)}
          />
        )}
      </div>

      <AnimatePresence>
        {selected && <PropertyDetail property={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
};

/* ---------------- HUB ---------------- */
const Hub: React.FC<{ profile: UserProfile; onOpen: (k: ServiceKey) => void }> = ({ profile, onOpen }) => (
  <>
    <div className="mt-2 mb-7">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-stone-500">
        <Sparkles className="w-3.5 h-3.5" /> Scopri i servizi Onirico
      </span>
      <h1 className="font-serif text-[clamp(28px,5vw,40px)] tracking-tight mt-3 leading-tight">
        Molto più del tuo progetto, {profile.firstName || profile.name.split(' ')[0]}.
      </h1>
      <p className="text-[14px] text-stone-600 mt-2 max-w-[640px] leading-relaxed">
        Esplora tutti i mondi Onirico: dall’architettura alle finiture, dal marketing
        agli investimenti immobiliari. Tutto a portata di portale.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {SHOWCASE_SERVICES.map((s, i) => {
        const Icon = ICONS[s.key];
        return (
          <motion.button
            key={s.key}
            onClick={() => onOpen(s.key)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="group text-left bg-white border border-[#e6e6e6] rounded-[26px] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="h-36 w-full overflow-hidden relative">
              <img src={s.image} alt={s.name} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
              <div className="absolute left-4 bottom-3 flex items-center gap-2 text-white">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.color }}>
                  <Icon className="w-4 h-4" />
                </span>
                <b className="text-[18px] tracking-tight drop-shadow">{s.name}</b>
              </div>
            </div>
            <div className="p-5">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-stone-400">{s.tagline}</span>
              <p className="text-[13.5px] text-stone-600 mt-1.5 leading-relaxed">{s.intro}</p>
              <span className="inline-flex items-center gap-1 text-[12.5px] font-bold mt-3 group-hover:gap-2 transition-all" style={{ color: s.color }}>
                {s.cta} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  </>
);

/* ---------------- PAGINA SERVIZIO (studio/materico/strategico) ---------------- */
const ServicePage: React.FC<{ service: typeof SHOWCASE_SERVICES[number]; onBack: () => void }> = ({ service, onBack }) => {
  const [sent, setSent] = useState(false);
  const Icon = ICONS[service.key];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <button onClick={onBack} className="flex items-center gap-1 text-[12.5px] font-bold text-stone-500 hover:text-[#161616] mb-4">
        <ArrowLeft className="w-4 h-4" /> Tutti i servizi
      </button>

      <div className="bg-white border border-[#e6e6e6] rounded-[28px] overflow-hidden">
        <div className="h-52 md:h-64 w-full relative overflow-hidden">
          <img src={service.image} alt={service.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-black/10" />
          <div className="absolute left-6 bottom-5 text-white">
            <span className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: service.color }}><Icon className="w-4 h-4" /></span>
              {service.tagline}
            </span>
            <h1 className="font-serif text-[34px] tracking-tight mt-2 drop-shadow">{service.name}</h1>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <p className="text-[15px] text-stone-700 leading-relaxed max-w-[680px]">{service.intro}</p>

          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {service.bullets.map((b) => (
              <div key={b} className="flex items-start gap-2.5 bg-[#fafafa] border border-[#ececec] rounded-2xl p-3.5">
                <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: service.color }}>
                  <Check className="w-3 h-3" />
                </span>
                <span className="text-[13.5px] text-stone-700">{b}</span>
              </div>
            ))}
          </div>

          {/* CTA interesse */}
          <div className="mt-7 border-t border-[#ececec] pt-6">
            {sent ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-[13.5px] font-semibold">Richiesta inviata! Un consulente Onirico ti contatterà a breve.</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <b className="block text-[15px]">Interessato a {service.name}?</b>
                  <span className="text-[13px] text-stone-500">Lasciaci un contatto, pensiamo a tutto noi.</span>
                </div>
                <button
                  onClick={() => setSent(true)}
                  className="flex items-center justify-center gap-2 rounded-xl text-white font-bold text-[14px] h-11 px-6 transition active:scale-[0.98] shrink-0"
                  style={{ background: service.color }}
                >
                  {service.cta} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ---------------- VETRINA UNICO (immobili) ---------------- */
const UnicoVetrina: React.FC<{ onBackHub: () => void; onOpenProperty: (p: InvestProperty) => void }> = ({ onBackHub, onOpenProperty }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <button onClick={onBackHub} className="flex items-center gap-1 text-[12.5px] font-bold text-stone-500 hover:text-[#161616] mb-4">
      <ArrowLeft className="w-4 h-4" /> Tutti i servizi
    </button>

    <div className="flex items-center gap-3 mb-1">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: '#4338ca' }}>
        <Gem className="w-5 h-5" />
      </span>
      <div>
        <h1 className="font-serif text-[30px] tracking-tight leading-none">Investi con Unico</h1>
        <span className="text-[12px] font-bold uppercase tracking-wide text-stone-400">Immobili di pregio in Puglia</span>
      </div>
    </div>
    <p className="text-[14px] text-stone-600 mt-3 max-w-[660px] leading-relaxed">
      Operazioni immobiliari selezionate e ristrutturate da Onirico. Entra come investitore
      a partire da piccole quote e segui il rendimento di ogni progetto.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {UNICO_PROPERTIES.map((p, i) => {
        const pct = p.goal ? Math.min(100, Math.round((p.raised / p.goal) * 100)) : 0;
        const st = STATUS_META[p.status];
        return (
          <motion.button
            key={p.id}
            onClick={() => onOpenProperty(p)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: i * 0.04 }}
            className="group text-left bg-white border border-[#e6e6e6] rounded-[24px] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col"
          >
            <div className="h-40 w-full overflow-hidden relative">
              <img src={p.image} alt={p.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <span className={`absolute top-3 left-3 text-[10.5px] font-bold px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
              <span className="absolute top-3 right-3 text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-white/90 text-[#161616] border border-white/60 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {p.targetRoi}% / anno
              </span>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <span className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{p.type}</span>
              <b className="block text-[16px] tracking-tight mt-0.5">{p.title}</b>
              <span className="flex items-center gap-1 text-[12px] text-stone-500 mt-1"><MapPin className="w-3.5 h-3.5" /> {p.location}</span>

              <div className="mt-3">
                <div className="h-1.5 w-full bg-[#eee] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#4338ca' }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5 font-semibold">
                  <span>{pct}% raccolto</span>
                  <span>{p.investors} investitori</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0f0f0]">
                <div>
                  <span className="block text-[10px] uppercase tracking-wide text-stone-400 font-bold">Quota minima</span>
                  <b className="text-[14px]">{eur(p.minInvestment)}</b>
                </div>
                <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#4338ca] group-hover:gap-2 transition-all">
                  Dettagli <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  </motion.div>
);

/* ---------------- DETTAGLIO IMMOBILE (modale) ---------------- */
const PropertyDetail: React.FC<{ property: InvestProperty; onClose: () => void }> = ({ property: p, onClose }) => {
  const [amount, setAmount] = useState<string>(String(p.minInvestment));
  const [sent, setSent] = useState(false);
  const pct = p.goal ? Math.min(100, Math.round((p.raised / p.goal) * 100)) : 0;
  const st = STATUS_META[p.status];
  const closed = p.status === 'completato';
  const soon = p.status === 'in_arrivo';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-[640px] max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] shadow-2xl"
      >
        <div className="h-56 w-full relative overflow-hidden">
          <img src={p.image} alt={p.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-[#161616]">
            <X className="w-4.5 h-4.5" />
          </button>
          <div className="absolute left-5 bottom-4 text-white">
            <span className={`inline-block text-[10.5px] font-bold px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
            <h2 className="font-serif text-[28px] tracking-tight mt-2 drop-shadow">{p.title}</h2>
            <span className="flex items-center gap-1 text-[12.5px] font-semibold mt-0.5"><MapPin className="w-3.5 h-3.5" /> {p.location}</span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-[14px] text-stone-700 leading-relaxed">{p.summary}</p>

          {/* Metriche */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
            <Metric icon={<TrendingUp className="w-4 h-4" />} label="Rendimento" value={`${p.targetRoi}%`} sub="atteso/anno" />
            <Metric icon={<Coins className="w-4 h-4" />} label="Quota minima" value={eur(p.minInvestment)} />
            <Metric icon={<Clock className="w-4 h-4" />} label="Durata" value={`${p.durationMonths} mesi`} />
            <Metric icon={<Users className="w-4 h-4" />} label="Investitori" value={String(p.investors)} />
          </div>

          {/* Avanzamento raccolta */}
          <div className="mt-5 bg-[#fafafa] border border-[#ececec] rounded-2xl p-4">
            <div className="flex items-center justify-between text-[12px] font-semibold text-stone-500">
              <span>Capitale raccolto</span>
              <span>{eur(p.raised)} / {eur(p.goal)}</span>
            </div>
            <div className="h-2 w-full bg-[#e8e8e8] rounded-full overflow-hidden mt-2">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#4338ca' }} />
            </div>
            <span className="text-[11px] font-bold text-[#4338ca] mt-1.5 inline-block">{pct}% completato</span>
          </div>

          {/* Highlights */}
          <div className="mt-5">
            <b className="text-[13px] uppercase tracking-wide text-stone-400">Punti di forza</b>
            <div className="grid sm:grid-cols-2 gap-2 mt-2.5">
              {p.highlights.map((h) => (
                <div key={h} className="flex items-start gap-2 text-[13px] text-stone-700">
                  <Check className="w-4 h-4 text-[#4338ca] mt-0.5 shrink-0" /> {h}
                </div>
              ))}
            </div>
          </div>

          {/* CTA investi / interesse */}
          <div className="mt-6 border-t border-[#ececec] pt-5">
            {sent ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-[13.5px] font-semibold">
                  {soon ? 'Ti avviseremo all’apertura della raccolta!' : 'Richiesta inviata! Un consulente Unico ti contatterà per finalizzare.'}
                </span>
              </div>
            ) : closed ? (
              <div className="text-center bg-stone-100 border border-stone-200 rounded-2xl p-4 text-stone-600 text-[13.5px] font-semibold">
                Operazione conclusa — raccolta non più disponibile.
              </div>
            ) : (
              <>
                {!soon && (
                  <div className="flex flex-col gap-1.5 mb-3">
                    <label className="text-[11.5px] font-bold text-[#555]">Quanto vuoi investire?</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold">€</span>
                      <input
                        type="number" min={p.minInvestment} step={1000}
                        value={amount} onChange={(e) => setAmount(e.target.value)}
                        className="input w-full h-11 pl-8 pr-3.5 text-[14px]"
                      />
                    </div>
                    <span className="text-[11px] text-stone-400">Quota minima {eur(p.minInvestment)}</span>
                  </div>
                )}
                <button
                  onClick={() => setSent(true)}
                  className="flex items-center justify-center gap-2 rounded-xl text-white font-bold text-[14px] h-12 w-full transition active:scale-[0.98]"
                  style={{ background: '#4338ca' }}
                >
                  {soon ? 'Avvisami all’apertura' : 'Manifesta interesse a investire'} <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-stone-400 text-center mt-2.5 leading-snug">
                  Nessun impegno: un consulente ti contatterà per illustrarti l’operazione.
                  Dati dimostrativi a scopo di valutazione.
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string }> = ({ icon, label, value, sub }) => (
  <div className="bg-[#fafafa] border border-[#ececec] rounded-2xl p-3">
    <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-stone-400">{icon}{label}</span>
    <b className="block text-[15px] mt-1 leading-none">{value}</b>
    {sub && <span className="text-[10.5px] text-stone-400">{sub}</span>}
  </div>
);
