/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dati VETRINA del portale cliente (pagine "scopri i servizi").
 * Contenuti dimostrativi — NON salvati su Firebase. Servono per far
 * navigare al cliente gli altri servizi Onirico oltre ai propri progetti.
 * Gli immobili Unico sono fittizi, pensati per testare la pagina investimenti.
 *
 * Qui vivono anche: la config della LANDING cinematica (pagina di login) e
 * il mapper deal→snapshot pubblico per il nodo `unicoShowcase`.
 */

import type { UnicoDeal, UnicoShowcaseEntry, UnicoShowcaseScene } from './types';

export type ServiceKey = 'studio' | 'materico' | 'strategico' | 'unico';

export interface ServiceShowcase {
  key: ServiceKey;
  name: string;
  color: string;
  tagline: string;
  intro: string;
  bullets: string[];
  image: string;
  cta: string;
}

export const SHOWCASE_SERVICES: ServiceShowcase[] = [
  {
    key: 'studio',
    name: 'Studio',
    color: '#161616',
    tagline: 'Architettura · Ingegneria',
    intro: 'Dal sopralluogo al collaudo: progettiamo e seguiamo ogni pratica edilizia, dando forma a spazi che parlano di te.',
    bullets: [
      'Progettazione architettonica e d’interni su misura',
      'Pratiche edilizie: CILA, SCIA, permessi di costruire',
      'Catasto, APE, accatastamenti e sanatorie',
      'Direzione lavori e sicurezza in cantiere',
    ],
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    cta: 'Richiedi una consulenza',
  },
  {
    key: 'materico',
    name: 'Materico',
    color: '#c2410c',
    tagline: 'Forniture & posa chiavi in mano',
    intro: 'Selezioniamo finiture e materiali di pregio e coordiniamo le imprese partner per la posa, con un unico interlocutore.',
    bullets: [
      'Capitolati e moodboard di finiture su misura',
      'Pavimenti, rivestimenti, gres e pietre naturali',
      'Preventivi trasparenti con imprese partner selezionate',
      'Coordinamento e collaudo della posa in cantiere',
    ],
    image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=80',
    cta: 'Richiedi un preventivo',
  },
  {
    key: 'strategico',
    name: 'Strategico',
    color: '#b45309',
    tagline: 'Marketing & brand',
    intro: 'Raccontiamo la tua storia e facciamo crescere il tuo brand con campagne, contenuti e una comunicazione che converte.',
    bullets: [
      'Identità visiva, naming e brand design',
      'Social media, contenuti e campagne Meta / Google',
      'Servizi foto e video professionali',
      'Strategia di crescita e funnel di vendita',
    ],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80',
    cta: 'Parla con un consulente',
  },
  {
    key: 'unico',
    name: 'Unico',
    color: '#4338ca',
    tagline: 'Atelier immobiliare · Investimenti',
    intro: 'Immobili di pregio selezionati in Puglia, ristrutturati dal nostro studio e rivenduti. Investi con noi a partire da piccole quote.',
    bullets: [
      'Immobili selezionati nelle location più richieste',
      'Ristrutturazione curata da Onirico Studio & Materico',
      'Rendimento atteso stimato per ogni operazione',
      'Investi da piccole quote, report periodici inclusi',
    ],
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
    cta: 'Scopri gli immobili',
  },
];

