import React from "react"

// #region 一坨型別定義

export namespace SettingEditor {

  export type ListOperations<T> = {
    moveUp: (index: number) => void;
    moveDown: (index: number) => void;
    moveToTop: (index: number) => void;
    removeItem: (index: number) => void;
    addItem: (newItem: T) => void;
    duplicateItem: (index: number) => void;
    canMoveUp: (index: number) => boolean;
    canMoveDown: (index: number) => boolean;
    isMaxReached: boolean;
    isMinReached: boolean;
  };

  export type ItemOperations<T> = {
    moveUp: () => void;
    moveDown: () => void;
    moveToTop: () => void;
    remove: () => void;
    duplicate: () => void;
    update: (newValue: T) => void;
    isFirst: boolean;
    isLast: boolean;
  };

  export type WrappedItem<T> = {
    data: T;
    index: number;
    ops: ItemOperations<T>;
  };

  export type ListControl<T> = {
    items: WrappedItem<T>[];
    addItem: (newItem: T) => void;
    isMaxReached: boolean;
  };

  export namespace Inputs {
    export type String = {
      width?: number;
      value: string;
      onChange: (e: string) => void;
    };

    export type Number = {
      width?: number;
      value: number;
      float?: boolean;
      onChange: (e: number) => void;
    };
  }

  export type List<T> = {
    max?: number;
    min?: number;
    list: T[];
    onChange: (e: T[]) => void;
    children: (control: ListControl<T>) => React.ReactNode;
  };

  export function useListController<T>(props: List<T>): ListOperations<T> {
    const { list, onChange, max = Infinity, min = 0 } = props;

    const moveUp = (index: number) => {
      if (index <= 0) return;
      const clone = [...list];
      [clone[index - 1], clone[index]] = [clone[index], clone[index - 1]];
      onChange(clone);
    };

    const moveDown = (index: number) => {
      if (index >= list.length - 1) return;
      const clone = [...list];
      [clone[index + 1], clone[index]] = [clone[index], clone[index + 1]];
      onChange(clone);
    };

    const moveToTop = (index: number) => {
      if (index === 0) return;
      const clone = [...list];
      const [item] = clone.splice(index, 1);
      clone.unshift(item);
      onChange(clone);
    };

    const removeItem = (index: number) => {
      if (list.length <= min) {
        console.warn('Reached minimum limit');
        return;
      }
      const clone = [...list];
      clone.splice(index, 1);
      onChange(clone);
    };

    const addItem = (newItem: T) => {
      if (isMaxReached) {
        console.warn('Reached maximum limit');
        return;
      }
      const clone = [...list, newItem];
      onChange(clone);
    };

    const duplicateItem = (index: number) => {
      if (isMaxReached) {
        console.warn('Reached maximum limit');
        return;
      }

      const itemClone = JSON.parse(JSON.stringify(list[index]));

      const newList = [...list];
      newList.splice(index + 1, 0, itemClone);

      onChange(newList);
    };

    const isMaxReached = list.length >= max;
    const isMinReached = list.length <= min;


    return {
      moveUp,
      moveDown,
      moveToTop,
      removeItem,
      addItem,
      duplicateItem,
      canMoveUp: (i) => i > 0,
      canMoveDown: (i) => i < list.length - 1,
      isMaxReached,
      isMinReached
    };
  }

  export const ListEditor = <T extends any>(props: List<T>) => {
    const { list, onChange, max = Infinity, min = 0, children } = props;

    const addItem = (newItem: T) => {
      if (list.length >= max) return;
      onChange([...list, newItem]);
    };

    const itemsWithOps: WrappedItem<T>[] = list.map((item, index) => {

      const moveUp = () => {
        if (index === 0) return;
        const clone = [...list];
        [clone[index - 1], clone[index]] = [clone[index], clone[index - 1]];
        onChange(clone);
      };

      const moveDown = () => {
        if (index === list.length - 1) return;
        const clone = [...list];
        [clone[index + 1], clone[index]] = [clone[index], clone[index + 1]];
        onChange(clone);
      };

      const moveToTop = () => {
        if (index === 0) return;
        const clone = [...list];
        const [target] = clone.splice(index, 1);
        clone.unshift(target);
        onChange(clone);
      };

      const remove = () => {
        if (list.length <= min) return;
        const clone = [...list];
        clone.splice(index, 1);
        onChange(clone);
      };

      const duplicate = () => {
        if (list.length >= max) return;
        const cloneItem = JSON.parse(JSON.stringify(item));
        const cloneList = [...list];
        cloneList.splice(index + 1, 0, cloneItem);
        onChange(cloneList);
      };

      const update = (newValue: T) => {
        const clone = [...list];
        clone[index] = newValue;
        onChange(clone);
      };


      return {
        data: item,
        index,
        ops: {
          moveUp,
          moveDown,
          moveToTop,
          remove,
          duplicate,
          update,
          isFirst: index === 0,
          isLast: index === list.length - 1
        }
      };
    });

    return (
      <>
        {children({
          items: itemsWithOps,
          addItem,
          isMaxReached: list.length >= max
        })}
      </>
    );
  };

}

