// Backend-agnostic data layer. UI code depends only on this interface, never
// on fetch/REST/SharePoint specifics directly — swapping the backend means
// swapping the implementation wired up in `provider.ts`, not touching screens.
export interface DataProvider {
  list<T>(entity: string): Promise<T[]>;
  get<T>(entity: string, id: string): Promise<T>;
  create<T>(entity: string, data: Partial<T>): Promise<T>;
  update<T>(entity: string, id: string, data: Partial<T>): Promise<T>;
  remove(entity: string, id: string): Promise<void>;
}
