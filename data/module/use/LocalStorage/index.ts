import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

export type SetValue<T> = (value: SetStateAction<T>, options?: { save?: boolean }) => void;

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, SetValue<T>] {

  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(() => {
    return readValue();
  });

  const setValue: SetValue<T> = useCallback(
    (value, options) => {
      const shouldSave = options?.save ?? true;
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (shouldSave && typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue]
  );

  useEffect(() => {
    setStoredValue(readValue());
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.storageArea === window.localStorage) {
        setStoredValue(readValue());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, readValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;