import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const external = ['axios'];

const plugins = [
  resolve({
    preferBuiltins: true,
    browser: false
  }),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: true,
    declarationDir: './dist/types'
  })
];

export default [
  // Node.js/ES Module build
  {
    input: 'src/index.ts',
    external,
    output: {
      file: 'dist/usertune.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins
  },
  
  // CommonJS build  
  {
    input: 'src/index.ts',
    external,
    output: {
      file: 'dist/usertune.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    plugins
  },
  
  // Browser build (with dependencies bundled and minified)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/usertune.browser.js',
      format: 'umd',
      name: 'Usertune',
      sourcemap: true,
      globals: {
        axios: 'axios'
      }
    },
    external: ['axios'],
    plugins: [
      ...plugins,
      terser()
    ]
  }
]; 