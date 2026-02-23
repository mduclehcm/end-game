const path = require("node:path");
const webpack = require("webpack");

// Optional deps that @nestjs/terminus loads for DB health checks; we only use HTTP health.
const optionalPeers = ["@mikro-orm/core", "@nestjs/mongoose", "@nestjs/sequelize", "@nestjs/typeorm"];

// Bundle node_modules into the output (Nest default excludes them).
// https://docs.nestjs.com/cli/monorepo#webpack-options
module.exports = (options) => ({
	...options,
	externals: [],
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
		new webpack.IgnorePlugin({
			checkResource(resource) {
				const name = optionalPeers.find((p) => resource === p || resource.startsWith(`${p}/`));
				if (!name) return false;
				try {
					require.resolve(resource);
				} catch {
					return true;
				}
				return false;
			},
		}),
	],
});
