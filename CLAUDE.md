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
  Materico) → rivendita, con investitori. Lato studio: modulo **operazioni
  immobiliari + investitori + ROI** (`UnicoStudioView`, sotto-tab "Operazioni &
  Investitori" nella divisione UNICO di Progetti; nodo `unicoDeals`). Lato
  cliente: vetrina investimenti (`ServicesShowcase`: mostra gli immobili
  **pubblicati** dal nodo `unicoShowcase`, fallback demo se vuoto — vedi §21).
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
`ClientPortalView` (portale cliente/partner, ~2400 righe), `ServicesShowcase`
(sezione "Scopri i servizi" del portale: pagine vetrina Studio/Materico/
Strategico/Unico accanto ai progetti; Unico ha la vetrina immobili-investimento
con dati **fittizi** da `src/showcaseData.ts` — contenuti demo, non su Firebase),
`AuthFlow` (onboarding pubblico, vedi §5; la landing è la pagina **cinematica**
`CinematicShowcase`, vedi §21), `UnicoStudioView` (modulo Unico lato
studio: operazioni immobiliari + investitori + ROI, nodo `unicoDeals`; pulsante
"Vetrina" → `UnicoShowcaseEditor`, vedi §21),
`FurnishingsBoard` (modulo "Arredi & Moodboard": scelte materiali/arredi —
**fissi** con impatto progettuale+scadenza vs **mobili** estetici — e lavagna
moodboard drag-and-drop; nodo `projectFurnishings`; usato identico lato studio in
`ProjectsView` tab "Arredi & Moodboard" e lato cliente in `ClientPortalView`),
`CantiereBoard` (modulo "Cantiere", §15: dashboard studio + portale partner — rapportini,
presenze, foto, materiali, checklist, documenti, SAL/avanzamento, storico; include
`DriveUploader` con fallback link), `AccessRequests`
(approvazione accessi), `GoogleLogin`, `Modal`, `ThreeDProgress` (GLB a 13 step),
`SmartText`, `AppleSwitch`, `MotionTabsMenu`, `PinnedList`, `StatusCard`,
`InteractiveView`, `QuotesView`+`QuoteEditor` (preventivi/parcelle, vedi §16 — vivono
dentro Finanze, non più voce sidebar), `TrashView` (Cestino condiviso, vedi §20),
`ConfirmDeleteModal` (doppia conferma eliminazione, vedi §20).

## 5. Autenticazione & ruoli (IMPORTANTE)
- Accesso con **email+password** *oppure* **Google** (`src/components/AuthFlow.tsx`:
  landing pubblica vetrina → Accedi / Registrati → form). Gli account vivono nel
  nodo **`users/<uid>`**. `GoogleLogin.tsx` è il vecchio schermo, non più usato.
- **Iscrizione** = l'utente sceglie il **tipo account** (`accountType`):
  - **`cliente`** (privato) e **`azienda`** (con P.IVA, CF, PEC, SDI, sede, settore)
    → `role:'cliente', status:'approved', active:false` **auto-approvati**: accesso
    immediato al portale. (Distinti solo da `accountType`/dati; stesso ruolo portale.)
  - **`team`** (collaboratore) → `status:'pending'`, **nessun ruolo** finché
    admin/manager non lo approva da **Gestione accessi** (`AccessRequests`).
  - Form raccoglie sempre: nome, cognome, email, telefono, residenza + **privacy**
    (`profileComplete:true` quando finito). Chi entra con Google senza scheda vede
    lo schermo "Completa la registrazione" (stesso form, senza password).
- **Bootstrap admin**: il primo utente in assoluto, **oppure** l'email
  `giorgio.pascali990@gmail.com`, diventa `role:'admin', active:true,
  status:'approved', profileComplete:true` (effetto auth in App + whitelist regole).
- Ruoli: `admin | manager | staff` = **team "active"** (vedono i dati studio;
  finanza solo admin/manager). `cliente | partner` = **portale** (`active:false`,
  vedono solo i propri progetti via `clientUid` + le proprie richieste Materico).
- **Gestione accessi**: admin **e manager** (`canManageAccess`). Il manager può
  approvare/assegnare ruoli ma **non** creare admin (vincolo anche nelle regole).
- `currentUser` impostato solo se `status==='approved' && role`. Lo stato
  **`ownProfile`** tiene il proprio record `users/<uid>` SEMPRE (anche non-active),
  così il render decide registrazione/attesa/rifiuto anche per cliente/azienda
  (non leggibili da `accounts`, popolato solo per utenti active). I clienti
  caricano solo i propri progetti per id. Il nodo **`directory`** dà ai portali
  l'elenco dei membri studio.
- **Collegamento cliente↔pratica**: in Nuovo progetto / Modifica c'è il select
  "Collega cliente registrato" (`pClientUid`) → scrive `clientUid` sul progetto e
  `projectIds[pid]=true` sul cliente. Disponibile ad admin **e manager**.

## 6. Modello dati (nodi Realtime Database)
- `users/<uid>` — account (campi: uid, name, email, photoURL, role, active,
  status, sector?, projectIds?, createdAt…).
- `directory/<uid>` — `{name, role}` dei membri studio (scritto dall'admin; letto
  anche dai portali).
- `projects/<pid>`, `tasks/<id>`, `templates/<id>`, `projectsInternal/<id>`,
  `estimates/<id>`.
- `studioFinance/<id>` + nodi finanza dedicati: `finComputi`, `finInvoicesActive`,
  `finInvoicesPassive`, `finScadenze`, `finBank` (array; admin/manager). Le interfacce
  di questi nodi e il **motore di calcolo** vivono in **`src/finance.ts`** (funzioni
  pure: `studioParcella`, `matericoMargin`, `unicoMargin`, `consolidato`, `arrediTotals`,
  `computoTotal` + parser CSV `parseCsv`/`rowsToComputoItems`; costanti override-abili
  `STUDIO_FEE_PCT=0.15`, `ARREDI_MOBILI_FEE_PCT=0.20`, `MATERICO_MARKUP_PCT=0.15`).
- `projectEconomics/<pid>` — **snapshot read-only per il portale cliente** (scritto da
  `FinanzeView` lato studio): quadro economico calcolato (computo, arredi fissi/mobili,
  parcella 15%/20%, piano SAL) + fatture/scadenze del progetto. Letto dal cliente
  collegato (`clientUid`) in `ClientPortalView` (sostituisce il vecchio localStorage).
- `documents/<pid>/<docId>`, `projectMessages/<pid>/<msgId>` — **scritture
  mirate per-elemento** (così anche i clienti possono creare i propri).
- `projectFurnishings/<pid>/<itemId>` — modulo "Arredi & Moodboard" (tipo
  `Furnishing`): arredi **fissi/mobili** (ora con `price`/`quantity` → base parcella) +
  tile moodboard 2D (campo `board`, **deprecato**: la lavagna 2D è stata sostituita dal
  moodboard 3D, vedi §19). Scrittura **mirata per-elemento** come documents; a
  differenza di documents il cliente può anche **aggiornare** i propri item (non solo
  crearli), quindi la regola di write è a livello `$pid` senza vincolo `!data.exists()`.
- `projectMoodboard3d/<pid>` — **Moodboard 3D per progetto** (vedi §19): `{ elements: BoardElement[],
  updatedAt, by }`. Scrittura del **nodo intero** (non per-elemento). Regole come `projectFurnishings`
  (studio attivo non-cliente **o** cliente collegato `clientUid`, read+write).
- `appointments/<id>` — agenda condivisa (vedi §8).
- `unicoShowcase/<dealId>` — **snapshot PUBBLICO vetrina Unico** (`UnicoShowcaseEntry`, vedi §21):
  scritto in write-through da `saveUnicoDeals` (App) per i soli deal `published`; SOLO campi
  divulgabili (no costi acquisto/ristrutturazione, no nomi investitori). Read: ogni autenticato;
  write: admin/manager.
- `crmLeads`, `crmSuppliers` — array CRM (pipeline + fornitori/partner).
- `clients/<id>` — **Rubrica clienti** (anagrafica riutilizzabile, anche clienti **senza login**:
  privato/azienda con CF/P.IVA/PEC/SDI/indirizzo). Gestita in CRM → tab "Clienti" (admin/manager).
  In Nuovo/Modifica progetto il select "Cliente (rubrica)" auto-compila i campi (`Project.clientRecordId`);
  collegamento all'account portale resta separato e opzionale (`clientUid`).
- `matericoRequests/<id>` — flusso Materico (vedi §9).
- `clientRequests/<clientUid>/<id>` — **richieste cliente / "La tua idea"** (`ClientRequest`): brief inviato
  dal cliente dal portale per Studio/Strategico/Unico (titolo, descrizione, budget, dove, link e
  **moodboard 3D** opzionale). Annidato per uid come `notifications`: il cliente legge/scrive il proprio
  ramo, lo studio attivo legge tutto. Lo studio (admin/manager) la valuta in **Richieste clienti**
  (`ClientRequestsView`, route `#richieste-clienti`, voce sidebar/navbar): "Prendi in carico" /
  **"Converti in progetto"** (crea `projects/<pid>`, collega il cliente, porta la moodboard su
  `projectMoodboard3d`, notifica il cliente) / "Chiudi". Lato cliente: `ClientRequestPanel`
  (CTA "Nuova richiesta" + lista unificata con le proprie MatericoRequest). **Materico** dal flusso
  unificato genera comunque una `MatericoRequest` (bidding partner invariato).
- `notifications/<uid>/<id>` — **notifiche persistenti** (`Notification`): scritte dall'app
  (`pushNotification`/`notifyStudio` in App) e dalle **Cloud Functions** (Admin SDK). Sostituiscono
  le vecchie notifiche solo-in-memoria; il Centro Notifiche mostra queste + le richieste appuntamento.
  read/write solo del proprio uid (write anche da studio attivo per notificare colleghi).
- `teamLeave/<id>` — **ferie/assenze team** (`TeamLeave`): pannello in `CalendarView`; all'inserimento
  notifica in-app a tutto il team (il reminder 7gg prima è una Cloud Function).
- `quotes/<id>` — **Preventivi & Parcelle** (`Quote`, vedi §16): macro-voci, stati, piano pagamenti,
  `docKind` (preventivo|parcella), **IVA/cassa spuntabili** (`vatEnabled/vatPct/cassaEnabled/cassaPct`,
  calcolo `quoteTotals` in finance.ts); admin/manager. La rata "emessa" genera fattura attiva +
  scadenza nei nodi finanza (eredita IVA/cassa).
- `trash/<id>` — **Cestino condiviso** (`TrashItem`, vedi §20): elementi eliminati da ogni sezione,
  conservati 60 giorni poi purge automatico client-side; read/write team attivo non-cliente.
- **Modulo Cantiere** (vedi §15): `cantieri/<cid>` (record cantiere, `partnerUids:{uid:true}`) +
  sotto-collezioni granulari per-elemento `cantiereRapportini|cantierePresenze|cantiereFoto|
  cantiereMateriali|cantiereChecklist|cantiereDocumenti|cantiereSal|cantiereLog|cantiereRecords|
  cantiereMessages` (tutte `<cid>/<id>`). `cantiereRecords` = **registro voci generico**
  (discriminato da `section`: scadenze, cronoprogramma, verifiche, nonconformita, ordini_servizio…);
  `cantiereDocumenti` esteso con `section`/`category`/`expiry` = **registro documenti generico**
  (documenti, sicurezza POS/PSC/DUVRI, verbali, progettazione, doc tecnica…); `cantiereMessages` =
  chat di cantiere. **Indice inverso** `partnerCantieri/<uid>/<cid>=true` (scritto dallo studio
  all'assegnazione) → permette al partner di **elencare** i cantieri assegnati (i partner non
  hanno i cid nei loro `projectIds`). Foto/documenti salvano `{driveFileId,driveUrl}` (upload
  reale Google Drive, vedi `src/drive.ts`) **oppure** `link` (fallback). Tipi in `src/types.ts`.
- **Area Impresa** (profilo impresa partner, riutilizzabile su tutti i suoi cantieri, keyed per uid):
  `impresaDocs/<uid>/<id>` (DURC/visure/polizze/SOA/doc dipendenti, con `expiry`) e
  `impresaRecords/<uid>/<id>` (squadre/operai/mezzi/attrezzature/sicurezza, discriminati da `section`).
  Scritti dal partner proprietario (read studio). UI: portale partner tab "La mia impresa"
  (`src/components/cantiere/ImpresaArea.tsx`) + Area Impresa dentro al `CantiereBoard`.

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
  animazione layout). Mostra i task **dell'utente** (anche multi-assegnatario,
  `Task.assignees` — `assignee` resta il primo per compatibilità) + gli
  appuntamenti di cui è **partecipante**.
