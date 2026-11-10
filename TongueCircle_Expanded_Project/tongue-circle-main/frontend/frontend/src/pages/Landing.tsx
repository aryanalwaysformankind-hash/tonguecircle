import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Globe2, Languages, MessageCircle, Users, Video, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Flag from "@/components/flags/Flag";

const communityPhotos = [
  {
    src: "https://images.unsplash.com/photo-1547699326-3d895d9acd30?auto=format&fit=crop&w=720&q=85",
    alt: "Smiling Italian man in front of the Colosseum in Rome",
    flag: "it",
    greeting: "Ciao!",
    position: "object-center",
  },
  {
    src: "https://images.unsplash.com/photo-1624233599786-ee6045a0e703?auto=format&fit=crop&w=560&q=85",
    alt: "Smiling German woman in a knit cap",
    flag: "de",
    greeting: "Hallo!",
    position: "object-center",
  },
  {
    src: "https://images.unsplash.com/photo-1740029144380-2180cc1c4cc9?auto=format&fit=crop&crop=faces&w=1100&h=420&q=85",
    alt: "Smiling Japanese woman sitting in a bright cafe",
    flag: "jp",
    greeting: "Konnichiwa!",
    position: "object-center",
  },
];

function GreetingTag({ flag, greeting, testId }: { flag: string; greeting: string; testId: string }) {
  return (
    <span
      data-testid={testId}
      className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 py-1 pl-1 pr-2.5 text-xs font-bold text-stone-800 shadow-sm backdrop-blur"
    >
      <Flag code={flag} label="" size="xs" className="size-4! rounded-full!" />
      {greeting}
    </span>
  );
}

