/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AuthFlow — onboarding pubblico di Onirico.
 * Gestisce: landing vetrina (servizi) → accesso → registrazione
 * (Cliente / Azienda / Team) con email+password oppure Google →
 * completamento profilo per chi entra con Google senza scheda.
 *
 * Regole di approvazione:
 *  - Cliente / Azienda  → accesso immediato al portale (role 'cliente', active:false).
 *  - Team               → status 'pending', nessun ruolo: lo assegna admin/manager.
 *  - Email proprietario → admin attivo (bootstrap).
 *
 * Tono e copy ispirati a oniricodesign.com ("Design your vision").
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight, Mail, Lock, Phone, MapPin,
  Check, ChevronLeft, Briefcase, User as UserIcon, Users, Eye, EyeOff
} from 'lucide-react';
import {
  loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, setAccount,
  type User as GUser
} from '../firebase';
import type { AccountType } from '../types';
import { LANDING_SHOWCASE } from '../showcaseData';
import { CinematicShowcase } from './CinematicShowcase';

const OWNER_EMAIL = 'giorgio.pascali990@gmail.com';

// Classe condivisa per uniformare tutti i campi (la base .input non ha padding/altezza)
const IN = 'input w-full h-11 px-3.5 text-[14px]';
const IN_PWD = 'input w-full h-11 pl-3.5 pr-10 text-[14px]';

const SECTORS = [
  { value: 'studio', label: 'Edilizia / Architettura' },
  { value: 'strategico', label: 'Marketing / Comunicazione' },
  { value: 'materico', label: 'Edile / Forniture e posa' },
  { value: 'unico', label: 'Immobiliare' },
  { value: 'altro', label: 'Altro settore' },
];

const BENEFITS = [
  'Accesso immediato al tuo portale personale',
  'Segui ogni fase del lavoro in tempo reale',
  'Preventivi, documenti e contratti sempre con te',
];

const GoogleMark = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);

const authErr = (code?: string): string => {
  switch (code) {
    case 'auth/email-already-in-use': return 'Esiste già un account con questa email. Usa "Accedi".';
    case 'auth/invalid-email': return 'Email non valida.';
    case 'auth/weak-password': return 'Password troppo debole (min. 6 caratteri).';
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Email o password non corretti.';
    case 'auth/user-not-found': return 'Nessun account con questa email.';
    case 'auth/too-many-requests': return 'Troppi tentativi. Riprova più tardi.';
    case 'auth/popup-closed-by-user': return 'Accesso annullato.';
    case 'auth/operation-not-allowed': return 'Email/Password non abilitato su Firebase. Contatta lo studio.';
    default: return 'Operazione non riuscita. Riprova.';
  }
};

interface AuthFlowProps {
  gUser: GUser | null;                 // utente Firebase (presente = autenticato ma profilo incompleto)
  pendingProfile?: any | null;         // record users/<uid> già esistente (parziale)
  onToast: (msg: string, type?: 'ok' | 'err') => void;
  onLogout: () => void;
}

const Field: React.FC<{
  label: string; icon?: React.ReactNode; children: React.ReactNode; full?: boolean;
}> = ({ label, icon, children, full }) => (
  <div className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
    <label className="text-[11.5px] font-bold text-[#555] flex items-center gap-1.5">{icon}{label}</label>
    {children}
  </div>
);