- `appointments/<id>` è **multi-partecipante**: `participants {uid: pending|
  confermato|rifiutato}` + `participantNames` (creatore auto-confermato). Il
  popup "Nuovo appuntamento" ha la selezione libera **"Con"** tra team+clienti+
  partner (rimossi "Agenda di", controparte libera e il toggle nota). Stato
  complessivo **grigio (pending)** finché tutti confermano → **verde
  (confermato)**; notifiche in-app su invito/conferma/rifiuto/annullamento.
  Conferma/rifiuto = scrittura **granulare** `participants/<uid>` (le regole la
  consentono anche ai partecipanti non-attivi) + update best-effort di `status`.
  Appuntamenti legacy senza `participants`: fallback su `ownerUid`. I portali
  inviano **richieste** (`status:'pending'`) come prima; Dashboard ha anche il
  box "Messaggi & richieste" sotto l'Agenda di oggi.
- Il popup **"Nuovo impegno"** supporta più assegnatari e suggerisce il
  collegamento a una pratica; i task collegati (`projectId`) compaiono anche
  nel fascicolo tecnico ("Impegni agenda collegati").
- **Nuovo progetto**: divisione dedotta dal tab attivo (niente select);
  indirizzo strutturato `via/civico/cap/comune/provincia` (compone
  `indirizzoImmobile`, helper `composeAddress`); **catastali multipli**
  (`Project.catastali[]`, primo → `foglio/particella/sub` legacy, editor
  `CatastaliEditor`); dalla **data di inizio** i task delle fasi vengono
  pianificati in sequenza (`durationDays`, default 2gg) e **auto-assegnati per
  mansione** (`UserProfile.functions`, scelte da Team → "Modifica iscritto") al
  membro col minor numero di task aperti.

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
- **App-like**: il sito è **non zoomabile** (viewport meta in `index.html` + blocco
  ctrl+rotella/±/gesture in `main.tsx`) e **non selezionabile** (`user-select:none`
  su body in `index.css`), con **eccezione** per `input/textarea/select/
  [contenteditable]`. Non rimuovere queste regole; i nuovi campi testo nativi sono
  già coperti.
