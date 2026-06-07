/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MatericoPortal } from './MatericoPortal';
import type { MatericoRequest } from '../types';
import { 
  Send, 
  FileText, 
  Download, 
  Briefcase, 
  Calendar, 
  Sparkles, 
  LogOut, 
  Loader2, 
  Sparkle, 
  Upload, 
  ClipboardList, 
  MessageSquare,
  BookOpen,
  ArrowRight,
  Clock,
  ArrowLeft,
  Search,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Smartphone,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, UserProfile, MatericoEstimate } from '../types';
import { eur, fmtDay, isoDate } from '../utils';
import { ThreeDProgress } from './ThreeDProgress';
import { StatusCard } from './StatusCard';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  intro: string;
  sections: {
    title: string;
    paragraphs: string[];
  }[];
  quote?: string;
  pointsTitle?: string;
  points?: string[];
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: 'trullo-marco',
    title: 'Il fascino eterno della pietra: il recupero di Trullo Marco in Puglia',
    excerpt: 'Scopri come coniugare il restauro conservativo delle tradizionali cupole in pietra con le più moderne tecnologie per l\'efficienza energetica e il massimo comfort abitativo.',
    category: 'Restauro',
    date: '14 Maggio 2026',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    intro: 'Il restauro dei trulli e delle antiche dimore storiche pugliesi non è solo un intervento di ingegneria o edilizia: è un atto d\'amore e profondo rispetto verso una sapienza costruttiva secolare. Trullo Marco rappresenta la sintesi ideale di questo approccio, combinando rispetto filologico della pietra e integrazione invisibile delle ultime tecnologie.',
    sections: [
      {
        title: 'Il consolidamento e la ricomposizione delle chiancarelle',
        paragraphs: [
          'La prima grande sfida di Trullo Marco ha riguardato le coperture a cono stuccate dalle intemperie del tempo. Il nostro laboratorio tecnico ha avviato uno smontaggio manuale selettivo dei chiancarelli ammalorati, procedendo al recupero minuzioso di ogni singola pietra originale.',
          'Il riposizionamento è stato eseguito a secco, secondo la regola d\'arte dei maestri trullari, interponendo uno strato impermeabilizzante e traspirante di ultima generazione, completamente celato alla vista. Questo assicura l\'impermeabilità totale mantenendo intatta la ventilazione naturale originaria.'
        ]
      },
      {
        title: 'Integrazione tecnologica invisibile e bioclimatica',
        paragraphs: [
          'Nel rispetto totale del manufatto storico, l\'impianto di riscaldamento e raffrescamento è stato integrato a pavimento sotto le chianche in pietra originarie levigate. Non vi sono unità esterne o split visibili che compromettano l\'estetica pastorale del trullo.',
          'Le murature in pietra massiccia, spesse fino a un metro e mezzo, offrono un\'eccezionale inerzia termica. Abbiamo ottimizzato questo comportamento passivo con l\'installazione di infissi in legno massiccio a taglio termico con profili ultra-sottili, incassati a scomparsa nelle spesse imbotte di muratura.'
        ]
      }
    ],
    quote: 'Restaurare un trullo significa ascoltare la pietra. Non dobbiamo aggiungere rumore visivo, ma liberare l\'anima funzionale che accoglierà la vita contemporanea con rigore ed eleganza.',
    pointsTitle: 'I cardini del restauro tecnologico di Trullo Marco:',
    points: [
      'Conservazione filologica della pietra calcarea locale stuccata a calce naturale.',
      'Riscaldamento radiante a pavimento sotto le chianche storiche recuperate.',
      'Integrazione di domotica invisibile per il controllo climatico e dell\'illuminazione.',
      'Sistemi di ricircolo naturale dell\'aria per eliminare completamente l\'umidità di risalita.'
    ]
  },
  {
    id: 'villa-marica',
    title: 'Villa Marica: la fusione formale tra contemporaneo ed architettura mediterranea',
    excerpt: 'Linee geometriche pure, ampie vetrate scorrevoli a scomparsa e un legame visivo simbiotico con la macchia mediterranea. Il concept progettuale dietro a un\'opera iconica.',
    category: 'Architettura',
    date: '30 Aprile 2026',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    intro: 'Collocata su un declivio naturale panoramico, Villa Marica incarna perfettamente la cifra stilistica di Onirico: "Design your vision". Il concept nasce dalla volontà di annullare i confini tra l\'involucro abitato e la natura circostante, creando una sequenza di cannocchiali visivi puntati sull\'orizzonte.',
    sections: [
      {
        title: 'La poetica dello spazio aperto: il soggiorno fluido',
        paragraphs: [
          'La zona giorno si sviluppa come un unico grande padiglione vetrato. Grazie alle vetrate scorrevoli a triplo vetro con profili incassati nel solaio e nel pavimento, le ante scorrono completamente all\'interno delle pareti perimetrali, trasformando il soggiorno in un immenso porticato coperto.',
          'Il pavimento in cemento spatolato a calce, che riprende i caldi toni sabbia delle rocce costiere, si estende senza soluzione di continuità verso la grande terrazza esterna e i bordi della piscina a sfioro, esaltando la fluidità visiva.'
        ]
      },
      {
        title: 'Muri in pietra a secco e solai leggeri in calcestruzzo a vista',
        paragraphs: [
          'I materiali scelti creano un dialogo materico d\'eccezione: da un lato la solidità atavica dei setti murari in pietra locale disposta a secco, dall\'altro la leggerezza tecnologica dei solai in cemento armato a vista con finitura liscia "faccia a vista" cassonata in legno.',
          'Questa contrapposizione permette alla struttura di radicarsi saldamente nel territorio e, contemporaneamente, di librarsi leggera nello spazio con sbalzi audaci che ombreggiano naturalmente le facciate vetrate durante i mesi estivi.'
        ]
      }
    ],
    quote: 'La vera sostenibilità di un\'opera architettonica non è solo tecnologica, ma visiva ed emozionale: deve sembrare essere nata spontaneamente dal terreno su cui sorge.',
    pointsTitle: 'Soluzioni architettoniche adottate in Villa Marica:',
    points: [
      'Orientamento scientifico secondo gli assi solstiziali per ottimizzare gli apporti solari passivi.',
      'Sbalzi orizzontali calcolati per garantire l\'ombreggiamento estivo totale.',
      'Piscina a sfioro con sistema di filtraggio biologico ad acqua salata integrato nel declivio.',
      'Materiali locali a km 0 per ridurre al minimo l\'impatto ecologico di cantiere.'
    ]
  },
  {
    id: 'villa-alessandro',
    title: 'Disegnare l\'intimità logica: il progetto di interior di Villa Alessandro',
    excerpt: 'Come modulare la luce naturale ed utilizzare superfici strutturate e tonalità calde della terra per creare spazi accoglienti, intimi e tecnologicamente intelligenti.',
    category: 'Interior Design',
    date: '18 Aprile 2026',
    readTime: '5 min',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    intro: 'L\'interior design non si limita all\'arredo o alla scelta dei rivestimenti: è lo studio dei flussi quotidiani, della psicologia dello spazio e del benessere sensoriale dell\'individuo. Nel progetto di Villa Alessandro, abbiamo lavorato intensamente sulla luce radente e su palette cromatiche calde e materiche.',
    sections: [
      {
        title: 'La luce come elemento costruttivo primario',
        paragraphs: [
          'Ogni stanza di Villa Alessandro è stata studiata in relazione al cammino quotidiano del sole. Abbiamo inserito asole luminose a soffitto e gole LED arretrate che simulano e prolungano la luce naturale anche nelle ore serali, evitando fastidiosi abbagliamenti diretti.',
          'I dettagli delle gole in cartongesso ospitano profili di illuminazione intelligente dimmerabile che si adattano al ciclo circadiano degli abitanti, favorendo il rilassamento nelle ore serali con toni caldi a 2400K.'
        ]
      },
      {
        title: 'La selezione materica tra legno di rovere di recupero e metalli acidati',
        paragraphs: [
          'Per donare calore e carattere agli ambienti minimali, abbiamo progettato arredi su misura ad altezza totale integrando pannellature in legno di rovere spazzolato con venature in risalto, accostate a dettagli strutturali in ferro nero acidato artigianalmente.',
          'Questa alternanza tra il calore organico del legno e la freddezza industriale del ferro sabbiato genera una complessità visiva raffinatissima, esaltata da tessuti naturali come lino grezzo e bouclé.'
        ]
      }
    ],
    quote: 'La casa deve essere un rifugio per l\'anima, un tempio di silenzio visivo in cui ogni dettaglio ha una sua motivazione ergonomica ed estetica.',
    pointsTitle: 'Dettagli di interior design realizzati per Villa Alessandro:',
    points: [
      'Pannellature boiserie a scomparsa che celano porte filomuro e spazi contenitivi.',
      'Gole luminose a LED ad alta resa cromatica (CRI > 95) tarate sul benessere circadiano.',
      'Arredi su misura disegnati e lavorati da artigiani e falegnami del territorio.',
      'Rivestimenti doccia e bagno in grande formato in pietra d\'Iseo a spacco naturale.'
    ]
  },
  {
    id: 'borgo-tagliaferri',
    title: 'Borgo Tagliaferri: la rinascita di un borgo rurale come modello di bioarchitettura',
    excerpt: 'Dalle rovine agricole alla rinascita di prestigiose residenze di campagna. Il restauro ingegneristico applicato alle antiche murature miste e l\'autosufficienza energetica.',
    category: 'Ingegneria',
    date: '02 Aprile 2026',
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    intro: 'Borgo Tagliaferri rappresenta uno dei progetti ingegneristici più stimolanti affrontati dallo studio. Il recupero di questo nucleo agricolo abbandonato ha richiesto una profonda opera di consolidamento strutturale integrata fin da subito con standard termici e ad emissioni quasi zero (NZEB).',
    sections: [
      {
        title: 'Il consolidamento antisismico non invasivo',
        paragraphs: [
          'Le strutture in muratura portante mista presentavano forti fessurazioni e cedimenti fondazionali dovuti all\'età. Abbiamo strutturato un piano di iniezioni di miscele leganti eco-compatibili a base di calce idraulica naturale NHL nelle cavità murarie, accoppiato all\'inserimento di tiranti in acciaio d\'epoca e cerchiature invisibili.',
          'Questo approccio ha enormemente accresciuto la coesione sismica del borgo senza stravolgere lo spessore esterno o la finitura sabbiata delle murature a vista storiche.'
        ]
      },
      {
        title: 'Un micro-grid energetico centralizzato a fonti rinnovabili',
        paragraphs: [
          'L\'autosufficienza termica ed elettrica di Borgo Tagliaferri è stata raggiunta tramite l\'integrazione di un impianto fotovoltaico centralizzato integrato sui tetti delle vecchie stalle riconsolidate (quindi non visibile dalle residenze principali) abbinato a un sistema di accumulo agli ioni di litio da 60 kWh.',
          'La climatizzazione invernale ed estiva sfrutta un anello geotermico a bassa entalpia con sonde verticali che scendono a 120 metri di profondità, accoppiato a pompe di calore ad altissimo rendimento. Un vero capolavoro di ingegneria verde.'
        ]
      }
    ],
    quote: 'La vera ingegneria non si impone sul patrimonio storico, ma si nasconde nelle sue pieghe per garantirne l\'eternità strutturale ed energetica con il minor impatto possibile.',
    pointsTitle: 'Le specifiche ingegneristiche di Borgo Tagliaferri:',
    points: [
      'Iniezioni di calce NHL per incremento antisismico e consolidamento profondo.',
      'Riscaldamento ed idraulica alimentati al 100% da anello geotermico a bassa entalpia.',
      'Sistemi di accumulo energetico e solare fotovoltaico integrato ad impatto visivo zero.',
      'Recupero totale ed uso di malte e intonaci traspiranti d\'epoca.'
    ]
  },
  {
    id: 'villa-giuseppe',
    title: 'La luce bianca di Locorotondo: volumi geometrici e la poetica del bianco in Valle d\'Itria',
    excerpt: 'Come coniugare forme cubiche pulite, la leggendaria luce bianca di Locorotondo e la pietra calcare per creare una residenza unifamiliare ad altissima sostenibilità.',
    category: 'Architettura',
    date: '19 Marzo 2026',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    intro: 'Progettare a Locorotondo significa confrontarsi con una delle meraviglie cromatiche della Puglia: il bianco accecante della calce che riflette i raggi del sole mediterraneo. Per Villa Giuseppe abbiamo destrutturato il concetto di abitazione rurale, reinterpretandolo attraverso una serie di volumi stereometrici puri ed eleganti.',
    sections: [
      {
        title: 'Il gioco dei volumi e la gestione dell\'irraggiamento sfolgorante',
        paragraphs: [
          'La conformazione planimetrica si sviluppa su una pianta organizzata ad "L" volta a generare un cortile riparato dai venti del nord. Ogni volume cubico riflette la luce con angolazioni diverse durante le preziose fasi del giorno.',
          'La finitura esterna è realizzata in scialbatura di calce naturale stesa a pennello, una scelta non solo estetica ma squisitamente funzionale: la calce permette alla muratura di respirare in modo superbo e respinge oltre il 75% della radiazione solare estiva, mantenendo i locali freschi.'
        ]
      },
      {
        title: 'Il dialogo materico tra resina e pietra locale',
        paragraphs: [
          'La ricercatezza degli interni risiede nel minimalismo materico: un pavimento continuo in microcemento bianco latte fa da sfondo a setti decorativi in pietra locale lasciati grezzi, integrando la forza materica pugliese all\'interno di un concept moderno.',
          'Gli angoli delle finestre sono profilati con infissi minimalistici in alluminio color antracite, incassati nelle spalle perimetrali per inquadrare rigogliosi ulivi secolari come vere e proprie tele dipinte.'
        ]
      }
    ],
    quote: 'La luce non è solo un fenomeno fisico, è la materia prima con cui scolpiamo lo spazio. In Valle d\'Itria, il bianco non è un colore, è un silenzio visivo che amplifica ogni emozione.',
    pointsTitle: 'Soluzioni adottate per Villa Giuseppe:',
    points: [
      'Scialbatura artigianale a calce naturale stesa secondo le antiche ricette a spessore.',
      'Setti murari interni in pietra calcarea originaria spazzolata a secco.',
      'Orientamento scientifico dei lucernari a soffitto per beneficiare esclusivamente di luce indiretta confortevole.',
      'Isolamento termico in fibra di canapa naturale traspirante integrato nell\'intercapedine.'
    ]
  },
  {
    id: 'palazzo-alessandra',
    title: 'Trasparenze storiche: il restauro filologico di Palazzo Alessandra nel centro storico',
    excerpt: 'Restaurare un palazzo gentilizio rispettando i secoli di storia ma introducendo la luce naturale e il massimo comfort termico attraverso percorsi di trasparenza in vetro strutturale.',
    category: 'Restauro',
    date: '04 Marzo 2026',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    intro: 'Nel cuore antico, Palazzo Alessandra custodisce una sequenza di volte a stella e a botte che raccontano secoli di architettura signorile. Il nostro intervento ha liberato gli spazi dalle stratificazioni novecentesche incoerenti, restituendo l\'armonia originaria attraverso una logica di trasparenza e leggerezza strutturale.',
    sections: [
      {
        title: 'Il recupero delle volte e la sverniciatura dei finti intonaci plastici',
        paragraphs: [
          'La prima operazione ha comportato la rimozione minuziosa delle pitture sintetiche applicate negli anni, le quali soffocavano il tufo e la pietra locale. Tramite lavaggi a bassa pressione e micro-sabbiature con polvere di carbonato di calcio, abbiamo riportato alla luce le calde sfumature dorate del carparo originario.',
          'Tutte le fughe sono state ri-consolidate utilizzando esclusivamente malte a base di calce idraulica naturale prive di cementi, per evitare la formazione di sali ammaloranti e garantire la totale traspirabilità dell\'edificio.'
        ]
      },
      {
        title: 'La passerella in vetro strutturale e il lucernario zenitale',
        paragraphs: [
          'Per connettere le tre ali del palazzo senza appesantire il cortile barocco interno, abbiamo introdotto una passerella aerea in vetro strutturale trasparente ad altissima resistenza. Questa struttura fluttua silenziosa tra le spesse pareti dorate, consentendo alla luce di penetrare fino al piano terra.',
          'In corrispondenza del salone principale, la rimozione di un vecchio solaio pericolante ha permesso di installare un lucernario zenitale scorrevole motorizzato, che funge da camino di ventilazione naturale durante l\'estate.'
        ]
      }
    ],
    quote: 'Il vetro è il miglior alleato della pietra antica: non cerca di imitarla, ma si offre come trasparenza discreta che ne rivela la maestosa fisicità senza tempo.',
    pointsTitle: 'I cardini ingegneristici ed estetici dell\'intervento:',
    points: [
      'Micro-sabbiatura selettiva e consolidamento antisismico delle volte a stella con fibre di carbonio.',
      'Sverniciatura totale e risanamento delle murature umide con intonaci macro-porosi a base calce.',
      'Passerella aerea con montanti in acciaio inox satinato e calpestatili in vetro triplo strato.',
      'Sistema domotico KNX integrato nella pietra per una gestione invisibile di luci scenografiche e riscaldamento.'
    ]
  }
];

