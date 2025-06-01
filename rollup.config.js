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

const browserPlugins = [
  resolve({
    preferBuiltins: false,
    browser: true
  }),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.json'
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
  
  // Browser build (unminified, with axios bundled)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/usertune.browser.js',
      format: 'umd',
      name: 'Usertune',
      sourcemap: true,
      exports: 'named',
      globals: {
        'usertune.js': 'Usertune'
      }
    },
    plugins: [
      ...browserPlugins,
      {
        name: 'expose-usertune-class',
        generateBundle(options, bundle) {
          const chunk = bundle['usertune.browser.js'];
          if (chunk && chunk.type === 'chunk') {
            // Modify the UMD wrapper to expose Usertune class directly
            chunk.code = chunk.code.replace(
              /global\.Usertune = factory\(\);/,
              'global.Usertune = factory().Usertune;'
            );
          }
        }
      }
    ]
  },

  // Browser build (minified, with axios bundled)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/usertune.browser.min.js',
      format: 'umd',
      name: 'Usertune',
      sourcemap: true,
      exports: 'named',
      globals: {
        'usertune.js': 'Usertune'
      }
    },
    plugins: [
      ...browserPlugins,
      {
        name: 'expose-usertune-class',
        generateBundle(options, bundle) {
          const chunk = bundle['usertune.browser.min.js'];
          if (chunk && chunk.type === 'chunk') {
            // Modify the UMD wrapper to expose Usertune class directly
            chunk.code = chunk.code.replace(
              /global\.Usertune = factory\(\);/,
              'global.Usertune = factory().Usertune;'
            );
          }
        }
      },
      terser({
        compress: {
          drop_console: true
        },
        mangle: true
      })
    ]
  }
]; 