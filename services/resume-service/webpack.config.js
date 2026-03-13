const path = require("node:path");
const webpack = require("webpack");

const optionalPeers = ["@mikro-orm/core", "@nestjs/mongoose", "@nestjs/sequelize"];

module.exports = (options) => ({
	...options,
	externals: [],
	resolve: {
		...options.resolve,
		alias: {
			...options.resolve?.alias,
			"@domain": path.resolve(__dirname, "src/domain/index.ts"),
			"@ports": path.resolve(__dirname, "src/ports/index.ts"),
		},
		// Let .js imports from TypeScript packages (e.g. cv-layout) resolve to .ts source
		extensionAlias: {
			".js": [".ts", ".js"],
		},
	},
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
