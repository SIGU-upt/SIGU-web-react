import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  // Hooks y variantes que viven junto a su componente por diseño (patrón shadcn/ui y
  // el contexto de auth). Se permiten por nombre en vez de apagar la regla: cualquier
  // otro export que no sea un componente sigue marcándose.
  {
    files: ['src/components/ui/**/*.tsx', 'src/contexts/AuthContext.tsx'],
    rules: {
      'react-refresh/only-export-components': [
        'error',
        {
          allowConstantExport: true,
          allowExportNames: [
            'badgeVariants',
            'buttonGroupVariants',
            'buttonVariants',
            'navigationMenuTriggerStyle',
            'toggleVariants',
            'useFormField',
            'useSidebar',
            'useAuth',
          ],
        },
      ],
    },
  },
])
