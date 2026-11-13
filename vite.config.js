import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: Number(process.env.PORT || 3000),
    strictPort: true,
    allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', 'live-43495884867-1.omgithub.com', '.omgithub.com'],
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT || 3000),
    strictPort: true,
    allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', 'live-43495884867-1.omgithub.com', '.omgithub.com'],
  },
});
