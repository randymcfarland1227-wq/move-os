import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/move-os/",
  plugins: [
    {
      name: "move-os-static-css",
      enforce: "pre",
      transform(code, id) {
        if (id.endsWith("/app/globals.css")) {
          return code.replace('@import "tailwindcss";', "");
        }
      },
    },
    react(),
  ],
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
  },
});
