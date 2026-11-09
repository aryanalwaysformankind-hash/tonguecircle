import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth, useClerk, useUser } from "@clerk/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Compass,
  Globe2,
  Languages,
  LogOut,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet } from "@/lib/api";
import type { UnreadCount } from "@/lib/types";

interface AppShellProps {
  children: ReactNode;
}

const navigation = [
  { to: "/", label: "Discover", icon: Compass, end: true },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/phrases", label: "My phrases", icon: Languages },
  { to: "/profile", label: "My profile", icon: UserRound },
];

function Brand() {
  return (
    <NavLink to="/" aria-label="Tongue Circle home" className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-2xl bg-[#2A5B52] text-white shadow-sm">
        <Globe2 className="size-5" aria-hidden="true" />
      </span>
      <span className="font-heading text-lg font-extrabold tracking-tight text-stone-900">
        tongue<span className="text-[#D9532F]">circle</span>
      </span>
    </NavLink>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const unreadQuery = useQuery({
    queryKey: ["unread"],
    queryFn: async () => apiGet<UnreadCount>("/messages/unread-count", await getToken()),
    refetchInterval: 15_000,
  });
  const unreadCount = unreadQuery.data?.count ?? 0;

  const handleSignOut = async () => {
    queryClient.clear();
    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      toast.error("We couldn't sign you out. Please try again.");
    }
  };

  return (
    <div className="min-h-svh bg-[#FAF8F5] text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#FAF8F5]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-stone-600 sm:block">
              A world of voices, one community.
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex size-10 items-center justify-center rounded-full text-stone-500 transition hover:bg-white hover:text-[#D9532F] lg:hidden"
              aria-label="Sign out"
            >
              <LogOut className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-white transition hover:border-[#D9532F]"
              aria-label="Open my profile"
            >
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-5 text-stone-500" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 lg:px-8">
        <aside className="sticky top-[4.5rem] hidden h-[calc(100svh-4.5rem)] flex-col border-r border-stone-200/80 py-8 pr-5 lg:flex">
          <p className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-400">
            Your space
          </p>
          <nav aria-label="Main navigation" className="space-y-1">
            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#E8F0EC] text-[#2A5B52]"
                      : "text-stone-600 hover:bg-white hover:text-stone-900"
                  }`
                }
              >
                <Icon className="size-[18px]" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {to === "/messages" && unreadCount > 0 && (
                  <span className="min-w-5 rounded-full bg-[#D9532F] px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-[#2A5B52] p-4 text-white">
            <p className="font-heading text-sm font-bold">Language grows through people.</p>
            <p className="mt-2 text-xs leading-5 text-white/75">
              Share your words, discover new perspectives and make a connection.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-stone-500 transition hover:bg-white hover:text-[#D9532F]"
          >
            <LogOut className="size-[18px]" aria-hidden="true" />
            Sign out
          </button>
        </aside>

        <main className="min-w-0 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-0 lg:py-8">
          {children}
        </main>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition ${
                  isActive ? "text-[#D9532F]" : "text-stone-500"
                }`
              }
            >
              <span className="relative">
                <Icon className="size-5" aria-hidden="true" />
                {to === "/messages" && unreadCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex size-4 items-center justify-center rounded-full bg-[#D9532F] text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
