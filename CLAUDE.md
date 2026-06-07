# CLAUDE.md — Onirico Studio OS

Contesto progetto per Claude Code. Leggere **tutto** prima di modificare.

## 1. Cos'è
Gestionale/ERP web dello **studio Onirico** (architettura/ingegneria, Puglia) e
delle sue società controllate. Single-page app React con backend **Firebase
Realtime Database**, accesso **Google** con approvazione admin, deploy su
**GitHub Pages**. Tutto ciò che accade nell'app è **condiviso in tempo reale**
sul Database (niente dati locali, niente dati finti).

Le "divisioni"/società:
- **Studio** — architettura, pratiche edilizie (catasto, CILA/SCIA, APE…).
- **Materico** — società controllata: riceve richieste clienti (forniture/posa),
  le subappalta a imprese partner aggiungendo un margine, coordina i lavori.
- **Unico** — società controllata: acquisto immobili → ristrutturazione (via
  Materico) → rivendita, con investitori. *(modulo non ancora costruito)*
- **Strategico** — società controllata: marketing per le altre società e per
  clienti esterni. *(modulo dedicato non ancora costruito)*

## 2. Stack
- React 19 + TypeScript, **Vite 6**, Tailwind v4 (`@tailwindcss/vite`).
- `firebase` v11 (Auth Google + Realtime Database).
- `three` r0.184 (viewer 3D), `motion` (Framer Motion), `lucide-react` (icone).
- Routing **a hash** (`#dashboard`, `#progetto/<id>`…), nessun router lib.
- `base: './'` in `vite.config.ts` → funziona su GitHub Pages a qualsiasi path.

## 3. Avvio / build / deploy
```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # output in dist/ (esbuild: NON fa type-check)
```
- Deploy automatico: `.github/workflows/deploy.yml` (push su `main` → Pages).
- **Nota**: `npx tsc --noEmit` riporta errori di tipo *preesistenti* nel codice
  ereditato da Google AI Studio; **non bloccano** `vite build` (esbuild ignora i
  tipi). Non inseguire quegli errori; verifica sempre con `npm run build`.

## 4. Architettura
- **`src/App.tsx`** (~3100 righe) è il cuore: stato globale, sottoscrizioni
  Firebase, tutti gli handler, il router a hash (funzione `renderView()` con uno
  `switch(route)`), i modali, le notifiche. La maggior parte delle feature si
  cabla qui.
- **`src/components/`**: viste e widget (vedi sotto).
- **`src/firebase.ts`**: init Firebase + helper. Config reale già inclusa
  (progetto `oniricoapp-48953`). Espone: `loginWithGoogle`, `logoutGoogle`,
  `watchAuth`, `watchAccounts`, `watchOwnAccount`, `getAccounts`, `setAccount`,
  `updateAccount`, `removeAccount`, e i generici `watchNode(path,cb)`,
  `getNode(path)`, `writeNode(path,val)`, `updateNode`, `removeNode`, `clean()`.
  `clean()` = `JSON.parse(JSON.stringify(v))` per togliere `undefined` (Firebase
  li rifiuta) — **usare sempre** scrivendo sul DB (writeNode lo fa già).
- **`src/types.ts`**: tutte le interfacce (UserProfile, Project, Task, Template,
  Appointment, MatericoRequest, ecc.).
- **`firebase-rules.json`**: regole del Realtime Database (da pubblicare a mano
  su Firebase Console quando si aggiungono nodi).

### Componenti principali
`Sidebar`/`Navbar` (nav desktop/mobile), `DashboardView`, `CalendarView`
(agenda Giorno·Settimana·Mese), `ProjectsView`, `DocumentsView`, `CrmView`
(pipeline lead + fornitori), `MatericoView` (hub operatore Materico),
`MatericoPortal` (lato cliente/partner), `FinanzeView`, `TeamView`,
`ClientPortalView` (portale cliente/partner, ~2400 righe), `AccessRequests`
(approvazione accessi), `GoogleLogin`, `Modal`, `ThreeDProgress` (GLB a 13 step),
`SmartText`, `AppleSwitch`, `MotionTabsMenu`, `PinnedList`, `StatusCard`,
`InteractiveView`.

## 5. Autenticazione & ruoli (IMPORTANTE)
- Accesso solo con **Google**. Gli account vivono nel nodo **`users/<uid>`**.
- **Bootstrap admin**: il primo utente in assoluto, **oppure** l'email
  `giorgio.pascali990@gmail.com`, diventa `role:'admin', active:true,
  status:'approved'`. Definito sia nel codice (effetto auth in App) sia nelle
  regole (whitelist email).
- Ogni nuovo accesso = record `status:'pending', active:false` → resta in attesa.
  L'admin approva da **Gestione accessi** (`AccessRequests`) assegnando un ruolo.
- Ruoli: `admin | manager | staff` = **team "active"** (vedono i dati studio;
  finanza solo admin/manager). `cliente | partner` = **portale** (`active:false`,
  vedono solo i propri progetti via `clientUid` + le proprie richieste Materico).
- `currentUser` è impostato solo se `status==='approved' && role`. I clienti
  (active=false) **non** possono leggere le collection generali: caricano solo i
  propri progetti per id. Il nodo pubblico **`directory`** dà ai portali l'elenco
  dei membri studio (per richieste appuntamento).

## 6. Modello dati (nodi Realtime Database)
- `users/<uid>` — account (campi: uid, name, email, photoURL, role, active,
  status, sector?, projectIds?, createdAt…).
- `directory/<uid>` — `{name, role}` dei membri studio (scritto dall'admin; letto
  anche dai portali).
