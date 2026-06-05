# Onirico Studio OS

Gestionale dello studio (React + Vite + Tailwind + Three.js) con **login Google +
controllo accessi su Firebase** e **modello 3D a 13 step** (cartella `model/`).
Deploy su **GitHub Pages**.

## Come funziona ora l'accesso
- Si entra solo con **account Google**.
- Al primo accesso in assoluto, quell'utente diventa **admin** (sei tu, che entri
  per primo). Tutti gli account "finti" del prototipo sono stati rimossi.
- Ogni nuovo accesso resta **in attesa**: l'utente vede "Richiesta in attesa di
  approvazione" e non entra finché TU non lo approvi.
- Da admin trovi il pulsante **Accessi** (icona persone, in alto a destra e nel
  tuo profilo) con il numero di richieste. Lì **approvi/rifiuti** e **assegni il
  ruolo** (Admin / Manager / Staff / Cliente / Partner; per i Clienti anche il
  settore). Puoi cambiare ruolo, rimettere in attesa o eliminare un account.
- Gli utenti vivono sul tuo **Realtime Database** (nodo `accounts`), non più in
  locale. Il resto dei dati (progetti, task, finanze) resta in `localStorage`
  come nel prototipo.

---

## Cosa devi fare tu

### 1) Abilita Google in Firebase
Authentication -> Sign-in method -> **Google -> Abilita**.
In Authentication -> Settings -> **Authorized domains** aggiungi il dominio Pages
(es. `giorgiopascalistudio.github.io`). `localhost` e gia autorizzato.

### 2) Imposta le REGOLE del Realtime Database (importante!)
Realtime Database -> Regole. Incolla queste (sostituisci `LA_TUA_EMAIL` con la tua
email Google), poi **Pubblica**. Impediscono a chiunque di auto-promuoversi admin
e permettono il primo accesso amministratore sicuro:

```json
{
  "rules": {
    "accounts": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && (auth.uid === $uid || root.child('accounts').child(auth.uid).child('role').val() === 'admin')",
        ".validate": "newData.hasChildren(['email','status'])",
        "role": {
          ".validate": "root.child('accounts').child(auth.uid).child('role').val() === 'admin' || auth.token.email === 'LA_TUA_EMAIL' || newData.val() === data.val()"
        },
        "status": {
          ".validate": "root.child('accounts').child(auth.uid).child('role').val() === 'admin' || auth.token.email === 'LA_TUA_EMAIL' || newData.val() === 'pending' || newData.val() === data.val()"
        }
      }
    }
  }
}
```

Per sicurezza extra, metti la stessa email anche nel codice: in `src/App.tsx`
cerca `const ADMIN_EMAILS: string[] = []` e scrivi `['la_tua_email@gmail.com']`.
Cosi sei sempre admin anche se per sbaglio accede prima qualcun altro.

> In alternativa rapida (meno sicura): tieni il Database in "modalita test" per il
> primo accesso, entra una volta (diventi admin), poi incolla le regole sopra.

### 3) Carica i 13 modelli 3D
Metti `step-01.glb` ... `step-13.glb` in **`public/model/`** (gli stessi del
`model.zip`). Vite li pubblica da solo; l'app li carica da `model/step-XX.glb`.

---

## Avvio in locale
```bash
npm install
npm run dev
```

## Deploy su GitHub Pages (automatico)
Incluso `.github/workflows/deploy.yml`. Una volta sola: push su `main`, poi su
GitHub **Settings -> Pages -> Source = GitHub Actions**. Da li ogni push pubblica.

---

## Nota sicurezza
La config Firebase e nel codice: e normale per le web app (la sicurezza viene
dalle regole sopra). Assicurati che le regole siano pubblicate prima di mettere
il sito online.
