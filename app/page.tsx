import Navbar from '@/components/Navbar';
import HomeActions from '@/components/HomeActions';

const heroStats = [
  { value: '10 sec', label: 'urgent Telegram mode' },
  { value: '12h', label: 'AM/PM alert time' },
  { value: 'CSV', label: 'question import ready' },
  { value: '/today', label: 'bot command support' },
];

const workflow = [
  {
    step: '01',
    title: 'Connect LeetCode',
    text: 'Save your LeetCode username so the app can check recent accepted submissions.',
  },
  {
    step: '02',
    title: 'Set Reminder Time',
    text: 'Pick a 1-12 AM/PM alert time and choose how aggressive reminders should be.',
  },
  {
    step: '03',
    title: 'Plan DSA Work',
    text: 'Create daily or weekly plans from topics, CSV files, or your own question list.',
  },
  {
    step: '04',
    title: 'Get Telegram Alerts',
    text: 'If planned work is still pending, the bot keeps nudging you before the day ends.',
  },
];

const features = [
  {
    tag: 'TG',
    title: 'Telegram reminder engine',
    text: 'Every 1 min, 5 min, 15 min, or urgent 10 sec reminders for pending work.',
  },
  {
    tag: 'LC',
    title: 'Auto-detect solved plans',
    text: 'Match planned problem slugs with recent accepted LeetCode submissions.',
  },
  {
    tag: 'DSA',
    title: 'Question bank',
    text: 'Quickly build plans from Arrays, Strings, DP, Graphs, Trees, and Sliding Window.',
  },
  {
    tag: 'CSV',
    title: 'CSV and sheet import',
    text: 'Bring a DSA sheet into the app and turn rows into planned questions.',
  },
  {
    tag: 'REP',
    title: 'Weekly reports',
    text: 'See solved, pending, missed, and topic-wise progress for the week.',
  },
  {
    tag: 'BOT',
    title: 'Bot commands',
    text: 'Use /today, /plan, /done 1, and /pause without opening the dashboard.',
  },
];

const topics = ['Arrays', 'DP', 'Graphs', 'Trees', 'Strings', 'Sliding Window'];

const faq = [
  {
    question: 'Will it call my phone?',
    answer:
      'This version focuses on free Telegram messages. Phone calls need a paid provider such as Twilio or another telephony service.',
  },
  {
    question: 'Can it detect solved LeetCode questions automatically?',
    answer:
      'Yes. Planned questions can be matched against recent accepted submissions when the LeetCode slug is saved correctly.',
  },
  {
    question: 'Can I import my own DSA sheet?',
    answer:
      'Yes. The dashboard supports CSV import, and the landing page now makes that workflow visible.',
  },
];

const heatmapLevels = [
  'bg-lc-border/50',
  'bg-lc-green/25',
  'bg-lc-green/45',
  'bg-lc-orange/60',
  'bg-lc-red/70',
];

