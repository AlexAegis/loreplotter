const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
	plugins: [new CompressionPlugin()],
	optimization: {
		minimize: true
	}
};
