import {
  completeInfiniteScrollDataLoad,
  maybeRequestInfiniteScrollData,
  resetInfiniteScrollState,
  saveInfiniteScrollPercentage,
  setInfiniteScrollDirectionsState,
} from './grid.core.infinite-scroll';

describe('grid.core.infinite-scroll', () => {
  describe('maybeRequestInfiniteScrollData', () => {
    it('requests top when the user is within threshold of the start', () => {
      const state = resetInfiniteScrollState(true, true);
      const result = maybeRequestInfiniteScrollData({
        state,
        startIndex: 5,
        visibleRows: 1000,
        viewportRows: 20,
        threshold: 20,
      });
      expect(result.request).toBe('top');
      expect(result.nextState.dataLoading).toBe(true);
    });

    it('requests bottom when the user is within threshold of the end', () => {
      const state = resetInfiniteScrollState(true, true);
      const result = maybeRequestInfiniteScrollData({
        state,
        startIndex: 975,
        visibleRows: 1000,
        viewportRows: 20,
        threshold: 20,
      });
      expect(result.request).toBe('bottom');
    });

    it('returns null when dataLoading is already true', () => {
      const state = { ...resetInfiniteScrollState(true, true), dataLoading: true };
      const result = maybeRequestInfiniteScrollData({
        state,
        startIndex: 5,
        visibleRows: 1000,
        viewportRows: 20,
        threshold: 20,
      });
      expect(result.request).toBeNull();
    });

    it('returns null when the matching direction flag is off', () => {
      const state = resetInfiniteScrollState(false, true);
      const result = maybeRequestInfiniteScrollData({
        state,
        startIndex: 0,
        visibleRows: 1000,
        viewportRows: 20,
        threshold: 20,
      });
      // scrollUp is off — top request is suppressed even though we're at 0.
      expect(result.request).toBeNull();
    });
  });

  describe('completeInfiniteScrollDataLoad', () => {
    it('clears dataLoading and updates direction flags', () => {
      const state = { ...resetInfiniteScrollState(true, true), dataLoading: true };
      const next = completeInfiniteScrollDataLoad(state, true, false);
      expect(next.dataLoading).toBe(false);
      expect(next.scrollUp).toBe(true);
      expect(next.scrollDown).toBe(false);
    });
  });

  describe('saveInfiniteScrollPercentage', () => {
    it('stores previousVisibleRows', () => {
      const state = resetInfiniteScrollState(true, true);
      const next = saveInfiniteScrollPercentage(state, 500);
      expect(next.previousVisibleRows).toBe(500);
    });
  });

  describe('setInfiniteScrollDirectionsState', () => {
    it('updates direction flags without touching dataLoading', () => {
      const state = { ...resetInfiniteScrollState(true, true), dataLoading: true };
      const next = setInfiniteScrollDirectionsState(state, false, false);
      expect(next.scrollUp).toBe(false);
      expect(next.scrollDown).toBe(false);
      expect(next.dataLoading).toBe(true);
    });
  });
});
