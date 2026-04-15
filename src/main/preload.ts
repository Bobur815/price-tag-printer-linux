import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  auth: {
    login: (apiUrl: string, phone: string, password: string, storeId?: string) =>
      ipcRenderer.invoke('auth:login', apiUrl, phone, password, storeId),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },
  products: {
    getAll: (filters?: unknown) => ipcRenderer.invoke('products:getAll', filters),
  },
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
  printer: {
    getAvailablePrinters: () => ipcRenderer.invoke('printer:getAvailable'),
    printPriceTagsTSPL: (req: unknown) => ipcRenderer.invoke('printer:printPriceTagsTSPL', req),
  },
});

// Type definitions for window.electronAPI
export interface ElectronAPI {
  auth: {
    login: (apiUrl: string, phone: string, password: string, storeId?: string) => Promise<{ ok: boolean }>;
    logout: () => Promise<{ ok: boolean }>;
  };
  products: {
    getAll: (filters?: unknown) => Promise<unknown>;
  };
  settings: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<{ ok: boolean }>;
    getAll: () => Promise<Record<string, string>>;
  };
  printer: {
    getAvailablePrinters: () => Promise<string[]>;
    printPriceTagsTSPL: (req: unknown) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