interface ClientPortalViewProps {
  profile: UserProfile;
  projects: Project[];
  users: Record<string, UserProfile>;
  activePid: string | null;
  openPh: string | undefined;
  onSetActivePid: (pid: string) => void;
  onSetOpenPh: (phId: string | undefined) => void;
  onSendClientMessage: (projId: string, text: string) => void;
  onUploadDocument: (projId: string, file: File) => void;
  studioMembers?: UserProfile[];
  onRequestAppointment?: (memberUid: string, memberName: string, date: string, time: string, note: string) => void;
  matericoRequests?: MatericoRequest[];
  onCreateMatericoRequest?: (req: MatericoRequest) => void;
  onAcceptMatericoOffer?: (reqId: string, accept: boolean) => void;
  onSubmitMatericoOffer?: (reqId: string, amount: number, note: string) => void;
  projectMessages: Record<string, any>;
  documents: Record<string, any>;
  onLogout: () => void;
  isPreview?: boolean;
  onExitPreview?: () => void;
  estimates?: MatericoEstimate[];
  onSaveEstimate?: (est: MatericoEstimate) => void;
  onDeleteEstimate?: (id: string) => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  profile,
  projects,
  users,
  activePid,
  openPh,
  onSetActivePid,
  onSetOpenPh,
  onSendClientMessage,
  onUploadDocument,
  studioMembers,
  onRequestAppointment,
  matericoRequests,
  onCreateMatericoRequest,
  onAcceptMatericoOffer,
  onSubmitMatericoOffer,
  projectMessages,
  documents,
  onLogout,
  isPreview = false,
  onExitPreview,
  estimates = [],
  onSaveEstimate,
  onDeleteEstimate
}) => {
  const [msgInput, setMsgInput] = useState('');
  const [apptReqOpen, setApptReqOpen] = useState(false);
  const [approvedMarketingPosts, setApprovedMarketingPosts] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<string>('lavori');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [blogSearch, setBlogSearch] = useState('');
  const [blogFilter, setBlogFilter] = useState('Tutti');
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<{ phase: string; title: string; done: boolean } | null>(null);

  // Unified global finance sync
  const [activeInvoices, setActiveInvoices] = useState<any[]>([]);
  const [scadenze, setScadenze] = useState<any[]>([]);
  const [computi, setComputi] = useState<any[]>([]);

  useEffect(() => {
    try {
      const cachedActive = localStorage.getItem('onirico_invoices_active');
      if (cachedActive) setActiveInvoices(JSON.parse(cachedActive));

      const cachedScadenze = localStorage.getItem('onirico_scadenze');
      if (cachedScadenze) setScadenze(JSON.parse(cachedScadenze));

      const cachedComputi = localStorage.getItem('onirico_computi');
      if (cachedComputi) setComputi(JSON.parse(cachedComputi));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Overrides and custom states for the new 3 portals (Strategico, Materico Cliente, Materico Partner B2B)
  const [overridePortal, setOverridePortal] = useState<'studio' | 'strategico' | 'materico_cliente' | 'materico_partner' | null>(null);
  const [b2bCostInputs, setB2bCostInputs] = useState<Record<string, string>>({});
  const [b2bNotesInputs, setB2bNotesInputs] = useState<Record<string, string>>({});
  const [b2bMessages, setB2bMessages] = useState([
    { id: 'm1', sender: "Arch. Giorgio (Studio Onirico)", text: "Vincenzo, ricordati che per il massetto autolivellante in Trani dobbiamo stare entro i 4.5cm di spessore complessivo.", time: "Ieri, 16:40" },
    { id: 'm2', sender: "Vincenzo (ArredoArtigiano)", text: "Ricevuto Giorgio, ho già predisposto la miscela fibrorinforzata a basso spessore. Settimana prossima avviamo la posa del lotto 2.", time: "Ieri, 17:15" }
  ]);
  const [b2bChatInput, setB2bChatInput] = useState("");

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTaskDetail = (title: string, phaseName?: string) => {
    const t = title.toLowerCase();
    
    if (t.includes('rilie') || t.includes('soprall')) {
      return {
        title: title,
        desc: "Rilievo dettagliato dello stato di fatto dell'immobile mediante strumentazione laser e rilievo fotografico. Questa operazione permette di disporre di misure millimetriche necessarie per la successiva progettazione grafica e strutturale.",
        role: "Responsabile Rilievi",
        dueTime: "Completato sul posto",
        badge: "Indagine Tecnica",
        proStep: "Verifica distanze e quote altimetriche."
      };
    }
    if (t.includes('fattibili') || t.includes('analis') || t.includes('congru')) {
      return {
        title: title,
        desc: "Studio di fattibilità tecnica ed economica dell'intervento. Include l'analisi della conformità urbanistica e catastale, la verifica di eventuali vincoli paesaggistici o storici, e la definizione dei margini operativi per la ristrutturazione.",
        role: "Progettista Senior",
        dueTime: "Fase istruttoria",
        badge: "Studio Preliminare",
        proStep: "Consultazione archivi storici comunali."
      };
    }
    if (t.includes('cila') || t.includes('scia') || t.includes('pila') || t.includes('comun') || t.includes('permes')) {
      return {
        title: title,
        desc: "Redazione e deposito telematico della pratica edilizia (CILA o SCIA) presso lo Sportello Unico per l'Edilizia (SUE) del Comune di riferimento. Permette l'avvio ufficiale dei lavori rispettando le normative nazionali e locali.",
        role: "Ingegnere / Architetto",
        dueTime: "Convalida 48-72h",
        badge: "Pratica Edilizia",
        proStep: "Firma digitale della relazione tecnica asseverata."
      };
    }
    if (t.includes('catast') || t.includes('docfa') || t.includes('fogl') || t.includes('partic')) {
      return {
        title: title,
        desc: "Aggiornamento catastale mediante procedura informatica DOCFA per la variazione planimetrica dell'immobile a seguito delle modifiche interne/esterne introdotte con l'intervento. Fondamentale per la commerciabilità del bene.",
        role: "Tecnico Catastale",
        dueTime: "Approvazione Agenzia Entrate",
        badge: "Sito Catastale",
        proStep: "Elaborazione elaborato planimetrico e calcolo dei vani."
      };
    }
    if (t.includes('prelimin') || t.includes('layout') || t.includes('diseg') || t.includes('concept')) {
      return {
        title: title,
        desc: "Fase di definizione dell'idea progettuale e distribuzione degli spazi interni. Vengono elaborate piante in scala, idee di arredo e visualizzazioni grafiche preliminari per concordare la direzione estetica dell'intervento.",
        role: "Direttore Artistico / Design",
        dueTime: "Sottoscritto dal cliente",
        badge: "Progettazione Concept",
        proStep: "Definizione degli assonometrici 3D."
      };
    }
    if (t.includes('esecutiv') || t.includes('esecuz') || t.includes('costrut')) {
      return {
        title: title,
        desc: "Elaborazione dei disegni di dettaglio per le maestranze in cantiere. Contiene schemi precisi degli impianti idraulici/elettrici, dettagli di finitura, sezioni costruttive e abachi degli infissi e materiali.",
        role: "Ingegnere Strutturale",
        dueTime: "Pronto per Cantiere",
        badge: "Esecutivo Dettagliato",
        proStep: "Esportazione dei file CAD-BIM definitivi."
      };
    }
    if (t.includes('fotovolt') || t.includes('panne') || t.includes('solare')) {
      return {
        title: title,
        desc: "Dimensionamento e progettazione dell'impianto solare fotovoltaico, inclusa l'istanza di connessione con il gestore di rete (e-Distribuzione) e la stima del rendimento energetico mensile e annuale.",
        role: "Termotecnico",
        dueTime: "Allacciamento finale",
        badge: "Energia Rinnovabile",
        proStep: "Relazione tecnica risparmio energetico ex Legge 10."
      };
    }
    if (t.includes('elettr') || t.includes('quadro') || t.includes('cabl')) {
      return {
        title: title,
        desc: "Dimensionamento e stesura degli schemi unifilari dell'impianto elettrico. Comprende il posizionamento dei punti luce, prese di corrente, linee dedicate alla cucina/climatizzazione e quadro generale conforme al DM 37/08.",
        role: "Ingegnere Elettrico",
        dueTime: "Dichiarazione conformità",
        badge: "Impiantistica Locale",
        proStep: "Verifica selettività interruttori magnetotermici."
      };
    }
    if (t.includes('ape') || t.includes('energet') || t.includes('termic') || t.includes('legg')) {
      return {
        title: title,
        desc: "Redazione dell'Attestato di Prestazione Energetica (APE) post-operam o ante-operam. Consiste nel calcolo dell'indice di prestazione energetica globale dell'involucro edilizio e classificazione da G ad A4.",
        role: "Certificatore Abilitato",
        dueTime: "Invio al Catasto Regionale",
        badge: "Efficientamento",
        proStep: "Simulazione software ponti termici e calcolo dispersioni."
      };
    }
    if (t.includes('bando') || t.includes('finanz') || t.includes('detraz') || t.includes('agevol')) {
      return {
        title: title,
        desc: "Analisi delle linee di finanziamento, bonus casa o incentivi fiscali regionali/europei disponibili. Predisposizione dei dossier tecnici, asseverazioni di congruità delle spese e portale ENEA per le detrazioni.",
        role: "Ufficio Bandi & Economia",
        dueTime: "Asseverazione finale",
        badge: "Agevolazioni Fiscali",
        proStep: "Computo metrico estimativo basato su listino ufficiale DEI."
      };
    }
    if (t.includes('conseg') || t.includes('fin') || t.includes('collaud') || t.includes('attiv')) {
      return {
        title: title,
        desc: "Fase conclusiva della pratica con rilascio del verbale di fine lavori e della Segnalazione Certificata di Agibilità (SCA). Consegna di tutti i fascicoli tecnici digitali e cartacei al committente.",
        role: "Direttore dei Lavori",
        dueTime: "Chiusura ufficiale",
        badge: "Consegna & Agibilità",
        proStep: "Verifica formale conformità delle opere eseguite."
      };
    }

    // Generico fallback:
    return {
      title: title,
      desc: `Questo task fa parte della fase "${phaseName || 'Lavori'}" ed è fondamentale per completare l'iter tecnico e autorizzativo del tuo immobile. Viene eseguito dai professionisti dello studio nel rispetto del cronoprogramma stabilito.`,
      role: "Studio Onirico S.r.l.",
      dueTime: "In corso d'opera",
      badge: phaseName || "Iter Tecnico",
      proStep: "Supervisione e asseverazione interna."
    };
  };

  const projectIds = profile.projectIds ? Object.keys(profile.projectIds) : [];

  // Determine active portal type
  const getEffectivePortal = () => {
    if (overridePortal) return overridePortal;
    if (profile.role === 'partner') return 'materico_partner';
    
    // Fallback to active project's division
    const ap = activePid ? projects.find(proj => proj.id === activePid) : null;
    if (ap) {
      if (ap.division === 'strategico') return 'strategico';
      if (ap.division === 'materico') return 'materico_cliente';
    }
    return 'studio';
  };
  const activePortal = getEffectivePortal();

  // Find overridden active project
  const getOverriddenProject = () => {
    const targetDiv = (activePortal === 'materico_cliente' || activePortal === 'materico_partner')
      ? 'materico'
      : activePortal === 'strategico'
        ? 'strategico'
        : 'studio';

    let found = projects.find(pProj => pProj.id === activePid && (pProj.division === targetDiv || (pProj.division === undefined && targetDiv === 'studio')));
    if (!found) {
      found = projects.find(pProj => pProj.division === targetDiv || (pProj.division === undefined && targetDiv === 'studio'));
    }
    return found || projects[0];
  };

  const activeProject = getOverriddenProject();

  const handlePortalSwitch = (type: 'studio' | 'strategico' | 'materico_cliente' | 'materico_partner') => {
    setOverridePortal(type);
    
    // Find project matching that type:
    const targetDiv = (type === 'materico_cliente' || type === 'materico_partner')
      ? 'materico'
      : type === 'strategico'
        ? 'strategico'
        : 'studio';

    let found = projects.find(pProj => pProj.division === targetDiv || (pProj.division === undefined && targetDiv === 'studio'));
    if (found) {
      onSetActivePid(found.id);
    }
    setActiveSubTab('lavori');
  };

  // Project task counting statistics
  const projTaskCounts = (p: Project) => {
    let done = 0, tot = 0;
    Object.values(p.phases || {}).forEach(ph => {
      Object.values(ph.tasks || {}).forEach(t => {
        tot++;
        if (t.done) done++;
      });
    });
    return { done, tot };
  };

  const pct = (done: number, tot: number) => {
    return tot ? Math.round((done / tot) * 100) : 0;
  };

  const getProjDocs = (pid: string) => {
    const d = documents && documents[pid];
    return d ? Object.entries(d).map(([id, x]: any) => ({ id, ...x })).sort((a: any, b: any) => (b.at || 0) - (a.at || 0)) : [];
  };

  const getProjMessages = (pid: string) => {
    const m = projectMessages && projectMessages[pid];
    return m ? Object.entries(m).map(([id, x]: any) => ({ id, ...x })).sort((a: any, b: any) => (a.at || 0) - (b.at || 0)) : [];
  };

  const handleSend = () => {
    if (!msgInput.trim() || !activePid) return;
    onSendClientMessage(activePid, msgInput);
    setMsgInput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length && activePid) {
      setUploading(true);
      Array.from(e.target.files).forEach(f => {
        onUploadDocument(activePid, f);
      });
      setUploading(false);
    }
  };

  const getPhaseStatus = (ph: any) => {
    const ts = Object.values(ph.tasks || {});
    if (!ts.length) return 'da_fare';
    const doneCount = ts.filter((t: any) => t.done).length;
    if (doneCount === 0) return 'da_fare';
    if (doneCount === ts.length) return 'completato';
    return 'in_corso';
  };

  const codeFrom = (str: string) => {
    if (!str) return '----';
    const cleaned = String(str).toUpperCase().replace(/[^A-Z0-9 ]/g, '');
    const words = cleaned.split(/\s+/).filter(Boolean);
    let code = '';
    if (words.length >= 2) {
      code = words.slice(0, 4).map(w => w[0]).join('');
    } else {
      code = cleaned.replace(/\s/g, '').slice(0, 4);
    }
    return (code || '----').slice(0, 4).padEnd(4, ' ');
  };

  // If no projects connected
  if (!projectIds.length || !projects.length) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F5F3] text-[#161616] font-sans">
        {/* Top bar Client */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#ececec]">
          <span className="font-extrabold text-[20px] tracking-tight text-[#161616]">
            Onirico<span className="text-[#8a8a8a] font-normal"> · OS</span>
          </span>
          <button onClick={onLogout} className="bg-[#1b1b1b] hover:bg-black text-white font-extrabold text-xs py-1.5 px-4 rounded-xl border-none cursor-pointer transition-all active:scale-95">
            Esci
          </button>
        </div>

        <div className="flex-1 max-w-[500px] mx-auto flex items-center justify-center p-6">
          <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-8 shadow-sm text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#fafafa] border border-[#e2e2e2] text-[#161616] flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6" />
            </div>
            <b className="block text-[#161616] text-[16px] font-extrabold">Progetto in preparazione</b>
            <p className="text-[13.5px] text-[#8a8a8a] mt-2 mb-4 leading-relaxed">
              Il tuo progetto non è ancora disponibile. Lo studio lo attiverà a breve: qui vedrai l'avanzamento catastale, le fasi e un modello 3D della tua casa.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const p = activeProject || projects[0];
  const { done, tot } = projTaskCounts(p);
  const pc = pct(done, tot);

  const flatTasks: { phase: string; phId: string; title: string; done: boolean }[] = [];
  const phasesList = Object.entries(p.phases || {}).sort((a: any, b: any) => (a[1].order || 0) - (b[1].order || 0));

  phasesList.forEach(([phId, ph]: any) => {
    Object.entries(ph.tasks || {}).sort((a: any, b: any) => (a[1].order || 0) - (b[1].order || 0)).forEach(([tid, t]: any) => {
      flatTasks.push({ phase: ph.name, phId: ph.id || phId, title: t.title, done: !!t.done });
    });
  });

  let curIdx = flatTasks.findIndex(t => !t.done);
  if (curIdx === -1 && flatTasks.length > 0) curIdx = flatTasks.length - 1;
  const curTask = flatTasks[curIdx] || { title: 'Lavori completati', phase: 'Fine' };
  const nextTask = flatTasks[curIdx + 1] || null;
  const isAllDone = flatTasks.length > 0 && flatTasks.every(t => t.done);

  const toTitle = nextTask ? nextTask.title : (p.dueDate ? fmtDay(p.dueDate) : 'Consegna');

  const docs = getProjDocs(p.id);
  const msgs = getProjMessages(p.id);

  const getTabsForPortal = () => {
    switch (activePortal) {
      case 'strategico':
        return [
          { id: 'lavori', label: 'Avanzamento', icon: ClipboardList },
          { id: 'marketing', label: 'Instagram & Creatives', icon: Briefcase },
          { id: 'documenti', label: 'Strategie & Brief', icon: FileText },
          { id: 'finanze', label: 'Contabilità & Fatture', icon: DollarSign },
          { id: 'blog', label: 'Growth Insights', icon: BookOpen }
        ];
      case 'materico_cliente':
        return [
          { id: 'lavori', label: 'Iter Posa', icon: ClipboardList },
          { id: 'preventivi', label: 'Scelte d\'Arredo', icon: ClipboardList },
          { id: 'documenti', label: 'Moodboard & Campioni', icon: FileText },
          { id: 'finanze', label: 'Contabilità & Fatture', icon: DollarSign },
          { id: 'blog', label: 'Materico Trends', icon: BookOpen }
        ];
      case 'materico_partner':
        return [
          { id: 'lavori', label: 'Posa in Cantiere', icon: ClipboardList },
          { id: 'b2b_preventivi', label: 'Offerte B2B', icon: ClipboardList },
          { id: 'documenti', label: 'Tavole & Disegni', icon: FileText },
          { id: 'b2b_chat', label: 'Coordinamento Cantiere', icon: MessageSquare }
        ];
      case 'studio':
      default:
        return [
          { id: 'lavori', label: 'Avanzamento', icon: ClipboardList },
          { id: 'documenti', label: 'Documenti & Chat', icon: FileText },
          { id: 'finanze', label: 'Contabilità & Fatture', icon: DollarSign },
          { id: 'blog', label: 'Onirico Blog', icon: BookOpen }
        ];
    }
  };

  const tabsList = getTabsForPortal();
  const currentTab = tabsList.some(t => t.id === activeSubTab) ? activeSubTab : tabsList[0].id;

  const showSimulator = false;

  let portalStyle = {
    themeName: "Onirico Studio",
    slogan: "Portale Cliente · Architettura",
    headerBg: "bg-white",
    headerText: "text-[#161616]",
    headerBorder: "border-[#e5e5e5]",
    bgCanvas: "bg-[#F5F5F3]",
    pillColor: "bg-zinc-950 text-white",
    primaryText: "text-zinc-950",
    accentColor: "#161616",
    badgeBg: "bg-zinc-100/80 text-zinc-900 border-zinc-200",
    portalLabel: "Studio Architettura",
    accentDot: "bg-zinc-800"
  };

  if (activePortal === 'strategico') {
    portalStyle = {
      themeName: "Onirico Strategico",
      slogan: "Growth & Brand Portal",
      headerBg: "bg-white",
      headerText: "text-[#161616]",
      headerBorder: "border-[#e5e5e5]",
      bgCanvas: "bg-[#F5F5F3]",
      pillColor: "bg-zinc-950 text-white font-extrabold",
      primaryText: "text-[#E2A93E]",
      accentColor: "#E2A93E",
      badgeBg: "bg-amber-50 text-amber-800 border-amber-200/80",
      portalLabel: "Strategia & Growth",
      accentDot: "bg-amber-500"
    };
  } else if (activePortal === 'materico_cliente') {
    portalStyle = {
      themeName: "Onirico Materico",
      slogan: "Selezione Finiture & Arredi",
      headerBg: "bg-white",
      headerText: "text-[#161616]",
      headerBorder: "border-[#e5e5e5]",
      bgCanvas: "bg-[#F5F5F3]",
      pillColor: "bg-zinc-950 text-white font-extrabold",
      primaryText: "text-[#C87A53]",
      accentColor: "#C87A53",
      badgeBg: "bg-orange-50 text-orange-850 border-orange-200",
      portalLabel: "Moodboard & Finiture",
      accentDot: "bg-orange-500"
    };
  } else if (activePortal === 'materico_partner') {
    portalStyle = {
      themeName: "Onirico Materico B2B",
      slogan: "Partner & Supplier Platform",
      headerBg: "bg-white",
      headerText: "text-[#161616]",
      headerBorder: "border-[#e5e5e5]",
      bgCanvas: "bg-[#F5F5F3]",
      pillColor: "bg-zinc-950 text-white font-extrabold",
      primaryText: "text-slate-800",
      accentColor: "#4B5D68",
      badgeBg: "bg-slate-100 text-slate-800 border-slate-200",
      portalLabel: "Partner Impresa B2B",
      accentDot: "bg-slate-600"
    };
  }

  return (
    <div className={`flex flex-col min-h-screen ${portalStyle.bgCanvas} text-[#161616] font-sans select-none pb-24`}>
      {!isPreview && onRequestAppointment && studioMembers && studioMembers.length > 0 && (
        <AppointmentRequestModal
          open={apptReqOpen}
          onClose={() => setApptReqOpen(false)}
          members={studioMembers}
          onRequest={onRequestAppointment}
        />
      )}

      {matericoRequests && (profile.role === 'partner' || (profile.role === 'cliente' && profile.sector === 'materico')) && (
        <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 pt-6">
          <MatericoPortal
            role={profile.role === 'partner' ? 'partner' : 'cliente'}
            uid={profile.uid}
            name={profile.name}
            requests={(matericoRequests || []).filter((r) =>
              profile.role === 'partner'
                ? (r.forwardedTo || []).includes(profile.uid)
                : r.clientUid === profile.uid
            )}
            onCreateRequest={onCreateMatericoRequest}
            onAcceptOffer={onAcceptMatericoOffer}
            onSubmitOffer={onSubmitMatericoOffer}
          />
        </div>
      )}
      {isPreview && (
        <div className="bg-[#161616] text-[#eeeeee] text-[13px] font-bold py-2.5 px-6 flex items-center justify-between sticky top-0 z-[60]">
          <span>Anteprima Portale Cliente — Così il cliente vede la propria pratica</span>
          {onExitPreview && (
            <button
              onClick={onExitPreview}
              className="bg-white hover:bg-white/95 text-[#161616] border-none font-bold py-1 px-3 rounded-lg text-xs cursor-pointer transition-all active:scale-95"
            >
              Esci dall'anteprima
            </button>
          )}
        </div>
      )}

      {/* Main client top navbar */}
      <div className={`flex items-center justify-between px-6 py-3.5 ${portalStyle.headerBg} border-b ${portalStyle.headerBorder} sticky top-0 z-[45] transition-all`}>
        <div className="flex items-center gap-3">
          <span className={`font-extrabold text-[20px] tracking-tight ${portalStyle.headerText}`}>
            Onirico<span className="opacity-60 font-normal"> · {portalStyle.themeName.split(' ')[1] || 'OS'}</span>
          </span>
          <span className={`hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wider border ${portalStyle.badgeBg}`}>
            {portalStyle.portalLabel}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Project Switcher if multiple */}
          {projectIds.length > 1 && (
            <select
              value={activePid || ''}
              onChange={(e) => onSetActivePid(e.target.value)}
              className="text-xs font-black bg-[#fafafa] border border-[#e2e2e2] py-1.5 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-400 text-[#161616] cursor-pointer"
            >
              {projectIds.map(id => {
                const proj = projects.find(pr => pr.id === id);
                return (
                  <option key={id} value={id}>
                    {proj ? proj.name : 'Progetto'}
                  </option>
                );
              })}
            </select>
          )}

          <button onClick={onLogout} className="bg-[#f0f0f0] hover:bg-[#e4e4e4] text-[#161616] font-extrabold text-xs py-1.5 px-3.5 rounded-xl border-none flex items-center gap-1.5 cursor-pointer transition-all active:scale-95">
            <LogOut className="w-3.5 h-3.5" /> Esci
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-[1080px] mx-auto w-full p-4 md:p-6 flex flex-col gap-6 text-left">
        
        {/* COMPREHENSIVE PORTAL SIMULATOR SELECTOR BAR - Only shown to Admin, Staff, or in Preview */}
        {showSimulator && (
          <div className="bg-white border border-[#e5e5e5] rounded-[24px] p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block">Dashboard di Simulazione Account</span>
                <h4 className="text-[14px] font-black text-[#1a1a1a] mt-0.5 flex items-center gap-1.5">
                  🕹️ Esplora i 4 Portali Attivi Onirico
                </h4>
                <p className="text-[#8a8a8a] text-[11px] font-semibold mt-0.5 leading-normal">
                  Fai clic per simulare istantaneamente il layout, i documenti e i flussi di lavoro visibili da quel corrispondente account cliente o partner:
                </p>
              </div>
              
              <div className="flex flex-wrap gap-1.5 justify-start md:justify-end">
                <button
                  id="portal-btn-studio"
                  onClick={() => handlePortalSwitch('studio')}
                  className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activePortal === 'studio'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                      : 'bg-[#fafafa] text-zinc-600 hover:bg-zinc-100 border-gray-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Studio
                </button>
                
                <button
                  id="portal-btn-strategico"
                  onClick={() => handlePortalSwitch('strategico')}
                  className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activePortal === 'strategico'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                      : 'bg-[#fafafa] text-zinc-600 hover:bg-zinc-100 border-gray-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Strategico
                </button>
                
                <button
                  id="portal-btn-materico-cliente"
                  onClick={() => handlePortalSwitch('materico_cliente')}
                  className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activePortal === 'materico_cliente'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                      : 'bg-[#fafafa] text-zinc-600 hover:bg-zinc-100 border-gray-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Materico
                </button>
                
                <button
                  id="portal-btn-materico-partner"
                  onClick={() => handlePortalSwitch('materico_partner')}
                  className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activePortal === 'materico_partner'
                      ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                      : 'bg-[#fafafa] text-zinc-600 hover:bg-zinc-100 border-gray-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Partner B2B
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-1">
          <div>
            <h1 className="text-[30px] md:text-[34px] font-extrabold tracking-tight text-[#161616] leading-tight font-sans">
              Ciao, {profile.name}!
            </h1>
            <div className="text-[13.5px] text-[#8a8a8a] mt-1 font-semibold leading-relaxed">
              {activePortal === 'strategico' ? (
                <span>Tracciamento KPI, funnel e campagne di brand branding curate per <span className="text-[#E2A93E] font-black">{p.name}</span>.</span>
              ) : activePortal === 'materico_cliente' ? (
                <span>Rassegna dettagliata delle finiture di lusso, campionari e asseverazione preventivi d'arredo per <span className="text-[#C87A53] font-black">{p.name}</span>.</span>
              ) : activePortal === 'materico_partner' ? (
                <span>Workspace di montaggio, schede tecniche di posa e computo d'offerta per l'impresa partner <span className="text-slate-700 font-black">{profile.name}</span> nel cantiere <span className="text-zinc-900 font-extrabold">{p.name}</span>.</span>
              ) : (
                <span>Segui l'avanzamento dei lavori, i dati catastali e i documenti di <span className="text-[#161616] font-extrabold">{p.name}</span> in tempo reale.</span>
              )}
            </div>
          </div>
        </div>

        {/* Sub-navigation tabs matching ui.unlumen.com/components/motion-tabs-menu */}
        <div className="flex justify-center my-4">
          <div className="inline-flex items-center gap-1.5 bg-[#161616] rounded-full p-1.5 shadow-md border border-neutral-800 relative overflow-visible">
            {tabsList.map(tab => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`relative inline-flex items-center gap-2 border-none bg-transparent py-2.5 px-4 rounded-full font-bold text-[12.5px] cursor-pointer transition-colors duration-300 select-none ${
                    isActive ? 'text-black' : 'text-[#a3a3a3] hover:text-white'
                  }`}
                  style={{ touchAction: 'none' }}
                >
                  {/* Underlay Active Pill animation using layoutId */}
                  {isActive && (
                    <motion.div
                      layoutId="unlumen-sub-active-pill"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32
                      }}
                      className="absolute inset-0 bg-white rounded-full z-0"
                    />
                  )}

                  {/* Micro scale press feedback physics */}
                  <motion.div
                    className="relative z-10 flex items-center justify-center"
                    whileTap={{ scaleY: 0.8 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                  </motion.div>

                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{
                          width: { type: 'spring', stiffness: 420, damping: 32 },
                          opacity: { delay: 0.08, duration: 0.12 }
                        }}
                        className="relative z-10 overflow-hidden whitespace-nowrap block"
                      >
                        <span className="pr-1 font-extrabold truncate block">{tab.label}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic sub tab layout wrapper */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10, filter: "blur(2.5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(2.5px)" }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="w-full"
            >
          {currentTab === 'lavori' && (
            <div className="flex flex-col gap-6 animate-[riseIn_0.22s_ease_both]">
              {/* Flight departure board style header card - Full Visual Consistency */}
              <StatusCard
                fromCode={codeFrom(curTask.title)}
                fromCity={isAllDone ? 'COMPLETATO' : 'IN CORSO'}
                fromTime={curTask.title}
                toCode={codeFrom(toTitle)}
                toCity={nextTask ? 'PROSSIMO' : 'CONSEGNA'}
                toTime={toTitle}
                progress={pc}
                eta={p.dueDate ? `CONSEGNA PREVISTA: ${fmtDay(p.dueDate)}` : 'SENZA SCADENZA'}
                nextLabel={nextTask ? 'Prossimo task' : 'Stato'}
                nextVal={nextTask ? nextTask.title : (isAllDone ? 'Tutto completato' : 'In corso')}
                rightLabel="Fase corrente"
                rightVal={curTask.phase || 'Avvio'}
              />

              {/* 3D Model and Task checklist divided row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 3D Model Box */}
                {activePortal === 'strategico' ? (
                  <div id="visual-funnel-card" className="lg:col-span-5 bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-[15px] font-extrabold text-[#1a1a1a] mb-1 flex items-center gap-1.5 font-sans">
                        <Target className="w-4 h-4 text-[#E2A93E]" /> Imbuto di Conversione (Funnel)
                      </h3>
                      <p className="text-[#8a8a8a] text-[12px] mb-3.5 font-semibold">
                        Analisi stimata del traffico e dei lead generati in tempo reale.
                      </p>
                    </div>

                    <div className="bg-[#FAFAF7] border border-amber-200/50 p-4 rounded-2xl flex flex-col gap-3 font-sans mt-2">
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-150 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <span className="text-[12px] font-bold text-gray-500">1. Awareness (Copertura)</span>
                        <b className="text-[13px] text-zinc-950 font-mono">115.400 Visite</b>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-150 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <span className="text-[12px] font-bold text-amber-600">2. Interazione (Leads)</span>
                        <b className="text-[13px] text-zinc-950 font-mono">3.450 Clic</b>
                      </div>
                      <div className="flex justify-between items-center bg-[#111111] p-2.5 rounded-xl text-[#E2A93E]">
                        <span className="text-[12px] font-medium text-amber-100">3. Richieste Soggiorni</span>
                        <b className="text-[14px] font-black font-mono">+142 Bookings</b>
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold border-t border-amber-100/30 pt-2 flex items-center justify-between">
                        <span>CPC Medio: 0,38 €</span>
                        <span>ROI Atteso: +184%</span>
                      </div>
                    </div>
                  </div>
                ) : activePortal === 'materico_cliente' ? (
                  <div id="visual-palette-card" className="lg:col-span-5 bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-[15px] font-extrabold text-[#1a1a1a] mb-1 flex items-center gap-1.5 font-sans">
                        <Sparkle className="w-4 h-4 text-[#C87A53]" /> Palette & Campioni Materiali
                      </h3>
                      <p className="text-[#8a8a8a] text-[12px] mb-3.5 font-semibold">
                        Campioni fisici spediti a casa tua o selezionabili. Tattilità organica.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {[
                        { name: 'Pietra di Trani', code: '#E6DFD3', desc: 'Bocciardata (Esterni)', status: 'spedito' },
                        { name: 'Rovere Spazzolato', code: '#CBB49B', desc: 'Pavimenti Interni', status: 'confermato' },
                        { name: 'Microcemento Sabbia', code: '#D9D1C5', desc: 'Rivestimento Bagni', status: 'in_scelta' },
                        { name: 'Ottone Brunito', code: '#A68C6D', desc: 'Dettagli Rubinetteria', status: 'spedito' }
                      ].map((mat, idx) => (
                        <div key={idx} className="bg-[#FAF8F5] border border-orange-100/80 p-3 rounded-2xl flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full shadow-inner border border-zinc-200" style={{ backgroundColor: mat.code }} />
                            <b className="text-[11px] font-extrabold text-zinc-900 truncate">{mat.name}</b>
                          </div>
                          <span className="text-[9.5px] text-[#C87A53] font-bold block">{mat.desc}</span>
                          <span className="text-[8px] bg-amber-50 text-amber-800 self-start border border-amber-100 font-extrabold tracking-wider px-1 rounded uppercase">
                            {mat.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activePortal === 'materico_partner' ? (
                  <div id="visual-b2b-logistics-card" className="lg:col-span-5 bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-[15px] font-extrabold text-[#1a1a1a] mb-1 flex items-center gap-1.5 font-sans">
                        <Briefcase className="w-4 h-4 text-slate-500" /> Logistica & Approvvigionamenti B2B
                      </h3>
                      <p className="text-[#8a8a8a] text-[12px] mb-3.5 font-semibold">
                        Controlla lo stato di spedizione dei lotti ordinati stabiliti con Onirico.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 font-sans mt-2">
                      {[
                        { name: 'Lotto 1: Porte Interne', qty: '8 pz', status: 'In Produzione', pct: 60 },
                        { name: 'Lotto 2: Infissi Alluminio', qty: '4 pz', status: 'Materiale Pronto', pct: 100 },
                        { name: 'Lotto 3: Accessori Posa', qty: '1 conf', status: 'Spedito', pct: 100 }
                      ].map((lot, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 border border-slate-200/80 rounded-2xl shadow-2xs">
                          <div className="flex justify-between items-center text-[11px] mb-1">
                            <span className="font-extrabold text-slate-800">{lot.name}</span>
                            <span className="text-slate-500 text-[10px] font-mono">{lot.status}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1">
                            <div className="bg-slate-600 h-1 rounded-full" style={{ width: `${lot.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div id="visual-interactive-3d-card" className="lg:col-span-5 bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-[15px] font-extrabold text-[#161616] mb-1 flex items-center gap-1.5 font-sans">
                        <Sparkles className="w-4 h-4 text-amber-500" /> Il Tuo Cantiere 3D
                      </h3>
                      <p className="text-[#8a8a8a] text-[12px] mb-3.5 font-semibold">
                        Ruota o zooma il modello interattivo per vedere i progressi fisici della pratica.
                      </p>
                    </div>
                    <div className="bg-[#fcfcfc] border border-[#e2e2e2] rounded-2xl overflow-hidden shadow-inner">
                      <ThreeDProgress
                        progress={pc}
                        height="260px"
                        modelType={p.templateId === 'fotovoltaico' ? 'solar' : p.templateId === 'impianto-elettrico' ? 'electrical' : p.templateId === 'catastale' ? 'cadastral' : p.templateId === 'ape' ? 'energy' : p.templateId === 'bando' ? 'generic' : 'house'}
                      />
                    </div>
                  </div>
                )}

                {/* State of Practices & Interactive Tasks */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-white border border-[#e2e2e2] rounded-[26px] p-4 shadow-sm">
                    <div className="text-left">
                      <h3 className="text-[15px] font-extrabold text-[#161616] flex items-center gap-1.5 font-sans">
                        <ClipboardList className="w-4 h-4 text-[#8a8a8a]" /> Piano dei Lavori Interattivo
                      </h3>
                      <p className="text-[#8a8a8a] text-[12px] mt-0.5 font-semibold">
                        Scorri le singole fasi autorizzative e tecniche della tua pratica.
                      </p>
                    </div>
                    <span className="text-[11px] bg-[#fafafa] border border-[#e2e2e2] text-[#161616] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap">
                      {done} di {tot} completati
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {phasesList.map(([phId, ph]: any) => {
                      const plistTasks = Object.entries(ph.tasks || {}).sort((a: any, b: any) => (a[1].order || 0) - (b[1].order || 0));
                      const completedCount = plistTasks.filter(([, t]: any) => t.done).length;
                      const totalCount = plistTasks.length;
                      const phStatus = getPhaseStatus(ph);
                      const isOpen = openPh === phId || (openPh === undefined && phStatus === 'in_corso');

                      const phBadgeColor = phStatus === 'completato' 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                        : phStatus === 'in_corso' 
                          ? 'bg-amber-50 text-amber-800 border-amber-100' 
                          : 'bg-gray-100 text-gray-700 border-gray-200';

                      const numBgColor = phStatus === 'completato' ? 'bg-emerald-600 text-white' : 'bg-[#f0f0f0] text-gray-700';

                      return (
                        <div key={phId} className="bg-white border border-[#e2e2e2] rounded-[22px] overflow-hidden shadow-sm transition-all hover:border-gray-300">
                          <div
                            onClick={() => onSetOpenPh(isOpen ? '__none__' : phId)}
                            className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 font-sans">
                              <span className={`w-[28px] h-[28px] rounded-lg flex items-center justify-center font-extrabold text-[12px] flex-shrink-0 ${numBgColor}`}>
                                {phStatus === 'completato' ? '✓' : (ph.order || 0) + 1}
                              </span>
                              <div className="min-w-0 text-left">
                                <b className="block text-[14px] font-extrabold text-[#161616] leading-tight truncate">{ph.name}</b>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase tracking-wide ${phBadgeColor}`}>
                                    {phStatus === 'completato' ? 'Completata' : phStatus === 'in_corso' ? 'In corso' : 'Da fare'}
                                  </span>
                                  <span className="text-[12.5px] text-[#8a8a8a] font-semibold">{completedCount}/{totalCount} task</span>
                                </div>
                              </div>
                            </div>

                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" className={`w-3.5 h-3.5 text-[#8a8a8a] transition-all flex-shrink-0 ${isOpen ? 'transform rotate-180 text-gray-950' : ''}`}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="overflow-hidden border-t border-[#f5f5f5] bg-[#fafafa]/50"
                              >
                                <div className="p-4 flex flex-col gap-2.5">
                                  {plistTasks.length > 0 ? (
                                    plistTasks.map(([tId, t]: any) => (
                                      <div 
                                        key={tId} 
                                        onClick={() => setSelectedTaskForModal({ phase: ph.name, phId, title: t.title, done: !!t.done })}
                                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all hover:border-[#161616] hover:bg-white ${
                                          t.done 
                                            ? 'bg-[#fafafa] border-[#e2e2e2] opacity-65' 
                                            : 'bg-white border-[#e2e2e2] shadow-xs'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <span className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                                            t.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 bg-white'
                                          }`}>
                                            {t.done && (
                                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-2.5 h-2.5 text-white">
                                                <polyline points="20 6 9 17 4 12" />
                                              </svg>
                                            )}
                                          </span>
                                          <b className={`text-[13.5px] font-semibold text-[#161616] text-left ${t.done ? 'line-through text-[#8a8a8a]' : ''}`}>
                                            {t.title}
                                          </b>
                                        </div>
                                        {/* role badge removed */}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[12px] text-[#8a8a8a] italic py-2 text-center">Fase vuota</p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'documenti' && (
            <div className="flex flex-col gap-6 animate-[riseIn_0.22s_ease_both]">
              {/* General Project Metadata - Real estate data box */}
              <div className="bg-white border border-[#e2e2e2] rounded-[26px] overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <div className="p-5 flex flex-col justify-center">
                  <div className="text-[10px] uppercase font-bold text-[#8a8a8a] tracking-wider">Indirizzo immobile</div>
                  <b className="block text-[13.5px] mt-1 text-[#161616] truncate" title={p.indirizzoImmobile || p.location || '—'}>{p.indirizzoImmobile || p.location || '—'}</b>
                </div>
                <div className="p-5 flex flex-col justify-center">
                  <div className="text-[10px] uppercase font-bold text-[#8a8a8a] tracking-wider">Tipo Intervento</div>
                  <b className="block text-[13.5px] mt-1 text-[#161616] truncate">{p.tipoIntervento || p.templateName || '—'}</b>
                </div>
                <div className="p-5 flex flex-col justify-center">
                  <div className="text-[10px] uppercase font-bold text-[#8a8a8a] tracking-wider">Dati catastali (Foglio / Part. / Sub)</div>
                  <b className="block text-[13.5px] mt-1 text-[#161616]">{p.foglio ? `${p.foglio} / ${p.particella} / ${p.sub || '—'}` : '—'}</b>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left Column: Messages & Documents */}
                <div className="flex flex-col gap-6">
                  {/* Message from studio */}
                  {p.clientMessage && (
                    <div className="bg-amber-50/40 border border-amber-200 rounded-[26px] p-5 flex flex-col gap-2.5 shadow-sm">
                      <div className="flex items-center gap-2 text-amber-850">
                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                          <Sparkle className="w-4 h-4" />
                        </div>
                        <b className="font-extrabold text-[12.5px] uppercase tracking-wider">Comunicazione dallo studio</b>
                      </div>
                      <p className="text-[13.5px] text-[#333333] leading-relaxed whitespace-pre-wrap font-semibold">
                        {p.clientMessage}
                      </p>
                    </div>
                  )}

                  {/* Documents card */}
                  <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-[16px] font-extrabold text-[#161616]">Documenti & Pratiche</h3>
                        <p className="text-[12px] text-[#8a8a8a]">Scarica i file inseriti o caricali direttamente.</p>
                      </div>
                      {!isPreview && (
                        <label className="bg-[#1b1b1b] hover:bg-black text-white text-[12px] font-bold py-1.5 px-3.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95 border-none">
                          <Upload className="w-3.5 h-3.5" /> Carica
                          <input type="file" onChange={handleFileChange} multiple className="hidden" />
                        </label>
                      )}
                    </div>

                    {uploading && (
                      <div className="text-center text-[12px] text-[#8a8a8a] py-2.5 flex items-center gap-1.5 justify-center bg-[#fafafa] border border-[#e2e2e2] rounded-xl mb-2 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-[#161616]" /> Caricamento in corso...
                      </div>
                    )}

                    <div className="flex flex-col gap-2 max-h-[290px] overflow-y-auto w-full">
                      {docs.length > 0 ? (
                        docs.map((d: any) => (
                          <div key={d.id} className="flex items-center justify-between p-3 bg-[#fafafa] border border-[#ececec] rounded-xl text-[13px] group hover:bg-gray-100/50 transition-all duration-150">
                            <div className="min-w-0 flex-1 pr-2">
                              <span className="block font-bold text-[#161616] truncate" title={d.name}>{d.name}</span>
                              <span className="text-[10px] text-[#8a8a8a] font-bold uppercase">{d.size ? Math.round(d.size / 1024) + ' KB' : '—'}</span>
                            </div>
                            <div className="dw-container flex-shrink-0">
                              <label className="dw-label" title="Scarica Documento">
                                <input 
                                  type="checkbox" 
                                  className="dw-input" 
                                  onChange={(e: any) => {
                                    if (e.target.checked) {
                                      setTimeout(() => {
                                        triggerDownload(d.url, d.name);
                                      }, 2500);

                                      // Reset the checkbox animation after completed state
                                      setTimeout(() => {
                                        e.target.checked = false;
                                      }, 5500);
                                    }
                                  }}
                                />
                                <div className="dw-circle">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="dw-icon">
                                    <path d="M12 5v14M19 12l-7 7-7-7" />
                                  </svg>
                                  <div className="dw-square"></div>
                                </div>
                                <p className="dw-title">Scarica</p>
                                <p className="dw-title">Fatto</p>
                              </label>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[12.5px] text-[#8a8a8a] text-center italic py-8 bg-[#fafafa] rounded-xl border border-dashed border-[#e2e2e2]">
                          Nessun documento inserito dallo studio.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Chat assistance */}
                <div className="bg-white border border-[#e2e2e2] rounded-[26px] p-5 shadow-sm flex flex-col h-[410px]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[16px] font-extrabold text-[#161616]">Assistenza & Chat</h3>
                      <p className="text-[12px] text-[#8a8a8a] mb-3.5">Parla direttamente con i progettisti del tuo cantiere.</p>
                    </div>
                    {!isPreview && onRequestAppointment && studioMembers && studioMembers.length > 0 && (
                      <button
                        onClick={() => setApptReqOpen(true)}
                        className="shrink-0 bg-[#161616] hover:bg-black text-white text-[11.5px] font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 cursor-pointer border-none active:scale-95 transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Appuntamento
                      </button>
                    )}
                  </div>
                  
                  {/* Chat window viewport */}
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0">
                    {msgs.length > 0 ? (
                      msgs.map((m: any) => {
                        const isMine = m.role === 'cliente';
                        return (
                          <div key={m.id} className={`flex flex-col max-w-[85%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                            <div className={`p-3 rounded-[20px] text-[13px] leading-relaxed font-semibold shadow-xs ${
                              isMine 
                                ? 'bg-[#1b1b1b] text-white rounded-tr-none' 
                                : 'bg-[#fafafa] text-[#161616] rounded-tl-none border border-[#e2e2e2]'
                            }`}>
                              {m.text}
                            </div>
                            <span className="text-[9.5px] font-bold text-[#8a8a8a] mt-1 px-1">{m.name}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="my-auto py-10 flex flex-col items-center text-center">
                        <p className="text-[12.5px] text-[#8a8a8a] italic">Invia un messaggio per contattare lo studio.</p>
                      </div>
                    )}
                  </div>

                  {/* Input block always pinned at bottom of fixed size card */}
                  {!isPreview ? (
                    <div className="flex gap-2 items-center mt-3 border-t border-[#f5f5f5] pt-3 flex-shrink-0">
                      <input
                        type="text"
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                        className="flex-1 min-h-[38px] bg-[#fafafa] border border-[#e2e2e2] rounded-xl px-3 py-1.5 text-[13px] text-[#161616] placeholder-[#8a8a8a] focus:outline-none focus:border-gray-500 transition-colors"
                        placeholder="Scrivi un messaggio per lo studio..."
                      />
                      <button onClick={handleSend} className="bg-[#1b1b1b] hover:bg-black text-white h-[38px] w-[38px] rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 border-none">
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11.5px] text-[#8a8a8a] mt-3 italic text-center flex-shrink-0">Anteprima: chat disattivata</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentTab === 'b2b_preventivi' && (() => {
            const projEstimates = estimates.filter(e => e.projectId === p.id);
            return (
              <div className="flex flex-col gap-6 text-left font-sans text-[#161616]">
                <div className="bg-white text-zinc-900 border border-[#e5e5e5] rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs animate-[riseIn_0.22s_ease_both]">
                  <div>
                    <h3 className="text-[17px] font-extrabold flex items-center gap-2">
                       <ClipboardList className="w-4 h-4 text-slate-600" />
                       Gestionale Commesse & Offerte B2B
                    </h3>
                    <p className="text-[12.5px] text-[#8a8a8a] mt-1 pr-6 leading-relaxed font-semibold">
                      Compila e assevera i costi industriali dei lotti d'arredo per il cantiere <b className="text-zinc-900">{p.name}</b>. Onirico applicherà il ricarico concordato (+15%) prima della presentazione formale al cliente finale. I prezzi inseriti sono intesi per fornitura e posa in opera a regola d'arte.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {projEstimates.length === 0 ? (
                    <div className="bg-white border border-[#ececec] rounded-2xl p-10 text-center text-zinc-500">
                      Nessuna commessa o preventivo disponibile per questa divisione.
                    </div>
                  ) : (
                    projEstimates.map(est => {
                      const currentCost = b2bCostInputs[est.id] !== undefined ? b2bCostInputs[est.id] : String(est.baseCost || est.basePrice || '');
                      const currentNotes = b2bNotesInputs[est.id] !== undefined ? b2bNotesInputs[est.id] : (est.requestNotes || est.notes || '');
                      
                      const markupPct = est.markupPercent || 15;
                      const calculatedClientPrice = Number(currentCost) ? Number(currentCost) * (1 + markupPct / 100) : 0;

                      return (
                        <div key={est.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase">
                                LOTTO ID: #{est.id.slice(0, 5).toUpperCase()}
                              </span>
                              <h4 className="text-[15.5px] font-extrabold text-[#111] mt-2">{est.itemName}</h4>
                              <p className="text-[12.5px] text-[#555] mt-1">{est.itemDescription}</p>
                            </div>
                            
                            <span className={`text-[10px] font-mono tracking-wider font-extrabold px-3 py-1 rounded-full uppercase border ${
                              est.status === 'accettato' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              est.status === 'rifiutato' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              est.status === 'preventivato_partner' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {est.status === 'accettato' && 'Confermato dal Cliente (In Produzione) ✓'}
                              {est.status === 'rifiutato' && 'Rifiutato dal Cliente ✕'}
                              {est.status === 'preventivato_partner' && 'In attesa di revisione Onirico'}
                              {est.status === 'proposto_cliente' && 'Sotto esame del Cliente'}
                              {est.status === 'richiesto' && 'In fase d\'offerta commissionale'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                            <div>
                              <label className="text-[10.5px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Note e Specifiche Tecniche del Fornitore</label>
                              <textarea
                                value={currentNotes}
                                onChange={(e) => setB2bNotesInputs(prev => ({ ...prev, [est.id]: e.target.value }))}
                                placeholder="Indica peculiarità, schede di montaggio, o giustificazioni del listino..."
                                className="w-full text-xs border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-slate-500 font-sans min-h-[70px] resize-none"
                              />
                            </div>

                            <div className="flex flex-col justify-between">
                              <div>
                                <label className="text-[10.5px] font-black text-gray-400 uppercase tracking-widest block mb-1">Costo Base Industriale B2B (€)</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">€</span>
                                  <input
                                    type="number"
                                    value={currentCost}
                                    onChange={(e) => setB2bCostInputs(prev => ({ ...prev, [est.id]: e.target.value }))}
                                    placeholder="0,00"
                                    className="w-full text-xs font-mono font-extrabold border border-gray-200 rounded-xl py-2 pl-7 pr-3 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                  />
                                </div>
                              </div>

                              <div className="bg-slate-50/80 border border-slate-150 p-2 text-[11px] rounded-xl font-sans text-gray-500 mt-2 flex justify-between items-center">
                                <span>Prezzo preventivato al Cliente (inc. Ricarico Onirico +{markupPct}%):</span>
                                <b className="font-mono text-zinc-950 font-black">{eur(calculatedClientPrice)}</b>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                            <button
                              onClick={() => {
                                onSaveEstimate({
                                  ...est,
                                  baseCost: Number(currentCost),
                                  requestNotes: currentNotes,
                                  status: 'preventivato_partner',
                                  finalPrice: calculatedClientPrice
                                });
                                alert('Preventivo inviato con successo a Onirico Studio per il ricarico e l\'approvazione del cliente! ✓');
                              }}
                              className="bg-slate-700 hover:bg-slate-800 text-white font-extrabold text-[11.5px] py-1.5 px-4 rounded-xl border-none cursor-pointer tracking-wide shadow-sm active:scale-95 transition-all"
                            >
                              Invia Offerta Asseverata B2B ↳
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {currentTab === 'b2b_chat' && (
            <div className="flex flex-col gap-4 text-left font-sans text-[#161616]">
              <div className="bg-white border border-[#ececec] rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <h3 className="text-[16px] font-extrabold text-[#1a1a1a]">Canale di Coordinamento Cantiere (B2B)</h3>
                </div>
                <p className="text-[12.5px] text-[#8a8a8a] mb-4 leading-relaxed">
                  Messaggistica diretta integrata per risolvere nodi tecnici, spessori di rivestimento, date di posa in cantiere con i direttori artistici di Onirico.
                </p>

                <div className="bg-slate-50/60 border border-gray-200 rounded-2xl p-4 min-h-[250px] max-h-[400px] overflow-y-auto flex flex-col gap-3.5 shadow-inner">
                  {b2bMessages.map(m => {
                    const isSelf = m.sender.startsWith("Vincenzo") || m.sender.includes("(Partner)");
                    return (
                      <div key={m.id} className={`flex flex-col max-w-[80%] ${isSelf ? 'self-end bg-[#161616] text-white rounded-l-2xl rounded-tr-2xl' : 'self-start bg-white text-zinc-950 rounded-r-2xl rounded-tl-2xl border border-gray-200'} p-3 shadow-xs`}>
                        <span className={`text-[9.5px] ${isSelf ? 'text-slate-300' : 'text-slate-500'} font-bold`}>{m.sender}</span>
                        <p className="text-[12.5px] mt-1 font-semibold leading-relaxed">{m.text}</p>
                        <span className={`text-[8px] ${isSelf ? 'text-slate-400' : 'text-gray-450'} mt-1 self-end font-mono`}>{m.time}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={b2bChatInput}
                    onChange={(e) => setB2bChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && b2bChatInput.trim()) {
                        const newMsg = {
                          id: String(Date.now()),
                          sender: `${profile.name} (Partner)`,
                          text: b2bChatInput,
                          time: "Adesso"
                        };
                        setB2bMessages(prev => [...prev, newMsg]);
                        setB2bChatInput("");
                      }
                    }}
                    placeholder="Scrivi un messaggio tecnico di cantiere..."
                    className="flex-1 text-xs border border-gray-200 rounded-xl px-3 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-sans"
                  />
                  <button
                    onClick={() => {
                      if (!b2bChatInput.trim()) return;
                      const newMsg = {
                        id: String(Date.now()),
                        sender: `${profile.name} (Partner)`,
                        text: b2bChatInput,
                        time: "Adesso"
                      };
                      setB2bMessages(prev => [...prev, newMsg]);
                      setB2bChatInput("");
                    }}
                    className="bg-[#161616] hover:bg-neutral-800 text-white font-extrabold text-xs px-4 rounded-xl border-none cursor-pointer transition-all active:scale-95"
                  >
                    Invia
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'marketing' && (
            <div className="flex flex-col gap-6">
              {/* Marketing KPI Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-[#ececec] rounded-2xl p-4.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono tracking-widest text-[#8a8a8a] uppercase font-bold">Budget Totale</span>
                    <DollarSign className="w-3.5 h-3.5 text-[#161616]" />
                  </div>
                  <p className="text-[20px] font-extrabold text-[#161616] mt-2">€7.500,00</p>
                  <p className="text-[11px] text-[#8a8a8a] mt-0.5 font-sans">Allocato per la campagna</p>
                </div>
                <div className="bg-white border border-[#ececec] rounded-2xl p-4.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono tracking-widest text-[#8a8a8a] uppercase font-bold">Speso Meta Ads</span>
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <p className="text-[20px] font-extrabold text-[#161616] mt-2">€3.240,00</p>
                  <p className="text-[11px] text-green-600 font-semibold mt-0.5 font-sans">Ottimizzato al 43%</p>
                </div>
                <div className="bg-white border border-[#ececec] rounded-2xl p-4.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono tracking-widest text-[#8a8a8a] uppercase font-bold">Click-Through Rate</span>
                    <Target className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <p className="text-[20px] font-extrabold text-[#161616] mt-2">3.82%</p>
                  <p className="text-[11px] text-blue-600 font-semibold mt-0.5 font-sans">Media settore: 1.8%</p>
                </div>
                <div className="bg-white border border-[#ececec] rounded-2xl p-4.5">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono tracking-widest text-[#8a8a8a] uppercase font-bold">Costo Acquisizione</span>
                    <Smartphone className="w-3.5 h-3.5 text-[#161616]" />
                  </div>
                  <p className="text-[20px] font-extrabold text-[#161616] mt-2">€12,40</p>
                  <p className="text-[11px] text-[#8a8a8a] mt-0.5 font-sans">Costo per lead (CPA)</p>
                </div>
              </div>

              {/* Marketing Main Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Social & Reels Approval Hub */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="bg-white border border-[#ececec] rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h3 className="text-[16px] font-extrabold text-[#1a1a1a]">Social Feed & Campaign Approval Hub</h3>
                    </div>
                    <p className="text-[12.5px] text-[#8a8a8a] mb-5 leading-relaxed font-sans">
                      Anteprima e approvazione dei post social e dei video creativi preparati dalla controllata Onirico Strategico prima della pubblicazione definitiva sui canali META.
                    </p>

                    <div className="flex flex-col gap-4">
                      {([
                        {
                          id: 'post-1',
                          title: 'Video-tour emozionale camere storiche e volte a stella',
                          type: 'Instagram Reel',
                          length: '15 secondi / Ratio 9:16',
                          src: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=600',
                          caption: 'Nel cuore del Salento, dove la pietra di Lecce incontra l\'eleganza minimalista delle nostre realizzazioni sartoriali. Ogni volta racconta un segreto, ogni restauro custode di luce. ✨ #oniricostudio #masseriasalentina #interiordesign'
                        },
                        {
                          id: 'post-2',
                          title: 'Storytelling sulle origini e restauro conservativo del trullo saraceno',
                          type: 'Meta Ad Swipe Carousel',
                          length: '4 Card Grafiche illustrative',
                          src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600',
                          caption: 'La salvaguardia dell\'architettura rurale salentina come valore progettuale supremo. Scopri le 4 fasi di consolidamento strutturale che abbiamo implementato a Ostuni.'
                        },
                        {
                          id: 'post-3',
                          title: 'Drone clip: Veduta aerea del tramonto dorato sulla Masseria',
                          type: 'TikTok / IG Reels Video',
                          length: '12 secondi, Drone FPV',
                          src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
                          caption: 'La magia dell\'ora d\'oro sul nostro cantiere a picco sulle scogliere di Otranto. Un sogno ad occhi aperti che si materializza giorno dopo giorno. 🌅'
                        }
                      ]).map(post => {
                        const approved = approvedMarketingPosts[post.id];
                        return (
                          <div key={post.id} className="border border-[#ececec] rounded-2xl p-4 flex flex-col md:flex-row gap-4 hover:shadow-xs transition-shadow">
                            <div className="w-full md:w-[130px] h-[130px] rounded-xl overflow-hidden bg-[#fafafa] flex-shrink-0 relative border border-[#f0f0f0]">
                              <img src={post.src} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                                {post.type}
                              </span>
                            </div>
                            <div className="flex-1 flex flex-col justify-between text-left">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-mono text-[#8a8a8a]">{post.length}</span>
                                  <span className={`text-[10px] uppercase font-bold py-0.5 px-2 rounded-full ${
                                    approved 
                                      ? 'bg-green-50 text-green-600 border border-green-200' 
                                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                                  }`}>
                                    {approved ? 'APPROVATO DA TE ✓' : 'IN ATTESA APPROVAZIONE'}
                                  </span>
                                </div>
                                <h4 className="text-[14px] font-extrabold text-[#161616] mt-1 leading-snug">{post.title}</h4>
                                <p className="text-[11.5px] text-[#fff] bg-[#161616] rounded-xl p-2.5 mt-2 font-mono leading-relaxed select-all">
                                  {post.caption}
                                </p>
                              </div>

                              <div className="flex items-center justify-end gap-2 mt-3.5 border-t border-[#f5f5f5] pt-3">
                                {approved ? (
                                  <div className="flex items-center gap-1 text-green-600 text-xs font-black">
                                    <CheckCircle2 className="w-4 h-4" /> Approvato per la pianificazione automatica
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setApprovedMarketingPosts(prev => ({ ...prev, [post.id]: true }));
                                      }}
                                      className="bg-[#161616] hover:bg-black text-white text-[11px] font-bold py-1.5 px-3 rounded-lg border-none cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                                    >
                                      Approva Contenuto ✓
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sidebar Campaign details */}
                <div className="flex flex-col gap-4">
                  <div className="bg-white border border-[#ececec] rounded-3xl p-5 text-left">
                    <h3 className="text-[14.5px] font-extrabold text-[#1a1a1a] mb-2 font-sans">Dati & Canali Campagna</h3>
                    <div className="flex flex-col gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-[#8a8a8a] uppercase block">Nome Campagna Interna</span>
                        <b className="text-[12.5px] text-[#161616] block mt-0.5">ONIRICO-WEB-SUMMER-2026</b>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#8a8a8a] uppercase block">Geotargeting</span>
                        <b className="text-[12.5px] text-[#161616] block mt-0.5">Puglia, Lombardia, Svizzera, Germania (Raggio 50km)</b>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#8a8a8a] uppercase block">Canali Attivi</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className="bg-[#fafafa] border border-[#e2e2e2] text-[#161616] text-[10.5px] font-semibold py-0.5 px-2 rounded-lg">Instagram Feed</span>
                          <span className="bg-[#fafafa] border border-[#e2e2e2] text-[#161616] text-[10.5px] font-semibold py-0.5 px-2 rounded-lg">Facebook Ads</span>
                          <span className="bg-[#fafafa] border border-[#e2e2e2] text-[#161616] text-[10.5px] font-semibold py-0.5 px-2 rounded-lg">Google Location Search</span>
                        </div>
                      </div>
                      <div className="border-t border-[#f5f5f5] pt-3">
                        <span className="text-[10px] font-mono text-[#8a8a8a] uppercase block">Referente Onirico</span>
                        <b className="text-[12.5px] text-[#161616] block mt-0.5">Arch. Mario Bianchi (Brand Director & Strategist)</b>
                        <p className="text-[11px] text-gray-400 mt-1 font-sans">Puoi inviare un messaggio nella tab "Documenti & Chat" se desideri richiedere formati alternativi o modifiche al copy.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'preventivi' && (() => {
            const projEstimates = estimates.filter(e => e.projectId === p.id);
            return (
              <div className="flex flex-col gap-6 text-left">
                {/* Header info */}
                <div className="bg-white border border-[#ececec] rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[16px] font-extrabold text-[#161616] flex items-center gap-2">
                       <ClipboardList className="w-4 h-4 text-emerald-500" />
                       Approvazione Preventivi e Forniture Partner
                    </h3>
                    <p className="text-[12.5px] text-[#8a8a8a] mt-1 pr-6 leading-relaxed font-sans">
                      Gestisci direttamente le proposte d’acquisto selezionate dai nostri tecnici per le finiture, infissi e arredi di pregio del tuo immobile. Onirico applica la propria marginalità di interposizione certificata. Puoi accettare o rifiutare ciascuna voce singolarmente.
                    </p>
                  </div>
                  <div className="bg-[#fafafa] border border-[#e2e2e2] rounded-2xl p-4 flex flex-col min-w-[200px] text-center">
                    <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Totale Approvato Client</span>
                    <b className="text-[20px] font-mono font-extrabold text-emerald-600 mt-1">
                      {eur(projEstimates.filter(x => x.status === 'accettato').reduce((acc, cr) => acc + cr.finalPrice, 0))}
                    </b>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      {projEstimates.filter(x => x.status === 'accettato').length} preventivi confermati
                    </span>
                  </div>
                </div>

                {projEstimates.length === 0 ? (
                  <div className="bg-white border border-[#ececec] rounded-3xl p-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#fafafa] border border-[#e2e2e2] text-gray-400 flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <b className="text-[#161616] text-[15px] font-extrabold block">Nessun preventivo caricato</b>
                    <p className="text-[13px] text-[#8a8a8a] mt-1 max-w-[400px] mx-auto leading-relaxed font-sans">
                      Stiamo raccogliendo e asseverando i computi tecnici dei nostri fornitori per questo cantiere. A breve compariranno qui le proposte per la tua approvazione.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {projEstimates.map(est => {
                      return (
                        <div key={est.id} className="bg-white border border-[#ececec] rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start justify-between hover:shadow-xs transition-shadow">
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-[#f0f0f0] text-gray-700 text-[10px] font-mono py-0.5 px-2 rounded-md font-bold uppercase">
                                Fornitore Partner: {est.partnerName}
                              </span>
                              
                              <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-md ${
                                est.status === 'accettato' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : ''
                              } ${
                                est.status === 'rifiutato' ? 'bg-rose-50 text-rose-600 border border-rose-200' : ''
                              } ${
                                est.status === 'proposto_cliente' ? 'bg-amber-50 text-amber-600 border border-amber-200' : ''
                              } ${
                                est.status === 'richiesto' ? 'bg-gray-100 text-gray-500 border border-gray-200' : ''
                              }`}>
                                {est.status === 'accettato' && 'Approvato ✓'}
                                {est.status === 'rifiutato' && 'Respinto ✕'}
                                {est.status === 'proposto_cliente' && 'In attesa d\'approvazione'}
                                {est.status === 'richiesto' && 'In fase di offerta'}
                              </span>
                            </div>

                            <h4 className="text-[15.5px] font-extrabold text-[#161616] mt-2 leading-snug">{est.itemName}</h4>
                            
                            {est.requestNotes && (
                              <p className="text-[12px] text-gray-500 mt-2 italic bg-[#fafafa] border-l-2 border-[#161616] pl-2 py-0.5">
                                « {est.requestNotes} »
                              </p>
                            )}

                            {est.notes && (
                              <p className="text-[11.5px] text-[#8a8a8a] mt-1.5 leading-relaxed font-sans">
                                <span className="font-bold text-[#161616]">Note direzione lavori:</span> {est.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-3 min-w-[210px] w-full md:w-auto border-t md:border-t-0 border-[#f5f5f5] pt-3 md:pt-0">
                            <div className="text-right flex flex-col md:items-end w-full">
                              <span className="text-[9px] font-mono text-[#8a8a8a] uppercase block tracking-wider font-semibold">PREZZO FINALE (IVA incl.)</span>
                              <b className="text-[20px] font-mono font-extrabold text-[#161616] block mt-0.5">
                                {eur(est.finalPrice)}
                              </b>
                              <span className="text-[10px] text-[#8a8a8a] block mt-0.5 font-mono">
                                Base: {eur(est.basePrice)} + Ricarico {est.markupPercent}%
                              </span>
                            </div>

                            {est.status === 'proposto_cliente' && (
                              <div className="flex items-center gap-2 w-full mt-1.5 justify-end">
                                <button
                                  onClick={() => {
                                    if (onSaveEstimate) {
                                      onSaveEstimate({ ...est, status: 'rifiutato', updatedAt: Date.now() });
                                    }
                                  }}
                                  className="flex-1 md:flex-initial bg-white hover:bg-neutral-50 text-rose-600 hover:text-rose-700 border border-[#e2e2e2] text-xs font-black py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-95"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Rifiuta
                                </button>
                                <button
                                  onClick={() => {
                                    if (onSaveEstimate) {
                                      onSaveEstimate({ ...est, status: 'accettato', updatedAt: Date.now() });
                                    }
                                  }}
                                  className="flex-1 md:flex-initial bg-[#161616] hover:bg-black text-emerald-400 hover:text-emerald-300 border-none text-xs font-black py-2 px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-95"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Accetta
                                </button>
                              </div>
                            )}

                            {est.status === 'accettato' && (
                              <div className="text-emerald-600 text-xs font-black flex items-center gap-1 mt-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approvato da te
                              </div>
                            )}

                            {est.status === 'rifiutato' && (
                              <div className="text-rose-600 text-xs font-black flex items-center gap-1 mt-1 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" /> Respinto da te
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {currentTab === 'finanze' && (() => {
            // Filter active invoices and scadenze for this project
            const projInvoices = activeInvoices.filter((inv: any) => inv.projectId === p.id);
            const projScadenze = scadenze.filter((sc: any) => sc.projectId === p.id);
            
            // Calculate totals
            const totalInvoiced = projInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
            const paidInvoices = projInvoices.filter((inv: any) => inv.status === 'pagata' || inv.status === 'Paid').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
            const pendingInvoices = totalInvoiced - paidInvoices;

            return (
              <div className="flex flex-col gap-6 animate-[riseIn_0.22s_ease_both] text-left font-sans text-stone-900 mt-2">
                {/* Header overview */}
                <div className="bg-white border border-[#e5e5e5] rounded-[24px] p-6 shadow-xs">
                  <h3 className="text-[17px] font-extrabold flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Contabilità e Stato dei Pagamenti
                  </h3>
                  <p className="text-[12.5px] text-[#8a8a8a] leading-relaxed">
                    Consulta la rendicontazione dei pagamenti, lo stato delle fatture attive inviate tramite SDI e lo scadenziario finanziario concordato per la tua commessa: <b className="text-[#161616]">{p.name}</b>.
                  </p>
                </div>

                {/* KPI Boxes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-[#8a8a8a] tracking-wider block">Totale Fatturato (SDI)</span>
                    <b className="text-[20px] font-black mt-1 block text-stone-800">{eur(totalInvoiced || 12500)}</b>
                    <span className="text-[11px] text-stone-500 mt-1 block">{projInvoices.length} fatture emesse ad oggi</span>
                  </div>

                  <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Ricevuto / Pagato</span>
                    <b className="text-[20px] font-black mt-1 block text-emerald-700">{eur(paidInvoices || 9000)}</b>
                    <span className="text-[11px] text-emerald-600 mt-1 block">Riconciliato con saldi bancari</span>
                  </div>

                  <div className={`rounded-2xl p-5 border shadow-xs ${pendingInvoices > 0 ? 'bg-amber-50/10 border-amber-200' : 'bg-white border-[#e5e5e5]'}`}>
                    <span className="text-[10px] uppercase font-bold text-[#8a8a8a] tracking-wider block">In Attesa di Saldo</span>
                    <b className="text-[20px] font-black mt-1 block text-amber-700">{eur(pendingInvoices || 3500)}</b>
                    <span className="text-[11px] text-stone-500 mt-1 block">A scadenze programmate</span>
                  </div>
                </div>

                {/* Main section: Invoices + Milestone Scadenze */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left component: SDI Invoices list */}
                  <div className="lg:col-span-7 bg-white border border-[#e5e5e5] rounded-[24px] p-6 shadow-xs">
                    <div className="flex justify-between items-center border-b border-[#f5f5f5] pb-4 mb-4">
                      <b className="text-[14px] font-black text-[#161616]">Fatture Elettroniche Attive (SDI)</b>
                      <span className="text-[10.5px] bg-slate-100 text-[#1a1a1a] font-bold px-2 py-0.5 rounded-lg border border-slate-200">Canale Onirico S.p.A.</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {projInvoices.length === 0 ? (
                        <div className="py-12 text-center text-stone-400 italic text-[12.5px] bg-stone-50/30 rounded-2xl border border-dashed border-stone-200">
                          Nessuna fattura emessa per questa commessa.
                        </div>
                      ) : (
                        projInvoices.map((inv: any) => (
                          <div key={inv.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 rounded-xl border border-stone-150 bg-stone-50/30">
                            <div>
                              <div className="flex items-center gap-2">
                                <b className="text-[13.5px] font-black text-stone-950">{inv.id || `FAT-${inv.date?.replace(/-/g, '') || '2026-003'}`}</b>
                                {inv.isSal && (
                                  <span className="text-[9.5px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded uppercase">SAL</span>
                                )}
                              </div>
                              <span className="text-[11px] text-stone-500 font-medium block mt-1">{inv.description || inv.desc || 'Acconto onorari professionali'}</span>
                              <span className="text-[10px] text-stone-400 font-semibold block mt-1 font-mono">{fmtDay(inv.date || inv.dueDate)}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2 sm:mt-0 font-mono">
                              <span className="text-[14px] font-black text-stone-800">{eur(Number(inv.amount))}</span>
                              <span className={`text-[10.5px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                                inv.status === 'pagata' || inv.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {inv.status === 'pagata' || inv.status === 'Paid' ? 'PAGATA ✓' : 'PENDENTE'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right component: Expected scadenze milestone */}
                  <div className="lg:col-span-5 bg-white border border-[#e5e5e5] rounded-[24px] p-6 shadow-xs">
                    <div className="border-b border-[#f5f5f5] pb-4 mb-4">
                      <b className="text-[14px] font-black block text-[#161616]">Scadenziario dei Pagamenti</b>
                      <span className="text-[11px] text-[#8a8a8a] mt-0.5 block">Monitora le date di scadenza per acconti e saldi.</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {projScadenze.length === 0 ? (
                        <div className="py-8 text-center text-stone-400 italic text-[12px] bg-stone-50/30 rounded-2xl border border-dashed border-stone-200">
                          Nessuna scadenza programmata per questo progetto.
                        </div>
                      ) : (
                        projScadenze.map((sc: any) => (
                          <div key={sc.id} className="p-3.5 rounded-xl border border-stone-150 flex justify-between items-center bg-stone-50/25">
                            <div>
                              <b className="text-[12.5px] font-bold text-stone-800 block leading-tight">{sc.desc || sc.description || 'Acconto lavori'}</b>
                              <span className="text-[10.5px] text-stone-400 font-semibold block mt-1 font-mono">{fmtDay(sc.date || sc.dueDate)}</span>
                            </div>
                            <div className="text-right font-mono">
                              <span className="text-[13px] font-black block text-stone-800">{eur(Number(sc.amount))}</span>
                              <span className={`text-[10px] font-bold ${sc.isPaid ? 'text-emerald-700' : 'text-amber-600'}`}>
                                {sc.isPaid ? 'SALDATA' : 'DA SALDARE'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {currentTab === 'blog' && (() => {
            const filteredBlogPosts = BLOG_POSTS.filter(post => {
              const matchesCategory = blogFilter === 'Tutti' || post.category === blogFilter;
              const matchesSearch = post.title.toLowerCase().includes(blogSearch.toLowerCase()) || 
                                    post.excerpt.toLowerCase().includes(blogSearch.toLowerCase()) ||
                                    post.category.toLowerCase().includes(blogSearch.toLowerCase());
              return matchesCategory && matchesSearch;
            });

            return (
              <div className="flex flex-col gap-6 animate-[riseIn_0.22s_ease_both]">
                {selectedPostId ? (() => {
                  const post = BLOG_POSTS.find(b => b.id === selectedPostId);
                  if (!post) return null;
                  return (
                    <motion.div
                      key="blog-post-detail"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-white border border-[#e2e2e2] rounded-[26px] p-6 shadow-sm max-w-3xl mx-auto w-full text-left"
                    >
                      {/* Back Button */}
                      <button
                        onClick={() => setSelectedPostId(null)}
                        className="inline-flex items-center gap-2 text-[12.5px] font-extrabold text-[#8a8a8a] hover:text-[#161616] mb-6 border-none bg-transparent cursor-pointer transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" /> Torna a tutti gli articoli
                      </button>

                      {/* Post Hero Image */}
                      <div className="w-full h-[220px] md:h-[305px] rounded-2xl overflow-hidden mb-6 shadow-sm relative">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-4 left-4 bg-black/75 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white/20">
                          {post.category}
                        </span>
                      </div>

                      {/* Metadata & Title */}
                      <div className="flex items-center gap-4 text-xs font-semibold text-[#8a8a8a] mb-3">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {post.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {post.readTime} di lettura
                        </span>
                      </div>

                      <h2 className="text-[23px] md:text-[27px] font-black text-[#161616] leading-tight tracking-tight mb-4 font-sans text-left">
                        {post.title}
                      </h2>

                      {/* Intro */}
                      <p className="text-[14.5px] font-bold text-[#4a4a4a] leading-relaxed italic border-l-[3px] border-[#161616] pl-4 mb-6">
                        {post.intro}
                      </p>

                      <div className="flex flex-col gap-5 text-[13.5px] font-semibold text-[#555] leading-relaxed text-left font-sans">
                        {post.sections.map((section, idx) => (
                          <div key={idx} className="flex flex-col gap-1.5">
                            <h3 className="text-[15.5px] font-extrabold text-[#161616] tracking-tight mt-2">
                              {idx + 1}. {section.title}
                            </h3>
                            {section.paragraphs.map((p, pIdx) => (
                              <p key={pIdx} className="mb-2">
                                {p}
                              </p>
                            ))}
                          </div>
                        ))}

                        {post.quote && (
                          <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 my-4 italic text-amber-900 font-bold relative text-[13px]">
                            <span className="absolute -top-3 left-4 bg-white border border-amber-200/50 text-[9px] font-extrabold uppercase py-0.5 px-2.5 rounded-full text-amber-800">
                              Punto di vista Onirico
                            </span>
                            "{post.quote}"
                          </div>
                        )}

                        {post.pointsTitle && (
                          <div className="mt-4">
                            <h4 className="text-[14px] font-extrabold text-[#161616] mb-2">{post.pointsTitle}</h4>
                            <ul className="list-disc pl-5 flex flex-col gap-1.5">
                              {post.points?.map((pt, pIdx) => (
                                <li key={pIdx} className="text-[#555] font-semibold">{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="mt-8 pt-6 border-t border-[#f5f5f5] flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2.5 self-start">
                          <span className="w-10 h-10 rounded-full bg-zinc-950 text-white flex items-center justify-center font-bold text-[13px]">
                            ON
                          </span>
                          <div className="text-left">
                            <b className="block text-[13px] font-extrabold text-[#161616]">Team Onirico Design</b>
                            <small className="block text-[11px] text-[#8a8a8a] font-semibold">Studio Associato d\'Ingegneria & Design</small>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (p && p.id) {
                              onSendClientMessage(p.id, `Salve, ho letto l\'articolo del blog "${post.title}" e vorrei fare delle domande su questi approcci applicati al mio cantiere.`);
                            }
                            setActiveSubTab('documenti');
                          }}
                          className="bg-[#161616] hover:bg-black text-white text-[12.5px] font-extrabold py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all border-none font-sans"
                        >
                          <MessageSquare className="w-4 h-4" /> Discuti l\'articolo in chat
                        </button>
                      </div>
                    </motion.div>
                  );
                })() : (
                  <div className="flex flex-col gap-6">
                    {/* Blog Header & Slogan Banner */}
                    <div className="bg-[#161616] text-white rounded-[26px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm border border-zinc-800 text-left">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#a8a8a8]">Design your vision</span>
                        </div>
                        <h2 className="text-[21px] md:text-[24px] font-black tracking-tight leading-tight mb-2">Onirico Blog</h2>
                        <p className="text-[12.5px] text-[#cccccc] font-semibold max-w-[500px]">
                          Approfondimenti tecnici, tendenze progettuali e i retroscena costruttivi delle nostre realizzazioni in tempo reale.
                        </p>
                      </div>
                      <a
                        href="https://oniricodesign.com/blog/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/10 hover:bg-white text-white hover:text-black font-extrabold text-[12px] py-2 px-4 rounded-xl border border-white/20 hover:border-transparent flex items-center gap-1.5 transition-all cursor-pointer select-none shrink-0"
                      >
                        Visita oniricodesign.com <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Search and Categories row */}
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                      {/* Categories tag pills */}
                      <div className="flex items-center bg-[#eaeaea] border border-[#dcdcdc] p-[3px] rounded-2xl gap-[2px] overflow-x-auto max-w-full">
                        {['Tutti', 'Architettura', 'Ingegneria', 'Restauro', 'Interior Design'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setBlogFilter(cat)}
                            className={`text-[12px] font-extrabold px-[14px] py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap border-none ${
                              blogFilter === cat 
                                ? 'bg-[#161616] text-white shadow-xs' 
                                : 'text-[#555] hover:text-[#161616] bg-transparent'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Integrated search inside blog tab */}
                      <div className="relative min-w-[200px] flex-1 sm:flex-none">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={blogSearch}
                          onChange={(e) => setBlogSearch(e.target.value)}
                          placeholder="Cerca un articolo..."
                          className="pl-9 pr-4 py-1.5 text-[12px] font-black text-[#161616] rounded-xl border border-[#e2e2e2] bg-white focus:outline-none focus:border-[#161616] w-full sm:w-[220px] placeholder-gray-400 font-sans shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Blog Posts list */}
                    {filteredBlogPosts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                        {filteredBlogPosts.map(post => (
                          <motion.div
                            key={post.id}
                            layoutId={`blog-post-card-${post.id}`}
                            onClick={() => {
                              setSelectedPostId(post.id);
                              // Smooth scroll up so readers start at top of the article
                              const element = document.getElementById('activeSubTabIndicator');
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              } else {
                                window.scrollTo({ top: 120, behavior: 'smooth' });
                              }
                            }}
                            className="bg-white border border-[#e2e2e2] rounded-[24px] overflow-hidden hover:border-[#161616] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                          >
                            <div>
                              {/* Image with category */}
                              <div className="h-[180px] w-full overflow-hidden relative bg-gray-100">
                                <img
                                  src={post.image}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="absolute top-3 left-3 bg-[#161616] text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                                  {post.category}
                                </span>
                              </div>

                              {/* Info */}
                              <div className="p-5 pb-2">
                                <div className="flex items-center gap-3 text-[10.5px] font-bold text-gray-400 mb-2">
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                                </div>
                                <h3 className="text-[15px] font-black text-[#161616] leading-snug mb-2 font-sans tracking-tight">
                                  {post.title}
                                </h3>
                                <p className="text-[12px] text-[#8a8a8a] font-semibold line-clamp-3 leading-relaxed mb-4">
                                  {post.excerpt}
                                </p>
                              </div>
                            </div>

                            <div className="px-5 pb-5 pt-1">
                              <span className="text-[12px] font-black text-[#161616] group-hover:text-black flex items-center gap-1 border-b border-transparent group-hover:border-[#161616] w-fit pb-0.5 transition-all">
                                Leggi articolo <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                        <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-[13px] text-gray-400 italic font-semibold">Nessun articolo blog corrisponde ai filtri impostati.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Task description detailed popup modal */}
      <AnimatePresence>
        {selectedTaskForModal && (() => {
          const info = getTaskDetail(selectedTaskForModal.title, selectedTaskForModal.phase);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="bg-white rounded-[28px] max-w-[485px] w-full border border-[#e2e2e2] shadow-2xl overflow-hidden text-left flex flex-col"
              >
                {/* Header section - Luxury light theme matching app */}
                <div className="bg-white p-6 pb-4 border-b border-[#f5f5f5] flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] tracking-wider font-extrabold uppercase bg-amber-400 text-black px-2.5 py-0.5 rounded font-mono">
                      {info.badge || 'Iter Tecnico'}
                    </span>
                  </div>
                  <h3 className="text-[17.5px] font-black leading-tight tracking-tight mt-1 text-[#161616]">
                    {selectedTaskForModal.title}
                  </h3>
                  <p className="text-[10px] text-[#8a8a8a] tracking-wide uppercase font-bold">
                    Fase: {selectedTaskForModal.phase}
                  </p>
                </div>

                {/* Content body */}
                <div className="p-6 flex flex-col gap-4 font-sans text-sm">
                  <div>
                    <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#8a8a8a] mb-1">Descrizione di dettaglio</h4>
                    <p className="text-[#333] text-[13.5px] leading-relaxed font-semibold">
                      {info.desc}
                    </p>
                  </div>

                  <hr className="border-none h-px bg-[#f1f1f1] my-1" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#8a8a8a] mb-1">Professionista Incaricato</h4>
                      <p className="text-[#161616] text-[13px] font-extrabold">
                        {info.role}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#8a8a8a] mb-1">Tempistica Prevista</h4>
                      <p className="text-[#161616] text-[13px] font-extrabold">
                        {selectedTaskForModal.done ? '✓ Completato' : info.dueTime}
                      </p>
                    </div>
                  </div>

                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSendClientMessage(p.id, `Salve, vorrei ricevere maggiori informazioni riguardo al task "${selectedTaskForModal.title}" nella fase "${selectedTaskForModal.phase}".`);
                        setSelectedTaskForModal(null);
                        setActiveSubTab('documenti');
                      }}
                      className="w-full bg-[#161616] hover:bg-black text-white text-[12.5px] font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 border-none shadow-sm font-sans"
                    >
                      <MessageSquare className="w-4 h-4" /> Chiedi più informazioni allo studio
                    </button>
                  </div>
                </div>

                {/* Footer with actions */}
                <div className="border-t border-[#f5f5f5] bg-[#fafafa] p-4 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    {selectedTaskForModal.done ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    )}
                    <span className="text-[11.5px] font-extrabold text-[#555]">
                      Stato: {selectedTaskForModal.done ? 'Pratica Evasa' : 'In Lavorazione'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTaskForModal(null)}
                    className="bg-[#f0f0f0] hover:bg-gray-200 text-[#161616] border border-[#e2e2e2] text-[12.5px] font-extrabold py-2 px-5 rounded-xl cursor-pointer transition-all"
                  >
                    Chiudi
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

// --- Richiesta appuntamento dal portale (cliente/partner) ---
const AppointmentRequestModal: React.FC<{
  open: boolean;
  onClose: () => void;
  members: UserProfile[];
  onRequest: (memberUid: string, memberName: string, date: string, time: string, note: string) => void;
}> = ({ open, onClose, members, onRequest }) => {
  const [done, setDone] = useState(false);
  const [member, setMember] = useState(members[0]?.uid || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  const submit = () => {
    if (!member || !date) return;
    const m = members.find((x) => x.uid === member);
    onRequest(member, m?.name || '', date, time, note.trim());
    setDone(true);
    setTimeout(() => {
      onClose();
      setDone(false);
      setDate(''); setTime(''); setNote('');
    }, 1600);
  };

  if (!open) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
          <div className="bg-white rounded-[24px] w-full max-w-[420px] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <b className="text-[16px] text-[#161616] block">Richiesta inviata</b>
                <p className="text-[13px] text-[#8a8a8a] mt-1">Il membro dello studio dovrà confermare l'appuntamento.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[17px] font-black text-[#161616]">Richiedi appuntamento</h3>
                  <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 border-none bg-transparent cursor-pointer"><XCircle className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-col gap-3 text-left">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Con</span>
                    <select value={member} onChange={(e) => setMember(e.target.value)} className="h-10 border border-[#e2e2e2] rounded-xl px-3 text-[14px]">
                      {members.map((m) => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Data</span>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 border border-[#e2e2e2] rounded-xl px-3 text-[14px]" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Ora</span>
                      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10 border border-[#e2e2e2] rounded-xl px-3 text-[14px]" />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a]">Motivo</span>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="border border-[#e2e2e2] rounded-xl p-3 text-[14px] resize-none" placeholder="Es. sopralluogo, revisione progetto…" />
                  </label>
                  <button onClick={submit} className="mt-1 py-2.5 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[13px] cursor-pointer border-none flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Invia richiesta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
