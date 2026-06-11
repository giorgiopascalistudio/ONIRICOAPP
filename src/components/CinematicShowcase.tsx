/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CinematicShowcase — pagina vetrina "cinematica" (struttura villa-omnia).
 * Un unico video continuo a tutto schermo; lo scroll (rotella) o lo swipe
 * fanno avanzare il video tra "scene" mappate su secondi precisi (di regola
 * una scena ogni ~3s), ognuna con titolo grande centrato + testo narrativo.
 *
 * Usi:
 *  - Landing pubblica di AuthFlow (config LANDING_SHOWCASE in showcaseData.ts)
 *    con i tasti "Inizia il tuo progetto" / "Sono già cliente" nel footer.
 *  - Pagina vetrina degli immobili Unico (config per-deal, nodo unicoShowcase).
 *
 * Fluidità (anche mobile): NON si fa scrubbing per-frame di `currentTime` (un
 * seek a ogni frame = lag e schermo nero su mobile). In avanti si RIPRODUCE il
 * video a velocità maggiorata fino al secondo della scena (decode lineare =
 * fluido); all'indietro un solo seek. Il primo frame si "innesca" con un
 * play/pause muto (necessario su iOS, altrimenti il video resta nero).
 *
 * I video sono SEMPRE online (URL diretto mp4): nessun upload runtime. In
 * caricamento si resta su NERO con il titolo che lampeggia (niente immagine).
 */

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { UnicoShowcaseScene } from '../types';
import { safeUrl } from '../utils';

interface CinematicShowcaseProps {
  videoUrl?: string | null;          // video continuo online (mp4 diretto)
  poster?: string | null;            // immagine sfondo SOLO se non c'è video (deal Unico senza tour)
  scenes: UnicoShowcaseScene[];      // scene ordinate per time (s)
  brand: string;                     // header sx riga 1 (es. "ONIRICO" o titolo immobile)
  brandSub?: string;                 // header sx riga 2
  /** CTA mostrata al posto del testo sull'ULTIMA scena (come il prototipo). */
  discoverLabel?: string;
  onDiscover?: () => void;
  /** Contenuto fisso renderizzato in basso (es. i 2 tasti login). */
  footer?: React.ReactNode;
  /** Se presente: pulsante [ chiudi ] in alto a destra (uso overlay). */
  onClose?: () => void;
}

