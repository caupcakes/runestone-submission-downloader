import {defineConfig} from 'vite';
import {copy} from 'vite-plugin-copy';

export default defineConfig({
    build: {
        assetsDir: './',
        rollupOptions: {
            input: {'content-script': './src/content-script.ts', 'background': './src/background.js'},
            output: {
                dir: './dist',
                entryFileNames: '[name].js',
            },
        },
    },
    plugins: [
        copy([
            {src: './manifest.json', dest: 'dist/'},
        ]) as any,
    ],
});
