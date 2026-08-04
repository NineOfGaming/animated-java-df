import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		dir: 'src/tests',
		server: {
			deps: {
				inline: ['book-and-quill', 'generic-stream'],
			},
		},
	},
})
