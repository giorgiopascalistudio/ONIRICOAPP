# Onirico Studio OS

Gestionale dello studio (React + Vite + Tailwind + Three.js) con **login Google
via Firebase** e **modello 3D a 13 step** caricato dalla cartella `model/`.
Pronto per il deploy su **GitHub Pages**.

Interfaccia e usabilità sono rimaste invariate rispetto al prototipo: è stato
aggiunto solo il gate di accesso Google davanti all'app e sostituito il modello
3D procedurale con il tuo modello GLB reale.

---

## Cosa devi fare tu (3 cose)

### 1) Incolla la config Firebase
Apri `src/firebase.ts` e sostituisci i 3 placeholder:

- `apiKey: 'INCOLLA_QUI_LA_TUA_API_KEY'`
- `messagingSenderId: 'INCOLLA_QUI_IL_SENDER_ID'`
- `appId: 'INCOLLA_QUI_L_APP_ID'`

Li hai già nel tuo vecchio file `onirico-studio-os.html` (cerca `firebaseConfig`),
oppure su **Firebase Console -> Impostazioni progetto -> Le tue app (Web)**.
I campi `authDomain`, `projectId`, `storageBucket` sono gia impostati sul
progetto `oniricoapp-48953`.

### 2) Abilita Google nel progetto Firebase
- **Firebase Console -> Authentication -> Sign-in method -> Google -> Abilita**.
- **Authentication -> Settings -> Authorized domains**: aggiungi il dominio del
  sito Pages (es. `giorgiopascalistudio.github.io`). `localhost` e gia autorizzato
  per i test in locale.

### 3) Carica i 13 modelli 3D
Metti i file `step-01.glb` ... `step-13.glb` dentro la cartella **`public/model/`**
(sono gli stessi del `model.zip` di prima). Vite li copia automaticamente nel
sito e l'app li carica da `model/step-XX.glb`.

---

## Avvio in locale
```bash
npm install
npm run dev        # http://localhost:3000
```

## Deploy su GitHub Pages (automatico)
E incluso il workflow `.github/workflows/deploy.yml`. Una volta sola:

1. Crea/usa la repo e fai push del progetto sul branch `main`.
2. Su GitHub: **Settings -> Pages -> Build and deployment -> Source = GitHub Actions**.
3. Da ora, ad ogni push su `main`, GitHub builda e pubblica da solo.

Il sito usa percorsi relativi e routing a hash (`#dashboard`...), quindi funziona
sia su `utente.github.io` sia su `utente.github.io/nome-repo` senza altre modifiche.

> In alternativa puoi buildare a mano (`npm run build`) e pubblicare la cartella `dist/`.

---

## Note
- Logout: "Esci dall'account" ora esce anche da Google, cosi ricompare l'accesso.
- I dati dell'app (progetti, task, finanze...) restano in `localStorage` come nel
  prototipo: quel comportamento non e stato toccato.
