const path = require("node:path");
const webpack = require("webpack");

const optionalPeers = ["@mikro-orm/core", "@nestjs/mongoose", "@nestjs/sequelize", "@nestjs/typeorm"];

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
