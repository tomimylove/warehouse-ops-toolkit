import { restApiProvider } from './rest-api-provider';
import type { DataProvider } from './data-provider';

// Single place that decides which DataProvider implementation is active.
// Swapping backends later means changing this one line, not every screen.
export const dataProvider: DataProvider = restApiProvider;
