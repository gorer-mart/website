'use client';

/**
 * Product image zoom — hover magnifier and fullscreen viewer.
 *
 * The point of a zoom on a clothing store is to show fabric, print and stitch
 * detail. That only works if the magnified layer is a *higher resolution*
 * source than the one already on screen: scaling the same ~800px file the page
 * rendered just enlarges its pixels and reveals nothing.
 *
 * Pointer events drive panning and pinching, so the same code path serves mouse,
 * trackpad, pen and touch.
 *
 * Both interactions are built to stay on the compositor:
 *
 *  - The element rect is measured once per hover, not per mouse move.
 *    `getBoundingClientRect()` forces a synchronous layout, and this page
 *    carries a review list and a related-products grid, so paying that on every
 *    move was the main source of the lag.
 *  - Transforms are written straight to the node during a gesture. Routing them
 *    through React state re-rendered the whole product page per mouse move.
 *  - Only `translate3d` changes while tracking. With `transform-origin: 0 0` the
 *    browser can move an already-rasterised layer instead of recomputing a new
 *    transform matrix from a shifting origin, which is what made the magnifier
 *    feel like it was swimming behind the cursor.
 *  - Writes happen synchronously in the handler rather than inside
 *    `requestAnimationFrame`. Browsers already align pointer events to the frame,
 *    so the extra rAF hop only added a frame of latency.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { resolveImageUrl, sizedImageUrl } from '../../../lib/image';

/** Width requested for the magnified layer. Sanity's `fit=max` never upscales. */
const ZOOM_WIDTH = 2000;
/** Width requested inside the fullscreen viewer, which can fill a 4K display. */
const FULLSCREEN_WIDTH = 2600;
const ZOOM_QUALITY = 85;

/** Magnification of the desktop hover magnifier. */
const HOVER_SCALE = 2.5;

const MIN_SCALE = 1;
const MAX_SCALE = 4;
/** Scale applied by a click / tap toggle. */
const STEP_SCALE = 2.5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** High-resolution URL for a gallery image. */
function zoomSrc(image: unknown, width: number): string {
  return sizedImageUrl(resolveImageUrl(image), width, ZOOM_QUALITY);
}

