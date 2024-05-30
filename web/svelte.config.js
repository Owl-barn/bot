
import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: vitePreprocess({ style: true, script: false }),
	kit: {
		adapter: adapter(),
		alias: {
			"styles": "./src/styles",
			"components": "./src/components",
			"lib": "./src/lib",
			"stores": "./src/stores",
			"routes": "./src/routes",
			"shared": "./src/structs/shared",
		}
	}
};