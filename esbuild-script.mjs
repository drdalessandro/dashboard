// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
/* global process */
/* global console */

import botLayer from '@medplum/bot-layer/package.json' with { type: 'json' };
import esbuild from 'esbuild';
import fastGlob from 'fast-glob';

// Find all TypeScript files of the bots (only src/bots gets bundled and
// deployed; the rest of src is FrontEnd code with UI-only dependencies)
const entryPoints = fastGlob.sync('./src/bots/**/*.ts').filter((file) => !file.endsWith('test.ts'));

const botLayerDeps = Object.keys(botLayer.dependencies);

// Define the esbuild options
const esbuildOptions = {
  entryPoints: entryPoints,
  bundle: true, // Bundle imported functions
  outdir: './dist', // Output directory for compiled files
  outbase: './src', // Keep the src structure so bots land in dist/bots/...
  platform: 'node', // or 'node', depending on your target platform
  loader: {
    '.ts': 'ts', // Load TypeScript files
  },
  resolveExtensions: ['.ts'],
  external: botLayerDeps,
  format: 'cjs', // Set output format as ECMAScript modules
  target: 'es2020', // Set the target ECMAScript version
  tsconfig: 'tsconfig.json',
  footer: { js: 'Object.assign(exports, module.exports);' }, // Required for VM Context Bots
};

// Build using esbuild
esbuild
  .build(esbuildOptions)
  .then(() => {
    console.log('Build completed successfully!');
  })
  .catch((error) => {
    console.error('Build failed:', JSON.stringify(error, null, 2));
    process.exit(1);
  });
