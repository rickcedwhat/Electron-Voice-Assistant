import tseslint from '@electron-toolkit/eslint-config-ts';
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import { join } from 'path';
export default tseslint.config(
  {
    ignores: ['**/node_modules', '**/dist', '**/out'],
  },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          project: join(__dirname, './tsconfig.json'),
        },
        alias: {
          map: [
            ['@shared', join(__dirname, './src/shared')],
            ['@renderer', join(__dirname, './src/renderer/src')],
            // Add other aliases if needed
          ],
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
        },
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh,
      prettier: eslintPluginPrettier, // Add 'prettier' to plugins
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,
      'prettier/prettier': 'error', // Add the prettier/prettier rule
    },
  },
  eslintConfigPrettier,
);
