'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Play, Pause } from 'lucide-react';
import { HeroVideoItem } from '@/content/site';

interface HeroVideoRotatorProps {
  videos: HeroVideoItem[];
  fallbackImage?: string;
  fallbackAlt?: string;
  className?: string;
}

export const HeroVideoRotator: React.FC<HeroVideoRotatorProps> = ({
  videos,
  fallbackImage = '/assets/hero/laurrel-room.png',
  fallbackAlt = 'Sunlit living room showcasing Laurrel Services cleaning and preparation standard',
  className = '',
}) => {
  // If no videos provided, render fallback image directly
  if (!videos || videos.length === 0) {
    return (
      <div className={`relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] xl:aspect-[5/4] rounded-3xl overflow-hidden border border-black/[0.08] shadow-2xl bg-neutral-100 ${className}`}>
        <Image
          src={fallbackImage}
          alt={fallbackAlt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 640px"
          className="object-cover object-[center_60%] sm:object-[45%_55%]"
        />
      </div>
    );
  }

  // Active video index (0 = Cleaning, 1 = Moving, 2 = Storage)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Dual-slot video architecture for smooth 750ms crossfade without flicker
  // Slot A and Slot B alternate between active (foreground) and incoming (background)
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');
  const [slotAIndex, setSlotAIndex] = useState(0);
  const [slotBIndex, setSlotBIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const videoRefA = useRef<HTMLVideoElement | null>(null);
  const videoRefB = useRef<HTMLVideoElement | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for reduced motion and data-saver preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (motionQuery.matches) {
        setPrefersReducedMotion(true);
        setIsPlaying(false);
      }

      const handleMotionChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
        if (e.matches) setIsPlaying(false);
      };

      motionQuery.addEventListener('change', handleMotionChange);

      // Check Save-Data header preference
      const nav = navigator as unknown as { connection?: { saveData?: boolean } };
      if (nav.connection?.saveData) {
        setIsPlaying(false);
      }

      return () => motionQuery.removeEventListener('change', handleMotionChange);
    }
  }, []);

  // Handle Page Visibility API: pause when tab hidden, resume when visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (activeSlot === 'A' && videoRefA.current && !videoRefA.current.paused) {
          videoRefA.current.pause();
        } else if (activeSlot === 'B' && videoRefB.current && !videoRefB.current.paused) {
          videoRefB.current.pause();
        }
      } else {
        if (isPlaying && !prefersReducedMotion) {
          const activeVid = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
          if (activeVid && activeVid.paused) {
            activeVid.play().catch(() => {});
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeSlot, isPlaying, prefersReducedMotion]);

  // Advance to next video with 750ms crossfade
  const advanceToNext = useCallback(() => {
    if (isTransitioning) return;

    const nextIndex = (currentIndex + 1) % videos.length;
    setIsTransitioning(true);

    if (activeSlot === 'A') {
      // Slot A is currently visible -> transition to Slot B
      setSlotBIndex(nextIndex);
      const incomingVid = videoRefB.current;
      if (incomingVid) {
        incomingVid.currentTime = 0;
        if (isPlaying && !prefersReducedMotion) {
          incomingVid.play().catch(() => {});
        }
      }

      // Switch active slot to B
      setActiveSlot('B');
      setCurrentIndex(nextIndex);

      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        // Prepare Slot A for the subsequent video
        const subsequentIndex = (nextIndex + 1) % videos.length;
        setSlotAIndex(subsequentIndex);
        if (videoRefA.current) {
          videoRefA.current.pause();
          videoRefA.current.currentTime = 0;
        }
      }, 750);
    } else {
      // Slot B is currently visible -> transition to Slot A
      setSlotAIndex(nextIndex);
      const incomingVid = videoRefA.current;
      if (incomingVid) {
        incomingVid.currentTime = 0;
        if (isPlaying && !prefersReducedMotion) {
          incomingVid.play().catch(() => {});
        }
      }

      // Switch active slot to A
      setActiveSlot('A');
      setCurrentIndex(nextIndex);

      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        // Prepare Slot B for the subsequent video
        const subsequentIndex = (nextIndex + 1) % videos.length;
        setSlotBIndex(subsequentIndex);
        if (videoRefB.current) {
          videoRefB.current.pause();
          videoRefB.current.currentTime = 0;
        }
      }, 750);
    }
  }, [currentIndex, isTransitioning, activeSlot, isPlaying, prefersReducedMotion, videos.length]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // TimeUpdate monitor on active video: trigger advance 0.75s before video ends
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (prefersReducedMotion || !isPlaying || isTransitioning) return;
    const vid = e.currentTarget;
    const duration = vid.duration;
    const currentTime = vid.currentTime;

    // Trigger crossfade 750ms before natural video duration ends
    if (duration && !isNaN(duration) && duration > 1) {
      if (currentTime >= duration - 0.75) {
        advanceToNext();
      }
    }
  };

  // Fallback if video ends without triggering timeupdate
  const handleVideoEnded = () => {
    if (!prefersReducedMotion && isPlaying && !isTransitioning) {
      advanceToNext();
    }
  };

  // Toggle Play / Pause
  const togglePlayPause = () => {
    const activeVid = activeSlot === 'A' ? videoRefA.current : videoRefB.current;
    if (isPlaying) {
      activeVid?.pause();
      setIsPlaying(false);
    } else {
      activeVid?.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Handle manual selection of service indicator
  const selectService = (targetIndex: number) => {
    if (targetIndex === currentIndex || isTransitioning) return;
    setIsTransitioning(true);

    if (activeSlot === 'A') {
      setSlotBIndex(targetIndex);
      const incomingVid = videoRefB.current;
      if (incomingVid) {
        incomingVid.currentTime = 0;
        if (isPlaying && !prefersReducedMotion) incomingVid.play().catch(() => {});
      }
      setActiveSlot('B');
      setCurrentIndex(targetIndex);
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        setSlotAIndex((targetIndex + 1) % videos.length);
        if (videoRefA.current) videoRefA.current.pause();
      }, 750);
    } else {
      setSlotAIndex(targetIndex);
      const incomingVid = videoRefA.current;
      if (incomingVid) {
        incomingVid.currentTime = 0;
        if (isPlaying && !prefersReducedMotion) incomingVid.play().catch(() => {});
      }
      setActiveSlot('A');
      setCurrentIndex(targetIndex);
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        setSlotBIndex((targetIndex + 1) % videos.length);
        if (videoRefB.current) videoRefB.current.pause();
      }, 750);
    }
  };

  const currentVideo = videos[currentIndex] || videos[0];
  const videoA = videos[slotAIndex] || videos[0];
  const videoB = videos[slotBIndex] || videos[1] || videos[0];

  return (
    <div
      className={`relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] xl:aspect-[5/4] rounded-3xl overflow-hidden border border-black/[0.08] shadow-2xl bg-[#202024] select-none group ${className}`}
      aria-label={`Laurrel Services showcase: currently showing ${currentVideo.service}`}
    >
      {/* Fallback image (shown if error occurs or while first frame loads) */}
      {(hasError || !isLoaded) && (
        <div className="absolute inset-0 z-0">
          <Image
            src={currentVideo.poster || fallbackImage}
            alt={currentVideo.description || fallbackAlt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 640px"
            className="object-cover object-center"
          />
        </div>
      )}

      {/* Reduced-motion static mode: render poster cleanly without autoplay video */}
      {prefersReducedMotion ? (
        <div className="absolute inset-0 z-10">
          <Image
            src={currentVideo.poster || fallbackImage}
            alt={currentVideo.description}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 640px"
            className="object-cover object-center"
          />
        </div>
      ) : (
        <>
          {/* Video Slot A */}
          <video
            ref={videoRefA}
            src={videoA.src}
            poster={videoA.poster}
            muted
            playsInline
            autoPlay={isPlaying}
            preload="auto"
            onLoadedData={() => setIsLoaded(true)}
            onTimeUpdate={activeSlot === 'A' ? handleTimeUpdate : undefined}
            onEnded={activeSlot === 'A' ? handleVideoEnded : undefined}
            onError={() => {
              console.warn(`[HeroVideoRotator] Failed to load video: ${videoA.src}`);
              setHasError(true);
            }}
            style={{
              objectPosition: videoA.objectPosition || 'center center',
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-750 ease-in-out ${
              activeSlot === 'A' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
            aria-hidden={activeSlot !== 'A'}
          />

          {/* Video Slot B */}
          <video
            ref={videoRefB}
            src={videoB.src}
            poster={videoB.poster}
            muted
            playsInline
            preload="auto"
            onTimeUpdate={activeSlot === 'B' ? handleTimeUpdate : undefined}
            onEnded={activeSlot === 'B' ? handleVideoEnded : undefined}
            onError={() => {
              console.warn(`[HeroVideoRotator] Failed to load video: ${videoB.src}`);
            }}
            style={{
              objectPosition: videoB.objectPosition || 'center center',
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-750 ease-in-out ${
              activeSlot === 'B' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
            aria-hidden={activeSlot !== 'B'}
          />
        </>
      )}

      {/* Ambient bottom subtle vignette to guarantee accessible contrast for controls */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none z-20"
        aria-hidden="true"
      />

      {/* Bottom-Left: Subtle Active Service Indicator & Step Pills */}
      <div className="absolute bottom-3.5 left-3.5 sm:bottom-5 sm:left-5 z-30 flex items-center gap-2">
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-[#202024]/75 backdrop-blur-md border border-white/15 text-white shadow-lg">
          {/* Service Name Label */}
          <span className="text-xs sm:text-sm font-bold tracking-wide">
            {currentVideo.service}
          </span>

          {/* Vertical divider */}
          <span className="h-3 w-[1px] bg-white/20" aria-hidden="true" />

          {/* 3 Step Progress Indicators */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Service video slides">
            {videos.map((vid, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={vid.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Switch to ${vid.service} video`}
                  onClick={() => selectService(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FE6000] ${
                    isActive
                      ? 'w-5 bg-[#FE6000]'
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom-Right: Accessible Play / Pause Control */}
      <div className="absolute bottom-3.5 right-3.5 sm:bottom-5 sm:right-5 z-30">
        <button
          type="button"
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause video showcase' : 'Play video showcase'}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#202024]/75 hover:bg-[#202024]/95 backdrop-blur-md text-white border border-white/15 flex items-center justify-center transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE6000] focus-visible:ring-offset-2 focus-visible:ring-offset-[#202024] shadow-lg"
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          ) : (
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
};
