const path = require("path");

module.exports = {
  mode: "development",
  entry: "./scripts.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },

  // ⭐️ JavaScript 파일에 대한 rules 수정 ⭐️
  module: {
    rules: [
      {
        // .js 파일만 처리 (ts-loader가 아닌 다른 로더가 필요할 수 있지만, 여기서는 ts-loader 규칙에서 제외합니다.)
        // livekit-client는 import되므로 webpack이 자동으로 처리합니다.
        test: /\.js$/,
        // node_modules와 scripts.js를 ts-loader에서 제외합니다.
        // scripts.js는 순수 JS 파일이므로, ts-loader의 엄격한 TS 규칙이 필요 없습니다.
        exclude: /node_modules/,
        // ⭐️ 'ts-loader'를 제거하고 babel-loader나 'type: "javascript/auto"'를 사용할 수 있지만,
        // ⭐️ 가장 간단하게는 tsconfig.json 오류를 발생시키는 부분을 제거하고,
        // ⭐️ scripts.js를 Webpack의 기본 JS 처리 기능으로 맡깁니다.
        // use: 'ts-loader', // 이 줄을 주석 처리하거나 제거합니다.
        type: "javascript/auto", // Webpack 5에서 모듈을 처리하는 기본 방식
      },
    ],
  },

  // Webpack이 모듈을 찾는 방법을 정의합니다.
  resolve: {
    extensions: [".js"],
    fallback: {
      fs: false,
      path: false,
      os: false,
      // LiveKit이 필요한 다른 Node.js 코어 모듈이 있다면 여기에 추가
    },
  },

  devtool: "source-map",
};
