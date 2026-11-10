import { Link } from "react-router-dom";
import { ArrowRight, Check, Crown, Globe2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const freeFeatures = [
  "Create your language profile",
  "Discover and connect with language partners",
  "Chat with community members",
  "One-to-one voice and video calls",
  "Send and receive voice messages",
  "Save useful phrases",
  "Translate messages and profile descriptions",
];

const premiumRoadmap = [
  "AI conversation coach with personalised corrections",
  "Advanced speaking and pronunciation feedback",
  "Detailed learning insights and progress reports",
  "Smart partner matching and advanced discovery",
  "Expanded practice paths and vocabulary review",
];

export default function Plans() {
  return (
    <main className="min-h-svh bg-[#FAF8F5] px-5 py-8 text-[#1E1F24] sm:px-8 sm:py-12">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Tongue Circle home">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[#2A5B52] text-white"><Globe2 className="size-5" /></span>
          <span className="font-heading text-lg font-extrabold tracking-tight">tongue<span className="text-[#D9532F]">circle</span></span>
        </Link>
        <Link to="/sign-in" className="text-sm font-semibold text-stone-600 transition hover:text-[#D9532F]">Sign in</Link>
      </header>

      <section className="mx-auto max-w-3xl pb-10 pt-16 text-center sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#DDE8E2] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2A5B52]"><Sparkles className="size-4" /> Simple plans, real connections</span>
        <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight sm:text-6xl">Start free. Grow with every conversation.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">Meet people, practice languages and build meaningful connections. Meet language partners, message, exchange voice notes and call face to face. Optional advanced learning tools are planned for Premium.</p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 pb-16 md:grid-cols-2">
        <article className="flex flex-col rounded-[2rem] border border-stone-200 bg-white p-7 shadow-[0_18px_55px_rgba(73,57,45,0.06)] sm:p-9">
          <div className="flex items-center justify-between"><h2 className="font-heading text-2xl font-bold">Free</h2><span className="rounded-full bg-[#E8F0EC] px-3 py-1 text-xs font-bold text-[#2A5B52]">Available now</span></div>
          <p className="mt-3 text-sm leading-6 text-stone-600">Everything you need to start finding language partners.</p>
          <p className="mt-7 font-heading text-5xl font-extrabold">$0<span className="ml-2 text-sm font-medium text-stone-500">forever</span></p>
          <ul className="mt-8 flex-1 space-y-4">{freeFeatures.map((feature) => <li key={feature} className="flex gap-3 text-sm text-stone-700"><Check className="mt-0.5 size-4 shrink-0 text-[#2A5B52]" />{feature}</li>)}</ul>
          <Link to="/sign-up" className="mt-9"><Button className="h-12 w-full rounded-full bg-[#2A5B52] text-white hover:bg-[#21483f]">Create a free account <ArrowRight className="ml-2 size-4" /></Button></Link>
        </article>

        <article className="relative flex flex-col overflow-hidden rounded-[2rem] border border-[#2A5B52]/20 bg-[#21483F] p-7 text-white shadow-[0_24px_65px_rgba(33,72,63,0.18)] sm:p-9">
          <div className="absolute -right-20 -top-24 size-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-center justify-between"><h2 className="font-heading text-2xl font-bold">Premium</h2><span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white">Coming soon</span></div>
          <p className="relative mt-3 text-sm leading-6 text-white/75">A deeper, more guided way to make progress with languages.</p>
          <p className="relative mt-7 font-heading text-4xl font-extrabold">In development</p>
          <ul className="relative mt-8 flex-1 space-y-4">{premiumRoadmap.map((feature) => <li key={feature} className="flex gap-3 text-sm text-white/85"><Crown className="mt-0.5 size-4 shrink-0 text-[#E8C98D]" />{feature}</li>)}</ul>
          <Link to="/sign-up" className="relative mt-9"><Button variant="outline" className="h-12 w-full rounded-full border-white/40 bg-white text-[#21483F] hover:bg-white/90">Join Tongue Circle for free <ArrowRight className="ml-2 size-4" /></Button></Link>
          <p className="relative mt-3 text-center text-xs text-white/55">No payment required. Premium checkout is not available yet.</p>
        </article>
      </section>

      <section className="mx-auto max-w-3xl border-t border-stone-200 py-10 text-center">
        <h2 className="font-heading text-2xl font-bold">Good conversations should be accessible.</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">You can use Tongue Circle's core community features for free. We'll share clear pricing and feature details before any paid plan launches.</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#2A5B52] hover:text-[#D9532F]">Back to Tongue Circle <ArrowRight className="size-4" /></Link>
      </section>
      <footer className="mx-auto max-w-6xl border-t border-stone-200 py-6 text-center text-xs text-stone-500">© {new Date().getFullYear()} Tongue Circle. Built for curious people everywhere.</footer>
    </main>
  );
}