/* ---------------- LANDING CINEMATICA (pagina di login) ---------------- */
// Config della pagina pubblica di accesso (AuthFlow → CinematicShowcase).
// ⚠️ Sostituire `videoUrl` con l'URL del proprio video su Firebase Storage
// (vedi CLAUDE.md §13): video mp4 CONTINUO, le scene sono mappate sui secondi.
export const LANDING_SHOWCASE: { videoUrl: string; poster: string; scenes: UnicoShowcaseScene[] } = {
  videoUrl: 'https://github.com/giorgiopascalistudio/ONIRICOAPP/releases/download/VIDEO_ONIRICO-APP/Clip.1.mp4',
  // Sfondo di riserva se il video non carica (stessa estetica scura).
  poster: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
  scenes: [
    {
      time: 0,
      subtitle: 'Onirico • Design your vision',
      text: 'Trasformiamo le idee che hai sempre sognato in progetti concreti e personalizzati. Spazi che parlano di te.',
    },
    {
      time: 3,
      subtitle: 'Studio • Architettura & Ingegneria',
      text: 'Progettazione, pratiche edilizie, catasto e direzione lavori: seguiamo ogni fase, dal sopralluogo al collaudo.',
    },
    {
      time: 6,
      subtitle: 'Materico • Forniture & Posa',
      text: 'Finiture e capitolati chiavi in mano: selezioniamo materiali di pregio e coordiniamo le imprese partner.',
    },
    {
      time: 9,
      subtitle: 'Strategico • Marketing & Brand',
      text: 'Comunicazione e campagne che raccontano la tua storia e fanno crescere il tuo brand.',
    },
    {
      time: 12,
      subtitle: 'Unico • Atelier immobiliare',
      text: 'Immobili di pregio selezionati in Puglia, ristrutturati e rivenduti. Investi con noi a partire da piccole quote.',
    },
    {
      time: 15,
      subtitle: 'Diamo forma ai tuoi sogni',
      text: 'Crea il tuo accesso in due minuti: segui ogni progetto in tempo reale, dall’idea alla consegna delle chiavi.',
    },
  ],
};

export type PropertyStatus = 'aperto' | 'in_corso' | 'completato' | 'in_arrivo';

export interface InvestProperty {
  id: string;
  title: string;
  type: string;          // Masseria, Trullo, Villa, Palazzo...
  location: string;      // zona/città
  image: string;
  status: PropertyStatus;
  price: number;         // valore complessivo operazione (€)
  minInvestment: number; // quota minima (€)
  targetRoi: number;     // rendimento atteso annuo (%)
  durationMonths: number;
  goal: number;          // capitale da raccogliere (€)
  raised: number;        // capitale già raccolto (€)
  investors: number;
  summary: string;
  highlights: string[];
}

// Immobili FITTIZI per testare la pagina investimenti Unico.
export const UNICO_PROPERTIES: InvestProperty[] = [
  {
    id: 'masseria-lucia',
    title: 'Masseria Lucia',
    type: 'Masseria storica',
    location: 'Valle d’Itria · Cisternino (BR)',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1000&q=80',
    status: 'aperto',
    price: 1_200_000,
    minInvestment: 25_000,
    targetRoi: 12,
    durationMonths: 24,
    goal: 1_200_000,
    raised: 780_000,
    investors: 31,
    summary: 'Antica masseria in pietra trasformata in boutique hotel di charme tra gli ulivi della Valle d’Itria.',
    highlights: [
      '8 suite più ristorante e piscina panoramica',
      'Restauro conservativo delle volte a stella originali',
      'Posizione strategica tra Alberobello e Ostuni',
      'Gestione ricettiva già pre-contrattualizzata',
    ],
  },
  {
    id: 'trullo-aurora',
    title: 'Trullo Aurora',
    type: 'Trullo',
    location: 'Alberobello (BA)',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
    status: 'aperto',
    price: 320_000,
    minInvestment: 10_000,
    targetRoi: 9,
    durationMonths: 14,
    goal: 320_000,
    raised: 210_000,
    investors: 18,
    summary: 'Trullo storico nel cuore di Alberobello, restauro filologico e rivendita a uso residenziale di pregio.',
    highlights: [
      'Coni in pietra a secco recuperati a regola d’arte',
      'Domotica e comfort termico invisibili',
      'Zona UNESCO ad altissima richiesta turistica',
      'Operazione breve, rivendita entro 14 mesi',
    ],
  },
  {
    id: 'villa-maraa',
    title: 'Villa Maràa',
    type: 'Villa fronte mare',
    location: 'Gallipoli (LE)',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80',
    status: 'in_corso',
    price: 2_400_000,
    minInvestment: 50_000,
    targetRoi: 15,
    durationMonths: 30,
    goal: 2_400_000,
    raised: 1_600_000,
    investors: 22,
    summary: 'Nuova villa contemporanea fronte mare con piscina a sfioro, infinity view sullo Ionio.',
    highlights: [
      'Progetto architettonico iconico firmato Onirico',
      '450 mq con accesso diretto alla scogliera',
      'Classe energetica A4, impianti full green',
      'Target rivendita premium internazionale',
    ],
  },
  {
    id: 'palazzo-sole',
    title: 'Palazzo Sole',
    type: 'Palazzo · Frazionamento',
    location: 'Lecce · Centro storico',
    image: 'https://images.unsplash.com/photo-1430285561322-7808604715df?auto=format&fit=crop&w=1000&q=80',
    status: 'completato',
    price: 1_800_000,
    minInvestment: 30_000,
    targetRoi: 11,
    durationMonths: 28,
    goal: 1_800_000,
    raised: 1_800_000,
    investors: 40,
    summary: 'Palazzo barocco nel centro di Lecce frazionato in 6 appartamenti di lusso. Operazione conclusa con successo.',
    highlights: [
      'Pietra leccese e affreschi restaurati',
      '6 unità vendute al 100%',
      'Rendimento finale superiore alle attese',
      'Case study di riferimento Onirico Unico',
    ],
  },
  {
    id: 'dimora-otranto',
    title: 'Dimora Salentina',
    type: 'Corte salentina',
    location: 'Otranto (LE)',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80',
    status: 'aperto',
    price: 640_000,
    minInvestment: 15_000,
    targetRoi: 10.5,
    durationMonths: 20,
    goal: 640_000,
    raised: 95_000,
    investors: 7,
    summary: 'Corte storica a due passi dal mare di Otranto, riconvertita in case vacanza ad alta redditività.',
    highlights: [
      '3 unità indipendenti con corte comune',
      'A 600 m dal centro e dalla baia',
      'Rendita da locazione turistica annuale',
      'Raccolta appena aperta: primi investitori',
    ],
  },
  {
    id: 'attico-bari-marina',
    title: 'Attico Bari Marina',
    type: 'Attico vista porto',
    location: 'Bari · Lungomare',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
    status: 'in_arrivo',
    price: 890_000,
    minInvestment: 20_000,
    targetRoi: 8.5,
    durationMonths: 18,
    goal: 890_000,
    raised: 0,
    investors: 0,
    summary: 'Attico panoramico sul lungomare di Bari con terrazza vista porto. Raccolta in apertura a breve.',
    highlights: [
      'Ultimo piano con terrazza di 80 mq',
      'Ristrutturazione di design chiavi in mano',
      'Quartiere in forte rivalutazione',
      'Pre-registra il tuo interesse',
    ],
  },
];

