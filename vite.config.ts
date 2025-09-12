import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Declare process to avoid requiring Node types during build
declare const process: {
  env?: Record<string, string | undefined>
}
const repoName = process.env?.GITHUB_REPOSITORY?.split('/')[1] ?? ''

export default defineConfig({
  base: repoName ? `/${repoName}/` : '/',
  plugins: [react()],
})
