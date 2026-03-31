import { Link, useNavigate } from 'react-router-dom';
import { useCourtCoach } from '../context/CourtCoachContext';
import {
  fallbackChecklist,
  fallbackDontSay,
  fallbackRights,
  fallbackSayThis,
  hearingLabelMap,
  legalResources,
} from '../lib/defaults';

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
      <h2 className="font-heading text-3xl text-navy">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function glanceRows(extracted = {}) {
  const missing = 'Not listed in your notice - check with the clerk.';
  const charges = extracted.charges?.length ? extracted.charges.join(', ') : missing;

  return [
    {
      label: 'Court Date',
      value: extracted.court_date
        ? `${extracted.court_date}${extracted.court_time ? ` at ${extracted.court_time}` : ''}`
        : missing,
    },
    { label: 'Courtroom', value: extracted.courtroom_address || missing },
    { label: 'Judge', value: extracted.judge_name || missing },
    { label: 'Your Charge(s)', value: charges },
    { label: 'Case Number', value: extracted.case_number || missing, mono: true },
    {
      label: 'Hearing Type',
      value: hearingLabelMap[extracted.hearing_type] || hearingLabelMap.unknown,
    },
  ];
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { state, startOver } = useCourtCoach();
  const { analysis, error } = state;

  const extracted = analysis?.extracted || {};
  const chargeExplanations = analysis?.charge_explanations || [];
  const whatWillHappen = analysis?.what_will_happen || [];
  const whatToBring = analysis?.what_to_bring?.length ? analysis.what_to_bring : fallbackChecklist;
  const sayThis = analysis?.say_this?.length ? analysis.say_this : fallbackSayThis;
  const dontSayThis = analysis?.dont_say_this?.length ? analysis.dont_say_this : fallbackDontSay;
  const rights = analysis?.key_rights?.length ? analysis.key_rights : fallbackRights;

  if (!analysis && !error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
        <h1 className="font-heading text-4xl text-navy">No analysis available yet</h1>
        <p className="mt-3 max-w-lg text-slate-600">Upload a court notice first so we can build your summary.</p>
        <Link to="/upload" className="mt-6 rounded-xl bg-primary px-5 py-3 font-semibold text-white">
          Go to Upload
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-mist via-white to-white pb-32">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-7 rounded-2xl border border-success/30 bg-emerald-50 p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-success">Your court notice has been analyzed</p>
          <h1 className="mt-2 font-heading text-4xl text-navy">Plain-English courtroom prep</h1>
          <p className="mt-3 text-base text-slate-700">Everything below is written in plain English. Scroll through each section.</p>
          {analysis?.tone_note ? (
            <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">{analysis.tone_note}</p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-lg border border-warning/40 bg-amber-50 px-3 py-2 text-sm text-warning">{error}</p>
          ) : null}
        </header>

        <div className="grid gap-5 sm:gap-6">
          <Section title="Your Case at a Glance">
            <dl className="space-y-3">
              {glanceRows(extracted).map((row) => (
                <div key={row.label} className="rounded-xl border border-slate-200 p-3 sm:flex sm:items-baseline sm:gap-3">
                  <dt className="w-40 shrink-0 text-sm font-semibold uppercase tracking-wide text-slate-600">{row.label}</dt>
                  <dd className={`mt-1 text-base text-ink sm:mt-0 ${row.mono ? 'font-mono text-sm sm:text-base' : ''}`}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="What This Charge Means">
            {chargeExplanations.length ? (
              <div className="space-y-4">
                {chargeExplanations.map((item, index) => (
                  <article key={`${item.charge}-${index}`} className="rounded-xl border border-slate-200 p-4">
                    <h3 className="font-serif text-2xl font-semibold text-ink">{item.charge}</h3>
                    <p className="mt-2 text-base text-slate-700">{item.plain_english}</p>
                    <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{item.max_penalty}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-slate-700">No charge details were found in your notice.</p>
            )}
            <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              This does NOT mean you will be convicted. It means you have been accused and have the right to tell your
              side.
            </p>
          </Section>

          <Section title="What Will Happen in the Courtroom">
            {whatWillHappen.length ? (
              <ol className="list-decimal space-y-2 pl-5 text-base text-slate-700">
                {whatWillHappen.map((step, index) => (
                  <li key={`${step}-${index}`}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="text-slate-700">We could not confidently detect the hearing flow from this notice.</p>
            )}
          </Section>

          <Section title="What to Bring">
            <ul className="space-y-2">
              {whatToBring.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                  <span className="mt-0.5 h-5 w-5 rounded border border-slate-500" aria-hidden="true" />
                  <span className="text-base text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="What to Say (and Not Say)">
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-success/30 bg-emerald-50 p-4">
                <h3 className="font-serif text-2xl font-semibold text-success">Say This</h3>
                <ul className="mt-3 space-y-2 text-base text-emerald-900">
                  {sayThis.map((line, index) => (
                    <li key={`${line}-${index}`}>{line}</li>
                  ))}
                </ul>
              </article>
              <article className="rounded-xl border border-warning/30 bg-amber-50 p-4">
                <h3 className="font-serif text-2xl font-semibold text-warning">Don&apos;t Say This</h3>
                <ul className="mt-3 space-y-2 text-base text-amber-900">
                  {dontSayThis.map((line, index) => (
                    <li key={`${line}-${index}`}>{line}</li>
                  ))}
                </ul>
              </article>
            </div>
          </Section>

          <Section title="Your Rights">
            <ul className="list-disc space-y-2 pl-5 text-base text-slate-700">
              {rights.map((right, index) => (
                <li key={`${right}-${index}`}>{right}</li>
              ))}
            </ul>
          </Section>

          <Section title="Free Legal Help in Philadelphia">
            <div className="grid gap-4 sm:grid-cols-2">
              {legalResources.map((resource) => (
                <article key={resource.name} className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-serif text-xl font-semibold text-ink">{resource.name}</h3>
                  <p className="mt-2 text-sm text-slate-700">{resource.description}</p>
                  <a
                    className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline"
                    href={resource.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {resource.website.replace('https://', '')}
                  </a>
                  {resource.phone ? <p className="mt-2 text-sm text-slate-600">{resource.phone}</p> : null}
                </article>
              ))}
            </div>
          </Section>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm text-slate-700">
          Court Date Coach explains court notices in plain language. It is not a law firm and does not provide legal
          advice. Nothing on this page is a substitute for speaking with a licensed attorney. If you are facing
          criminal charges, you have the right to free legal representation - ask the court for a public defender.
        </section>

        <button
          type="button"
          onClick={() => console.log('[Court Date Coach] Extraction flagged by user', analysis)}
          className="no-print mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          This isn&apos;t right
        </button>
      </div>

      <footer className="no-print fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Print This Summary
          </button>
          <button
            type="button"
            onClick={() => {
              startOver();
              navigate('/upload');
            }}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-sky-600"
          >
            Start Over
          </button>
        </div>
      </footer>
    </main>
  );
}
