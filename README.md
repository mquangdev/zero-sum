# Zero Sum

Web mobile-first để ghi sổ tiền các ván "thắng ăn tất" (bài, bi-a) giữa bạn bè. Không cần đăng nhập, không cần backend, dữ liệu lưu ngay trên trình duyệt.

Ví dụ: ván bi-a giá 5.000đ/bi, bạn thắng, A còn 3 bi, B còn 2 bi → A trả 15.000đ, B trả 10.000đ, bạn nhận 25.000đ. Nhiều ván cộng dồn trong một phiên và có tổng kết cuối trận.

## Tài liệu

- [`docs/spec.md`](docs/spec.md): yêu cầu và nghiệp vụ chi tiết
- [`CLAUDE.md`](CLAUDE.md): quy ước làm việc cho AI/dev

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, localStorage, Vitest. Deploy trên Vercel, CI bằng GitHub Actions.

## Chạy cục bộ

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run build
```

## CI/CD

- **CI**: GitHub Actions (`.github/workflows/ci.yml`) chạy `npm ci`, lint, typecheck, test và build cho mỗi pull request và mỗi lần push lên `main`.
- **CD**: Vercel tự deploy qua tích hợp Git, không cần workflow, token hay `vercel.json`. Nhánh `main` lên production, mỗi PR có một preview deploy.

Kết nối Vercel (làm một lần, bằng tay):

1. Vào vercel.com, Add New Project, import repo `mquangdev/zero-sum`.
2. Giữ nguyên preset Next.js và các cấu hình mặc định; không cần biến môi trường.
3. Production Branch là `main`; preview cho pull request được bật sẵn.
4. (Tuỳ chọn) Trong GitHub, Settings > Branches, yêu cầu check `CI / check` xanh trước khi merge vào `main`.

## Trạng thái

Đã có đủ chức năng MVP theo spec: tạo phiên, người chơi, nhập/sửa/xoá ván, bảng điểm, tổng kết và chuyển khoản tối giản, sao chép kết quả, xuất/nhập JSON, chế độ sáng/tối.
