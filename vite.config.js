import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/3i-atlas/', // <--- IMPORTANTE: ESTA LÍNEA HACE LA MAGIA
})