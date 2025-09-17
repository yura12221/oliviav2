export default function OfflinePage() {
  return (
    <main className="min-h-[50vh] grid place-items-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Ви офлайн</h1>
        <p className="opacity-80">
          Контент, який ви вже відкривали, буде доступний без інтернету.
          Підключіться до мережі, щоб отримати нові дані.
        </p>
      </div>
    </main>
  );
}
