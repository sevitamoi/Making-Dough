import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// host:true exposes the dev server on your Wi-Fi so phones can scan the QR code
export default defineConfig({ plugins: [react()], server: { host: true, allowedHosts: true, port: 5173, proxy: { '/api': 'http://localhost:5050' } } });
