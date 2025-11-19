'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';

export default function AvatarHoverCard({ avatar, selected, onToggle }) {
  const videoRef = useRef(null);
  const hoverTimer = useRef(null);
  const cardRef = useRef(null);
  const [showVideo, setShowVideo] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  // Lazy load video element only when card is visible in viewport
  useEffect(() => {
    if (!cardRef.current || !avatar.video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Only load video source when actually visible
            setShouldLoadVideo(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading slightly before entering viewport
        threshold: 0.1,
      }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [avatar.video]);

  useEffect(() => {
    if (videoRef.current && shouldLoadVideo) {
      try {
        videoRef.current.muted = true;
        videoRef.current.setAttribute('muted', '');
      } catch {}
    }
  }, [shouldLoadVideo]);

  function safePlay(v) {
    if (!v) return;
    try {
      const p = v.play?.();
      if (p && typeof p.then === 'function') {
        p.then(() => setShowVideo(true)).catch(() => setShowVideo(false));
      } else {
        setShowVideo(true);
      }
    } catch {
      setShowVideo(false);
    }
  }

  function handleEnter() {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      const v = videoRef.current;
      if (v) {
        try { v.currentTime = 0; } catch {}
        safePlay(v);
      }
    }, 75);
  }

  function handleLeave() {
    clearTimeout(hoverTimer.current);
    const v = videoRef.current;
    if (v) {
      try {
        v.pause?.();
        v.currentTime = 0;
      } catch {}
    }
    setShowVideo(false);
  }

  return (
    <article 
      ref={cardRef}
      className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <div
        className="relative aspect-[4/5] overflow-hidden"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <img
          src={avatar.image}
          alt={avatar.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />

        {/* Only render video element when it should be loaded (visible in viewport) */}
        {avatar.video && shouldLoadVideo && (
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${showVideo ? 'opacity-100' : 'opacity-0'}`}
            muted
            playsInline
            loop
            preload="none"
            disablePictureInPicture
            controls={false}
            onCanPlay={() => setShowVideo(true)}
          >
            <source src={avatar.video} type="video/mp4" />
          </video>
        )}

        <button
          onClick={onToggle}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full border ${
            selected
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white/80 text-slate-700 border-slate-300'
          } backdrop-blur flex items-center justify-center shadow`}
          aria-pressed={selected}
          aria-label={selected ? 'Deselect avatar' : 'Select avatar'}
        >
          {selected ? (
            <Check className="w-4 h-4" />
          ) : (
            <span className="block w-3.5 h-3.5 rounded-full border border-slate-400" />
          )}
        </button>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-slate-900 whitespace-normal break-words">
          {avatar.name}
        </h3>
      </div>
    </article>
  );
}
