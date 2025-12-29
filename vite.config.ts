import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";


const plugins = [
  react(), 
  tailwindcss(), 
  jsxLocPlugin(), 
  vitePluginManusRuntime(),
  // PWA configuration
  VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'robots.txt'],
    manifest: {
      name: 'NorskLeads - AI Lead Generation',
      short_name: 'NorskLeads',
      description: 'AI-powered lead generation platform for Norwegian businesses',
      theme_color: '#4F46E5',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/favicon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      // Cache strategies
      runtimeCaching: [
        {
          // Cache API responses
          urlPattern: /^https:\/\/api\./i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 // 1 hour
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          // Cache images
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
          }
        },
        {
          // Cache fonts
          urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'font-cache',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
          }
        },
        {
          // Cache CSS and JS
          urlPattern: /\.(?:js|css)$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
            }
          }
        }
      ],
      // Precache important assets
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      // Skip waiting and claim clients immediately
      skipWaiting: true,
      clientsClaim: true,
      // Clean up old caches
      cleanupOutdatedCaches: true,
    },
    devOptions: {
      enabled: false // Disable in development
    }
  }),
  // Gzip compression for static assets
  viteCompression({
    algorithm: 'gzip',
    ext: '.gz',
    threshold: 1024, // Only compress files > 1KB
    deleteOriginFile: false,
  }),
  // Brotli compression (better compression ratio)
  viteCompression({
    algorithm: 'brotliCompress',
    ext: '.br',
    threshold: 1024,
    deleteOriginFile: false,
  }),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    // Enable minification optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets < 4KB as base64
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps in production
    rollupOptions: {
      output: {
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Radix UI components
          if (id.includes('@radix-ui')) {
            return 'vendor-radix';
          }
          // Charts library (large)
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts';
          }
          // Calendar library
          if (id.includes('react-big-calendar') || id.includes('moment')) {
            return 'vendor-calendar';
          }
          // PDF generation
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'vendor-pdf';
          }
          // Drag and drop
          if (id.includes('react-beautiful-dnd') || id.includes('@hello-pangea/dnd')) {
            return 'vendor-dnd';
          }
          // Form handling
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'vendor-forms';
          }
          // tRPC and tanstack query
          if (id.includes('@trpc') || id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          // Utility libraries
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
            return 'vendor-utils';
          }
          // Lucide icons (can be large)
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  // Preview server configuration
  preview: {
    host: true,
    port: 4173,
  },
});
