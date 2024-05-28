
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: vitePreprocess({ style: true, script: false }),
	compilerOptions: {
		runes: true,
	},
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		alias: {
			"styles": "./src/styles",
			"components": "./src/components",
			"lib": "./src/lib",
			"stores": "./src/stores",
			"routes": "./src/routes",
		}
	}
};