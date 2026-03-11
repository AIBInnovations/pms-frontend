import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import useLocalStorage from '../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => { localStorage.clear(); });

  it('returns initial value when no stored value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('stores value in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    act(() => { result.current[1]('updated'); });

    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('test-key'))).toBe('updated');
  });

  it('reads existing value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify('existing'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('existing');
  });

  it('handles objects', () => {
    const { result } = renderHook(() => useLocalStorage('obj-key', { a: 1 }));

    act(() => { result.current[1]({ a: 2, b: 3 }); });

    expect(result.current[0]).toEqual({ a: 2, b: 3 });
  });
});
