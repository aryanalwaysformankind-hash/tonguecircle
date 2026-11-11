import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import {
  ArrowRight,
  Globe2,
  Languages,
  MessageCircle,
  Search,
  Sparkles,
  MapPin,
  UserRound,
  Users,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiGet, apiPostStream } from "@/lib/api";
import FlagPicker from "@/components/flags/FlagPicker";
import {
  KnownLanguageChips,
  LanguageChip,
  LocationLine,
} from "@/components/flags/LanguageChips";
import TranslateTargetPicker from "@/components/flags/TranslateTargetPicker";
import PhotoLightbox from "@/components/profile/PhotoLightbox";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
import type { DiscoverProfile, Profile } from "@/lib/types";

export default function Home() {
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [learningLanguage, setLearningLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [translatedBios, setTranslatedBios] = useState<Record<string, string>>({});
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [lightboxProfile, setLightboxProfile] = useState<DiscoverProfile | null>(null);

  const myProfileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => apiGet<Profile | null>("/profile/me", await getToken()),
  });

  const profilesQuery = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => apiGet<DiscoverProfile[]>("/profiles", await getToken()),
  });

  const translation = useMutation({
    mutationFn: async ({
      profileId,
      bio,
    }: {
      profileId: string;
      bio: string;
    }) => {
      let result = "";
      await apiPostStream(
        "/translate",
        { text: bio, target_language: targetLanguage },
        await getToken(),
        (chunk) => {
          result += chunk;
          setTranslatedBios((current) => ({
            ...current,
            [profileId]: result,
          }));
        },
      );
      return profileId;
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Translation is unavailable right now",
      );
    },
  });

  const profiles = (profilesQuery.data ?? []).filter((profile) => {
    const needle = search.trim().toLowerCase();

    const matchesSearch =
      !needle ||
      profile.display_name.toLowerCase().includes(needle) ||
      profile.city.toLowerCase().includes(needle) ||
      profile.country.toLowerCase().includes(needle) ||
      profile.learning_languages.some((language) =>
        language.toLowerCase().includes(needle),
      );

    const matchesLanguage =
      !learningLanguage ||
      profile.learning_languages.some(
        (language) => language === learningLanguage,
      );

    return matchesSearch && matchesLanguage;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-9 pb-8">

      {/* Welcome section */}
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#193F39] px-6 py-9 text-white shadow-xl sm:px-10 sm:py-12">
        <div className="absolute -right-20 -top-24 -z-10 size-80 rounded-full bg-[#D9532F]/30 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 -z-10 size-72 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50">
              <Sparkles className="size-3.5" />
              YOUR GLOBAL LANGUAGE COMMUNITY
            </div>

            <h1 className="mt-6 max-w-2xl font-heading text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              A new language.
              <br />
              A new friend.
              <br />
              <span className="text-[#F2A17F]">A bigger world.</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
              Practice with real people, exchange cultures and build
              friendships across borders. Your next conversation starts here.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#discover-learners"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#E65C38] px-6 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#F06A45]"
              >
                Discover learners
                <ArrowRight className="size-4" />
              </a>

              <Link
                to="/community"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <Users className="size-4" />
                Explore community
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative mx-auto flex aspect-square max-w-[290px] items-center justify-center rounded-full border border-white/15 bg-white/[0.06]">
              <div className="absolute inset-7 rounded-full border border-dashed border-white/25" />
              <div className="absolute inset-14 rounded-full border border-white/15" />

              <div className="flex size-28 items-center justify-center rounded-[2rem] bg-[#E65C38] shadow-2xl shadow-black/20">
                <Globe2 className="size-16 text-white" />
              </div>

              <span className="absolute left-3 top-14 flex size-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-xl">
                🇫🇷
              </span>
              <span className="absolute right-3 top-16 flex size-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-xl">
                🇯🇵
              </span>
              <span className="absolute bottom-7 left-10 flex size-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-xl">
                🇮🇳
              </span>
              <span className="absolute bottom-8 right-8 flex size-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-xl">
                🇪🇸
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick feature cards */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#2A5B52]">
            <Globe2 className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-stone-900">Real connections</p>
            <p className="mt-0.5 text-xs text-stone-500">Meet people worldwide</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#D9532F]">
            <Languages className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-stone-900">Learn naturally</p>
            <p className="mt-0.5 text-xs text-stone-500">Practice with native speakers</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <MessageCircle className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-stone-900">Easy conversations</p>
            <p className="mt-0.5 text-xs text-stone-500">Chat and translate together</p>
          </div>
        </div>
      </section>

      {/* Profile setup prompt */}
      {!myProfileQuery.isError &&
        !myProfileQuery.data &&
        !myProfileQuery.isPending && (
          <section className="flex flex-col justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <p className="font-heading text-lg font-bold text-stone-900">
                Your story starts with your profile
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Add your languages and introduce yourself to the community.
              </p>
            </div>
            <Link to="/profile">
              <Button className="rounded-full bg-[#D9532F] px-6 text-white hover:bg-[#BD421F]">
                Complete profile
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </section>
        )}

      {/* Discover section */}
      <section id="discover-learners" className="scroll-mt-24 space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9532F]">
              Find your people
            </p>
            <h2 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              People to meet
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
              Find someone who speaks the language you want to learn.
              Start with a hello and see where the conversation takes you.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-stone-500">
            <Users className="size-4" />
            {profiles.length} learners found
          </div>
        </div>

        {/* Search panel */}
        <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_250px] sm:p-5">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, city or language..."
              aria-label="Search learners"
              className="h-12 w-full rounded-xl border border-stone-200 bg-[#FAFAF8] pl-11 pr-4 text-sm outline-none transition focus:border-[#D9532F] focus:ring-4 focus:ring-[#D9532F]/10"
            />
          </label>

          <FlagPicker
            options={LANGUAGE_OPTIONS}
            value={learningLanguage}
            onChange={setLearningLanguage}
            placeholder="All languages"
            searchPlaceholder="Search languages"
            testId="discover-language-filter"
            clearable
          />
        </div>

        {profilesQuery.isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            We couldn't load the community right now. Please refresh and try again.
          </div>
        )}

        {profilesQuery.isPending && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[390px] animate-pulse rounded-3xl bg-stone-200/70"
              />
            ))}
          </div>
        )}

        {profilesQuery.isSuccess && profiles.length === 0 && (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#2A5B52]">
              <Globe2 className="size-8" />
            </span>

            <h3 className="mt-5 font-heading text-xl font-bold text-stone-900">
              {search || learningLanguage
                ? "No matching learners found"
                : "Your global community is growing"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
              {search || learningLanguage
                ? "Try another search or choose a different language."
                : "New learner profiles will appear here as people join TongueCircle."}
            </p>

            <Link to="/profile" className="mt-5 inline-block">
              <Button variant="outline" className="rounded-full">
                View my profile
              </Button>
            </Link>
          </div>
        )}

        {/* Learner cards */}
        {profiles.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => (
              <article
                key={profile.user_id}
                className="group overflow-hidden rounded-[1.7rem] border border-stone-200 bg-white shadow-[0_8px_30px_rgba(30,40,35,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(30,40,35,0.12)]"
              >
                <div className="relative aspect-[1.45/1] overflow-hidden bg-stone-100">
                  <button
                    type="button"
                    onClick={() => setLightboxProfile(profile)}
                    aria-label={`View ${profile.display_name}'s photos`}
                    className="h-full w-full cursor-zoom-in"
                  >
                    <img
                      src={profile.main_photo}
                      alt={`${profile.display_name}'s profile`}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </button>

                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

                  {profile.match_score >= 3 && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#2A5B52] shadow-sm">
                      <Sparkles className="size-3.5" />
                      {profile.match_score >= 5 ? "Great match" : "Good match"}
                    </span>
                  )}

                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                    <div>
                      <h3 className="font-heading text-xl font-bold drop-shadow">
                        {profile.display_name}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-white/90">
                        <MapPin className="size-3.5" />
                        <LocationLine
  profile={profile}
  testId={`discover-location-${profile.user_id}`}
  className="..."
/>
                      </div>
                    </div>

                    {profile.gallery_photos.length > 0 && (
                      <span className="rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold backdrop-blur">
                        +{profile.gallery_photos.length} photos
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Languages
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-[#2A5B52]">
                      {profile.learning_languages.length} learning
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <KnownLanguageChips
                      skills={profile.known_languages}
                      idPrefix={`discover-${profile.user_id}`}
                    />

                    {profile.learning_languages.map((language) => (
                      <LanguageChip
                        key={language}
                        language={language}
                        tone="learning"
                        label="learning"
                        testId={`discover-learning-language-${profile.user_id}-${language.toLowerCase()}`}
                      />
                    ))}
                  </div>

                  {profile.match_reasons.length > 0 && (
                    <p className="mt-4 rounded-xl bg-emerald-50/80 px-3 py-2 text-xs font-medium leading-5 text-[#2A5B52]">
                      <Sparkles className="mr-1 inline size-3.5" />
                      {profile.match_reasons.join(" · ")}
                    </p>
                  )}

                  {profile.bio && (
                    <div className="mt-4">
                      <p className="line-clamp-3 text-sm leading-6 text-stone-600">
                        {translatedBios[profile.user_id] &&
                        !showOriginal[profile.user_id]
                          ? translatedBios[profile.user_id]
                          : profile.bio}
                      </p>

                      {translatedBios[profile.user_id] && (
                        <button
                          type="button"
                          onClick={() =>
                            setShowOriginal((current) => ({
                              ...current,
                              [profile.user_id]: !current[profile.user_id],
                            }))
                          }
                          className="mt-2 text-xs font-bold text-[#D9532F] hover:underline"
                        >
                          {showOriginal[profile.user_id]
                            ? "Show translation"
                            : "Show original"}
                        </button>
                      )}

                      {!translatedBios[profile.user_id] && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <TranslateTargetPicker
                            value={targetLanguage}
                            onChange={setTargetLanguage}
                            testId={`discover-bio-target-${profile.user_id}`}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              translation.mutate({
                                profileId: profile.user_id,
                                bio: profile.bio,
                              })
                            }
                            disabled={translation.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-[#D9532F] hover:bg-orange-50 disabled:opacity-50"
                          >
                            <Languages className="size-3.5" />
                            Translate
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-[1fr_1fr] gap-2 border-t border-stone-100 pt-4">
                    <Link
                      to={`/people/${encodeURIComponent(profile.user_id)}`}
                      className={`${buttonVariants({ variant: "outline" })} h-11 rounded-xl border-stone-200 text-xs font-bold`}
                    >
                      <UserRound className="mr-1.5 size-4" />
                      Profile
                    </Link>

                    <Button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/messages?to=${encodeURIComponent(profile.user_id)}`,
                        )
                      }
                      className="h-11 rounded-xl bg-[#D9532F] text-xs font-bold text-white shadow-sm hover:bg-[#BD421F]"
                    >
                      <MessageCircle className="mr-1.5 size-4" />
                      Say hello
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Community invitation */}
      <section className="flex flex-col justify-between gap-5 rounded-[1.7rem] border border-stone-200 bg-[#F0F3EF] p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#2A5B52] shadow-sm">
            <Heart className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold text-stone-900">
              Language is better together.
            </h2>
            <p className="mt-1 max-w-lg text-sm leading-6 text-stone-600">
              Join a group, meet learners and practice in a friendly space.
            </p>
          </div>
        </div>

        <Link to="/community">
          <Button className="rounded-full bg-[#2A5B52] px-6 text-white hover:bg-[#1D4941]">
            Visit community
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </Link>
      </section>

      <PhotoLightbox
        open={Boolean(lightboxProfile)}
        onOpenChange={(open) => {
          if (!open) setLightboxProfile(null);
        }}
        name={lightboxProfile?.display_name ?? ""}
        photos={
          lightboxProfile
            ? [lightboxProfile.main_photo, ...lightboxProfile.gallery_photos]
            : []
        }
      />
    </div>
  );
}
