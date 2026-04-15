# Price Tag Printer — Standalone Electron App

A lightweight Electron app for Linux Mint that connects to a VPS, fetches products, and prints TSPL price tags on a label printer.

## Features

- 🚀 Lightweight (~150 MB vs ~400 MB full POS)
- 🔐 Simple login authentication
- 📦 Fetch products from VPS API
- 🖨️ Print price tags via TSPL label printer (CUPS on Linux)
- 🌍 Multi-language support (Russian & Uzbek)
- ⚡ Fast and responsive UI

## System Requirements

| Component | Minimum |
|-----------|---------|
| OS        | Ubuntu 18.04 / Linux Mint 19+ (64-bit) |
| RAM       | 512 MB free |
| CPU       | Any dual-core x86_64 |
| Disk      | 300 MB |
| Network   | WiFi or LAN (to reach VPS) |
| Printer   | USB or network TSPL label printer |

## Installation

### 1. Install Dependencies

```bash
cd price-tag-printer
npm install
```

### 2. Copy Files from Main POS Project (if available)

If you have a main POS project, copy these files:

| Source (main project) | Destination |
|-----------------------|-------------|
| `src/renderer/pages/Settings/PriceTags.tsx` | `src/renderer/pages/Settings/` |
| `src/renderer/pages/Settings/PrintTagsModal.tsx` | `src/renderer/pages/Settings/` |
| `src/renderer/components/common/Modal.tsx` | `src/renderer/components/common/` |
| `src/renderer/components/common/Button.tsx` | `src/renderer/components/common/` |
| `src/renderer/utils/helpers.ts` | `src/renderer/utils/` |
| `src/shared/types/product.types.ts` | `src/shared/types/` |
| `src/shared/utils/barcode-parser.ts` | `src/shared/utils/` |

**Note:** Placeholder files have been created for these components. You can use them as-is or replace with your actual files.

### 3. Setup CUPS Printer (Linux)

```bash
# Install CUPS
sudo apt install cups

# Add user to lpadmin group
sudo usermod -aG lpadmin $USER

# Open CUPS web UI
# Visit: http://localhost:631
```

#### Add USB Label Printer

```bash
# Find the printer URI
lpinfo -v | grep usb

# Add printer (replace URI with your value)
sudo lpadmin -p XP365B -E -v usb://XP/365B -m raw
sudo lpoptions -d XP365B
```

#### Test Printing

```bash
echo -e "SIZE 40 mm, 30 mm\nGAP 3 mm, 0 mm\nCLS\nTEXT 10,10,\"3\",0,1,1,\"TEST\"\nPRINT 1,1\r\n" | lp -d XP365B -o raw
```

## Development

### Run in Development Mode

```bash
npm run dev
```

This will:
1. Start Vite dev server on http://localhost:5173
2. Launch Electron with hot reload

### Type Checking

```bash
npm run type-check
```

## Building

### Build for Production

```bash
npm run build
```

### Create Distributable Package

```bash
npm run dist
```

This will create:
- `release/Price Tag Printer-1.0.0.AppImage` (portable, runs anywhere)
- `release/price-tag-printer_1.0.0_amd64.deb` (installable package)

### Install on Target Machine

#### AppImage (Recommended)

```bash
chmod +x "Price Tag Printer-1.0.0.AppImage"
./Price Tag Printer-1.0.0.AppImage
```

#### Debian Package

```bash
sudo dpkg -i price-tag-printer_1.0.0_amd64.deb
```

## Usage

1. **Login**
   - Enter your VPS API URL (e.g., `https://your-vps.com/api`)
   - Enter phone number and password
   - Click "Login"

2. **Print Price Tags**
   - View products fetched from VPS
   - Select products to print
   - Configure print settings (template, copies, etc.)
   - Click "Print"

## Configuration

### VPS API Endpoints

The app expects these endpoints on your VPS:

```
POST /auth/login
  Body: { phone: string, password: string }
  Response: { token: string }

GET /products?active=true
  Headers: { Authorization: "Bearer <token>" }
  Response: Product[]
```

### Local Storage

Settings are stored in localStorage:
- `vpsApiUrl` - VPS API URL
- `language` - Selected language (ru/uz)
- Price tag templates (if configured)

## Troubleshooting

### Printer Not Found

1. Check CUPS is running: `systemctl status cups`
2. List available printers: `lpstat -a`
3. Verify printer connection: `lpinfo -v`

### Login Failed

1. Verify VPS URL is correct and accessible
2. Check network connection
3. Verify API credentials

### Build Failed

1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Check TypeScript errors: `npm run type-check`

## Architecture

```
┌─────────────────────────────────────────┐
│  Renderer (React)                        │
│  - LoginPage                             │
│  - PriceTags.tsx     (template editor)   │
│  - PrintTagsModal.tsx (product selector) │
└────────────────┬────────────────────────┘
                 │ IPC (contextBridge)
┌────────────────▼────────────────────────┐
│  Main Process (Node.js)                  │
│  - auth: POST /api/auth/login            │
│  - products: GET /api/products           │
│  - printer: tspl-printer.ts (Linux)      │
└─────────────────────────────────────────┘
                 │ HTTP
┌────────────────▼────────────────────────┐
│  VPS (NestJS API)                        │
│  POST /api/auth/login → JWT              │
│  GET  /api/products   → product list     │
└─────────────────────────────────────────┘
```

## License

MIT

## Support

For issues and questions, please refer to the main project documentation.
