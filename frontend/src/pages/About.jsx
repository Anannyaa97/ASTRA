import { Link } from 'react-router-dom'
import { ExternalLink, Github, Rocket, Users } from 'lucide-react'

const TEAM_URL = 'https://www.spaceappschallenge.org/2026/find-a-team/orbitelle/'
const GITHUB_URL = 'https://github.com/Anannyaa97'
const YEAR = 2026

const MIT = `MIT License

Copyright (c) ${YEAR} Anannya A K

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`

const link = 'inline-flex items-center gap-1.5 font-semibold text-electric underline underline-offset-4 hover:text-ink'

export default function About() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold md:text-3xl">About ASTRA</h1>
        <p className="text-sm text-ink-dim">Junior Astronaut Mission Trainer. Your mission. Your decisions. Their survival.</p>
      </header>

      <section aria-label="What ASTRA is" className="panel space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-xl font-extrabold"><Rocket size={20} aria-hidden="true" /> What is ASTRA?</h2>
        <p className="text-ink-dim">
          ASTRA is a lunar outpost simulator for children aged 7 to 12. You command a small crew near the Moon&apos;s
          South Pole and learn why space engineers must balance power, air, water, food and protection. Every choice
          has a cost, and there is no single perfect answer.
        </p>
        <p className="text-ink-dim">
          It was made for the NASA Space Apps Challenge, &quot;Build a Junior Astronaut Mission Trainer&quot;.
        </p>
      </section>

      <section aria-label="Who made it" className="panel space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-xl font-extrabold"><Users size={20} aria-hidden="true" /> Made by</h2>
        <p><strong>Anannya A K</strong>, designer and developer</p>
        <ul className="space-y-2">
          <li>
            Team <strong>Orbitelle</strong>{' '}
            <a className={link} href={TEAM_URL} target="_blank" rel="noopener noreferrer">
              Space Apps team page <ExternalLink size={14} aria-hidden="true" />
            </a>
          </li>
          <li>
            <a className={link} href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Github size={16} aria-hidden="true" /> Anannyaa97 on GitHub <ExternalLink size={14} aria-hidden="true" />
            </a>
          </li>
        </ul>
      </section>

      <section aria-label="Honest labels" className="panel space-y-2 p-5">
        <h2 className="text-xl font-extrabold">What is real and what is a game</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-ink-dim">
          <li>The outpost, the crew, the dials and every number in the game are <strong>simulated game units</strong>. They are not NASA measurements.</li>
          <li>The radiation number is a simulated risk, <strong>not</strong> a real dose for astronauts.</li>
          <li>Space weather, research studies and images in the NASA Reality Hub come from public NASA sources. Each card says whether it is <strong>Live</strong>, <strong>Cached</strong>, <strong>Archived</strong> or <strong>Simulated</strong>, and links to its source.</li>
          <li>ASTRA is an independent student project. It is <strong>not made, endorsed or approved by NASA</strong>.</li>
        </ul>
      </section>

      <section aria-label="Credits" className="panel space-y-2 p-5">
        <h2 className="text-xl font-extrabold">Credits</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-ink-dim">
          <li>Space weather data: NASA DONKI (CCMC). Space biology: NASA Open Science Data Repository (OSDR). The NASA Image and Video Library is linked from the NASA Reality Hub. The pictures inside the game (the Moon base, crew and scenery) are original artwork drawn for ASTRA.</li>
          <li>Full list of data sources and why each was chosen: <Link className="font-semibold text-electric underline underline-offset-4" to="/data">How ASTRA uses NASA data</Link>.</li>
          <li>Radiation measurements on the International Space Station: NASA OSDR RadLab. Food in space reading: Canadian Space Agency, &quot;Food production on the Moon and in remote areas&quot; toolkit.</li>
          <li>Fonts: Unbounded and Atkinson Hyperlegible, both under the SIL Open Font License.</li>
          <li>Built with React, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide icons, FastAPI and SQLite.</li>
        </ul>
      </section>

      <section aria-label="NASA notice" className="panel space-y-2 p-5">
        <h2 className="text-xl font-extrabold">NASA notice</h2>
        <p className="text-sm text-ink-dim">
          NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on
          non-U.S. Government websites. ASTRA follows the data use rules of each source it links to.
        </p>
      </section>

      <section aria-label="License" className="panel space-y-3 p-5">
        <h2 className="text-xl font-extrabold">License</h2>
        <p className="text-sm text-ink-dim">ASTRA&apos;s source code is open under the MIT License.</p>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-4 text-xs leading-relaxed text-ink-dim">{MIT}</pre>
      </section>

      <p className="pb-4 text-center text-sm text-ink-dim">
        &copy; {YEAR} Anannya A K &middot; Team Orbitelle &middot; MIT License
      </p>
    </div>
  )
}
