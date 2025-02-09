import * as path from 'node:path';

import { defineConfig } from 'vite';
import babel from '@rollup/plugin-babel';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, './src/pinch-zoom.ts'),
      name: 'PinchZoom', // UMD에서 전역 객체 이름
      fileName: format => `pinch-zoom.${format}.js`, // 형식별 파일 이름
      formats: ['umd'], // UMD 형식으로 빌드
    },
    minify: false, // 압축 비활성화
    rollupOptions: {
      plugins: [
        babel({
          babelHelpers: 'runtime', // runtime 사용
          extensions: ['.ts', '.js'], // 변환할 확장자
          exclude: 'node_modules/**', // node_modules 제외
          presets: [
            [
              '@babel/preset-env',
              {
                targets: '> 0.25%, not dead, ie 11', // ES5 지원
                useBuiltIns: 'entry',
                corejs: 3,
              },
            ],
          ],
          plugins: ['@babel/plugin-transform-runtime'], // Babel 런타임 플러그인 추가
        }),
      ],
    },
  },
});
