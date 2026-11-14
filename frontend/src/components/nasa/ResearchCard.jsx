import { useRef } from 'react'
import { ExternalLink, X } from 'lucide-react'

// One space-biology card. Every card is the same shape so a row lines up perfectly.
// The extra details open in a pop-up (a native dialog), so opening one never moves anything else.
export default function ResearchCard({ card }) {
  const dialog = useRef(null)
  const titleId = `${card.id}-title`

  return (
    <li className="panel flex flex-col gap-4 p-5">
      <div className="space-y-1">
        <p className="text-xs font-bold uppercase tracking-wide text-ok">{card.topic}</p>
        <h3 className="text-lg font-extrabold leading-snug">{card.shortTitle ?? card.title}</h3>
      </div>

      <div>
        <p className="mb-1 text-sm font-bold text-ink-dim">What they found</p>
        <p className="leading-relaxed">{card.observed}</p>
      </div>

      <div className="mt-auto space-y-3">
        <button type="button" className="btn btn-ghost w-full justify-between" onClick={() => dialog.current?.showModal()}>
          More: what they studied and why it matters
        </button>
        <a href={card.link} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-semibold text-electric underline underline-offset-4">
          {card.linkLabel} <ExternalLink size={14} aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClick={(e) => { if (e.target === dialog.current) dialog.current.close() }}   // click the dark area to close
        className="panel m-auto w-[min(92vw,34rem)] p-0 text-ink backdrop:bg-black/70"
      >
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <h4 id={titleId} className="text-lg font-extrabold leading-snug">{card.shortTitle ?? card.title}</h4>
            <button type="button" className="btn btn-ghost shrink-0 !px-2" aria-label="Close" onClick={() => dialog.current?.close()}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <dl className="space-y-3 leading-relaxed">
            <div><dt className="font-bold">What scientists studied</dt><dd>{card.studied}</dd></div>
            <div><dt className="font-bold">Why it matters</dt><dd>{card.matters}</dd></div>
            <div className="text-sm text-ink-dim">
              <dt className="font-bold">Official name</dt>
              <dd>{card.title} ({card.kind})</dd>
            </div>
          </dl>
        </div>
      </dialog>
    </li>
  )
}
