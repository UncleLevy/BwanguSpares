import { useState, useCallback } from "react";

/**
 * useOptimisticList — optimistic updates for arrays.
 *
 * Returns [list, setList, updateItem, removeItem]
 *   updateItem(id, patch, asyncFn, onError?)  — updates immediately, rolls back on failure
 *   removeItem(id, asyncFn, onError?)          — removes immediately, rolls back on failure
 */
export function useOptimisticList(initialList = []) {
  const [list, setList] = useState(initialList);

  const updateItem = useCallback(async (id, patch, asyncFn, onError) => {
    let prev;
    setList(current => {
      prev = current;
      return current.map(item => item.id === id ? { ...item, ...patch } : item);
    });
    try {
      await asyncFn();
    } catch (err) {
      if (prev !== undefined) setList(prev);
      if (onError) onError(err);
    }
  }, []);

  const removeItem = useCallback(async (id, asyncFn, onError) => {
    let prev;
    setList(current => {
      prev = current;
      return current.filter(item => item.id !== id);
    });
    try {
      await asyncFn();
    } catch (err) {
      if (prev !== undefined) setList(prev);
      if (onError) onError(err);
    }
  }, []);

  return [list, setList, updateItem, removeItem];
}

/**
 * useOptimisticValue — optimistic updates for a single value/object.
 *
 * Returns [value, setValue, applyOptimistic]
 *   applyOptimistic(patch, asyncFn, onError?)
 */
export function useOptimisticValue(initial) {
  const [value, setValue] = useState(initial);

  const applyOptimistic = useCallback(async (patch, asyncFn, onError) => {
    let prev;
    setValue(current => {
      prev = current;
      return typeof patch === "function" ? patch(current) : { ...current, ...patch };
    });
    try {
      await asyncFn();
    } catch (err) {
      if (prev !== undefined) setValue(prev);
      if (onError) onError(err);
    }
  }, []);

  return [value, setValue, applyOptimistic];
}