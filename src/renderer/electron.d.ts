/**
 * TypeScript definitions for window.electronAPI
 * This file provides type safety for IPC calls from the renderer process
 */

export type { Product } from '../shared/types/product.types';

export interface PrintTagsRequest {
  printerName: string;
  items: Array<{
    productNameRu?: string;
    productNameUz?: string;
    price: number;
    barcode?: string;
    unit?: string;
    productType?: string;
    articleId?: number;
    pluCode?: string;
    amount?: number;
    copies: number;
    productionDate?: string;
    expiryDate?: string;
  }>;
  widthMm: number;
  heightMm: number;
  lang: string;
  fontSize: number;
  fontWeight: number;
  elements: {
    name: boolean;
    price: boolean;
    unit: boolean;
    barcode: boolean;
    articleId: boolean;
    pluCode: boolean;
    productionDate: boolean;
    expiryDate: boolean;
    customText1: boolean;
    customText2: boolean;
    customText1Value?: string;
    customText2Value?: string;
  };
}

export interface ElectronAPI {
  auth: {
    login: (apiUrl: string, phone: string, password: string, storeId?: string) => Promise<{ ok: boolean }>;
    logout: () => Promise<{ ok: boolean }>;
  };
  products: {
    getAll: (filters?: Record<string, unknown>) => Promise<Product[]>;
  };
  settings: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<{ ok: boolean }>;
    getAll: () => Promise<Record<string, string>>;
  };
  printer: {
    getAvailablePrinters: () => Promise<string[]>;
    printPriceTagsTSPL: (req: PrintTagsRequest) => Promise<boolean>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
