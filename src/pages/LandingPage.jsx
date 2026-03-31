import { Link } from 'react-router-dom';

const features = [
  'What does this charge mean?',
  'What happens in the courtroom?',
  'Where can I get free help?',
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-navy text-white">
      <div className="grain-overlay" aria-hidden="true" />

      <div className="pointer-events-none absolute -left-28 top-36 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-20 h-72 w-72 rounded-full bg-success/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-10 pt-6 sm:px-8 lg:px-10">
        <header className="mb-14">
          <p className="font-heading text-2xl font-bold tracking-wide sm:text-3xl">Court Date Coach</p>
        </header>

        <section className="animate-floatIn">
          <p className="mb-3 inline-block rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-mist/90">
            Philadelphia courtroom prep, explained clearly
          </p>
          <h1 className="max-w-3xl font-heading text-5xl leading-tight sm:text-6xl lg:text-7xl">
            Understand your court date. In plain English.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-mist/90 sm:text-xl">
            Upload your court notice and we&apos;ll explain exactly what&apos;s happening, what to expect, and how to
            prepare for free.
          </p>

          <Link
            to="/upload"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-lg font-semibold transition hover:bg-sky-500"
          >
            Get Started
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>

        <section className="mt-auto grid gap-4 pb-8 pt-16 sm:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature}
              className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm"
              style={{ animationDelay: `${index * 110}ms` }}
            >
              <p className="text-base font-semibold leading-snug">{feature}</p>
            </article>
          ))}
        </section>

        <footer className="border-t border-white/20 pt-6 text-sm text-mist/80">
          Court Date Coach is not a law firm and does not provide legal advice. For legal representation, see
          resources below.
        </footer>
      </div>
    </main>
  );
}
