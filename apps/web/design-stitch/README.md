# Design reference (local only)

Stitch API 生成很慢且不稳定，**日常开发不要跑 `pnpm stitch:pull`**。

本目录是已归档的 HTML 参考稿（与线上 Next 组件对应），用于对照颜色与布局：

| 文件 | 对应路由 |
|------|----------|
| `home.html` | `/` |
| `products.html` | `/products` |
| `product-detail.html` | `/products/[id]` |
| `login.html` / `register.html` | `/login` `/register` |
| `cart.html` / `checkout.html` | `/cart` `/checkout` |
| `orders.html` | `/orders` |
| `admin-*.html` | `/admin/*` |

实现侧设计 token 见 `apps/web/tailwind.config.ts` 与 `src/components/ui/stitch.ts`。
