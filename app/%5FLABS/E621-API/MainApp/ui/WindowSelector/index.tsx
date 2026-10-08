import { useCallback, useEffect, useRef, useState } from "react"
import { electronMode } from "../../core/globals"

export interface WindowSelectorProps {
  eventLock: boolean;
  windowsList: { id: string;[key: string]: any }[];
  onSelectStart?: () => void;
  onSelect?: (selectedId: string) => void;
  onSelectEnd?: (selectedId: string) => void;
}

export const WindowSelector = ({
  eventLock,
  windowsList,
  onSelectStart,
  onSelect,
  onSelectEnd
}: WindowSelectorProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const stateRef = useRef({
    isSelecting,
    selectedIndex,
    windowsList,
    onSelectStart,
    onSelect,
    onSelectEnd,
  });

  useEffect(() => {
    stateRef.current = {
      isSelecting,
      selectedIndex,
      windowsList,
      onSelectStart,
      onSelect,
      onSelectEnd
    };
  }, [isSelecting, selectedIndex, windowsList, onSelectStart, onSelect, onSelectEnd]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (eventLock) return;
      if ((electronMode ? e.ctrlKey : e.shiftKey) && e.code === "Tab") {
        e.preventDefault();

        const {
          isSelecting: currentIsSelecting,
          selectedIndex: currentIndex,
          windowsList: currentList,
          onSelectStart: startCb,
          onSelect: selectCb
        } = stateRef.current;

        if (currentList.length === 0) return;

        if (!currentIsSelecting) {
          setIsSelecting(true);
          const nextIndex = currentList.length > 1 ? 1 : 0;
          setSelectedIndex(nextIndex);

          if (startCb) startCb();
          if (selectCb) selectCb(currentList[nextIndex].id);

        } else {
          const direction = (electronMode ? e.shiftKey : false) ? -1 : 1;
          let nextIndex = (currentIndex + direction) % currentList.length;

          if (nextIndex < 0) {
            nextIndex += currentList.length;
          }
          setSelectedIndex(nextIndex);

          if (selectCb) selectCb(currentList[nextIndex].id);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (eventLock) return;
      if (electronMode ? e.key === "Control" : e.key === "Shift") {
        const {
          isSelecting: currentIsSelecting,
          selectedIndex: currentIndex,
          windowsList: currentList,
          onSelectEnd: endCb
        } = stateRef.current;

        if (currentIsSelecting) {
          setIsSelecting(false);

          if (currentList.length > 0 && endCb) {
            endCb(currentList[currentIndex].id);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [eventLock]);

  const setTarget = useCallback((targetId: string) => {
    const index = windowsList.findIndex((w) => w.id === targetId);

    if (index !== -1) {
      setSelectedIndex(index);

      if (onSelect) {
        onSelect(targetId);
      }
    }
  }, [windowsList, onSelect]);

  return {
    isSelecting,
    selectedWindowId: windowsList[selectedIndex]?.id || null,
    setTarget,
  };
};