- **Sicurezza link**: ogni URL inserito dall'utente (campi `link`/`url` di documenti,
  foto, arredi, richieste Materico…) va renderizzato come `href={safeUrl(u) || '#'}`
  (`safeUrl` in `utils.ts`, whitelist http/https/mailto/tel — blocca `javascript:`).
  Sempre `rel="noreferrer"` sui link `target="_blank"`. Niente
  `dangerouslySetInnerHTML`.

## 11. Artefatti React/Vite — vincoli
- Niente `localStorage`/`sessionStorage` per i dati (tutto su Firebase).
- `import.meta.env.BASE_URL` per asset statici (es. modelli GLB in
  `public/model/step-01..13.glb`, e `public/generatore-modulistica.html`).
- Three.js r128-safe nei vecchi artefatti; qui three 0.184 con GLTFLoader da
  `three/examples/jsm/loaders/GLTFLoader.js`.

## 12. Stato / roadmap
Fatto: login+ruoli, DB condiviso, Documenti+generatore modulistica, Finanza
condivisa, CRM, Agenda/appuntamenti, colori settore, Materico (flusso base).
Fatto (in parte): modulo **Unico** lato studio (operazioni immobiliari,
investitori, ROI/margine — `unicoDeals`); fatta la **pubblicazione in vetrina**
(editor per-deal + nodo `unicoShowcase` + pagina cinematica, §21); mancano SPV/quote.
Fatto: modulo **Cantiere** (§15) ampliato alla struttura del PDF a 3 aree (Campi condivisi /
Area Tecnici / Area Impresa): record `cantieri` + sotto-collezioni + registri generici
(`cantiereRecords`/`cantiereDocumenti` con `section`) + chat (`cantiereMessages`) + Area Impresa
riusabile (`impresaDocs`/`impresaRecords`, tab "La mia impresa" nel portale partner); SAL→fattura,
upload Google Drive con fallback link. Alcune sotto-voci del PDF sono placeholder navigabili
("in preparazione") da attivare incrementalmente.
Fatto: **Rubrica clienti** (`clients`) — anagrafica riutilizzabile (CRM → tab "Clienti") che
auto-compila il form progetto.
Fatto: **CRM esteso** (doc CONSIDERAZIONI CRM, §16-18): notifiche persistenti, rubrica con fasce/
responsabili/WhatsApp, Task con priorità urgente/tipologia + dashboard produttività, ferie team,
**Preventivi & Amministrazione** (`quotes` con macro-voci/stati/piano pagamenti → finanza), e
**backend Cloud Functions** (`functions/`: email SendGrid, reminder schedulati, report) — da deployare.
Da fare (CRM doc, fasi successive): 5 statistiche + Break Even Point, **Incentivi & Performance**
(300+ attività a punti), **Marketing & Eventi**, **Sondaggi/Customer satisfaction**, WhatsApp API.
Da fare: completare le voci Cantiere "in preparazione" (manutenzioni/guasti/magazzino/collaudi…),
modulo **Strategico** (marketing), preventivi self-service + PDF + firma, Gantt, timesheet/HR,
reporting/redditività, integrazioni esterne
(SDI reale, banche, Google/Outlook, WhatsApp, catasto — richiedono backend).

