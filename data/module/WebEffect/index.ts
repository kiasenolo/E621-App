export interface ParallaxItem {
  XoffSet: number | (() => number);
  YoffSet: number | (() => number);
  Element: HTMLElement | Element;
  other?: string;
}

export default {
  onBlur: function (className: string, element: HTMLElement, onStateChange?: (isBlur: boolean) => void) {
    const handleBlur = () => {
      element.classList.add(className);
      onStateChange?.(true);
    };

    const handleFocus = () => {
      element.classList.remove(className);
      onStateChange?.(false);
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return {
      RemoveEvent: function () {
        window.removeEventListener("blur", handleBlur);
        window.removeEventListener("focus", handleFocus);
      },
      isBlur: function () {
        return element.classList.contains(className);
      }
    };
  },

  pageParallaxEffect: function (List: ParallaxItem[], condition?: () => boolean) {
    let mouseX = 0;
    let mouseY = 0;
    let isTicking = false;

    const updatePositions = () => {
      if (condition && condition()) {
        isTicking = false;
        return;
      }

      const winCenterX = window.innerWidth / 2;
      const winCenterY = window.innerHeight / 2;

      const percentX = (mouseX - winCenterX) / winCenterX;
      const percentY = (mouseY - winCenterY) / winCenterY;

      List.forEach(({ XoffSet, YoffSet, Element, other }) => {
        const el = Element as HTMLElement;
        if (!el) return;

        const xVal = typeof XoffSet === "number" ? XoffSet : XoffSet();
        const yVal = typeof YoffSet === "number" ? YoffSet : YoffSet();

        const x = percentX * xVal;
        const y = percentY * yVal;

        el.style.transform = `translate(${x}px, ${y}px) ${other || ""}`;
      });

      isTicking = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;

      if (!isTicking) {
        window.requestAnimationFrame(updatePositions);
        isTicking = true;
      }
    };

    document.addEventListener("mousemove", onMouseMove);

    const resetAll = () => {
      List.forEach(({ Element, other }) => {
        const el = Element as HTMLElement;
        if (el) {
          el.style.transform = `translate(0px, 0px) ${other || ""}`;
        }
      });
    };

    return {
      RemoveEvent: function () {
        document.removeEventListener("mousemove", onMouseMove);
      },
      Reset: resetAll,
      List: List
    };
  },
};