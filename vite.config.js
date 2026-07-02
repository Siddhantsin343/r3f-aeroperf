import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJs from "vite-plugin-css-injected-by-js";

const isLib = process.env.BUILD_LIB === "true";

export default defineConfig({
  plugins: [react(), ...(isLib ? [cssInjectedByJs()] : [])],

  build: isLib
    ? {
        lib: {
          entry: "./src/index.jsx",
          name: "AeroPerf",
          fileName: (format) => `index.${format === "es" ? "mjs" : "js"}`,
          formats: ["es", "cjs"],
        },
        rollupOptions: {
          // external: ['react', 'react-dom', 'three', '@react-three/fiber', 'valtio'],
          external: [
            "react",
            "react-dom",
            "react-dom/client",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "three",
            "@react-three/fiber",
            "valtio",
          ],
          output: {
            globals: {
              react: "React",
              "react-dom": "ReactDOM",
              three: "THREE",
              "@react-three/fiber": "ReactThreeFiber",
              valtio: "valtio",
            },
          },
        },
      }
    : {
        outDir: "demo-dist",
      },
});
