import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-6 pt-24 text-center">
      <p className="text-5xl" aria-hidden>
        🎱
      </p>
      <h1 className="mt-4 text-2xl font-bold">Không tìm thấy trang</h1>
      <p className="mt-2 text-muted">Trang bạn tìm không tồn tại.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 font-semibold text-primary-fg"
      >
        Về trang chủ
      </Link>
    </main>
  );
}