export const AuthFlow: React.FC<AuthFlowProps> = ({ gUser, pendingProfile, onToast, onLogout }) => {
  // Se l'utente è autenticato ma senza scheda completa → forziamo il completamento.
  const completing = !!gUser;

  const [screen, setScreen] = useState<'landing' | 'login' | 'register'>('landing');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Login
  const [liEmail, setLiEmail] = useState('');
  const [liPass, setLiPass] = useState('');

  // Registrazione / completamento
  const splitName = (gUser?.displayName || '').trim().split(/\s+/);
  const [accountType, setAccountType] = useState<AccountType>('cliente');
  const [firstName, setFirstName] = useState(splitName[0] || '');
  const [lastName, setLastName] = useState(splitName.slice(1).join(' ') || '');
  const [email, setEmail] = useState(gUser?.email || '');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [residenza, setResidenza] = useState('');
  const [privacy, setPrivacy] = useState(false);
  // Azienda
  const [companyName, setCompanyName] = useState('');
  const [partitaIva, setPartitaIva] = useState('');
  const [codiceFiscale, setCodiceFiscale] = useState('');
  const [pec, setPec] = useState('');
  const [sdi, setSdi] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companySector, setCompanySector] = useState('studio');

  const fail = (msg: string) => { setErr(msg); setBusy(false); };

  const buildRecord = (uid: string, em: string, photo: string) => {
    const isOwner = em.toLowerCase() === OWNER_EMAIL;
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || gUser?.displayName || em;
    const base: any = {
      uid,
      email: em,
      name: fullName,
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      telefono: telefono.trim() || null,
      residenza: residenza.trim() || null,
      photoURL: photo || pendingProfile?.photoURL || '',
      accountType,
      privacyAccepted: true,
      privacyAcceptedAt: Date.now(),
      profileComplete: true,
      createdAt: pendingProfile?.createdAt || Date.now(),
    };
    if (isOwner) return { ...base, role: 'admin', status: 'approved', active: true };
    if (accountType === 'team') return { ...base, status: 'pending', active: false };
    // cliente | azienda → portale, accesso immediato
    const rec: any = { ...base, role: 'cliente', status: 'approved', active: false };
    if (accountType === 'azienda') {
      rec.companyName = companyName.trim() || null;
      rec.partitaIva = partitaIva.trim() || null;
      rec.codiceFiscale = codiceFiscale.trim() || null;
      rec.pec = pec.trim() || null;
      rec.sdi = sdi.trim() || null;
      rec.companyAddress = companyAddress.trim() || null;
      rec.sector = companySector;
    }
    return rec;
  };

  const validateProfile = (): string | null => {
    if (!firstName.trim() || !lastName.trim()) return 'Inserisci nome e cognome.';
    if (!telefono.trim()) return 'Inserisci un numero di telefono.';
    if (!residenza.trim()) return 'Inserisci la residenza.';
    if (accountType === 'azienda') {
      if (!companyName.trim()) return 'Inserisci la ragione sociale.';
      if (!partitaIva.trim()) return 'Inserisci la partita IVA.';
    }
    if (!privacy) return 'Devi accettare l’informativa privacy.';
    return null;
  };

  // Submit registrazione / completamento profilo. via: 'email' | 'google'
  const submit = async (via: 'email' | 'google') => {
    setErr(null);
    const vp = validateProfile();
    if (vp) { setErr(vp); return; }

    if (!completing && via === 'email') {
      if (!email.trim()) { setErr('Inserisci una email.'); return; }
      if (pass.length < 6) { setErr('La password deve avere almeno 6 caratteri.'); return; }
      if (pass !== pass2) { setErr('Le password non coincidono.'); return; }
    }

    setBusy(true);
    try {
      let uid: string, em: string, photo = '';
      if (completing && gUser) {
        uid = gUser.uid; em = gUser.email || email; photo = gUser.photoURL || '';
      } else if (via === 'google') {
        const cred = await loginWithGoogle();
        uid = cred.user.uid; em = cred.user.email || ''; photo = cred.user.photoURL || '';
      } else {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const cred = await registerWithEmail(email, pass, fullName);
        uid = cred.user.uid; em = email.trim();
      }
      await setAccount(uid, buildRecord(uid, em, photo));
      // Da qui in poi watchOwnAccount in App rileva il record completo e instrada.
      if (accountType === 'team') {
        onToast('Registrazione inviata. Un responsabile la approverà a breve.');
      } else {
        onToast('Benvenuto in Onirico!');
      }
    } catch (e: any) {
      fail(authErr(e?.code));
    }
  };

  const handleLogin = async () => {
    setErr(null);
    if (!liEmail.trim() || !liPass) { setErr('Inserisci email e password.'); return; }
    setBusy(true);
    try {
      await loginWithEmail(liEmail, liPass);
    } catch (e: any) {
      fail(authErr(e?.code));
    }
  };

  const handleGoogle = async () => {
    setErr(null);
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (e: any) {
      fail(authErr(e?.code));
    }
  };

  const handleReset = async () => {
    if (!liEmail.trim()) { setErr('Scrivi la tua email, poi premi di nuovo "Password dimenticata?".'); return; }
    try {
      await resetPassword(liEmail);
      onToast('Ti abbiamo inviato il link per reimpostare la password.');
    } catch (e: any) {
      onToast(authErr(e?.code), 'err');
    }
  };

  const TYPE_CARDS: { value: AccountType; title: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'cliente', title: 'Cliente', desc: 'Privato. Accesso immediato al tuo portale.', icon: <UserIcon className="w-5 h-5" /> },
    { value: 'azienda', title: 'Azienda', desc: 'Società con P.IVA e dati di fatturazione.', icon: <Briefcase className="w-5 h-5" /> },
    { value: 'team', title: 'Team', desc: 'Collaboratore. Richiede approvazione.', icon: <Users className="w-5 h-5" /> },
  ];

  // ---------- COMPLETAMENTO PROFILO (entrato con Google, scheda mancante) ----------
  if (completing) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] p-4 sm:p-6 flex items-center justify-center font-sans">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-[560px]">
          <div className="text-center mb-5">
            <h1 className="font-serif text-[30px] tracking-tight text-[#161616]">Ci siamo quasi</h1>
            <p className="text-[13.5px] text-stone-500 mt-1.5">Completa il profilo per attivare il tuo accesso.</p>
          </div>
          <div className="bg-white border border-[#e2e2e2] rounded-[26px] shadow-sm p-6 sm:p-7">
            {renderTypePicker()}
            <div className="grid grid-cols-2 gap-3.5 mt-5">{renderProfileFields()}</div>
            {renderPrivacy()}
            {err && <p className="text-[12px] text-red-600 font-semibold mt-3">{err}</p>}
            <button onClick={() => submit('email')} disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[14px] w-full mt-5 h-11 transition active:scale-[0.98] disabled:opacity-60">
              {busy ? 'Attendere…' : 'Conferma e accedi'} <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={onLogout} className="text-[12px] text-stone-400 hover:text-stone-600 font-semibold w-full text-center mt-3">
              Esci ({gUser?.email})
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---------- LANDING (cinematica, struttura villa-omnia) ----------
  if (screen === 'landing') {
    return (
      <CinematicShowcase
        videoUrl={LANDING_SHOWCASE.videoUrl}
        poster={LANDING_SHOWCASE.poster}
        scenes={LANDING_SHOWCASE.scenes}
        brand="ONIRICO"
        brandLogo={LANDING_SHOWCASE.logoUrl}
        brandSub="Architettura · Ingegneria · Design"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-md mt-2">
            <button
              onClick={() => { setScreen('register'); setErr(null); }}
              className="flex items-center justify-center gap-2 text-[13.5px] font-bold px-7 h-12 rounded-full bg-white text-stone-950 hover:bg-stone-200 transition active:scale-[0.98] w-full sm:w-auto cursor-pointer"
            >
              Inizia il tuo progetto <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setScreen('login'); setErr(null); }}
              className="text-[13.5px] font-bold px-7 h-12 rounded-full border border-white/30 text-white hover:bg-white/10 transition active:scale-[0.98] w-full sm:w-auto cursor-pointer"
            >
              Sono già cliente
            </button>
          </div>
        }
      />
    );
  }

  // ---------- LOGIN ----------
  if (screen === 'login') {
    return (
      <div className="min-h-screen bg-[#F5F5F3] p-4 sm:p-6 flex items-center justify-center font-sans">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-[400px]">
          <button onClick={() => { setScreen('landing'); setErr(null); }} className="flex items-center gap-1 text-[12.5px] font-bold text-stone-500 hover:text-[#161616] mb-4">
            <ChevronLeft className="w-4 h-4" /> Indietro
          </button>
          <div className="text-center mb-6">
            <h1 className="font-serif text-[30px] tracking-tight">Bentornato</h1>
            <p className="text-[13.5px] text-stone-500 mt-1.5">Accedi al tuo spazio Onirico.</p>
          </div>
          <div className="bg-white border border-[#e2e2e2] rounded-[24px] shadow-sm p-6 flex flex-col gap-3.5">
            <Field label="Email" icon={<Mail className="w-3.5 h-3.5" />}>
              <input type="email" value={liEmail} onChange={(e) => setLiEmail(e.target.value)} className={IN} placeholder="nome@email.it" />
            </Field>
            <Field label="Password" icon={<Lock className="w-3.5 h-3.5" />}>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={liPass} onChange={(e) => setLiPass(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className={IN_PWD} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <button onClick={handleReset} className="text-[11.5px] font-bold text-stone-400 hover:text-[#161616] text-right -mt-1.5">
              Password dimenticata?
            </button>

            {err && <p className="text-[12px] text-red-600 font-semibold">{err}</p>}

            <button onClick={handleLogin} disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[14px] h-11 transition active:scale-[0.98] disabled:opacity-60">
              {busy ? 'Accesso…' : 'Accedi'}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="h-px flex-1 bg-[#ececec]" />
              <span className="text-[11px] font-bold text-stone-400 uppercase">oppure</span>
              <div className="h-px flex-1 bg-[#ececec]" />
            </div>

            <button onClick={handleGoogle} disabled={busy} className="flex items-center justify-center gap-3 h-11 rounded-xl border border-stone-200 hover:bg-stone-50 hover:border-stone-400 font-bold text-[14px] disabled:opacity-60">
              <GoogleMark /> Continua con Google
            </button>
          </div>
          <p className="text-center text-[12.5px] text-stone-500 mt-5">
            Non hai un account?{' '}
            <button onClick={() => { setScreen('register'); setErr(null); }} className="font-bold text-[#161616] hover:underline">Registrati</button>
          </p>
        </motion.div>
      </div>
    );
  }

  // ---------- REGISTRAZIONE ----------
  return (
    <div className="min-h-screen bg-[#F5F5F3] p-4 sm:p-6 flex items-center justify-center font-sans">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-[940px]">
        <button onClick={() => { setScreen('landing'); setErr(null); }} className="flex items-center gap-1 text-[12.5px] font-bold text-stone-500 hover:text-[#161616] mb-4">
          <ChevronLeft className="w-4 h-4" /> Indietro
        </button>

        <div className="grid lg:grid-cols-[0.82fr_1.18fr] bg-white border border-[#e2e2e2] rounded-[28px] shadow-sm overflow-hidden">
          {/* Pannello brand (desktop) */}
          <div className="hidden lg:flex flex-col justify-between bg-[#161616] text-white p-9 relative">
            <div>
              <div className="font-serif text-[22px] tracking-tight">onirico</div>
              <h2 className="font-serif text-[34px] leading-[1.08] mt-12">
                Diamo forma<br />ai tuoi <span className="italic text-white/55">sogni.</span>
              </h2>
              <p className="text-[13.5px] text-white/60 mt-4 leading-relaxed">
                Crea il tuo accesso e segui ogni progetto, dall’idea alla consegna delle chiavi.
              </p>
            </div>
            <ul className="flex flex-col gap-3 mt-10">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[13px] text-white/85">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <p className="text-[11.5px] text-white/40 mt-10 leading-relaxed">
              Hai già una pratica avviata con noi? Lo studio la collegherà al tuo account.
            </p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            <div className="mb-5">
              <h1 className="font-serif text-[28px] tracking-tight">Crea il tuo accesso</h1>
              <p className="text-[13px] text-stone-500 mt-1">Scegli il tipo di account e completa i dati.</p>
            </div>

            {renderTypePicker()}

            <div className="grid grid-cols-2 gap-3.5 mt-5">
              {renderProfileFields()}

              {/* Credenziali email */}
              <Field label="Email" icon={<Mail className="w-3.5 h-3.5" />} full>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={IN} placeholder="nome@email.it" />
              </Field>
              <Field label="Password" icon={<Lock className="w-3.5 h-3.5" />}>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} className={IN_PWD} placeholder="min. 6 caratteri" />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Conferma password" icon={<Lock className="w-3.5 h-3.5" />}>
                <input type={showPass ? 'text' : 'password'} value={pass2} onChange={(e) => setPass2(e.target.value)} className={IN} placeholder="ripeti password" />
              </Field>
            </div>

            {renderPrivacy()}

            {err && <p className="text-[12px] text-red-600 font-semibold mt-3">{err}</p>}

            <button onClick={() => submit('email')} disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-[#1b1b1b] hover:bg-black text-white font-bold text-[14px] w-full mt-5 h-11 transition active:scale-[0.98] disabled:opacity-60">
              {busy ? 'Attendere…' : 'Crea account'} <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 my-3.5">
              <div className="h-px flex-1 bg-[#ececec]" />
              <span className="text-[11px] font-bold text-stone-400 uppercase">oppure</span>
              <div className="h-px flex-1 bg-[#ececec]" />
            </div>

            <button onClick={() => submit('google')} disabled={busy} className="flex items-center justify-center gap-3 h-11 rounded-xl border border-stone-200 hover:bg-stone-50 hover:border-stone-400 font-bold text-[14px] w-full disabled:opacity-60">
              <GoogleMark /> Registrati con Google
            </button>

            <p className="text-center text-[12.5px] text-stone-500 mt-5">
              Hai già un account?{' '}
              <button onClick={() => { setScreen('login'); setErr(null); }} className="font-bold text-[#161616] hover:underline">Accedi</button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // ---------- blocchi riusati ----------
  function renderTypePicker() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {TYPE_CARDS.map((t) => {
          const on = accountType === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setAccountType(t.value)}
              className={`text-left rounded-2xl border p-3.5 transition-all ${on ? 'border-[#1b1b1b] bg-[#1b1b1b] text-white shadow-md' : 'border-[#e6e6e6] bg-white hover:border-stone-400'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${on ? 'bg-white/15' : 'bg-[#f2f2f0]'}`}>
                {t.icon}
              </div>
              <b className="block text-[14px]">{t.title}</b>
              <span className={`block text-[11px] leading-snug mt-0.5 ${on ? 'text-white/70' : 'text-stone-500'}`}>{t.desc}</span>
            </button>
          );
        })}
      </div>
    );
  }

  function renderProfileFields() {
    return (
      <>
        <Field label="Nome" icon={<UserIcon className="w-3.5 h-3.5" />}>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={IN} placeholder="Mario" />
        </Field>
        <Field label="Cognome" icon={<UserIcon className="w-3.5 h-3.5" />}>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={IN} placeholder="Rossi" />
        </Field>
        <Field label="Telefono" icon={<Phone className="w-3.5 h-3.5" />}>
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={IN} placeholder="+39 ..." />
        </Field>
        <Field label="Residenza" icon={<MapPin className="w-3.5 h-3.5" />}>
          <input value={residenza} onChange={(e) => setResidenza(e.target.value)} className={IN} placeholder="Via, Città" />
        </Field>

        {accountType === 'azienda' && (
          <>
            <div className="col-span-2 mt-1 mb-0.5 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400">Dati azienda</span>
              <div className="h-px flex-1 bg-[#ececec]" />
            </div>
            <Field label="Ragione sociale" full>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={IN} placeholder="Azienda S.r.l." />
            </Field>
            <Field label="Partita IVA">
              <input value={partitaIva} onChange={(e) => setPartitaIva(e.target.value)} className={IN} placeholder="IT01234567890" />
            </Field>
            <Field label="Codice fiscale">
              <input value={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value)} className={IN} />
            </Field>
            <Field label="PEC">
              <input value={pec} onChange={(e) => setPec(e.target.value)} className={IN} placeholder="azienda@pec.it" />
            </Field>
            <Field label="Codice SDI">
              <input value={sdi} onChange={(e) => setSdi(e.target.value)} className={IN} placeholder="0000000" />
            </Field>
            <Field label="Sede legale" full>
              <input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className={IN} placeholder="Via, Città" />
            </Field>
            <Field label="Settore in cui operate" full>
              <select value={companySector} onChange={(e) => setCompanySector(e.target.value)} className={`${IN} pr-3`}>
                {SECTORS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </>
        )}
      </>
    );
  }

  function renderPrivacy() {
    return (
      <label className="flex items-start gap-2.5 mt-4 cursor-pointer select-none">
        <span className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${privacy ? 'bg-[#1b1b1b] border-[#1b1b1b]' : 'border-stone-300 bg-white'}`}>
          {privacy && <Check className="w-3.5 h-3.5 text-white" />}
        </span>
        <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="hidden" />
        <span className="text-[12px] text-stone-600 leading-snug">
          Ho letto e accetto l’<b className="text-[#161616]">informativa sulla privacy</b> e il trattamento dei miei dati personali secondo il GDPR (Reg. UE 2016/679).
        </span>
      </label>
    );
  }
};