export default function Landing() {
  return (
    <main className="min-h-svh overflow-hidden bg-[#FAF8F5] text-[#1E1F24]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5" data-testid="landing-brand-link">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[#D9532F] text-white">
            <Globe2 className="size-5" aria-hidden="true" />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight">Tongue Circle</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/plans" className="hidden text-sm font-semibold text-stone-600 transition hover:text-[#D9532F] sm:block">Plans</Link>
          <Link to="/sign-in" data-testid="landing-sign-in-link">
            <Button variant="outline" className="rounded-full border-stone-300 bg-white px-5">Sign in</Button>
          </Link>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-16 pt-8 sm:px-8 sm:pb-24 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:pt-12">
        <div className="animate-rise max-w-2xl">
          <p
            data-testid="landing-eyebrow"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E8E4DF] bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2A5B52] shadow-sm"
          >
            <Languages className="size-4" aria-hidden="true" />
            Language exchange, made human
          </p>
          <h1
            data-testid="landing-headline"
            className="font-heading text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Your next conversation could open up the world.
          </h1>
          <p data-testid="landing-description" className="mt-6 max-w-xl text-lg leading-8 text-[#525760]">
            Meet people who speak the language you’re learning. Share a little of your world, and
            find a new voice to practice with.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link to="/sign-up" data-testid="landing-google-signin-link">
              <Button className="h-12 rounded-full bg-[#D9532F] px-6 text-base font-semibold text-white hover:bg-[#BD421F]">
                Create your free account
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/plans" className="text-sm font-bold text-[#2A5B52] transition hover:text-[#D9532F]">Explore plans</Link>
            <span data-testid="landing-free-translation-note" className="text-sm text-stone-500">
              Free to join · Translate while you chat
            </span>
          </div>
          <div className="mt-12 flex items-center gap-4 border-t border-stone-200 pt-6">
            <span className="flex size-11 items-center justify-center rounded-full bg-[#E0F2FE] text-[#0369A1]">
              <MessageCircle className="size-5" aria-hidden="true" />
            </span>
            <p data-testid="landing-community-note" className="max-w-sm text-sm leading-6 text-stone-600">
              A thoughtful community for learners, not another language app to swipe through.
            </p>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-xl lg:ml-auto lg:mr-0">
          <div className="absolute -right-6 -top-7 h-36 w-36 rounded-full bg-[#E6C8B6]/60 blur-3xl" />
          <div className="absolute -bottom-8 -left-7 h-40 w-40 rounded-full bg-[#B9D6C7]/50 blur-3xl" />
          <div className="relative grid grid-cols-[1.12fr_0.88fr] grid-rows-[180px_140px_120px] gap-3 sm:grid-rows-[230px_170px_145px]">
            <figure className="relative row-span-2 overflow-hidden rounded-[2rem] border-4 border-white shadow-[0_24px_70px_rgba(73,57,45,0.18)]">
              <img
                src={communityPhotos[0].src}
                alt={communityPhotos[0].alt}
                className={`h-full w-full object-cover ${communityPhotos[0].position}`}
                data-testid="landing-community-photo-one"
              />
              <GreetingTag flag={communityPhotos[0].flag} greeting={communityPhotos[0].greeting} testId="landing-greeting-italian" />
            </figure>
            <figure className="relative overflow-hidden rounded-[1.6rem] border-4 border-white shadow-xl">
              <img
                src={communityPhotos[1].src}
                alt={communityPhotos[1].alt}
                className={`h-full w-full object-cover ${communityPhotos[1].position}`}
                data-testid="landing-community-photo-two"
              />
              <GreetingTag flag={communityPhotos[1].flag} greeting={communityPhotos[1].greeting} testId="landing-greeting-german" />
            </figure>
            <div className="flex flex-col justify-center rounded-[1.6rem] bg-[#2A5B52] p-5 text-white shadow-xl">
              <p data-testid="landing-community-card-label" className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                Find your people
              </p>
              <p data-testid="landing-community-card-copy" className="mt-2 font-heading text-xl font-bold leading-tight">
                One good conversation at a time.
              </p>
            </div>
            <figure className="relative col-span-2 overflow-hidden rounded-[1.8rem] border-4 border-white shadow-xl">
              <img
                src={communityPhotos[2].src}
                alt={communityPhotos[2].alt}
                className={`h-full w-full object-cover ${communityPhotos[2].position}`}
                data-testid="landing-community-photo-three"
              />
              <GreetingTag flag={communityPhotos[2].flag} greeting={communityPhotos[2].greeting} testId="landing-greeting-japanese" />
            </figure>
          </div>
          <div className="absolute -left-3 top-[40%] flex items-center gap-3 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-xl backdrop-blur sm:-left-12">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#F4EBE2] text-[#B84728]">
              <Languages className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p data-testid="landing-translation-card-title" className="text-sm font-bold">Meaning, not just words</p>
              <p data-testid="landing-translation-card-copy" className="text-xs text-stone-500">Translate messages instantly</p>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-stone-200/80 bg-white/70 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A5B52]">A better way to practice</p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Real people. Real language. Real progress.</h2>
            <p className="mt-4 text-base leading-7 text-stone-600">Language is more than memorizing words. Build confidence by connecting with people and learning through everyday conversations.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#E8F0EC] text-[#2A5B52]"><Users className="size-5" /></span><h3 className="mt-5 font-heading text-lg font-bold">Find your people</h3><p className="mt-2 text-sm leading-6 text-stone-600">Discover language partners by the languages they speak, the ones they are learning and shared interests.</p></article>
            <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#F8EDE7] text-[#B84728]"><MessageCircle className="size-5" /></span><h3 className="mt-5 font-heading text-lg font-bold">Learn in conversation</h3><p className="mt-2 text-sm leading-6 text-stone-600">Chat with people around the world and use built-in translation to help bridge language gaps.</p></article>
            <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#E8F0EC] text-[#2A5B52]"><Video className="size-5" /></span><h3 className="mt-5 font-heading text-lg font-bold">Talk face to face</h3><p className="mt-2 text-sm leading-6 text-stone-600">Start one-to-one voice or video calls with your language partners, right from a conversation.</p></article>
            <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#F8EDE7] text-[#B84728]"><Mic className="size-5" /></span><h3 className="mt-5 font-heading text-lg font-bold">Send your voice</h3><p className="mt-2 text-sm leading-6 text-stone-600">Share short voice notes to practice natural pronunciation and keep the conversation flowing.</p></article>
            <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#F8EDE7] text-[#B84728]"><Sparkles className="size-5" /></span><h3 className="mt-5 font-heading text-lg font-bold">A growing language world</h3><p className="mt-2 text-sm leading-6 text-stone-600">Explore an expanded catalogue of languages and native writing systems from around the world.</p></article>
            <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#F4EFE4] text-[#8B6A2B]"><BookOpen className="size-5" /></span><h3 className="mt-5 font-heading text-lg font-bold">Keep useful phrases</h3><p className="mt-2 text-sm leading-6 text-stone-600">Save phrases you want to remember and revisit them as your confidence grows.</p></article>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-[2rem] bg-[#21483F] px-6 py-8 text-center text-white sm:flex-row sm:px-10 sm:text-left">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">Your next conversation starts here</p><h2 className="mt-2 font-heading text-2xl font-bold">Join the circle. It's free to start.</h2></div>
            <Link to="/sign-up"><Button className="h-12 rounded-full bg-white px-6 font-bold text-[#21483F] hover:bg-white/90">Get started <ArrowRight className="ml-2 size-4" /></Button></Link>
          </div>
        </div>
      </section>
      <footer className="flex flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-stone-500 sm:flex-row sm:px-8">
        <p data-testid="landing-footer-copy">Tongue Circle — connect across borders, one conversation at a time.</p>
        <div className="flex items-center gap-5"><Link to="/plans" className="font-semibold hover:text-[#2A5B52]">Plans</Link><Link to="/sign-in" className="font-semibold hover:text-[#2A5B52]">Sign in</Link></div>
      </footer>
    </main>
  );
}
