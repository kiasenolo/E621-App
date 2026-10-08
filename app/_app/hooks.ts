import { useCallback, useEffect, useRef, useState } from 'react'

export function useFlag(initial: boolean) {
  const [value, setValue] = useState(initial)
  const ref = useRef(initial)

  const set = useCallback((next?: boolean) => {
    const value = next ?? !ref.current
    ref.current = value
    setValue(value)
    return value
  }, [])

  return [value, set] as const
}

export function useMultiFingerDoubleTap(handlers: { 3?: () => void, 4?: () => void }) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const DOUBLE_TAP_DELAY = 300;
    const FINGER_COUNT_STABILIZE_DELAY = 60;

    const lastTapTimes = { 3: 0, 4: 0 };
    let maxFingersInThisGesture = 0;
    let gestureTimer: ReturnType<typeof setTimeout> | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      const currentFingers = e.touches.length;
      if (currentFingers > maxFingersInThisGesture) {
        maxFingersInThisGesture = currentFingers;
      }

      if (gestureTimer) clearTimeout(gestureTimer);

      gestureTimer = setTimeout(() => {
        const finalFingers = maxFingersInThisGesture;
        const currentTime = Date.now();

        if (finalFingers === 3 || finalFingers === 4) {
          const timeSinceLastTap = currentTime - lastTapTimes[finalFingers];

          if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
            handlersRef.current[finalFingers]?.()
            lastTapTimes[finalFingers] = 0;
          } else {
            lastTapTimes[finalFingers] = currentTime;
          }
        }

        maxFingersInThisGesture = 0;
      }, FINGER_COUNT_STABILIZE_DELAY);
    };

    document.addEventListener("touchstart", handleTouchStart);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      if (gestureTimer) clearTimeout(gestureTimer);
    };
  }, []);
}
