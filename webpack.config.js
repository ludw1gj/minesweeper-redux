const config = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: './app.ts',
  output: {
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: 'ts-loader' },
    ],
  },
};

module.exports = (_, argv) => {
  switch (argv.mode) {
    case 'development':
      config.output.filename = 'bundle.js';
      break;
    case 'production':
      config.output.filename = 'bundle.min.js';
      break;
  }
  return config;
};
