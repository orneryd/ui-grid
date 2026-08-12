import { GridInfiniteScrollState } from './grid.core.types';

export function maybeRequestInfiniteScrollData(context: {
  state: GridInfiniteScrollState;
  startIndex: number;
  visibleRows: number;
  viewportRows: number;
  threshold: number;
}): { request: 'top' | 'bottom' | null; nextState: GridInfiniteScrollState } {
  if (context.state.dataLoading) {
    return { request: null, nextState: context.state };
  }

  if (context.state.scrollUp && context.startIndex <= context.threshold) {
    return {
      request: 'top',
      nextState: {
        ...context.state,
        dataLoading: true,
        previousVisibleRows: context.visibleRows
      }
    };
  }

  if (context.state.scrollDown && context.startIndex + context.viewportRows >= Math.max(context.visibleRows - context.threshold, 0)) {
    return {
      request: 'bottom',
      nextState: {
        ...context.state,
        dataLoading: true,
        previousVisibleRows: context.visibleRows
      }
    };
  }

  return { request: null, nextState: context.state };
}

export function completeInfiniteScrollDataLoad(
  state: GridInfiniteScrollState,
  scrollUp: boolean,
  scrollDown: boolean
): GridInfiniteScrollState {
  return {
    ...state,
    scrollUp,
    scrollDown,
    dataLoading: false
  };
}

export function resetInfiniteScrollState(scrollUp: boolean, scrollDown: boolean): GridInfiniteScrollState {
  return {
    scrollUp,
    scrollDown,
    dataLoading: false,
    previousVisibleRows: 0
  };
}

export function saveInfiniteScrollPercentage(
  state: GridInfiniteScrollState,
  visibleRows: number
): GridInfiniteScrollState {
  return {
    ...state,
    previousVisibleRows: visibleRows
  };
}

export function setInfiniteScrollDirectionsState(
  state: GridInfiniteScrollState,
  scrollUp: boolean,
  scrollDown: boolean
): GridInfiniteScrollState {
  return {
    ...state,
    scrollUp,
    scrollDown
  };
}