/* ---------------- PUBBLICAZIONE VETRINA (deal → snapshot) ---------------- */
// Stato deal (lato studio) → badge vetrina (lato cliente).
const DEAL_TO_PROPERTY_STATUS: Record<UnicoDeal['status'], PropertyStatus> = {
  valutazione: 'in_arrivo',
  acquisizione: 'aperto',       // raccolta capitale in corso
  ristrutturazione: 'in_corso',
  vendita: 'in_corso',
  concluso: 'completato',
};

// Copertina di cortesia se lo studio non ha ancora impostato un'immagine.
const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80';

/**
 * Snapshot PUBBLICO di un'operazione Unico per il nodo `unicoShowcase/<id>`.
 * Espone SOLO campi divulgabili: niente costi di acquisto/ristrutturazione
 * né nomi degli investitori (solo somma raccolta e conteggio).
 */
export function dealToShowcaseEntry(d: UnicoDeal): UnicoShowcaseEntry {
  const sc = d.showcase || {};
  return {
    id: d.id,
    title: d.title || 'Operazione Unico',
    type: d.type || 'Immobile',
    location: d.location || 'Puglia',
    status: DEAL_TO_PROPERTY_STATUS[d.status] || 'in_arrivo',
    price: Number(d.targetSalePrice) || 0,
    minInvestment: Number(d.minInvestment) || 0,
    targetRoi: Number(d.targetRoi) || 0,
    durationMonths: Number(d.durationMonths) || 0,
    goal: Number(d.capitalGoal) || 0,
    raised: (d.investors || []).reduce((s, i) => s + (Number(i.amount) || 0), 0),
    investors: (d.investors || []).length,
    summary: sc.summary || '',
    highlights: sc.highlights || [],
    image: sc.image || DEFAULT_PROPERTY_IMAGE,
    videoUrl: sc.videoUrl || null,
    scenes: sc.scenes || [],
    updatedAt: Date.now(),
  };
}
