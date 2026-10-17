# 環境依賴規範 (DEPENDENCIES.md)

本專案 `GibsonFilm` 之系統層級需求與所有非標準庫外部套件依賴如下表所示：

## 一、 系統層級依賴 (System Requirements)

| Package Name | Version | Purpose |
| :--- | :--- | :--- |
| `Node.js` | `>= 22.12.0` (相容 `>= 20.12.0`) | JavaScript 執行環境與 ESM 模組解析（搭配 `@cloudflare/vite-plugin` 建議使用 Node 22 LTS） |
| `npm` | `>= 10.0.0` | 套件依賴管理與腳本執行工具 |
| `Git` | `>= 2.40.0` | 原始碼版本控制與 GitHub Actions / Cloudflare 自動化部署觸發 |

## 二、 外部套件依賴 (External Packages)

| Package Name | Version | Purpose |
| :--- | :--- | :--- |
| `vue` | `== 3.5.39` | 前端核心響應式視圖框架（Composition API `<script setup>`） |
| `pinia` | `== 3.0.4` | 集中式狀態管理（使用 `shallowRef` 最佳化大型圖片陣列記憶體分配） |
| `vue-router` | `== 4.6.4` | 單頁應用程式（SPA）路由分發與歷史狀態管理 |
| `vite` | `== 8.1.1` | 前端開發伺服器與靜態資源模組打包工具 |
| `@vitejs/plugin-vue` | `== 6.0.7` | Vite 專用之 Vue 3 單一檔案元件（SFC）編譯插件 |
| `@cloudflare/vite-plugin` | `== 1.44.0` | Cloudflare Workers 靜態資產與邊緣運算整合插件 |
| `wrangler` | `== 4.110.0` | Cloudflare Workers 本地端模擬與邊緣節點部署 CLI 工具 |
| `sharp` | `== 0.35.3` | 基於 C++ `libvips` 之高效能影像處理庫（WebP 轉檔、LQIP 縮圖與相機線稿底色對齊） |
| `image-size` | `== 2.0.2` | 讀取影像尺寸與長寬比中繼資料 |
| `@rolldown/binding-win32-x64-msvc` | `== 1.1.5` | Windows x64 環境下供 Vite 8 / Rolldown 使用之原生 Rust N-API 綁定模組（Optional Dependency） |

## 三、 環境安裝與資產最佳化指令 (Installation & Build Commands)

```bash
# 1. 安裝所有專案依賴套件（若於 Windows 遭遇 rolldown 原生綁定缺失，請先清除 node_modules 與 package-lock.json）
npm install

# 2. 執行相機線稿色彩對齊 (#0f0e17) 與 3D 立體圖層生成
npm run optimize:cameras

# 3. 執行底片相簿冪等去重與 WebP 批次最佳化
npm run optimize:photos

# 4. 本地端啟動開發伺服器
npm run dev

# 5. 建置生產環境靜態資產並部署至 Cloudflare Workers
npm run deploy
```

