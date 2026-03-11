const path = require("node:path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const { RunScriptWebpackPlugin } = require("run-script-webpack-plugin");

module.exports = (options) => ({
	...options,
	entry: ["webpack/hot/poll?100", options.entry],
	externals: [
		nodeExternals({
			allowlist: ["webpack/hot/poll?100"],
		}),
	],
	module: {
		...options.module,
		rules: [
			{
				test: /\.(map|d\.ts)$/,
				use: path.join(__dirname, "empty-module-loader.js"),
			},
			...(options.module?.rules ?? []),
		],
	},
	plugins: [
		...(options.plugins ?? []),
		new webpack.HotModuleReplacementPlugin(),
		new webpack.WatchIgnorePlugin({
			paths: [/\.js$/, /\.d\.ts$/],
		}),
		new RunScriptWebpackPlugin({ name: options.output.filename, autoRestart: false }),
	],
});
