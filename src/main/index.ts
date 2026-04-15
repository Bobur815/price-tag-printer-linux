import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import { printPriceTagsTSPL } from './printer/tspl-printer';

// ── Settings file store ───────────────────────────────────────────────────────

let settingsCache: Record<string, string> | null = null;

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings(): Record<string, string> {
  if (settingsCache) return settingsCache;
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf-8');
    settingsCache = JSON.parse(raw) as Record<string, string>;
  } catch {
    settingsCache = {};
  }
  return settingsCache;
}

function saveSettings(data: Record<string, string>): void {
  settingsCache = data;
  fs.writeFileSync(getSettingsPath(), JSON.stringify(data, null, 2), 'utf-8');
}

let win: BrowserWindow | null = null;
let authToken: string | null = null;
let vpsApiUrl: string = '';

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ── Auth ──────────────────────────────────────────────────────────────────────

ipcMain.handle('auth:login', async (_e, rawApiUrl: string, phone: string, password: string, storeId?: string) => {
  // Normalize: strip trailing slash, ensure /api suffix
  let apiUrl = rawApiUrl.replace(/\/+$/, '');
  if (!apiUrl.endsWith('/api')) apiUrl = `${apiUrl}/api`;

  // Strip leading '+' to match DB phone format
  const normalizedPhone = phone.replace(/^\+/, '');

  try {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone, password, ...(storeId ? { storeId } : {}) }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Login failed: ${errorText}`);
    }
    const data = await res.json() as { token: string };
    authToken = data.token;
    vpsApiUrl = apiUrl;
    return { ok: true };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
});

ipcMain.handle('auth:logout', () => {
  authToken = null;
  vpsApiUrl = '';
  return { ok: true };
});

// ── Products ──────────────────────────────────────────────────────────────────

ipcMain.handle('products:getAll', async (_e, filters?: Record<string, unknown>) => {
  if (!authToken) throw new Error('Not authenticated');

  try {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    } else {
      queryParams.append('active', 'true');
    }

    const url = `${vpsApiUrl}/products?${queryParams.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch products: ${errorText}`);
    }

    return res.json();
  } catch (error) {
    console.error('Products fetch error:', error);
    throw error;
  }
});

// ── Settings ──────────────────────────────────────────────────────────────────

ipcMain.handle('settings:get', (_e, key: string) => {
  return loadSettings()[key] ?? null;
});

ipcMain.handle('settings:set', (_e, key: string, value: string) => {
  const data = loadSettings();
  data[key] = value;
  saveSettings(data);
  return { ok: true };
});

ipcMain.handle('settings:getAll', () => {
  return loadSettings();
});

// ── Printer ───────────────────────────────────────────────────────────────────

ipcMain.handle('printer:getAvailable', async () => {
  // On Linux, list printers via CUPS
  const { execSync } = await import('child_process');
  try {
    const output = execSync('lpstat -a 2>/dev/null || echo ""').toString();
    return output
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split(' ')[0]);
  } catch (error) {
    console.error('Failed to get available printers:', error);
    return [];
  }
});

ipcMain.handle('printer:printPriceTagsTSPL', async (_e, req) => {
  try {
    await printPriceTagsTSPL(req);
    return true;
  } catch (error) {
    console.error('Print error:', error);
    throw error;
  }
});
