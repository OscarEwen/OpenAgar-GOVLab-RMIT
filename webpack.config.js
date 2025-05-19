import path from 'path';

const __dirname = import.meta.dirname;

export default (isProduction) => ({
    entry: "./client/js/src/app.js",
    mode: isProduction ? 'production' : 'development',
    output: {
        library: "app",
        filename: "app.js",
        path: path.resolve(__dirname, 'client/js')
    },
    devtool: false,
    module: {
        rules: [
            {
                test: /\.(?:js|mjs|cjs)$/,
                // exclude: /node_modules/,
            }
        ]
    },
    node: {global: true},
});
