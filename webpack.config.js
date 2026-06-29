var CopyPlugin = require('copy-webpack-plugin');

var path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.less$/i,
        use: [ 'style-loader', 'css-loader', 'less-loader' ]
      },
      {
        test: /\.bpmn$/,
        use: { loader: 'raw-loader' }
      }
    ]
  },
  resolve: {
    mainFields: [ 'browser', 'module', 'main' ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/index.html', to: '.' },
        { from: 'node_modules/bpmn-js/dist/assets', to: 'vendor/bpmn-js/' },
        { from: 'node_modules/bpmn-js-bpmnlint/dist/assets/css', to: 'vendor/bpmn-js-bpmnlint/' },
        { from: 'node_modules/bpmn-js-side-panel/assets/side-panel.css', to: 'vendor/bpmn-js-side-panel/' },
        { from: 'node_modules/bpmn-js-animation/assets/animation.css', to: 'vendor/bpmn-js-animation/' },
        { from: 'node_modules/bpmn-js-animation/assets/simulation-panel.css', to: 'vendor/bpmn-js-animation/' }
      ]
    })
  ]
};