/** True on devices with a real hovering cursor. */
function hasHoverPointer(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

/**
 * Whether it is reasonable to fetch the ~270KB magnified image before the
 * customer has asked for it.
 *
 * Only worth doing where a hover magnifier exists at all, and never against the
 * customer's wishes: Data Saver and 2G connections opt out and fall back to
 * fetching on first hover.
 */
function shouldPrefetchZoom(): boolean {
  if (!hasHoverPointer()) return false;

  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;

  if (connection?.saveData) return false;
  if (typeof connection?.effectiveType === 'string' && connection.effectiveType.includes('2g')) {
    return false;
  }
  return true;
}

/**
 * Load and fully decode an image off the main render path.
 *
 * `decode()` matters as much as the download: revealing a freshly downloaded
 * 2000px file still costs a synchronous decode on first paint, which shows up
 * as a stutter exactly when the customer starts moving the cursor.
 */
function preloadDecoded(src: string, onReady: () => void): () => void {
  let cancelled = false;
  const img = new Image();

  const settle = () => {
    if (!cancelled) onReady();
  };

  img.src = src;
  if (typeof img.decode === 'function') {
    img.decode().then(settle).catch(() => {
      // Decode can reject for reasons that still leave a usable image
      // (notably in Safari), so fall back to the load event.
      if (img.complete && img.naturalWidth > 0) settle();
    });
  } else {
    img.onload = settle;
  }

  return () => {
    cancelled = true;
  };
}

/* ------------------------------------------------------------------ */
/* Desktop hover magnifier                                             */
/* ------------------------------------------------------------------ */

export function HoverZoomImage({
  image,
  displaySrc,
  displaySrcSet,
  displaySizes,
  lqip,
  alt,
  onExpand,
}: {
  image: unknown;
  displaySrc: string;
  displaySrcSet?: string;
  displaySizes?: string;
  lqip?: string;
  alt: string;
  onExpand: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLImageElement>(null);
  /** Frame geometry, measured on enter instead of on every move. */
  const rectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);

  const [isHovering, setIsHovering] = useState(false);
  const [highResReady, setHighResReady] = useState(false);

  const highResSrc = zoomSrc(image, ZOOM_WIDTH);

  const measure = useCallback(() => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
  }, []);

  /**
   * Point the magnified layer at the cursor.
   *
   * With `transform-origin: 0 0`, translating by `f * size * (1 - scale)` puts
   * the pixel that sits under the cursor unzoomed back under the cursor zoomed.
   */
  const track = useCallback((clientX: number, clientY: number) => {
    const rect = rectRef.current;
    const node = layerRef.current;
    if (!rect || !node || rect.width === 0 || rect.height === 0) return;

    const fx = clamp((clientX - rect.left) / rect.width, 0, 1);
    const fy = clamp((clientY - rect.top) / rect.height, 0, 1);

    const tx = fx * rect.width * (1 - HOVER_SCALE);
    const ty = fy * rect.height * (1 - HOVER_SCALE);

    node.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${HOVER_SCALE})`;
  }, []);

  // Reset whenever the displayed image changes — otherwise the previous
  // variant's high-res layer stays visible over the new image.
  useEffect(() => {
    setHighResReady(false);
  }, [highResSrc]);

  /**
   * Warm the magnified source while the browser is idle, but only where a
   * hover magnifier can actually be used. Waiting for the first hover meant the
   * customer moved the cursor and watched nothing happen while ~270KB
   * downloaded and decoded.
   */
  useEffect(() => {
    if (!highResSrc || highResReady) return;

    // Where prefetching is not appropriate, fall back to loading on first
    // hover, so the magnifier still works — it just warms up a beat later.
    const prefetch = shouldPrefetchZoom();
    if (!prefetch && !isHovering) return;

    let cancelPreload: (() => void) | undefined;
    const start = () => {
      cancelPreload = preloadDecoded(highResSrc, () => setHighResReady(true));
    };

    // Hovering is explicit intent — fetch immediately rather than waiting for
    // the browser to decide it is idle.
    if (isHovering) {
      start();
      return () => cancelPreload?.();
    }

    const idle = (window as unknown as { requestIdleCallback?: typeof requestIdleCallback })
      .requestIdleCallback;

    if (typeof idle === 'function') {
      const handle = idle(start, { timeout: 2000 });
      return () => {
        (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(
          handle as unknown as number
        );
        cancelPreload?.();
      };
    }

    const timer = window.setTimeout(start, 600);
    return () => {
      window.clearTimeout(timer);
      cancelPreload?.();
    };
  }, [highResSrc, highResReady, isHovering]);

  // Keep the cached geometry honest while the pointer is inside: scrolling with
  // a trackpad moves the frame without ever firing a pointer event.
  useEffect(() => {
    if (!isHovering) return;
    const onChange = () => measure();
    window.addEventListener('scroll', onChange, { passive: true });
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange);
      window.removeEventListener('resize', onChange);
    };
  }, [isHovering, measure]);

  const handleEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    // Touch and pen get the fullscreen viewer instead; a hover magnifier needs
    // a cursor that can hover.
    if (e.pointerType !== 'mouse') return;
    measure();
    track(e.clientX, e.clientY);
    setIsHovering(true);
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !isHovering) return;
    track(e.clientX, e.clientY);
  };

  return (
    <div
      ref={frameRef}
      onPointerEnter={handleEnter}
      onPointerLeave={() => setIsHovering(false)}
      onPointerMove={handleMove}
      onClick={onExpand}
      className="group relative aspect-[3/4] cursor-zoom-in select-none overflow-hidden bg-neutral-100"
      style={
        lqip
          ? { backgroundImage: `url(${lqip})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    >
      <img
        src={displaySrc}
        srcSet={displaySrcSet}
        sizes={displaySizes}
        alt={alt}
        loading="eager"
        decoding="sync"
        fetchPriority="high"
        className="h-full w-full select-none object-cover"
        draggable={false}
      />

      {/* Magnified layer. `transform` is owned imperatively by `track` and is
          deliberately absent from this style object, so a React re-render can
          never stomp the position mid-gesture. */}
      {highResSrc && (
        <img
          ref={layerRef}
          src={highResReady ? highResSrc : undefined}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          style={{
            transformOrigin: '0 0',
            opacity: isHovering && highResReady ? 1 : 0,
            transition: 'opacity 140ms ease-out',
            // Promote to its own layer only while in use — holding a 2000px
            // image on the compositor permanently costs real memory.
            willChange: isHovering ? 'transform' : undefined,
          }}
        />
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onExpand();
        }}
        aria-label="Open fullscreen view"
        className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-black opacity-0 shadow-sm transition-all hover:bg-white focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black group-hover:opacity-100"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fullscreen viewer                                                   */
/* ------------------------------------------------------------------ */

interface LightboxProps {
  images: unknown[];
  lqip?: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  productName: string;
}

export function ImageLightbox({
  images,
  lqip = [],
  index,
  onIndexChange,
  onClose,
  productName,
}: LightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [highResLoaded, setHighResLoaded] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * Live transform. Held in refs rather than state so a drag writes straight to
   * the node — panning through `setState` re-rendered the viewer on every
   * pointer move, which is what made dragging feel heavy.
   */
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  /** Live pointers, so one finger pans and two fingers pinch. */
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const panStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
  /** Distinguishes a click from the end of a drag. */
  const movedRef = useRef(false);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const currentImage = images[index];
  const fullSrc = zoomSrc(currentImage, FULLSCREEN_WIDTH);
  const previewSrc = sizedImageUrl(resolveImageUrl(currentImage), 1000, 80);

  useEffect(() => setMounted(true), []);

  const applyTransform = useCallback(() => {
    const node = imageRef.current;
    if (!node) return;
    const { x, y } = offsetRef.current;
    node.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scaleRef.current})`;
  }, []);

  /** Keep the image from being dragged off the stage. */
  const clampOffset = useCallback((next: { x: number; y: number }, atScale: number) => {
    const node = imageRef.current;
    if (!node) return next;
    // offsetWidth is the pre-transform layout size, so this stays correct at
    // any zoom level.
    const maxX = Math.max(0, (node.offsetWidth * atScale - node.offsetWidth) / 2);
    const maxY = Math.max(0, (node.offsetHeight * atScale - node.offsetHeight) / 2);
    return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  }, []);

  const commit = useCallback(
    (nextScale: number, nextOffset: { x: number; y: number }) => {
      scaleRef.current = nextScale;
      offsetRef.current = nextOffset;
      applyTransform();
      setScale(nextScale);
    },
    [applyTransform]
  );

  const resetView = useCallback(() => {
    commit(1, { x: 0, y: 0 });
  }, [commit]);

  // A new slide always starts unzoomed and centred.
  useEffect(() => {
    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setScale(1);
    setHighResLoaded(false);
    applyTransform();
  }, [index, applyTransform]);

  /**
   * Zoom while keeping the point under the cursor pinned in place.
   *
   * For a point `p` in unscaled element space measured from the layout centre
   * `C`, its screen position is `C + offset + p * scale`. `getBoundingClientRect`
   * already reports the *transformed* box, so its centre is `C + offset` and
   * `p` reduces to `(cursor - rectCentre) / scale`. Holding that point fixed
   * across a scale change gives `offsetNew = offset + p * (scale - target)`.
   */
  const zoomAt = useCallback(
    (nextScale: number, clientX?: number, clientY?: number) => {
      const current = scaleRef.current;
      const target = clamp(nextScale, MIN_SCALE, MAX_SCALE);
      if (target === current) return;

      if (target <= MIN_SCALE) {
        commit(MIN_SCALE, { x: 0, y: 0 });
        return;
      }

      const node = imageRef.current;
      const offset = offsetRef.current;
      let nextOffset = offset;

      if (node && clientX !== undefined && clientY !== undefined) {
        const rect = node.getBoundingClientRect();
        const pointX = (clientX - (rect.left + rect.width / 2)) / current;
        const pointY = (clientY - (rect.top + rect.height / 2)) / current;
        nextOffset = {
          x: offset.x + pointX * (current - target),
          y: offset.y + pointY * (current - target),
        };
      }

      commit(target, clampOffset(nextOffset, target));
    },
    [clampOffset, commit]
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      if (images.length === 0) return;
      onIndexChange(((nextIndex % images.length) + images.length) % images.length);
    },
    [images.length, onIndexChange]
  );

  /* ---- Keyboard ---- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          goTo(index + 1);
          break;
        case 'ArrowLeft':
          goTo(index - 1);
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomAt(scaleRef.current + 0.5);
          break;
        case '-':
        case '_':
          e.preventDefault();
          zoomAt(scaleRef.current - 0.5);
          break;
        case '0':
          resetView();
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, goTo, onClose, zoomAt, resetView]);

  /* ---- Scroll lock + focus management ---- */
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      // Return focus to whatever opened the viewer, so keyboard users are not
      // dumped back at the top of the document.
      previouslyFocusedRef.current?.focus?.();
    };
  }, []);

  /* ---- Wheel / trackpad zoom ---- */
  // Registered natively because React's onWheel is passive, and a passive
  // listener cannot preventDefault the page scroll behind the viewer.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomAt(scaleRef.current * factor, e.clientX, e.clientY);
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  /* ---- Pointer: pan with one, pinch with two ---- */
  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedRef.current = false;

    if (pointersRef.current.size === 1) {
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: offsetRef.current.x,
        offsetY: offsetRef.current.y,
      };
      if (scaleRef.current > 1) setIsPanning(true);
    } else if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchStartRef.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale: scaleRef.current,
      };
      panStartRef.current = null;
      setIsPanning(false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size >= 2 && pinchStartRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchStartRef.current.distance > 0) {
        movedRef.current = true;
        const ratio = distance / pinchStartRef.current.distance;
        zoomAt(pinchStartRef.current.scale * ratio, (a.x + b.x) / 2, (a.y + b.y) / 2);
      }
      return;
    }

    const start = panStartRef.current;
    if (!start || scaleRef.current <= 1) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;

    // Written straight to the node — no React render while the finger is down.
    offsetRef.current = clampOffset(
      { x: start.offsetX + dx, y: start.offsetY + dy },
      scaleRef.current
    );
    applyTransform();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
    if (pointersRef.current.size === 0) {
      panStartRef.current = null;
      setIsPanning(false);
    }
  };

  /** Click toggles zoom, but only when the gesture was not a drag or pinch. */
  const handleStageClick = (e: React.MouseEvent) => {
    if (movedRef.current) return;
    if (scaleRef.current > 1) {
      resetView();
    } else {
      zoomAt(STEP_SCALE, e.clientX, e.clientY);
    }
  };

  if (!mounted) return null;

  const zoomPercent = Math.round(scale * 100);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${productName} — image ${index + 1} of ${images.length}`}
      className="fixed inset-0 z-[95] flex flex-col bg-neutral-950"
    >
      {/* Header */}
      <header className="flex flex-shrink-0 items-center justify-between gap-4 px-4 py-3 text-white sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{productName}</p>
          <p className="mt-0.5 text-xs text-white/50 tabular-nums">
            {index + 1} of {images.length}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => zoomAt(scaleRef.current - 0.5)}
            disabled={scale <= MIN_SCALE}
            aria-label="Zoom out"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={resetView}
            aria-label="Reset zoom"
            className="min-w-14 cursor-pointer rounded-full px-2 py-1.5 text-xs tabular-nums text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {zoomPercent}%
          </button>

          <button
            type="button"
            onClick={() => zoomAt(scaleRef.current + 0.5)}
            disabled={scale >= MAX_SCALE}
            aria-label="Zoom in"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Stage */}
      <div
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleStageClick}
        className={`relative flex flex-1 items-center justify-center overflow-hidden ${
          scale > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
        // Let the component own every gesture — without this the browser
        // swallows pinch and drag as page zoom / scroll on touch devices.
        style={{ touchAction: 'none' }}
      >
        <img
          ref={imageRef}
          // The page-resolution file paints instantly; the high-resolution one
          // replaces it as soon as it decodes, so the viewer is never blank.
          src={highResLoaded ? fullSrc : previewSrc}
          alt={`${productName} — view ${index + 1}`}
          draggable={false}
          className="max-h-full max-w-full select-none object-contain"
          style={{
            // `transform` is owned by `applyTransform`; keeping it out of this
            // object stops a re-render from fighting an in-progress drag.
            willChange: 'transform',
            // Animate button-driven and toggle zooms, but never while a finger
            // or cursor is dragging — that would read as lag.
            transition: isPanning ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />

        {/* Decode the high-resolution file off-screen, then swap it in. */}
        {fullSrc && !highResLoaded && (
          <img
            src={fullSrc}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute h-px w-px opacity-0"
            onLoad={() => setHighResLoaded(true)}
          />
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(index - 1);
              }}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:left-5"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(index + 1);
              }}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:right-5"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Shown only at 1x, so it never covers detail the customer is inspecting. */}
        {scale === 1 && (
          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm">
            <span className="hidden sm:inline">Click or scroll to zoom</span>
            <span className="sm:hidden">Tap or pinch to zoom</span>
          </p>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex flex-shrink-0 justify-center gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onIndexChange(idx)}
              aria-label={`View image ${idx + 1}`}
              aria-current={idx === index}
              className={`h-16 w-12 flex-shrink-0 cursor-pointer overflow-hidden rounded transition-all ${
                idx === index ? 'opacity-100 ring-2 ring-white' : 'opacity-40 hover:opacity-75'
              }`}
              style={
                lqip[idx]
                  ? { backgroundImage: `url(${lqip[idx]})`, backgroundSize: 'cover' }
                  : undefined
              }
            >
              <img
                src={sizedImageUrl(resolveImageUrl(img), 120, 70)}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
