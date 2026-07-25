# 環境依賴規範 (DEPENDENCIES.md)

本專案 `GibsonFilm` 之系統需求與外部套件依賴如下表所示：

## 系統層級依賴 (System Requirements)

| Dependency | Recommended Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `>= 18.0.0` | JavaScript 執行環境 |
| **npm** | `>= 9.0.0` | 套件管理工具 |
| **Git** | `>= 2.30.0` | 版本控制與 CI/CD 觸發 |

## 外部套件依賴 (Node.js Packages)

| Package Name | Version | Purpose |
| :--- | :--- | :--- |
| `sharp` | `^0.35.3` | C++ libvips 高效能圖像處理，執行 WebP 格式轉換與 LQIP 縮圖生成 |
| `vue` | `^3.5.39` | 核心 Web 框架 (Composition API `<script setup>`) |
| `vite` | `^8.1.1` | 前端開發伺服器與靜態打包工具 |
| `pinia` | `^3.0.4` | 全域狀態管理 |
| `vue-router` | `^4.6.4` | 前端路由管理 |
| `image-size` | `^2.0.2` | 讀取圖像尺寸中介資料 |

## 安裝指令 (Installation Command)

```bash
npm install
```