## 13. Cosa serve all'utente (setup Firebase, una tantum)
- Authentication → Sign-in method → abilitare **Google** **e Email/Password** +
  Authorized domains (`giorgiopascalistudio.github.io`, `localhost`).
- Realtime Database → Regole → incollare `firebase-rules.json` → Pubblica.
  ⚠️ Le regole `users` ora permettono a cliente/azienda di auto-approvarsi
  (`role:'cliente'`) e al manager di approvare il Team; aggiunto anche il nodo
  `unicoDeals` (admin/manager), il nodo `projectFurnishings` (studio + cliente
  collegato via `clientUid`, in lettura e scrittura) e il nodo **`projectEconomics`**
  (write studio, read cliente collegato — quadro economico del portale). **Vanno
  ripubblicate**, altrimenti la registrazione e i moduli Unico / Arredi / la
  contabilità del portale falliscono con "permission denied".
  ⚠️ Aggiunti anche i nodi del **modulo Cantiere** (`cantieri`, `cantiere*`, `partnerCantieri`):
  **ripubblicare le regole** dopo il deploy, altrimenti i cantieri falliscono con
  "permission denied" e — come per gli arredi — la write resta silenziosa lato client.
  ⚠️ Aggiunti inoltre i nodi `clients` (rubrica clienti, write admin/manager), `cantiereRecords`,
  `cantiereMessages` (per-cantiere, write studio + partner assegnato sui propri elementi) e
  `impresaDocs`/`impresaRecords` (Area Impresa, write del partner proprietario o admin/manager):
  **ripubblicare le regole**, altrimenti rubrica, registri/chat di cantiere e Area Impresa danno
  "permission denied" con write silenziosa lato client.
  ⚠️ Aggiunti infine `notifications/$uid` (read/write proprio uid; write da studio attivo),
  `teamLeave` (read studio; write proprio o admin/manager), `quotes` (admin/manager) e
  `projectMoodboard3d` (come `projectFurnishings`): **ripubblicare le regole** dopo il deploy.
  ⚠️ Aggiunto il nodo **`trash`** (Cestino, §20 — read/write team attivo non-cliente):
  **ripubblicare le regole**, altrimenti il Cestino resta vuoto e i ripristini falliscono
  (le eliminazioni continuano a funzionare ma senza copia di sicurezza).
  ⚠️ Aggiunto il nodo **`unicoShowcase`** (vetrina Unico pubblicata, §21 — read ogni autenticato,
  write admin/manager): **ripubblicare le regole**, altrimenti la pubblicazione vetrina fallisce
  in silenzio e i clienti continuano a vedere i dati demo.
  ⚠️ Aggiornate le regole di **`projectMessages` e `cantiereMessages`** (chat): cliente/partner
  possono **eliminare un proprio messaggio entro 60s** dall'invio (unsend) e il create richiede
  `from == auth.uid` (niente spoofing autore). **Ripubblicare le regole**, altrimenti l'unsend
  fallisce lato portale (per lo studio funziona comunque).
  ⚠️ Aggiornate le regole di **`appointments`** (multi-partecipante): read estesa ai partecipanti
  (`participants/<auth.uid>` esiste) + write granulare `participants/$uid` per il proprio stato di
  conferma. **Ripubblicare le regole**, altrimenti gli inviti non si confermano lato portale.
  ⚠️ Aggiunto il nodo **`clientRequests/<clientUid>`** (richieste cliente "La tua idea", §6 — il cliente
  legge/scrive il proprio ramo, lo studio attivo non-cliente/non-partner legge tutto; convert→progetto
  riservato ad admin/manager): **ripubblicare le regole**, altrimenti l'invio richieste fallisce in
  silenzio lato portale e lo studio non le vede in "Richieste clienti".
