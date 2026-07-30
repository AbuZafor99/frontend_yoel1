// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({ plugins: [react()] })
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react],
  preview: {
    host: '0.0.0.0',
    port: 3002,
    allowedHosts: [
      'zentrofix.com',
      'www.zentrofix.com'
    ]
  }
})
