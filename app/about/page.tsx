export default function AboutPage() {
  return (
    <section className="space-y-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">
        About
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-50">
        Chi sono
      </h1>
      <div className="max-w-3xl space-y-4 text-lg leading-8 text-zinc-200">
        <p>
          Sono Matteo Collina, vivo a Cervia (RA) e sono appassionato di
          informatica, calcio e musica elettronica.
        </p>
        <p>
          Questo é il mio blog con contenuti in italiano dedicati al
          frontend, dove raccolgo pensieri, esperienze e risorse utili.
        </p>
      </div>
      <div className="flex flex-col gap-3 text-base text-zinc-100">
        <a
          href="https://github.com/matteocollina"
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit rounded-md px-3 py-2 font-semibold underline decoration-zinc-500 underline-offset-4 transition-colors hover:bg-zinc-50 hover:text-zinc-950 hover:decoration-zinc-950"
        >
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/matteo-collina"
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit rounded-md px-3 py-2 font-semibold underline decoration-zinc-500 underline-offset-4 transition-colors hover:bg-zinc-50 hover:text-zinc-950 hover:decoration-zinc-950"
        >
          LinkedIn
        </a>
      </div>
    </section>
  );
}
