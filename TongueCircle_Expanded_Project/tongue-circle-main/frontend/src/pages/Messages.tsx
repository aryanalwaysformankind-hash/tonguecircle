import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Bookmark,
  BookmarkCheck,
  Languages,
  MessageCircle,
  Send,
  Sparkles,
  Mic,
  Square,
  Globe2,
  Users,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import TranslateTargetPicker from "@/components/flags/TranslateTargetPicker";
import CallControls from "@/components/CallControls";
import { apiGet, apiPost, apiPostStream } from "@/lib/api";
import { buildStarters } from "@/lib/starters";
import type {
  Conversation,
  DiscoverProfile,
  Message,
  Phrase,
  PhraseCreate,
  Profile,
  TypingStatus,
} from "@/lib/types";

const TYPING_PING_MS = 2000;

export default function Messages() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();

  const requestedRecipient = searchParams.get("to");

  const [draft, setDraft] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("English");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [translationLanguages, setTranslationLanguages] = useState<Record<string, string>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [recording, setRecording] = useState(false);
  const [draftTranslation, setDraftTranslation] = useState("");
  const [draftRomanization, setDraftRomanization] = useState("");
  const [livePreview, setLivePreview] = useState(false);
  const [voiceTranscripts, setVoiceTranscripts] = useState<Record<string, string>>({});
  const [transcribingIds, setTranscribingIds] = useState<Record<string, boolean>>({});

  const recorderRef = useRef<MediaRecorder | null>(null);
  const endOfMessages = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingPing = useRef(0);

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: async () =>
      apiGet<Conversation[]>("/conversations", await getToken()),
    refetchInterval: 10000,
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () =>
      apiGet<Message[]>(
        `/conversations/${conversationId}/messages`,
        await getToken(),
      ),
    enabled: Boolean(conversationId),
    refetchInterval: 5000,
  });

  const typingQuery = useQuery({
    queryKey: ["typing", conversationId],
    queryFn: async () =>
      apiGet<TypingStatus>(
        `/conversations/${conversationId}/typing`,
        await getToken(),
      ),
    enabled: Boolean(conversationId),
    refetchInterval: 2000,
  });

  const myProfileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () =>
      apiGet<Profile | null>("/profile/me", await getToken()),
  });

  useEffect(() => {
    if (!messagesQuery.dataUpdatedAt) return;

    void queryClient.invalidateQueries({ queryKey: ["unread"] });
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }, [messagesQuery.dataUpdatedAt, queryClient]);

  const savePhrase = useMutation({
    mutationFn: async ({ body }: { id: string; body: PhraseCreate }) =>
      apiPost<Phrase>("/phrases", body, await getToken()),
    onSuccess: async (_phrase, { id }) => {
      setSavedIds((current) => ({ ...current, [id]: true }));
      await queryClient.invalidateQueries({ queryKey: ["phrases"] });
      toast.success("Saved to your phrases");
    },
    onError: () =>
      toast.error("That phrase couldn't be saved. Please try again."),
  });

  const activeConversation = conversationsQuery.data?.find(
    (item) => item.id === conversationId,
  );

  const recipientId =
    activeConversation?.other_user_id ?? requestedRecipient ?? "";

  const presenceQuery = useQuery({
    queryKey: ["presence", recipientId],
    queryFn: async () =>
      apiGet<{ online: boolean; last_seen: string | null }>(
        `/profiles/${encodeURIComponent(recipientId)}/presence`,
        await getToken(),
      ),
    enabled: Boolean(recipientId && conversationId),
    refetchInterval: 15000,
    retry: false,
  });

  useEffect(() => {
    let alive = true;

    const ping = async () => {
      try {
        await apiPost<void>("/presence/ping", undefined, await getToken());
      } catch {
        // Presence is best effort.
      }
    };

    void ping();

    const timer = window.setInterval(() => {
      if (alive) void ping();
    }, 30000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [getToken]);

  useEffect(() => {
    let cancelled = false;

    setDraftTranslation("");
    setDraftRomanization("");

    const value = draft.trim();

    if (!livePreview || !value || value.length < 3 || !conversationId) {
      return () => {
        cancelled = true;
      };
    }

    const timer = window.setTimeout(async () => {
      try {
        let translated = "";

        await apiPostStream(
          "/translate",
          { text: value, target_language: targetLanguage },
          await getToken(),
          (chunk) => {
            translated += chunk;
            if (!cancelled) setDraftTranslation(translated);
          },
        );

        let romanized = "";

        await apiPostStream(
          "/translate",
          {
            text: value,
            target_language: targetLanguage,
            mode: "transliterate",
          },
          await getToken(),
          (chunk) => {
            romanized += chunk;
            if (!cancelled) setDraftRomanization(romanized);
          },
        );
      } catch {
        // Preview is optional.
      }
    }, 950);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [draft, targetLanguage, conversationId, getToken, livePreview]);

  const partnerQuery = useQuery({
    queryKey: ["profile", recipientId],
    queryFn: async () =>
      apiGet<DiscoverProfile>(
        `/profiles/${encodeURIComponent(recipientId)}`,
        await getToken(),
      ),
    enabled: Boolean(recipientId),
  });

  const recipientProfile = partnerQuery.data;

  const headerName =
    activeConversation?.other_display_name ??
    recipientProfile?.display_name ??
    "Choose a conversation";

  const messages = messagesQuery.data ?? [];

  const partnerTyping = Boolean(
    conversationId && typingQuery.data?.typing,
  );

  const isNewChat =
    !messagesQuery.isPending || !conversationId
      ? messages.length === 0
      : false;

  const starters =
    recipientProfile && isNewChat
      ? buildStarters(myProfileQuery.data, recipientProfile)
      : [];

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length, conversationId, partnerTyping]);

  const handleDraftChange = (value: string) => {
    setDraft(value);

    const now = Date.now();

    if (
      !conversationId ||
      !value.trim() ||
      now - lastTypingPing.current < TYPING_PING_MS
    ) {
      return;
    }

    lastTypingPing.current = now;

    void (async () => {
      try {
        await apiPost<void>(
          `/conversations/${conversationId}/typing`,
          undefined,
          await getToken(),
        );
      } catch {
        // Typing hints are best effort.
      }
    })();
  };

  useEffect(() => {
    if (conversationId || !requestedRecipient) return;

    const existing = conversationsQuery.data?.find(
      (item) => item.other_user_id === requestedRecipient,
    );

    if (existing) {
      navigate(`/messages/${existing.id}`, { replace: true });
    }
  }, [
    conversationId,
    requestedRecipient,
    conversationsQuery.data,
    navigate,
  ]);

  const sendMessage = useMutation({
    mutationFn: async (text: string) =>
      apiPost<Message>(
        "/messages",
        { recipient_user_id: recipientId, text },
        await getToken(),
      ),
    onSuccess: async (message) => {
      setDraft("");

      await queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["messages", message.conversation_id],
      });

      navigate(`/messages/${message.conversation_id}`);
    },
    onError: () =>
      toast.error("Your message couldn't be sent. Please try again."),
  });

  const translateMessage = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      let result = "";

      await apiPostStream(
        "/translate",
        { text, target_language: targetLanguage },
        await getToken(),
        (chunk) => {
          result += chunk;
          setTranslations((current) => ({
            ...current,
            [id]: result,
          }));
        },
      );

      return id;
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : "Translation is unavailable right now",
      ),
  });

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (recipientId && draft.trim()) {
      sendMessage.mutate(draft.trim());
    }
  };

  const toggleVoiceRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }

    if (!conversationId || !recipientId) {
      toast.error("Open a conversation before recording a voice message.");
      return;
    }

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      toast.error("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = new MediaRecorder(
        media,
        mimeType ? { mimeType } : undefined,
      );

      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };

      recorder.onstop = () => {
        media.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });

        if (!blob.size) {
          toast.error("No audio was recorded. Please try again.");
          return;
        }

        if (blob.size > 10000000) {
          toast.error(
            "This recording is over the 10 MB upload limit. Try a shorter voice note.",
          );
          return;
        }

        const reader = new FileReader();

        reader.onload = async () => {
          try {
            await apiPost<Message>(
              "/messages",
              {
                recipient_user_id: recipientId,
                text: "",
                message_type: "audio",
                audio_data: String(reader.result),
              },
              await getToken(),
            );

            await queryClient.invalidateQueries({
              queryKey: ["messages", conversationId],
            });

            await queryClient.invalidateQueries({
              queryKey: ["conversations"],
            });

            toast.success("Voice message sent");
          } catch {
            toast.error("Your voice message could not be sent.");
          }
        };

        reader.readAsDataURL(blob);
      };

      recorderRef.current = recorder;
      recorder.start(1000);
      setRecording(true);
    } catch {
      toast.error(
        "Please allow microphone access to record a voice message.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      {/* Welcome banner */}
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-[#193F39] px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
        <div className="absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-[#D9532F]/25 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
            <Sparkles className="size-4" />
            Your global language community
          </div>

          <h1
            data-testid="messages-page-title"
            className="mt-4 max-w-2xl font-heading text-3xl font-extrabold leading-tight sm:text-4xl"
          >
            Conversations that connect.
          </h1>

          <p
            data-testid="messages-page-description"
            className="mt-3 max-w-xl text-sm leading-6 text-white/75"
          >
            Practice a new language, share your culture and make meaningful
            friendships, one message at a time.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold">
              <Globe2 className="mr-1 inline size-3.5" />
              Global conversations
            </span>

            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold">
              <Languages className="mr-1 inline size-3.5" />
              Instant translation
            </span>
          </div>
        </div>
      </header>

      {conversationsQuery.isError && (
        <p
          data-testid="messages-load-error"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          Messages are unavailable right now. Please refresh and try again.
        </p>
      )}

      {/* Chat workspace */}
      <section className="grid min-h-[680px] overflow-hidden rounded-[1.8rem] border border-stone-200 bg-white shadow-[0_12px_45px_rgba(30,40,35,0.06)] lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Conversation list */}
        <aside className="flex min-h-0 flex-col border-b border-stone-200 bg-[#FAFAF7] lg:border-b-0 lg:border-r">
          <div className="border-b border-stone-200 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#D9532F]">
                  Your inbox
                </p>

                <h2
                  data-testid="messages-conversation-list-title"
                  className="mt-1 font-heading text-xl font-bold text-stone-900"
                >
                  Conversations
                </h2>
              </div>

              <span className="flex size-10 items-center justify-center rounded-xl bg-[#E8F0EC] text-[#2A5B52]">
                <MessageCircle className="size-5" />
              </span>
            </div>

            <p
              data-testid="messages-conversation-count"
              className="mt-2 text-xs text-stone-500"
            >
              {conversationsQuery.data?.length ?? 0} conversations
            </p>
          </div>

          {conversationsQuery.isPending && (
            <p
              data-testid="messages-conversation-loading"
              className="p-5 text-sm text-stone-500"
            >
              Loading conversations…
            </p>
          )}

          {conversationsQuery.isSuccess &&
            conversationsQuery.data.length === 0 && (
              <div className="px-5 py-9 text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#2A5B52]">
                  <MessageCircle className="size-6" />
                </span>

                <p
                  data-testid="messages-empty-list-copy"
                  className="mt-4 text-sm font-medium leading-6 text-stone-600"
                >
                  Your first language exchange starts with a hello.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  data-testid="messages-discover-button"
                  className="mt-4 rounded-full"
                >
                  Discover learners
                </Button>
              </div>
            )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {(conversationsQuery.data ?? []).map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => navigate(`/messages/${conversation.id}`)}
                data-testid={`conversation-list-item-${conversation.id}`}
                className={`flex w-full items-center gap-3 border-b border-stone-100 px-4 py-4 text-left transition ${
                  conversation.id === conversationId
                    ? "bg-[#E8F0EC]"
                    : "hover:bg-white"
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={conversation.other_main_photo}
                    alt={`${conversation.other_display_name}'s profile`}
                    className="size-12 rounded-2xl object-cover"
                    data-testid={`conversation-photo-${conversation.id}`}
                  />

                  {conversation.unread_count > 0 && (
                    <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-white bg-[#D9532F]" />
                  )}
                </div>

                <span className="min-w-0 flex-1">
                  <span
                    data-testid={`conversation-name-${conversation.id}`}
                    className={`block truncate text-sm text-stone-900 ${
                      conversation.unread_count > 0
                        ? "font-extrabold"
                        : "font-bold"
                    }`}
                  >
                    {conversation.other_display_name}
                  </span>

                  <span
                    data-testid={`conversation-preview-${conversation.id}`}
                    className={`mt-1 block truncate text-xs ${
                      conversation.unread_count > 0
                        ? "font-semibold text-stone-800"
                        : "text-stone-500"
                    }`}
                  >
                    {conversation.last_message}
                  </span>
                </span>

                {conversation.unread_count > 0 && (
                  <span
                    data-testid={`conversation-unread-badge-${conversation.id}`}
                    aria-label={`${conversation.unread_count} unread`}
                    className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#D9532F] px-1.5 text-[11px] font-bold text-white"
                  >
                    {conversation.unread_count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-stone-200 p-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2A5B52] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#1D4941]"
            >
              <Users className="size-4" />
              Find language partners
            </button>
          </div>
        </aside>

        {/* Chat panel */}
        <div className="flex min-h-[600px] min-w-0 flex-col bg-[#F8F9F6]">
          {activeConversation || recipientProfile ? (
            <>
              {/* Chat header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
                {activeConversation && (
                  <img
                    src={activeConversation.other_main_photo}
                    alt={`${headerName}'s profile`}
                    className="size-12 rounded-2xl object-cover"
                    data-testid="active-conversation-photo"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/people/${encodeURIComponent(recipientId)}`}
                    data-testid="active-conversation-name"
                    className="block truncate font-heading text-lg font-bold text-stone-900 hover:text-[#D9532F]"
                  >
                    {headerName}
                  </Link>

                  <p
                    data-testid="active-conversation-subtitle"
                    className="mt-0.5 text-xs text-stone-500"
                  >
                    {partnerTyping ? (
                      <span className="font-semibold text-[#2A5B52]">
                        Typing…
                      </span>
                    ) : presenceQuery.data?.online ? (
                      <span className="font-semibold text-emerald-700">
                        ● Online now
                      </span>
                    ) : presenceQuery.data?.last_seen ? (
                      `Last seen ${new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(presenceQuery.data.last_seen))}`
                    ) : (
                      "Your language exchange"
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <TranslateTargetPicker
                    value={targetLanguage}
                    onChange={setTargetLanguage}
                    testId="message-translation-language"
                  />

                  {conversationId && (
                    <CallControls
                      conversationId={conversationId}
                      partnerName={headerName}
                    />
                  )}
                </div>
              </div>

              {/* Message history */}
              <div
                className="flex-1 space-y-5 overflow-y-auto bg-[#F8F9F6] px-4 py-6 sm:px-7"
                aria-live="polite"
                aria-relevant="additions"
              >
                <div className="mx-auto mb-6 max-w-xs text-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    <Globe2 className="size-3" />
                    TongueCircle conversation
                  </span>
                </div>

                {messagesQuery.isError && (
                  <p
                    data-testid="messages-thread-error"
                    className="text-center text-sm text-red-700"
                  >
                    Could not load this conversation.
                  </p>
                )}

                {messagesQuery.isPending && conversationId && (
                  <p
                    data-testid="messages-thread-loading"
                    className="text-center text-sm text-stone-500"
                  >
                    Loading messages…
                  </p>
                )}

                {isNewChat && (
                  <div className="mx-auto max-w-lg py-8 text-center">
                    <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#2A5B52]">
                      <MessageCircle className="size-6" />
                    </span>

                    <p
                      data-testid="messages-first-message-title"
                      className="mt-4 font-heading text-lg font-bold"
                    >
                      Start with something small
                    </p>

                    <p
                      data-testid="messages-first-message-copy"
                      className="mt-2 text-sm leading-6 text-stone-500"
                    >
                      Choose an opener and make it your own.
                    </p>

                    {starters.length > 0 && (
                      <ul
                        className="mt-5 space-y-2 text-left"
                        data-testid="conversation-starters"
                      >
                        {starters.map((starter, index) => (
                          <li key={starter}>
                            <button
                              type="button"
                              onClick={() => {
                                setDraft(starter);
                                composerRef.current?.focus();
                              }}
                              data-testid={`conversation-starter-${index}`}
                              className="flex w-full items-start gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-sm leading-6 text-stone-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9532F]/50 hover:shadow-md"
                            >
                              <Sparkles className="mt-1 size-4 shrink-0 text-[#D9532F]" />
                              <span>{starter}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {messages.map((message) => {
                  const mine = message.sender_user_id === user?.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        mine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <article
                        data-testid={`message-bubble-${message.id}`}
                        className={`max-w-[90%] rounded-[1.35rem] px-4 py-3 shadow-sm sm:max-w-[76%] ${
                          mine
                            ? "rounded-br-md bg-[#2A5B52] text-white"
                            : "rounded-bl-md border border-stone-200 bg-white text-stone-800"
                        }`}
                      >
                        {message.message_type === "audio" &&
                        message.audio_data ? (
                          <div
                            className="min-w-[210px]"
                            data-testid={`message-audio-${message.id}`}
                          >
                            <p className="mb-2 flex items-center gap-2 text-xs font-semibold">
                              <Mic className="size-4" />
                              Voice message
                            </p>

                            <audio
                              controls
                              preload="metadata"
                              className="max-w-full"
                              src={message.audio_data}
                            />

                            {voiceTranscripts[message.id] ? (
                              <p className="mt-2 whitespace-pre-wrap text-xs leading-5">
                                {voiceTranscripts[message.id]}
                              </p>
                            ) : (
                              <button
                                type="button"
                                disabled={Boolean(transcribingIds[message.id])}
                                onClick={async () => {
                                  setTranscribingIds((current) => ({
                                    ...current,
                                    [message.id]: true,
                                  }));

                                  try {
                                    const result = await apiPost<{ text: string }>(
                                      "/transcribe",
                                      { audio_data: message.audio_data },
                                      await getToken(),
                                    );

                                    setVoiceTranscripts((current) => ({
                                      ...current,
                                      [message.id]:
                                        result.text || "No speech detected.",
                                    }));
                                  } catch (error) {
                                    toast.error(
                                      error instanceof Error
                                        ? error.message
                                        : "Could not transcribe this voice note.",
                                    );
                                  } finally {
                                    setTranscribingIds((current) => ({
                                      ...current,
                                      [message.id]: false,
                                    }));
                                  }
                                }}
                                className="mt-2 text-xs font-semibold underline disabled:opacity-50"
                              >
                                {transcribingIds[message.id]
                                  ? "Transcribing…"
                                  : "Transcribe voice note"}
                              </button>
                            )}
                          </div>
                        ) : (
                          <p
                            data-testid={`message-text-${message.id}`}
                            className="whitespace-pre-wrap break-words text-sm leading-6"
                          >
                            {translations[message.id] &&
                            !showOriginal[message.id]
                              ? translations[message.id]
                              : message.text}
                          </p>
                        )}

                        <div
                          className={`mt-3 flex flex-wrap items-center justify-between gap-3 ${
                            mine ? "text-white/70" : "text-stone-400"
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <time
                              data-testid={`message-time-${message.id}`}
                              className="text-[10px]"
                              dateTime={message.created_at}
                            >
                              {new Intl.DateTimeFormat(undefined, {
                                hour: "numeric",
                                minute: "2-digit",
                              }).format(new Date(message.created_at))}
                            </time>

                            {mine && (
                              <span
                                aria-label={message.read ? "Read" : "Sent"}
                                title={message.read ? "Read" : "Sent"}
                                className="text-[10px]"
                              >
                                {message.read ? "✓✓ Read" : "✓ Sent"}
                              </span>
                            )}
                          </span>

                          {translations[message.id] ? (
                            <span className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setShowOriginal((current) => ({
                                    ...current,
                                    [message.id]: !current[message.id],
                                  }))
                                }
                                data-testid={`message-original-toggle-${message.id}`}
                                className="text-[11px] font-semibold underline-offset-2 hover:underline"
                              >
                                {showOriginal[message.id]
                                  ? "Show translation"
                                  : "Original"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  savePhrase.mutate({
                                    id: message.id,
                                    body: {
                                      original: message.text,
                                      translated: translations[message.id],
                                      target_language:
                                        translationLanguages[message.id] ??
                                        targetLanguage,
                                      partner_name: headerName,
                                    },
                                  })
                                }
                                disabled={
                                  Boolean(savedIds[message.id]) ||
                                  savePhrase.isPending ||
                                  translateMessage.isPending
                                }
                                data-testid={`message-save-phrase-${message.id}`}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline disabled:opacity-70"
                              >
                                {savedIds[message.id] ? (
                                  <>
                                    <BookmarkCheck className="size-3" />
                                    Saved
                                  </>
                                ) : (
                                  <>
                                    <Bookmark className="size-3" />
                                    Save phrase
                                  </>
                                )}
                              </button>
                            </span>
                          ) : message.message_type === "audio" ? (
                            <span className="text-[10px]">Audio</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setTranslationLanguages((current) => ({
                                  ...current,
                                  [message.id]: targetLanguage,
                                }));

                                translateMessage.mutate({
                                  id: message.id,
                                  text: message.text,
                                });
                              }}
                              disabled={translateMessage.isPending}
                              data-testid={`message-translate-button-${message.id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline disabled:opacity-50"
                            >
                              <Languages className="size-3" />
                              Translate
                            </button>
                          )}
                        </div>
                      </article>
                    </div>
                  );
                })}

                {partnerTyping && (
                  <div
                    className="flex justify-start"
                    data-testid="typing-indicator"
                  >
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-stone-200 bg-white px-4 py-3 shadow-sm">
                      <span className="flex items-center gap-1" aria-hidden="true">
                        <span className="typing-dot size-1.5 rounded-full bg-stone-500" />
                        <span className="typing-dot size-1.5 rounded-full bg-stone-500 [animation-delay:150ms]" />
                        <span className="typing-dot size-1.5 rounded-full bg-stone-500 [animation-delay:300ms]" />
                      </span>

                      <span
                        data-testid="typing-indicator-text"
                        className="text-xs text-stone-500"
                      >
                        {headerName.split(" ")[0]} is typing…
                      </span>
                    </div>
                  </div>
                )}

                <div ref={endOfMessages} />
              </div>

              {/* Message composer */}
              <form
                onSubmit={submitMessage}
                className="border-t border-stone-200 bg-white p-4 sm:p-5"
              >
                <label
                  className="sr-only"
                  htmlFor="message-compose-input"
                >
                  Write a message
                </label>

                <div className="rounded-2xl border border-stone-200 bg-[#FAFAF8] p-2 transition focus-within:border-[#2A5B52] focus-within:ring-4 focus-within:ring-[#2A5B52]/10">
                  <textarea
                    ref={composerRef}
                    id="message-compose-input"
                    rows={2}
                    maxLength={1200}
                    value={draft}
                    onChange={(event) =>
                      handleDraftChange(event.target.value)
                    }
                    placeholder={`Write a message to ${headerName}…`}
                    data-testid="message-compose-input"
                    className="min-h-12 w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-stone-400"
                  />

                  <div className="flex items-center justify-between gap-2 border-t border-stone-200 px-2 pt-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={recording ? "destructive" : "outline"}
                        disabled={!conversationId || sendMessage.isPending}
                        onClick={() => void toggleVoiceRecording()}
                        aria-label={
                          recording
                            ? "Stop voice recording"
                            : "Record voice message"
                        }
                        title={
                          recording
                            ? "Stop recording"
                            : "Record voice message"
                        }
                        className="size-10 rounded-xl"
                      >
                        {recording ? (
                          <Square className="size-4" />
                        ) : (
                          <Mic className="size-4" />
                        )}
                      </Button>

                      <button
                        type="button"
                        onClick={() => setLivePreview((value) => !value)}
                        aria-pressed={livePreview}
                        className={`rounded-full px-3 py-2 text-[11px] font-semibold transition ${
                          livePreview
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        <Languages className="mr-1 inline size-3.5" />
                        {livePreview ? "Preview on" : "Translate preview"}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      disabled={!draft.trim() || sendMessage.isPending}
                      data-testid="message-send-button"
                      className="h-10 rounded-xl bg-[#D9532F] px-5 text-white hover:bg-[#BD421F]"
                    >
                      <Send className="mr-2 size-4" />
                      {sendMessage.isPending ? "Sending…" : "Send"}
                    </Button>
                  </div>
                </div>

                {(draftTranslation || draftRomanization) && (
                  <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-3 text-xs text-stone-700">
                    <p className="mb-1 font-semibold text-emerald-800">
                      Live language preview · {targetLanguage}
                    </p>

                    {draftTranslation && (
                      <p>
                        <span className="font-semibold">Translation:</span>{" "}
                        {draftTranslation}
                      </p>
                    )}

                    {draftRomanization && (
                      <p className="mt-1">
                        <span className="font-semibold">Pronunciation:</span>{" "}
                        {draftRomanization}
                      </p>
                    )}
                  </div>
                )}

                <p
                  data-testid="message-translation-note"
                  className="mt-2 text-[10px] text-stone-400"
                >
                  Voice messages support uploads up to 10 MB.
                </p>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex size-16 items-center justify-center rounded-[1.4rem] bg-[#E8F0EC] text-[#2A5B52]">
                <MessageCircle className="size-7" />
              </span>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#D9532F]">
                Your next connection
              </p>

              <h2
                data-testid="messages-no-selection-title"
                className="mt-2 font-heading text-2xl font-extrabold text-stone-900"
              >
                Every friendship starts with hello.
              </h2>

              <p
                data-testid="messages-no-selection-copy"
                className="mt-3 max-w-sm text-sm leading-6 text-stone-500"
              >
                Choose a conversation on the left, or discover a learner and
                start practicing a new language.
              </p>

              <Button
                type="button"
                onClick={() => navigate("/")}
                data-testid="messages-no-selection-discover"
                className="mt-6 rounded-full bg-[#D9532F] px-6 text-white hover:bg-[#BD421F]"
              >
                <Users className="mr-2 size-4" />
                Discover learners
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
