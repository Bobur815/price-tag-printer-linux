# Setup Instructions

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Important: Copy Files from Main Project

⚠️ **ACTION REQUIRED**: If you have a main POS project, you need to copy these files:

#### Files to Copy

Copy these files from your main POS project to preserve the existing functionality:

```bash
# From main project → to price-tag-printer

# Price tag components (REQUIRED)
cp ../main-pos/src/renderer/pages/Settings/PriceTags.tsx \
   ./src/renderer/pages/Settings/PriceTags.tsx

cp ../main-pos/src/renderer/pages/Settings/PrintTagsModal.tsx \
   ./src/renderer/pages/Settings/PrintTagsModal.tsx

# Common components (use existing placeholders if not available)
cp ../main-pos/src/renderer/components/common/Modal.tsx \
   ./src/renderer/components/common/Modal.tsx

cp ../main-pos/src/renderer/components/common/Button.tsx \
   ./src/renderer/components/common/Button.tsx

# Utilities (use existing placeholders if not available)
cp ../main-pos/src/renderer/utils/helpers.ts \
   ./src/renderer/utils/helpers.ts

# Shared types (use existing placeholders if not available)
cp ../main-pos/src/shared/types/product.types.ts \
   ./src/shared/types/product.types.ts

cp ../main-pos/src/shared/utils/barcode-parser.ts \
   ./src/shared/utils/barcode-parser.ts
```

**Note:** Replace `../main-pos` with the actual path to your main POS project.

#### After Copying PriceTags.tsx

If `PriceTags.tsx` uses `react-router-dom`, you have two options:

**Option A: Remove navigation** (simpler)
```tsx
// Remove or comment out:
// import { useNavigate } from 'react-router-dom';
// const navigate = useNavigate();
// onClick={() => navigate('/settings')}

// Replace back button with:
// onClick={() => setShowEditor(false)}
```

**Option B: Add router** (if needed elsewhere)
```bash
npm install react-router-dom
```

Then wrap App in `MemoryRouter` in `src/renderer/App.tsx`:
```tsx
import { MemoryRouter } from 'react-router-dom';

export function App() {
  return (
    <MemoryRouter>
      {/* existing content */}
    </MemoryRouter>
  );
}
```

### 3. Configure Your VPS API

The app will prompt for your VPS API URL on first login. Make sure your VPS exposes:

```
POST /auth/login
GET  /products
```

### 4. Run Development Build

```bash
npm run dev
```

This starts Vite dev server + Electron app.

### 5. Build for Production

```bash
npm run dist
```

Output: `release/Price Tag Printer-1.0.0.AppImage`

## Linux Printer Setup

### Install CUPS

```bash
sudo apt install cups
sudo usermod -aG lpadmin $USER
```

Log out and back in for group changes to take effect.

### Add USB Printer

```bash
# Find USB printers
lpinfo -v | grep usb

# Example output:
# usb://XP/365B?serial=1234567

# Add printer (adjust name and URI)
sudo lpadmin -p LabelPrinter -E -v "usb://XP/365B?serial=1234567" -m raw

# Set as default
sudo lpoptions -d LabelPrinter
```

### Test Print

```bash
# Test TSPL command
echo -e "SIZE 40 mm, 30 mm\nGAP 3 mm, 0 mm\nCLS\nTEXT 10,10,\"3\",0,1,1,\"TEST PRINT\"\nPRINT 1,1\r\n" | lp -d LabelPrinter -o raw
```

## Troubleshooting

### "Cannot find module" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors

```bash
npm run type-check
```

Fix any errors before building.

### Printer not detected

```bash
# Check CUPS status
systemctl status cups

# List all printers
lpstat -a

# Restart CUPS
sudo systemctl restart cups
```

### App won't start in dev mode

Make sure both Vite and Electron are running:

```bash
# Terminal 1: Start Vite
npm run dev:vite

# Terminal 2 (in another terminal): Start Electron
npm run dev:electron
```

Or use:
```bash
npm run dev
```

This runs both concurrently.

## File Structure

```
price-tag-printer/
├── src/
│   ├── main/                  # Electron main process
│   │   ├── index.ts          # Entry point, IPC handlers
│   │   ├── preload.ts        # Context bridge
│   │   └── printer/
│   │       └── tspl-printer.ts  # TSPL printer (Linux CUPS)
│   ├── renderer/             # React renderer process
│   │   ├── main.tsx          # React entry
│   │   ├── App.tsx           # Main app component
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── Settings/
│   │   │       ├── PriceTags.tsx       # ⚠️ Copy from main project
│   │   │       └── PrintTagsModal.tsx  # ⚠️ Copy from main project
│   │   ├── components/common/
│   │   ├── utils/
│   │   └── i18n/
│   │       └── locales/
│   │           ├── ru.json
│   │           └── uz.json
│   └── shared/               # Shared types/utils
│       ├── types/
│       └── utils/
├── package.json
├── tsconfig.json
├── tsconfig.main.json
└── vite.config.ts
```

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ⚠️ Copy files from main project (see above)
3. ✅ Setup printer (see Linux Printer Setup)
4. ✅ Run dev build: `npm run dev`
5. ✅ Test login and printing
6. ✅ Build production: `npm run dist`
7. ✅ Deploy AppImage to target PC

## Support

For questions about TSPL commands, CUPS configuration, or Electron build issues, refer to:
- TSPL Programming Manual
- CUPS Documentation: https://www.cups.org/doc/
- Electron Builder: https://www.electron.build/
