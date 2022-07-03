const pkg = require('./package.json')
const path = require('path')
const Html = require('html-webpack-plugin')
const Copy = require("copy-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const devMode = process.env.NODE_ENV === 'development'

module.exports = {
    // devtool: 'cheap-module-source-map',
    entry: {
        index: './src/app.tsx',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: { type: 'umd' },
        clean: true,
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            '@image': path.resolve(__dirname, 'src/images/'),
            '@src': path.resolve(__dirname, 'src/'),
        },
    },
    devServer: {
        static: [{
            directory: path.join(__dirname + '/dist'),
            watch: true,
        }],
        hot: true,
        open: true,
        port: 8888,
    },
    module: {
        rules: [{
            test: /\.ts(x?)$/,
            use: [{
                loader: 'babel-loader',
                options: {
                    presets: [['@babel/preset-env', {
                        useBuiltIns: 'usage', corejs: { version: '3.19' },
                        targets: pkg.browserslist,
                        debug: false,
                    }],],
                },
            }, {
                loader: 'ts-loader',
            }],
        }, {
            test: /\.less$/,
            use: [
                devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                'css-loader',
                'less-loader',
            ],
        }, {
            test: /\.css$/,
            use: [
                devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                'css-loader',
            ],
        }, {
            test: /\.(png|svg|jpg|jpeg|gif)$/i,
            type: 'asset/resource',
            generator: devMode ? {} : {
                filename: (path) => {
                    return path.filename.replace('src', 'static')
                }
            },
        },]
    },
    optimization: {
        minimizer: [
            '...',
            new CssMinimizerPlugin(),
        ],
        splitChunks: {
            cacheGroups: {
                bennowu: {
                    test: /[\\/]node_modules[\\/]@bennowu/,
                    name: 'bennowu',
                    priority: 100,
                    chunks: 'all',
                },
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    priority: 0,
                    chunks: 'all',
                },
            },
        },
    },
    plugins: [
        // new BundleAnalyzerPlugin(),
        new Html({
            template: path.resolve(__dirname, './src/index.html'),
        }),
        // todo css 的大小优化
        new Copy({
            patterns: [
                { from: 'src/static', to: 'static' },
                { from: path.resolve(__dirname, 'node_modules', 'antd', 'dist', 'antd.min.css'), to: 'static' },
                { from: path.resolve(__dirname, 'node_modules', 'antd', 'dist', 'antd.dark.min.css'), to: 'static' },
            ]
        }),
        new MiniCssExtractPlugin(),
    ],
}