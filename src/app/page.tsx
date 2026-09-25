// Portada provisional de la plantilla. Cada app la sustituye por su primera pantalla.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-1 flex-col justify-center gap-3 p-8">
      <p className="text-xs tracking-[0.3em] uppercase">Drinks on Chain</p>
      <h1 className="text-3xl">Plantilla de aplicación</h1>
      <p>Next.js 16, TypeScript estricto, Tailwind 4, cliente de API tipado y datos de prueba.</p>
    </main>
  );
}
