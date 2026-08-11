"use client";

import { gsap } from "gsap";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const BUTTON_ZOOM_STEP = 0.5;
const WHEEL_ZOOM_STEP = 0.15;

type Position = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  originX: number;
  originY: number;
};

export function useImagePanZoom(resetKey: string) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(MIN_SCALE);
  const positionRef = useRef<Position>({ x: 0, y: 0 });
  const dragRef = useRef<DragState | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [isDragging, setIsDragging] = useState(false);

  const clampPosition = useCallback((position: Position, scale: number) => {
    const content = contentRef.current;
    if (!content || scale <= MIN_SCALE) return { x: 0, y: 0 };

    const maxX = Math.max(0, (content.offsetWidth * (scale - 1)) / 2);
    const maxY = Math.max(0, (content.offsetHeight * (scale - 1)) / 2);

    return {
      x: clamp(position.x, -maxX, maxX),
      y: clamp(position.y, -maxY, maxY),
    };
  }, []);

  const applyTransform = useCallback(
    (scale: number, position: Position) => {
      const content = contentRef.current;
      const nextPosition = clampPosition(position, scale);

      scaleRef.current = scale;
      positionRef.current = nextPosition;
      setZoomPercent(Math.round(scale * 100));

      if (!content) return;

      gsap.set(content, {
        x: nextPosition.x,
        y: nextPosition.y,
        scale,
        force3D: true,
        transformOrigin: "50% 50%",
      });
    },
    [clampPosition],
  );

  const reset = useCallback(() => {
    dragRef.current = null;
    setIsDragging(false);
    applyTransform(MIN_SCALE, { x: 0, y: 0 });
  }, [applyTransform]);

  const setScale = useCallback(
    (requestedScale: number, anchor?: Position) => {
      const previousScale = scaleRef.current;
      const nextScale = clamp(requestedScale, MIN_SCALE, MAX_SCALE);
      let nextPosition = positionRef.current;

      if (nextScale === MIN_SCALE) {
        nextPosition = { x: 0, y: 0 };
      } else if (anchor && viewportRef.current) {
        const viewportBounds = viewportRef.current.getBoundingClientRect();
        const anchorFromCenter = {
          x: anchor.x - (viewportBounds.left + viewportBounds.width / 2),
          y: anchor.y - (viewportBounds.top + viewportBounds.height / 2),
        };
        const scaleRatio = nextScale / previousScale;

        nextPosition = {
          x: nextPosition.x - anchorFromCenter.x * (scaleRatio - 1),
          y: nextPosition.y - anchorFromCenter.y * (scaleRatio - 1),
        };
      }

      applyTransform(nextScale, nextPosition);
    },
    [applyTransform],
  );

  const zoomIn = useCallback(() => {
    setScale(scaleRef.current + BUTTON_ZOOM_STEP);
  }, [setScale]);

  const zoomOut = useCallback(() => {
    setScale(scaleRef.current - BUTTON_ZOOM_STEP);
  }, [setScale]);

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;

      setScale(scaleRef.current + direction * WHEEL_ZOOM_STEP, {
        x: event.clientX,
        y: event.clientY,
      });
    },
    [setScale],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (scaleRef.current <= MIN_SCALE) return;

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        pointerX: event.clientX,
        pointerY: event.clientY,
        originX: positionRef.current.x,
        originY: positionRef.current.y,
      };
      setIsDragging(true);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      event.preventDefault();
      applyTransform(scaleRef.current, {
        x: drag.originX + event.clientX - drag.pointerX,
        y: drag.originY + event.clientY - drag.pointerY,
      });
    },
    [applyTransform],
  );

  const finishPointerInteraction = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (dragRef.current?.pointerId !== event.pointerId) return;

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      dragRef.current = null;
      setIsDragging(false);
    },
    [],
  );

  const handleDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (scaleRef.current > MIN_SCALE) {
        reset();
        return;
      }

      setScale(2, { x: event.clientX, y: event.clientY });
    },
    [reset, setScale],
  );

  useEffect(() => {
    reset();
  }, [reset, resetKey]);

  useEffect(() => {
    function handleResize() {
      applyTransform(scaleRef.current, positionRef.current);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [applyTransform]);

  useEffect(() => {
    const content = contentRef.current;
    return () => {
      if (content) gsap.killTweensOf(content);
    };
  }, [resetKey]);

  return {
    viewportRef,
    contentRef,
    zoomPercent,
    isDragging,
    canZoomIn: zoomPercent < MAX_SCALE * 100,
    canZoomOut: zoomPercent > MIN_SCALE * 100,
    zoomIn,
    zoomOut,
    reset,
    interactionProps: {
      onWheel: handleWheel,
      onDoubleClick: handleDoubleClick,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: finishPointerInteraction,
      onPointerCancel: finishPointerInteraction,
    },
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