const heatmap = Array.from({ length: 84 }, (_, index) => {
  const pattern = [0, 1, 2, 3, 1, 0, 4, 2, 3, 1, 0, 2];
  return pattern[index % pattern.length];
});

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-16">
        <section className="relative overflow-hidden border-b border-lc-border/20">
          <div className="absolute inset-0 bg-grid" />
          <div className="absolute right-[-160px] top-24 hidden w-[760px] max-w-[60vw] opacity-95 lg:block">
            <DashboardPreview />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 py-14 md:py-20 lg:min-h-[680px]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-lc-orange/30 bg-lc-card/60 px-4 py-2 text-sm text-lc-orange mb-6">
                Free Telegram reminders for LeetCode streaks
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-5 leading-tight">
                <span className="text-white">Never Lose Your </span>
                <span className="text-lc-orange text-glow">LeetCode Streak</span>
                <span className="text-white"> Again</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-400 mb-7 max-w-xl">
                Connect your LeetCode account, set reminder times, plan daily
                DSA questions, and receive Telegram alerts before your streak
                breaks.
              </p>

              <div className="grid gap-3 sm:grid-cols-3 mb-8 max-w-2xl">
                {['Forgot one problem?', 'Missed your alert?', 'Lost a long streak?'].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-lc-border/40 bg-black/20 px-4 py-3 text-sm text-gray-300"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <HomeActions
                  signedInLabel="Open Dashboard"
                  signedOutLabel="Get Started"
                  loginLabel="Login"
                />
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-lg border border-lc-border px-5 py-3 font-bold text-gray-300 transition-colors hover:border-lc-orange/60 hover:text-lc-orange"
                >
                  View Features
                </a>
              </div>
            </div>

            <div className="mt-10 lg:hidden">
              <DashboardPreview />
            </div>

            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-lc-border/40 bg-lc-card/50 p-4"
                >
                  <p className="text-2xl font-black text-white">{item.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-lc-border/20 py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <SectionHeader
              eyebrow="Workflow"
              title="From setup to saved streak in four steps"
              text="A clear flow helps users understand why the app exists in the first few seconds."
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {workflow.map((item) => (
                <div key={item.step} className="glass-card rounded-lg p-5">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-lc-orange text-sm font-black text-black">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-black text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-500">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-lc-border/20 py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <SectionHeader
              eyebrow="Features"
              title="More than a reminder app"
              text="It now presents the pieces recruiters and real users expect to see: planning, detection, progress, and bot controls."
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="glass-card rounded-lg p-5">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-lc-orange/40 bg-lc-orange/10 text-sm font-black text-lc-orange">
                    {feature.tag}
                  </div>
                  <h3 className="text-lg font-black text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-gray-500">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-lc-border/20 py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="glass-card rounded-lg p-6">
                <p className="text-sm font-bold text-lc-orange">DSA planner</p>
                <h2 className="mt-3 text-3xl font-black text-white">
                  Build a daily plan from topics
                </h2>
                <p className="mt-4 text-gray-400">
                  Pick the topic, target count, and difficulty mix. The dashboard
                  can turn a bank of questions into daily work instead of making
                  you remember everything manually.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {topics.map((topic, index) => (
                    <div
                      key={topic}
                      className="rounded-lg border border-lc-border/40 bg-black/25 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-white">{topic}</p>
                        <span className="text-sm text-lc-orange">{index + 2} q</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-lc-border/40">
                        <div
                          className="h-full rounded-full bg-lc-orange"
                          style={{ width: `${45 + index * 7}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-lg p-6">
                <p className="text-sm font-bold text-lc-green">Weekly report</p>
                <h2 className="mt-3 text-3xl font-black text-white">
                  Make progress visible
                </h2>
                <p className="mt-4 text-gray-400">
                  Show solved, missed, weak topics, and average questions per day
                  so the project feels like a full productivity tool.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    ['Solved this week', '21', 'bg-lc-green'],
                    ['Medium problems', '8', 'bg-lc-orange'],
                    ['Hard problems', '3', 'bg-lc-red'],
                    ['Average per day', '3.0', 'bg-lc-border'],
                  ].map(([label, value, color]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg bg-black/25 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${color}`} />
                        <span className="text-gray-300">{label}</span>
                      </div>
                      <span className="text-xl font-black text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-lc-border/20 py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-lc-orange/30 bg-lc-card/50 px-4 py-2 text-sm text-lc-orange mb-6">
              Roadmap
            </div>
            <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white">
                  Features that can make it even stronger
                </h2>
                <p className="mt-4 text-gray-400">
                  These are the next high-impact upgrades for a resume or demo:
                  streak freeze, AI coaching, leaderboard, multiple reminder
                  times, and WhatsApp support.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  'Streak freeze: 3 emergency saves per month',
                  'AI coach: suggest problems from weak topics',
                  'Leaderboard: compare friends and streaks',
                  'Multiple reminders: 6 PM, 8 PM, 10 PM',
                ].map((item) => (
                  <div key={item} className="rounded-lg border border-lc-border/40 bg-lc-card/50 p-4 text-sm text-gray-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="border-b border-lc-border/20 py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4">
            <SectionHeader
              eyebrow="FAQ"
              title="Clear answers reduce doubt"
              text="This section helps users understand the project limits and what is already supported."
            />

            <div className="space-y-3">
              {faq.map((item) => (
                <div key={item.question} className="glass-card rounded-lg p-5">
                  <h3 className="font-black text-white">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="glass-card rounded-lg p-6 md:p-8">
              <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-sm font-bold text-lc-orange">Ready to protect the streak?</p>
                  <h2 className="mt-3 text-3xl font-black text-white">
                    Connect LeetCode, set your alert, and let Telegram do the nagging.
                  </h2>
                </div>
                <HomeActions
                  signedInLabel="Open Dashboard"
                  signedOutLabel="Start Protecting"
                  loginLabel="Login"
                />
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-lc-border/20 py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-black text-lc-orange">Streak Guardian</p>
                <p className="mt-1 text-sm text-gray-600">
                  Not affiliated with LeetCode. Built for DSA consistency.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {[
                  ['About', '#features'],
                  ['Features', '#features'],
                  ['Privacy', '#faq'],
                  ['Terms', '#faq'],
                  ['Contact', '#faq'],
                  ['GitHub', '#features'],
                ].map(([label, href]) => (
                  <a key={label} href={href} className="hover:text-lc-orange">
                    {label}
                  </a>
                ))}
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-700">
              LeetCode Streak Guardian &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}

function SectionHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="text-sm font-bold text-lc-orange">{eyebrow}</p>
      <h2 className="mt-3 text-3xl md:text-4xl font-black text-white">{title}</h2>
      <p className="mt-4 text-gray-400">{text}</p>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="neon-border rounded-lg bg-lc-card/90 p-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-lc-border/40 pb-4">
        <div>
          <p className="text-sm text-gray-500">Dashboard</p>
          <p className="text-xl font-black text-white">Today at 10:40 AM</p>
        </div>
        <span className="rounded-full border border-lc-green/30 bg-lc-green/10 px-3 py-1 text-sm text-lc-green">
          Telegram connected
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          ['Streak', '16'],
          ['Solved', '324'],
          ['Pending', '2'],
          ['Urgent', '10 sec'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-black/30 p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-black/25 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-bold text-white">Daily plan</p>
          <span className="text-sm text-lc-orange">2 / 4 done</span>
        </div>
        {[
          ['Two Sum', 'done'],
          ['Valid Parentheses', 'done'],
          ['Graph Valid Tree', 'pending'],
          ['Coin Change', 'pending'],
        ].map(([title, status]) => (
          <div key={title} className="flex items-center justify-between border-t border-lc-border/30 py-3 first:border-t-0">
            <span className="text-sm text-gray-300">{title}</span>
            <span className={status === 'done' ? 'text-sm text-lc-green' : 'text-sm text-lc-orange'}>
              {status}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Heatmap compact />
      </div>
    </div>
  );
}

function Heatmap({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`grid grid-cols-12 gap-1 ${compact ? 'max-w-md' : ''}`}>
      {heatmap.map((level, index) => (
        <span
          key={`${level}-${index}`}
          className={`aspect-square rounded-[3px] ${heatmapLevels[level]}`}
        />
      ))}
    </div>
  );
}
