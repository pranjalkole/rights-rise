import { resolve } from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        register: resolve(__dirname, "register.html"),
        login: resolve(__dirname, "login.html"),
      }
    }
  }
})
/* vim: set et sw=2: */