- `projects/<pid>`, `tasks/<id>`, `templates/<id>`, `projectsInternal/<id>`,
  `estimates/<id>`.
- `studioFinance/<id>` + nodi finanza dedicati: `finComputi`, `finInvoicesActive`,
  `finInvoicesPassive`, `finScadenze`, `finBank` (array; admin/manager).
- `documents/<pid>/<docId>`, `projectMessages/<pid>/<msgId>` — **scritture
  mirate per-elemento** (così anche i clienti possono creare i propri).
- `appointments/<id>` — agenda condivisa (vedi §8).
- `crmLeads`, `crmSuppliers` — array CRM (pipeline + fornitori/partner).
- `matericoRequests/<id>` — flusso Materico (vedi §9).

### Persistenza
- In App, `syncState(key, val)` scrive l'intero nodo via `writeNode` (mappa
  `KEY2PATH`: es. `finance → studioFinance`). Caso speciale `users` → scrive
  per-uid. **Le collection `documents`/`projectMessages` NON si scrivono intere**
  (regole granulari): gli handler scrivono il singolo elemento.
- Le sottoscrizioni stanno nell'effetto di sync (keyed su `currentUser.uid/role`):
  ramo **studio** (sottoscrive tutte le collection) vs ramo **cliente/partner**
  (solo i propri progetti + directory + matericoRequests).

## 7. Regole di sicurezza
`firebase-rules.json` riflette il modello: team `active` legge/scrive i dati
studio; finanza solo admin/manager; clienti accedono ai propri progetti via
`clientUid`; nodo `users` protetto da auto-promozione (validate su role/active,
whitelist email admin). **Quando si aggiunge un nodo DB, aggiornare ANCHE le
regole** e ricordare all'utente di ripubblicarle.
- ⚠️ `matericoRequests` ha regole **permissive** (qualunque autenticato
  legge/scrive) come prima versione del flusso multi-attore; va blindato
  trasformando `forwardedTo` in mappa `{uid:true}` per le read per-partner.

## 8. Agenda / Appuntamenti
- `CalendarView` ordine **Giorno · Settimana · Mese**, tasti statici (niente
  animazione layout). Mostra i task **dell'utente** + i suoi appuntamenti.
- `appointments/<id>`: `{title,date,time,ownerUid,createdBy,withName,note,kind,
  status}`. Un membro può creare un appuntamento per un altro (`ownerUid`). I
  portali cliente/partner inviano **richieste** (`status:'pending'`) dal pulsante
  in "Documenti & Chat"; arrivano nella **Dashboard** e nel **Centro Notifiche**
  del membro, che conferma/rifiuta.

## 9. Modulo Materico (flusso)
1. Cliente (portale, sezioni "Richieste/Preventivi" e "Lavori in corso") crea una
   richiesta: titolo, tipo lavorazione, quantità (voci), link, note.
2. `MatericoView` (hub operatore, menu "Materico", admin/manager): inbox →
   suggerisce partner in base al tipo lavorazione (match con `crmSuppliers`) →
   inoltra ai partner selezionati.
3. Partner (portale) invia offerta (importo + note) → salvata in `offers[uid]`.
4. Operatore vede offerte **ordinate per prezzo**, sceglie la migliore, applica il
   **margine**, **invia al cliente** generando una **bozza contratto** (testo).
5. Cliente accetta/rifiuta dal portale, scarica la bozza contratto.
- TODO: firma digitale (provider esterno), upload file reale (oggi via link),
  blindatura regole, generazione contratto PDF.

## 10. Convenzioni di stile (rispettare!)
- Schema grafico: fondo `#F5F5F3`, testo `#161616`, accent nero `#1b1b1b`, card
  bianche `rounded-[22px]/[24px]/[26px]`, bordi `#e2e2e2`. Niente emoji a caso.
- Colori settore (a colpo d'occhio): Studio `#161616`, Strategico `#b45309`
  (ambra), Materico `#c2410c` (arancio), Unico `#4338ca` (indaco).
- Pattern "barra settori" (tabs a pillola) e "box clienti" riusati in più sezioni
  — mantenerli coerenti.
- Modali: o il componente `Modal`, o overlay `fixed inset-0 z-[200] bg-black/40
  backdrop-blur-sm`.
- **Mai** reintrodurre dati seed finti o account di test (l'admin ora ripulisce i
  vecchi account `isTest`/`test-*`).

## 11. Artefatti React/Vite — vincoli
- Niente `localStorage`/`sessionStorage` per i dati (tutto su Firebase).
- `import.meta.env.BASE_URL` per asset statici (es. modelli GLB in
  `public/model/step-01..13.glb`, e `public/generatore-modulistica.html`).
- Three.js r128-safe nei vecchi artefatti; qui three 0.184 con GLTFLoader da
  `three/examples/jsm/loaders/GLTFLoader.js`.

## 12. Stato / roadmap
Fatto: login+ruoli, DB condiviso, Documenti+generatore modulistica, Finanza
condivisa, CRM, Agenda/appuntamenti, colori settore, Materico (flusso base).
Da fare: modulo **Unico** (immobili/investitori/ROI/SPV), modulo **Strategico**
(marketing), preventivi self-service + PDF + firma, Gantt, timesheet/HR,
reporting/redditività, cantiere (diario/foto/presenze), integrazioni esterne
(SDI reale, banche, Google/Outlook, WhatsApp, catasto — richiedono backend).

## 13. Cosa serve all'utente (setup Firebase, una tantum)
- Authentication → abilitare **Google** + Authorized domains
  (`giorgiopascalistudio.github.io`, `localhost`).
- Realtime Database → Regole → incollare `firebase-rules.json` → Pubblica.
- Mettere i 13 GLB in `public/model/`.
