import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Custom domain (arizonalawyer.sbs) serves from site root.
// GitHub project URL path only needs /ziwei-ai/ when GITHUB_PAGES=true without custom domain.
const useProjectPath =
  process.env.GITHUB_PAGES === 'true' && process.env.CUSTOM_DOMAIN !== 'true'

export default defineConfig({
  plugins: [react()],
  base: useProjectPath ? '/ziwei-ai/' : '/',
})
