import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { Users, Video, Plus, Languages, Radio } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api";

type Group = { id: string; name: string; language: string; description: string; member_count: number; joined: boolean };
type Room = { id: string; title: string; language: string; participants: number; status: string; joined: boolean };

export default function CommunityHub() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState(""); const [language, setLanguage] = useState("English");
  const [description, setDescription] = useState("");
  const [roomTitle, setRoomTitle] = useState(""); const [roomLanguage, setRoomLanguage] = useState("English");
  const groups = useQuery({ queryKey: ["groups"], queryFn: async () => apiGet<Group[]>("/groups", await getToken()) });
  const rooms = useQuery({ queryKey: ["meeting-rooms"], queryFn: async () => apiGet<Room[]>("/meeting-rooms", await getToken()), refetchInterval: 15000 });
  const createGroup = useMutation({ mutationFn: async () => apiPost("/groups", { name, language, description }, await getToken()), onSuccess: async () => { setName(""); setDescription(""); await qc.invalidateQueries({ queryKey: ["groups"] }); toast.success("Your group is ready"); }, onError: () => toast.error("Could not create group") });
  const joinGroup = useMutation({ mutationFn: async (id: string) => apiPost(`/groups/${id}/join`, {}, await getToken()), onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] }) });
  const createRoom = useMutation({ mutationFn: async () => apiPost("/meeting-rooms", { title: roomTitle, language: roomLanguage }, await getToken()), onSuccess: async () => { setRoomTitle(""); await qc.invalidateQueries({ queryKey: ["meeting-rooms"] }); toast.success("Meeting room created"); }, onError: () => toast.error("Could not create room") });
  const joinRoom = useMutation({ mutationFn: async (id: string) => apiPost(`/meeting-rooms/${id}/join`, {}, await getToken()), onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting-rooms"] }) });
  return <div className="mx-auto max-w-6xl space-y-8">
    <header><p className="text-xs font-bold uppercase tracking-[.18em] text-[#2A5B52]">Learn together</p><h1 className="mt-2 font-heading text-3xl font-extrabold">Community spaces</h1><p className="mt-2 text-sm text-stone-600">Find your people, practise together and speak with confidence.</p></header>
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3"><span className="rounded-2xl bg-[#E8F0EC] p-3 text-[#2A5B52]"><Users/></span><div><h2 className="font-heading text-xl font-bold">Create a language group</h2><p className="text-sm text-stone-500">Build a friendly space around a language or shared goal.</p></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Group name" className="h-11 rounded-xl border px-3 text-sm"/><input value={language} onChange={e=>setLanguage(e.target.value)} placeholder="Language" className="h-11 rounded-xl border px-3 text-sm"/><input value={description} onChange={e=>setDescription(e.target.value)} placeholder="What will members practise?" className="h-11 rounded-xl border px-3 text-sm sm:col-span-2"/><Button disabled={!name.trim()||!language.trim()||createGroup.isPending} onClick={()=>createGroup.mutate()} className="rounded-full bg-[#2A5B52] sm:col-span-2"><Plus className="mr-2 size-4"/> Create group</Button></div>
    </section>
    <section className="space-y-4"><div className="flex items-center gap-2"><Languages className="text-[#2A5B52]"/><h2 className="font-heading text-xl font-bold">Discover groups</h2></div><div className="grid gap-3 md:grid-cols-2">{(groups.data??[]).map(g=><article key={g.id} className="rounded-2xl border border-stone-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{g.name}</h3><p className="mt-1 text-xs font-semibold text-[#2A5B52]">{g.language} · {g.member_count} members</p></div><Button size="sm" variant="outline" disabled={g.joined||joinGroup.isPending} onClick={()=>joinGroup.mutate(g.id)} className="rounded-full">{g.joined?"Joined":"Join"}</Button></div><p className="mt-3 text-sm text-stone-600">{g.description}</p></article>)}{groups.isSuccess&&!groups.data.length&&<p className="text-sm text-stone-500">No groups yet. Create the first one!</p>}</div></section>
    <section className="rounded-3xl border border-[#2A5B52]/15 bg-[#E8F0EC]/60 p-5 sm:p-7"><div className="flex items-center gap-3"><span className="rounded-2xl bg-white p-3 text-[#2A5B52]"><Video/></span><div><h2 className="font-heading text-xl font-bold">Live meeting rooms</h2><p className="text-sm text-stone-600">Open a room for a focused language conversation.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]"><input value={roomTitle} onChange={e=>setRoomTitle(e.target.value)} placeholder="Room topic (e.g. English café)" className="h-11 rounded-xl border bg-white px-3 text-sm"/><input value={roomLanguage} onChange={e=>setRoomLanguage(e.target.value)} placeholder="Language" className="h-11 rounded-xl border bg-white px-3 text-sm"/><Button disabled={!roomTitle.trim()||!roomLanguage.trim()} onClick={()=>createRoom.mutate()} className="rounded-full bg-[#2A5B52]"><Plus className="mr-2 size-4"/> Open room</Button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{(rooms.data??[]).map(r=><article key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4"><div><p className="font-semibold">{r.title}</p><p className="mt-1 text-xs text-stone-500"><Radio className="mr-1 inline size-3 text-emerald-600"/>{r.language} · {r.participants} participants</p></div><Button size="sm" variant="outline" disabled={r.joined||joinRoom.isPending} onClick={()=>joinRoom.mutate(r.id)} className="rounded-full">{r.joined?"In room":"Join room"}</Button></article>)}</div>
      <p className="mt-3 text-xs text-stone-500">Room creation and membership are implemented; connect a WebRTC room provider to enable live audio/video inside rooms.</p>
    </section>
  </div>;
}