export const CinematicShowcase: React.FC<CinematicShowcaseProps> = ({
  videoUrl, poster, scenes, brand, brandSub, discoverLabel, onDiscover, footer, onClose,
}) => {
  // Scene ordinate e con fallback: senza scene la pagina resta statica.
  const SCENES = scenes.length ? [...scenes].sort((a, b) => a.time - b.time) : [{ time: 0, subtitle: brand, text: '' }];

  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const [ready, setReady] = useState(false); // il video ha iniziato a riprodurre → via il velo nero

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const idxRef = useRef(0); // indice corrente leggibile dentro i listener nativi

  const src = safeUrl(videoUrl || '');
  const posterSrc = safeUrl(poster || '');
  const hasVideo = !!src && !videoFailed;

  const rafRef = useRef<number | null>(null);
  const primedRef = useRef(false); // il video ha già riprodotto (decoder attivo)
  const cancelRaf = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };

  // Forza muted via JS (React non setta sempre la property → autoplay bloccato).
  const forceMuted = () => {
    const v = videoRef.current;
    if (v) { v.muted = true; v.defaultMuted = true; }
  };

  // Porta il video al secondo `target`. In AVANTI riproduce a velocità maggiorata
  // (decode lineare = fluido su PC e mobile, niente seek per-frame); all'INDIETRO
  // un solo seek. Alla fine PAUSA: il frame resta (il decoder ha già riprodotto,
  // quindi anche su iOS il fotogramma è renderizzato, non nero). Niente loop.
  const TRANSITION_RATE = 2.6;
  const applyTarget = (target: number, instant = false) => {
    const v = videoRef.current;
    if (!v || !v.duration || isNaN(v.duration)) return;
    cancelRaf();
    const tgt = Math.max(0, Math.min(target, v.duration - 0.05));
    if (instant || tgt <= v.currentTime + 0.05) {
      forceMuted();
      try { v.currentTime = tgt; } catch { /* seek non pronto */ }
      v.pause();
      return;
    }
    forceMuted();
    v.playbackRate = TRANSITION_RATE;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    const tick = () => {
      const vv = videoRef.current;
      if (!vv) { rafRef.current = null; return; }
      if (vv.currentTime >= tgt - 0.04 || vv.ended) {
        try { vv.currentTime = tgt; } catch { /* noop */ }
        vv.pause();
        vv.playbackRate = 1;
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Cambio scena: aggiorna il testo + muovi il video alla scena.
  const changeScene = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(nextIdx, SCENES.length - 1));
    setCurrentSceneIdx(clamped);
    idxRef.current = clamped;
    lastScrollTime.current = Date.now();
    applyTarget(SCENES[clamped].time);
  };

  // L'autoplay muto serve SOLO a "primare" il decoder (su iOS un video mai
  // riprodotto resta nero). Appena parte, prendiamo il controllo: posizioniamo
  // sulla scena corrente e mettiamo in pausa → da lì comanda lo scroll.
  const handlePlaying = () => {
    setReady(true);
    if (primedRef.current) return;
    primedRef.current = true;
    applyTarget(SCENES[idxRef.current].time, true);
  };

  // Tenta il play appena il src è pronto (desktop parte qui; mobile via autoplay).
  useEffect(() => {
    if (!hasVideo) return;
    forceMuted();
    const v = videoRef.current;
    const p = v && v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, hasVideo]);

  // Rete di sicurezza: se l'autoplay è bloccato a freddo, il primo gesto utente
  // (tap/click ovunque) avvia la riproduzione e quindi prima il decoder.
  useEffect(() => {
    if (!hasVideo) return;
    const kick = () => {
      forceMuted();
      const v = videoRef.current;
      const p = v && v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    document.addEventListener('touchstart', kick, { passive: true });
    document.addEventListener('pointerdown', kick);
    return () => {
      document.removeEventListener('touchstart', kick);
      document.removeEventListener('pointerdown', kick);
    };
  }, [hasVideo]);

  useEffect(() => () => cancelRaf(), []);

  // Listener nativi (non-passivi) per rotella + swipe: così possiamo bloccare
  // lo scroll della pagina (pull-to-refresh incluso) → sensazione "app".
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Date.now() - lastScrollTime.current < 700) return;
      if (e.deltaY > 3) changeScene(idxRef.current + 1);
      else if (e.deltaY < -3) changeScene(idxRef.current - 1);
    };
    const onTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // blocca lo scroll nativo della pagina
      const deltaY = e.touches[0].clientY - touchStartY.current;
      if (Math.abs(deltaY) < 30) return;
      if (Date.now() - lastScrollTime.current < 700) return;
      if (deltaY < 0) { changeScene(idxRef.current + 1); touchStartY.current = e.touches[0].clientY; }
      else { changeScene(idxRef.current - 1); touchStartY.current = e.touches[0].clientY; }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SCENES.length]);

  const isLast = currentSceneIdx === SCENES.length - 1;
  const scene = SCENES[currentSceneIdx];
  const loadingText = SCENES[0].subtitle || brand;

  return (
    <div
      ref={containerRef}
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      className="relative w-full h-dvh overflow-hidden bg-black text-stone-100 font-sans flex flex-col select-none"
    >
      <style>{`
        @keyframes cinFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .cin-fade-in { animation: cinFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes cinBlink { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }
        .cin-blink { animation: cinBlink 1.6s ease-in-out infinite; }
      `}</style>

      {/* 1. Sfondo: video continuo (o, in assenza di video, immagine del deal) */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-black">
        {hasVideo ? (
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-cover select-none"
            muted
            autoPlay
            playsInline
            preload="auto"
            disablePictureInPicture
            onPlaying={handlePlaying}
            onError={() => setVideoFailed(true)}
          />
        ) : posterSrc ? (
          <img src={posterSrc} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        ) : null}

        {/* Vignettature alto/basso per il contrasto dei testi */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-[70%] bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />
      </div>

      {/* 1b. Velo NERO in caricamento col titolo che lampeggia (niente immagine) */}
      {hasVideo && !ready && (
        <div className="absolute inset-0 z-30 bg-black flex items-center justify-center px-6 pointer-events-none">
          <span className="cin-blink text-center font-serif italic font-light text-white tracking-wide text-[26px] leading-tight sm:text-4xl md:text-5xl">
            {loadingText}
          </span>
        </div>
      )}

      {/* 2. Header sottile (logo persistente) */}
      <header className="relative z-10 w-full px-6 py-6 md:px-12 md:py-8 flex items-start justify-between pointer-events-auto">
        <div className="flex flex-col">
          <h1 className="text-[12px] md:text-[14px] font-light uppercase tracking-[0.35em] text-white">{brand}</h1>
          {brandSub && (
            <p className="text-[7.5px] md:text-[8px] tracking-[0.4em] uppercase text-stone-400 font-medium mt-1">{brandSub}</p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-stone-300 hover:text-white transition duration-300 uppercase cursor-pointer bg-white/5 hover:bg-white/15 border border-white/15 rounded-full px-3.5 py-2"
          >
            <X className="w-3 h-3" /> chiudi
          </button>
        )}
      </header>

      {/* 3. Blocco scena CENTRATO e GRANDE */}
      <section className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-6 flex flex-col items-center justify-center text-center gap-5">
        <h2
          key={`sub-${currentSceneIdx}`}
          className="cin-fade-in font-serif font-light text-white italic tracking-wide leading-[1.08] text-[28px] sm:text-4xl md:text-5xl lg:text-[56px] max-w-2xl"
        >
          {scene.subtitle}
        </h2>

        <div className="max-w-md min-h-[44px] flex items-center justify-center">
          {isLast && onDiscover ? (
            <button
              onClick={onDiscover}
              className="cin-fade-in px-6 py-3 border border-white/25 hover:border-white/80 bg-white/5 hover:bg-white text-[11px] text-stone-200 hover:text-stone-950 font-mono uppercase tracking-[0.25em] rounded-full transition-all duration-500 ease-out active:scale-95 cursor-pointer"
            >
              {discoverLabel || 'Scopri di più'}
            </button>
          ) : (
            <p key={`txt-${currentSceneIdx}`} className="cin-fade-in text-[13px] sm:text-[14px] md:text-[15px] text-stone-300 font-light leading-relaxed tracking-wide">
              {scene.text}
            </p>
          )}
        </div>
      </section>

      {/* 4. Barra inferiore: pallini scene + footer (es. tasti login) */}
      <div className="relative z-10 w-full px-6 pb-10 md:pb-12 flex flex-col items-center gap-5 pointer-events-auto">
        {SCENES.length > 1 && (
          <div className="flex items-center gap-1.5">
            {SCENES.map((s, i) => (
              <button
                key={`${s.time}-${i}`}
                onClick={() => changeScene(i)}
                aria-label={`Scena ${i + 1}`}
                className={`rounded-full transition-all duration-500 cursor-pointer ${i === currentSceneIdx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'}`}
              />
            ))}
          </div>
        )}
        {footer}
      </div>
    </div>
  );
};
