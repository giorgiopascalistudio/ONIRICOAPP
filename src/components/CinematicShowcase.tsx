/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CinematicShowcase — pagina vetrina "cinematica" (struttura villa-omnia).
 * Un unico video continuo a tutto schermo; lo scroll (rotella) o lo swipe
 * fanno scorrere il video con easing fluido tra "scene" mappate su secondi
 * precisi, ognuna con sottotitolo + testo narrativo.
 *
 * Usi:
 *  - Landing pubblica di AuthFlow (config LANDING_SHOWCASE in showcaseData.ts)
 *    con i tasti "Inizia il tuo progetto" / "Sono già cliente" nel footer.
 *  - Pagina vetrina degli immobili Unico (config per-deal, nodo unicoShowcase).
 *
 * I video sono SEMPRE online (Firebase Storage o URL diretto mp4): nessun
 * upload runtime. Se manca il video si usa l'immagine `poster` come sfondo.
 */

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { UnicoShowcaseScene } from '../types';
import { safeUrl } from '../utils';

interface CinematicShowcaseProps {
  videoUrl?: string | null;          // video continuo online (mp4 diretto)
  poster?: string | null;            // immagine fallback se il video manca/non carica
  scenes: UnicoShowcaseScene[];      // scene ordinate per time (s)
  brand: string;                     // header sx riga 1 (es. "ONIRICO" o titolo immobile)
  brandSub?: string;                 // header sx riga 2
  /** CTA mostrata al posto del testo sull'ULTIMA scena (come il prototipo). */
  discoverLabel?: string;
  onDiscover?: () => void;
  /** Contenuto fisso renderizzato sotto al blocco testo (es. i 2 tasti login). */
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const targetTimeRef = useRef<number>(SCENES[0].time);
  const rafRef = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(0);

  const src = safeUrl(videoUrl || '');
  const posterSrc = safeUrl(poster || '');
  const hasVideo = !!src && !videoFailed;

  // Transizione fluida: insegue il target con easing dentro al video continuo.
  const triggerSmoothTransition = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const step = () => {
      const v = videoRef.current;
      if (!v) { rafRef.current = null; return; }
      const diff = targetTimeRef.current - v.currentTime;
      if (Math.abs(diff) < 0.01) {
        v.currentTime = targetTimeRef.current;
        rafRef.current = null;
      } else {
        v.currentTime = v.currentTime + diff * 0.12; // coefficiente easing del prototipo
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const changeScene = (nextIdx: number) => {
    setCurrentSceneIdx(nextIdx);
    targetTimeRef.current = SCENES[nextIdx].time;
    lastScrollTime.current = Date.now();
    if (hasVideo) triggerSmoothTransition();
  };

  // Rotella: una "tacca" = una scena (debounce anti doppio salto).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Date.now() - lastScrollTime.current < 800) return;
      if (e.deltaY > 3 && currentSceneIdx < SCENES.length - 1) changeScene(currentSceneIdx + 1);
      else if (e.deltaY < -3 && currentSceneIdx > 0) changeScene(currentSceneIdx - 1);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [currentSceneIdx, SCENES.length, hasVideo]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Swipe mobile: su = avanti, giù = indietro.
  const touchStartY = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(deltaY) < 25) return;
    if (Date.now() - lastScrollTime.current < 800) return;
    if (deltaY < 0 && currentSceneIdx < SCENES.length - 1) changeScene(currentSceneIdx + 1);
    else if (deltaY > 0 && currentSceneIdx > 0) changeScene(currentSceneIdx - 1);
  };

  const isLast = currentSceneIdx === SCENES.length - 1;
  const scene = SCENES[currentSceneIdx];

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="relative w-full h-dvh overflow-hidden bg-stone-950 text-stone-100 font-sans flex flex-col justify-between select-none"
    >
      <style>{`
        @keyframes cinFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .cin-fade-in { animation: cinFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* 1. Video continuo di sfondo (o poster) a copertura totale */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        {hasVideo ? (
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-cover select-none"
            muted
            playsInline
            preload="auto"
            poster={posterSrc || undefined}
            onError={() => setVideoFailed(true)}
          />
        ) : posterSrc ? (
          <img src={posterSrc} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        ) : null}

        {/* Vignettature alto/basso per il contrasto dei testi */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-stone-950 via-stone-950/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-[65%] bg-gradient-to-t from-stone-950 via-stone-950/85 to-transparent pointer-events-none" />
      </div>

      {/* 2. Header sottile */}
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
            className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-stone-400 hover:text-white transition duration-300 uppercase cursor-pointer bg-white/5 hover:bg-white/15 border border-white/15 rounded-full px-3.5 py-2"
          >
            <X className="w-3 h-3" /> chiudi
          </button>
        )}
      </header>

      {/* 3. Blocco centrale scene + footer */}
      <section className="relative z-10 w-full max-w-xl mx-auto px-6 pb-10 md:pb-14 flex flex-col items-center text-center gap-4 pointer-events-auto">
        {/* Indicatore scene (pallini) */}
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

        <h2 key={`sub-${currentSceneIdx}`} className="cin-fade-in text-sm sm:text-base md:text-lg font-serif font-light text-white italic tracking-wide leading-tight">
          {scene.subtitle}
        </h2>

        <div className="max-w-md min-h-[44px] md:min-h-[52px] flex items-center justify-center">
          {isLast && onDiscover ? (
            <button
              onClick={onDiscover}
              className="cin-fade-in px-5 py-2.5 border border-white/20 hover:border-white/80 bg-white/5 hover:bg-white text-[10px] text-stone-300 hover:text-stone-950 font-mono uppercase tracking-[0.25em] rounded-full transition-all duration-500 ease-out active:scale-95 cursor-pointer"
            >
              {discoverLabel || 'Scopri di più'}
            </button>
          ) : (
            <p key={`txt-${currentSceneIdx}`} className="cin-fade-in text-[11px] sm:text-[12px] md:text-[13px] text-stone-300 font-light leading-relaxed tracking-wide">
              {scene.text}
            </p>
          )}
        </div>

        {footer}
      </section>
    </div>
  );
};
