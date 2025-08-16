import { createContext, useContext } from 'react';

export const LiveRegionContext = createContext<(message: string) => void>(
  () => {},
);

export function useLiveRegion() {
  return useContext(LiveRegionContext);
}
