import React from 'react';

const driverQuotes = [
  {
    quote: 'Hard work. It always does eventually pay off.',
    driver: 'Lewis Hamilton',
    detail: 'On persistence after a long winless spell · 2024',
  },
  {
    quote: 'I never really give up.',
    driver: 'Charles Leclerc',
    detail: 'After fighting into Q3 in Brazil · 2018',
  },
  {
    quote: 'Always I believe it’s possible.',
    driver: 'Fernando Alonso',
    detail: 'On believing another title was possible · 2023',
  },
  {
    quote: 'Dreams do come true.',
    driver: 'Lando Norris',
    detail: 'After his home win at Silverstone · 2025',
  },
  {
    quote: 'Keep in that positive place.',
    driver: 'George Russell',
    detail: 'On maintaining wellbeing · 2023',
  },
  {
    quote: 'When I get it, I’ll be there.',
    driver: 'Carlos Sainz',
    detail: 'On putting in the work to adapt · 2025',
  },
  {
    quote: 'We want to win!',
    driver: 'Max Verstappen',
    detail: 'Looking ahead after securing his third title · 2023',
  },
  {
    quote: 'I believe in things.',
    driver: 'Lewis Hamilton',
    detail: 'On dreams and ambition · 2020',
  },
  {
    quote: 'If you no longer go for a gap which exists you are no longer a racing driver.',
    driver: 'Ayrton Senna',
    detail: 'On his racing instinct · 1990',
  },
  {
    quote: 'I do this sport because I love this sport.',
    driver: 'Michael Schumacher',
    detail: 'On what keeps him racing · 2001',
  },
  {
    quote: 'James Hunt would not push you off the road. We trusted each other.',
    driver: 'Niki Lauda',
    detail: 'Remembering the respect between rivals · 2016',
  },
  {
    quote: "I couldn't wait to get well again so that I could race.",
    driver: 'Juan Manuel Fangio',
    detail: 'On returning after his 1952 Monza crash',
  },
  {
    quote: 'I wanted to be a racing driver - almost from nappy times!',
    driver: 'Juan Manuel Fangio',
    detail: 'On his lifelong ambition · 1979',
  },
];

interface QuoteRowProps {
  quotes: typeof driverQuotes;
  direction: 'left' | 'right';
  label: string;
}

const QuoteRow: React.FC<QuoteRowProps> = ({ quotes, direction, label }) => (
  <div className="quote-marquee" aria-label={label}>
    <div className={`quote-marquee-track quote-marquee-${direction}`}>
      {[false, true].map((isDuplicate) => (
        <div
          key={String(isDuplicate)}
          className="flex shrink-0 gap-4 pr-4"
          aria-hidden={isDuplicate}
        >
          {quotes.map((item, index) => (
            <article
              key={`${item.driver}-${index}`}
              className="quote-card flex w-[min(82vw,320px)] shrink-0 flex-col justify-between rounded-xl border border-white/8 bg-[#15151c]/60 p-5 sm:w-[320px]"
            >
              <div>
                <span aria-hidden="true" className="font-racing text-3xl leading-none text-red-500/80">
                  “
                </span>
                <p className="font-racing text-base font-semibold leading-snug text-neutral-100/85">
                  {item.quote}
                </p>
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <p className="font-racing text-sm font-bold uppercase tracking-wider text-white/85">
                    {item.driver}
                  </p>
                  <p className="mt-1 text-[10px] leading-snug text-neutral-500">{item.detail}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const DriverQuotes: React.FC = () => (
  <section className="driver-quotes relative isolate mt-12 overflow-hidden border-y border-white/10 py-8 sm:py-10">
    <div className="relative z-10 mx-auto mb-6 max-w-7xl px-4 sm:px-6">
      <p className="font-racing text-[10px] font-bold uppercase tracking-[0.3em] text-red-400">
        From the drivers
      </p>
      <h2 className="mt-1 font-racing text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
        Words from the grid
      </h2>
      <p className="mt-1 text-xs text-neutral-400">
        Grit, belief, and race-day ambition from F1 drivers past and present.
      </p>
    </div>
    <div className="relative z-10 space-y-4">
      <QuoteRow quotes={driverQuotes} direction="left" label="Driver quotes moving right to left" />
      <QuoteRow
        quotes={[...driverQuotes].reverse()}
        direction="right"
        label="Driver quotes moving left to right"
      />
    </div>
  </section>
);
