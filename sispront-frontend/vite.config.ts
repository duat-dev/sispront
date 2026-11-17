import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { compile } from 'tailwindcss'
import { defineConfig, type Plugin } from 'vite'

function collectFiles(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      collectFiles(fullPath, files)
    } else if (/\.(tsx|ts|jsx|js|html)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }
  return files
}

function extractCandidates(content: string): string[] {
  const tokens = content.split(/[\s"'`;{}()<>+=,?]+/)
  return tokens.filter((t) => t.length > 0 && !t.startsWith('//'))
}

function tailwindcssVitePlugin(): Plugin {
  const rootDir = process.cwd()

  return {
    name: 'sispront-tailwindcss-v4',
    enforce: 'pre',
    handleHotUpdate({ file, server }) {
      if (/\.(tsx|ts|jsx|js|html)$/.test(file)) {
        const cssModules = server.moduleGraph.getModulesByFile(
          path.resolve(rootDir, 'src/index.css')
        )
        if (cssModules) {
          for (const mod of cssModules) {
            server.moduleGraph.invalidateModule(mod)
          }
        }
      }
    },
    async transform(code, id) {
      if (!id.endsWith('.css') || !code.includes('@import "tailwindcss"')) {
        return null
      }

      const compiler = await compile(code, {
        base: path.dirname(id),
        loadStylesheet: async (sheetId, base) => {
          if (sheetId === 'tailwindcss') {
            const p = path.resolve(rootDir, 'node_modules/tailwindcss/index.css')
            return {
              path: p,
              base: path.dirname(p),
              content: fs.readFileSync(p, 'utf8'),
            }
          }
          const resolved = path.resolve(base, sheetId)
          return {
            path: resolved,
            base: path.dirname(resolved),
            content: fs.readFileSync(resolved, 'utf8'),
          }
        },
      })

      const files = [
        path.resolve(rootDir, 'index.html'),
        ...collectFiles(path.resolve(rootDir, 'src')),
      ]

      const candidateSet = new Set<string>()
      for (const file of files) {
        if (fs.existsSync(file)) {
          this.addWatchFile(file)
          const fileContent = fs.readFileSync(file, 'utf8')
          for (const token of extractCandidates(fileContent)) {
            candidateSet.add(token)
          }
        }
      }

      return {
        code: compiler.build(Array.from(candidateSet)),
        map: null,
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcssVitePlugin(), react()],
})