- **Google Drive (upload file del Cantiere, opzionale)**: in Google Cloud Console del progetto
  `oniricoapp-48953` → abilitare **Google Drive API**; creare un **ID client OAuth → Applicazione
  web** con JS origins `http://localhost:3000` e `https://giorgiopascalistudio.github.io`;
  incollarne l'ID in `src/drive.ts` (`DEFAULT_CLIENT_ID`) o impostare
  `window.__ONIRICO_DRIVE_CLIENT_ID__`. Finché non è configurato, l'upload Drive non parte e la
  UI usa il **fallback "incolla link"** (l'app resta pienamente funzionante).
- **Firebase Storage (video vetrina cinematica, §21)**: Console Firebase → Build → Storage →
  "Inizia" (i progetti recenti richiedono il piano **Blaze** per attivarlo — già previsto per le
  Cloud Functions §18; la quota no-cost resta: **5 GB** archiviati + **1 GB/giorno** di download).
  Caricare gli mp4 da console (cartella `vetrina/`), click sul file → copiare l'**URL di download**
  (con token, funziona nel tag `<video>` senza toccare le regole Storage) → incollarlo nel campo
  "Video" dell'editor vetrina o in `LANDING_SHOWCASE.videoUrl` (`src/showcaseData.ts`).
  Video consigliato: mp4 H.264 muto, ~20-30s, keyframe fitti per lo scrubbing fluido
  (`ffmpeg -i in.mp4 -c:v libx264 -crf 23 -g 15 -movflags +faststart -an out.mp4`).
- Mettere i 13 GLB in `public/model/`.

## 15. Modulo Cantiere (studio ↔ impresa partner)
- **Dove**: tab **"Cantiere"** nel fascicolo progetto (`ProjectsView`, divisioni studio/materico/
  unico) lato studio; tab **"Cantieri"** + **"La mia impresa"** nel portale `materico_partner`
  (`ClientPortalView`) lato partner. Componente unico `CantiereBoard` con prop `mode:'studio'|'partner'`.
- **Struttura (PDF `MODULI/CANTIERE.pdf`)**: navigazione a **3 aree** in `CantiereBoard` →
  **Campi condivisi** (Panoramica, Giornale di cantiere, Dati generali, Localizzazione,
  Cliente/Committente, Foto, Attività & Scadenze, Documenti, Comunicazioni/Chat), **Area Tecnici**
  (SAL, Cronoprogramma, Verifiche, Non conformità, Verbali/Ordini di servizio, Sicurezza
  POS/PSC/DUVRI, Progettazione, Doc tecnica, Controllo qualità, Storico) e **Area Impresa**
  (Documentazione, Squadre, Operai, Presenze, Mezzi, Sicurezza impresa). Config dichiarativa
  `SECTIONS` in `CantiereBoard.tsx`: ogni sezione è `comp` (componente dedicato), `cantdoc`/`cantrec`
  (registro generico), `impdoc`/`imprec` (Area Impresa) o `soon` (placeholder `SectionPlaceholder`
  per le voci ancora da attivare — promuoverle è una riga di config). Componenti riusabili in
  `src/components/cantiere/` (`DocRegistry`, `RecordRegistry`, `DriveUploader`, `SectionPlaceholder`,
  `ImpresaArea`, `GiornaleCantiere`, `CantierePanoramica`).
- **Panoramica** (`CantierePanoramica`, landing della sezione): KPI cliccabili (avanzamento+SAL,
  consegna, giornale, ore manodopera, documenti in scadenza ≤30gg, non conformità aperte, attività,
  checklist qualità) che saltano alla sezione di dettaglio via `goSection`.
- **Giornale di cantiere** (`GiornaleCantiere`, sostituisce il vecchio "Diario"/lista rapportini):
  calendario mensile (dot di stato per voce + indicatore presenze/materiali/foto), click sul giorno
  → voci del giorno + registrazioni collegate a quella data. Voce strutturata sul modello
  **D.M. 49/2018 art. 14** (`Rapportino` esteso, retro-compatibile): meteo + temp min/max,
  manodopera (qualifica×numero, `RapportinoManodopera`), mezzi, lavorazioni, annotazioni/eventi,
  foto. Lo **studio (DL) compila voci auto-approvate** (`authorRole:'studio'`, `status:'approvato'`);
  il partner invia rapportini `inviato` da approvare (come prima). Le regole esistenti coprono già
  la write studio: **nessuna ripubblicazione necessaria**. Modifica voce = riscrittura stesso id
  (il partner che modifica torna a `inviato`).
- **Modello**: vedi §6. Ogni progetto può avere 1+ cantieri (`cantieri/<cid>`, `projectId`).
  Lo studio assegna imprese **partner** per-cantiere (`partnerUids` + indice inverso
  `partnerCantieri/<uid>/<cid>`). Le sotto-collezioni per-cantiere si scrivono **per-elemento**
  (handler generici `handleSaveCantEntity`/`handleDeleteCantEntity`); l'Area Impresa (keyed per uid)
  usa `handleSaveImpresaEntity`/`handleDeleteImpresaEntity` in `App.tsx`. La chat usa
  `handleSendCantiereMessage`; **unsend entro 60s** del proprio messaggio
  (`handleDeleteCantiereMessage`/`handleDeleteProjectMessage` in App + `ChatDeleteButton`,
  componente che si nasconde da solo allo scadere — rimozione diretta, senza doppia
  conferma/cestino: eccezione documentata al pattern `askDelete` di §20). Nella tab SAL
  l'**avanzamento** si allinea automaticamente alla % dell'ultimo SAL approvato
  (`handleApproveSal`) e lo slider salva solo al rilascio.
- **Permessi** (`firebase-rules.json`): cantiere/sotto-collezioni leggibili da studio attivo
  **o** partner assegnato; rapportini/presenze/foto/materiali/documenti/records/messages scrivibili
  dal partner assegnato solo per **propri** elementi (`by`/`partnerUid`/`from == auth.uid`);
  approvazioni (`status:'approvato'`, `approvedBy`), checklist, SAL e log scrivibili **solo dallo
  studio**. `impresaDocs`/`impresaRecords/<uid>` scrivibili dal partner proprietario (`auth.uid==$uid`)
  o admin/manager, leggibili da tutto lo studio attivo.
- **Sottoscrizioni** (`App.tsx`): studio sottoscrive tutti i nodi `cantier*`; il partner
  sottoscrive `partnerCantieri/<uid>` e poi, per ogni `cid`, il cantiere e le sotto-collezioni.
- **SAL → finanza**: lo studio approva un `cantiereSal` (`handleApproveSal`); in `FinanzeView`
  → tab **SAL** compaiono i SAL approvati non fatturati con "Emetti bozza fattura"
  (`handleGenerateCantiereSalInvoice`, riusa la logica di `handleGenerateSalInvoice`); il
  `linkedInvoiceId` collega cantiere↔fattura ed evita doppioni.
- **File**: `DriveUploader` (`src/components/cantiere/DriveUploader.tsx`, usato da `CantiereBoard`,
  `DocRegistry`, `ImpresaArea`) carica su Google Drive (vedi §13) e in mancanza ricade su link
  incollato. In Firebase si salva solo `{driveFileId,driveUrl}` o `link`.
- **Collegamento ai task del fascicolo**: solo riferimento in lettura (`taskRefs`), nessun
  cambio di stato dei task.

## 14. Finanza holding (parcelle + libri per società)
- **Motore**: `src/finance.ts` (vedi §6). Regole ricavo: **Studio 15%** su
  (computo + arredi fissi) **+ 20%** arredi mobili se `Project.studioManagesArrediMobili`;
  **Materico 15%** sul costo partner; **Unico** = rivendita − acquisto − ristrutturazione.
- **`FinanzeView`**: selettore **Società** (Studio·Strategico·Materico·**Unico**·
  **Consolidato**); tab **Parcelle & Onorari** (calcolo automatico); import computo da
  **CSV** (Excel/PDF → allegato `sourceFileName`, no parsing); SAL derivati dalla parcella;
  numerazione fatture per società (`FE-STU/STR/MAT/UNI`); Conto Economico per società +
  Consolidato di gruppo. Cash-flow/banca restano **simulati** ma etichettati.
- Excel parsing: richiede **SheetJS (`xlsx`)** — non installato (oggi solo CSV nativo).
- **Contabilità di commessa** (per-progetto): tab **"Contabilità di commessa"**
  (`projTab === 'finanziario'`) nel fascicolo (`ProjectsView`, solo admin/manager).
  Riusa il motore `finance.ts` per il quadro economico automatico (valore opera =
  computo + arredi **fissi confermati**; parcella; ricavi/incassato/da-incassare da
  `finInvoicesActive`; costi da `finInvoicesPassive`; margine atteso/realizzato;
  avanzamento %; piano SAL). I pulsanti **Registra costo/ricavo/scadenza** scrivono
  sui **nodi finanza globali** (`finInvoicesPassive`/`finInvoicesActive`/`finScadenze`)
  con `projectId` + `sector = division` → confluiscono nel **consolidato** di `FinanzeView`.
  Unica fonte di verità: nessun nodo per-progetto dedicato. App sottoscrive i 4 nodi
  strutturati (gated `canFinance`) e passa array + handler (`handleSaveFinanceItem`/
  `handleDeleteFinanceItem`) sia a `ProjectsView` sia (indirettamente) accanto a
  `FinanzeView`. I "movimenti liberi" (cassa) restano su `studioFinance` e **non**
  entrano nel margine. Lo snapshot `projectEconomics` per il cliente resta **solo
  ricavi** (niente costi/margine dello studio).

## 16. Preventivi & Amministrazione (CRM esteso)
- **`QuotesView`** vive in **Finanze → tab "Preventivi & Parcelle"** (la voce sidebar "Preventivi"
  è stata rimossa; la route `#preventivi` redirige a Finanze col tab aperto). **Sempre differenziato
  per società**: segue il selettore Società di FinanzeView; con "Tutte/Consolidato" la lista è
  raggruppata per divisione con i colori settore. Nodo `quotes/<id>` (`Quote`):
  `docKind` **preventivo|parcella**, righe per **macro-voce** (Progettazione/Consulenza/Opere edili/
  Impiantistica/Materiali/Altro), **stati** (Elaborato/In attesa/Accettato/Rifiutato), **IVA e Cassa
  previdenziale spuntabili** (default IVA 22% on, cassa 4% off; totali con `quoteTotals`), **piano
  pagamenti** (`PaymentMilestone`: acconto/rate/saldo con % o importo + scadenza, importi imponibili).
  Cliente dalla rubrica `clients`. Editor riusabile **`QuoteEditor`**: usato anche dal fascicolo
  progetto (`ProjectsView` tab "Contabilità & Bilancio" → pannello "Preventivi & Parcelle", con
  progetto/divisione bloccati) — stesso nodo, stessa lista in Finanze.
- Anche le **fatture attive** (`InvoiceActive`) hanno IVA (`taxRate`, 0 = niente IVA) e
  **`cassaPct`** spuntabili nel form di FinanzeView; helper `docTotals`/`invoiceTotals` in
  `finance.ts` (la cassa concorre alla base imponibile IVA).
- **Collegamento a finanza**: `handleEmitMilestone` (App) genera da una rata una **bozza fattura
  attiva** (`finInvoicesActive`) + **scadenza** (`finScadenze`) via `handleSaveFinanceItem`
  (con `projectId`/`sector=division`) → consolidato `FinanzeView`; la milestone tiene `invoiceId`.
- **Quadro pagamenti per cliente**: nella scheda cliente del CRM (fatturato/incassato/da incassare +
  scadenze da sollecitare con pulsanti email/WhatsApp). Notifica al team su preventivo accettato.

## 17. CRM esteso — rubrica, produttività, ferie, notifiche
- **Notifiche persistenti** (vedi §6 `notifications`): `pushNotification(uid,…)` / `notifyStudio(…)`
  in `App.tsx`; il Centro Notifiche (desktop+mobile) legge il nodo; click apre `link` (hash).
- **Rubrica clienti potenziata** (`CrmView` tab Clienti): `ClientRecord.tier` (fasce 1/2/3 + filtro),
  `responsabili` (più membri), `whatsapp`; scheda con storico progetti + quadro pagamenti + WhatsApp/email.
- **Task & Produttività**: `Task.priority` include **'urgente'**, `Task.tipo` (tipologia, datalist);
  notifica al collaboratore alla (ri)assegnazione; **dashboard produttività** per collaboratore in
  `TeamView` (aperti/urgenti/scaduti/completati, settimana/mese).
- **Ferie team** (vedi §6 `teamLeave`): pannello in `CalendarView` + notifica in-app a tutti.

## 18. Backend — Cloud Functions (automazioni)
- Cartella **`functions/`** (TS, firebase-functions v2, region `europe-west1`), config `firebase.json`
  + `.firebaserc` (progetto `oniricoapp-48953`). Email via **SendGrid** (secret `SENDGRID_KEY`).
- Funzioni: `onQuoteStatusChange` (preventivo accettato → notifica+email), `dailyReminders`
  (ferie 7gg prima + scadenze 3gg), `weeklyReport`/`monthlyReport` (attività completate per
  collaboratore). Scrivono notifiche su `notifications/<uid>` (Admin SDK, bypassa le regole).
- **Deploy a carico utente** (vedi `functions/README.md`): `firebase login`, piano **Blaze**,
  `firebase functions:secrets:set SENDGRID_KEY`, `firebase deploy --only functions`. Non verificabile
  da Claude (serve auth/Blaze/API key). WhatsApp automatico = futuro (oggi link `wa.me` in app).

## 19. Moodboard 3D (R3F)
- **Dove**: tab **"Arredi & Moodboard"** (`FurnishingsBoard`) → sezione **Moodboard**: anteprima +
  pulsante **"Apri moodboard 3D"** che apre l'editor in **overlay a tutto schermo**. Sostituisce la
  vecchia lavagna 2D (drag tile su `Furnishing.board`, ora deprecata). Disponibile lato studio
  (`ProjectsView`) e portale cliente (`ClientPortalView`).
- **Origine**: prototipo esterno (`moodboard-3d/`, **gitignorato** assieme alla libreria texture PBR
  ~3,6 GB non usata dal codice/non deployabile) integrato in **`src/components/moodboard3d/`**
  (`Moodboard3D` overlay + `MoodboardCanvas`/`Sidebar`/`Toolbar`/`PropertiesPanel` + `data/types/utils`).
- **Stack**: `@react-three/fiber` + `@react-three/drei` + `three` (già presente). I materiali della
  libreria caricano texture da **URL Unsplash** (le PBR locali NON sono collegate — fase futura:
  ottimizzare un subset e ospitarlo in `public/` o Firebase Storage). Il modulo è **lazy-loaded**
  (`React.lazy` in `FurnishingsBoard`) → chunk separato `Moodboard3D-*.js`, scaricato solo all'apertura.
- **Persistenza**: nodo `projectMoodboard3d/<pid>` (vedi §6). `Moodboard3D` riceve `elements`+`onSave`;
  salva su click **Salva**, alla **chiusura** e in **autosave** (debounce ~1,5s). App: stato
  `moodboard3d`, sub (studio: nodo intero; cliente: per-pid), handler `handleSaveMoodboard3d`.
- **Adeguamento grafico**: chrome (header/overlay/gizmo/tooltip) in stile Onirico; i colori "cablati"
  dei pannelli del prototipo sono rimappati ai token via CSS scoped `.mb3d` in `src/index.css`
  (chiaro + dark). Funzionalità del prototipo **invariate** (rimosso solo lo share-link `#board=`
  che confliggeva col router a hash).
- ⚠️ Regole: aggiunto `projectMoodboard3d` in `firebase-rules.json` → **ripubblicare**.

## 20. Cestino, doppia conferma, archiviazione
- **Cestino** (`TrashView`, voce sidebar admin/manager, route `#cestino`; nodo `trash/<id>`,
  tipo `TrashItem`): OGNI eliminazione passa da qui per **60 giorni** (`TRASH_RETENTION_DAYS`),
  poi purge automatico client-side (effetto in App). Helper in App: `moveToTrash(section,label,
  payload,meta?,detail?)` (no-op per cliente/partner: niente write su trash), `handleRestoreTrash`
  (switch per `section` → riscrive nel nodo di origine), `handleTrashDeleteForever`.
  Sezioni coperte: progetti, task, preventivi, fatture attive/passive, scadenze, movimenti,
  documenti, arredi, appuntamenti, richieste/preventivi Materico, rubrica, lead/fornitori CRM,
  operazioni Unico, cantieri + voci cantiere, Area Impresa, ferie.
- **Doppia conferma**: `ConfirmDeleteModal` (stato `confirmDel` in App, helper
  `askDelete(title,message,onConfirm,permanent?)`): il primo click su "Elimina" arma il pulsante,
  il secondo conferma. Renderizzata sia nel layout studio sia nel portale cliente/partner.
  TUTTI gli handler di delete in App passano da `askDelete`; i componenti che eliminano
  internamente (CrmView, UnicoStudioView, FinanzeView-computi) ricevono `askDelete`/`onTrashItem`
  come prop (con fallback `confirm()`). **Niente più `window.confirm` diretti** nelle eliminazioni.
- **Archiviazione progetti**: `Project.archived` + `handleToggleArchiveProject` (App). Pulsante
  archivia/ripristina nell'header del fascicolo e nel modale "Modifica pratica". Gli archiviati
  escono da tutte le liste di default (Dashboard, filtri Attivi/Completati/Tutti) e compaiono solo
  nel filtro **"Archivio"** di ProjectsView (insieme a sospesi/annullati), con badge ambra.
- **Colori società**: `COMPANY_COLOR` in `finance.ts` (unica fonte; usato da Dashboard, Preventivi,
  liste progetti). Non ridefinire i colori inline nei nuovi componenti.

## 21. Vetrina cinematica (login + immobili Unico)
- **`CinematicShowcase`** (`src/components/CinematicShowcase.tsx`): pagina a tutto schermo con
  **video continuo** di sfondo; rotella/swipe fanno scorrere il video con easing tra **scene**
  mappate su secondi precisi (`UnicoShowcaseScene { time, subtitle, text }`), pallini di
  navigazione, vignette per contrasto. Props: `videoUrl` (sempre **online**, fallback `poster`
  immagine se manca/fallisce), `scenes`, `brand`/`brandSub`, `footer` (ReactNode fisso sotto al
  testo), `onDiscover`/`discoverLabel` (CTA sull'ultima scena), `onClose` (uso overlay).
  Origine: prototipo `MODULI/villa-omnia.zip`, senza l'uploader runtime.
- **Login**: la landing di `AuthFlow` È il CinematicShowcase (config **`LANDING_SHOWCASE`** in
  `src/showcaseData.ts` — sostituire lì il `videoUrl` placeholder con l'URL Firebase Storage),
  con i tasti "Inizia il tuo progetto" (→ registrazione) e "Sono già cliente" (→ login) nel
  footer. Le schermate login/registrazione sono invariate.
- **Allestimento per-operazione**: in `UnicoStudioView` ogni card deal ha il pulsante **"Vetrina"**
  (pallino indigo se pubblicata) → **`UnicoShowcaseEditor`** (copertina, video URL online,
  descrizione, punti di forza, scene sec/titolo/testo, **anteprima** fullscreen, checkbox
  pubblica). Salva in `UnicoDeal.showcase` (`UnicoShowcaseConfig`) + `published`.
- **Pubblicazione**: `saveUnicoDeals` (App) riscrive in write-through il nodo intero
  **`unicoShowcase`** con `dealToShowcaseEntry(deal)` (`src/showcaseData.ts`) per i soli deal
  `published` → depubblicazioni/eliminazioni sempre in sync. Lo snapshot è **solo campi
  divulgabili** (vendita/quota/ROI/durata/raccolto/n.investitori, MAI costi né nomi investitori).
- **Lato cliente**: App sottoscrive `unicoShowcase` (entrambi i rami) e lo passa via
  `ClientPortalView` a `ServicesShowcase`: la vetrina Unico usa le entry reali (badge "Tour video"
  sulle card con video; click → pagina cinematica con CTA "Dettagli & investi" → modale dettaglio);
  senza entry pubblicate restano i demo `UNICO_PROPERTIES` (disclaimer "dati dimostrativi" solo lì).
- **Video**: SEMPRE URL online (Firebase Storage consigliato, vedi §13) — un unico mp4 continuo
  per pagina; le scene puntano ai suoi secondi. Niente upload dal client.
