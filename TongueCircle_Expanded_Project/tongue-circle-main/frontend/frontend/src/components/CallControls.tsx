import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import { Phone, PhoneOff, Video, Mic, MicOff, Camera, CameraOff, X } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Call = {
  id: string; conversation_id: string; caller_id: string; callee_id: string;
  call_type: "audio" | "video"; offer: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit | null; caller_candidates: RTCIceCandidateInit[];
  callee_candidates: RTCIceCandidateInit[]; status: "ringing" | "accepted" | "rejected" | "ended";
  is_caller: boolean;
};

const turnUrl = import.meta.env.VITE_TURN_URL;
const iceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
if (turnUrl) iceServers.push({
  urls: turnUrl,
  username: import.meta.env.VITE_TURN_USERNAME,
  credential: import.meta.env.VITE_TURN_CREDENTIAL,
});
const ICE: RTCConfiguration = { iceServers };

export default function CallControls({ conversationId, partnerName }: { conversationId: string; partnerName: string }) {
  const { getToken } = useAuth();
  const [call, setCall] = useState<Call | null>(null);
  const [incoming, setIncoming] = useState<Call | null>(null);
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [busy, setBusy] = useState(false);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const callRef = useRef<Call | null>(null);
  const candidateCursor = useRef(0);
  const remoteSet = useRef(false);

  const stopMedia = useCallback(() => {
    peer.current?.close(); peer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null;
    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    if (remoteAudio.current) remoteAudio.current.srcObject = null;
    remoteStream.current = null;
    setActive(false); setCall(null); setIncoming(null); callRef.current = null;
    candidateCursor.current = 0; remoteSet.current = false;
  }, []);

  const createPeer = useCallback(async (kind: "audio" | "video") => {
    const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: kind === "video" });
    stream.current = media;
    if (localVideo.current) localVideo.current.srcObject = media;
    const connection = new RTCPeerConnection(ICE);
    peer.current = connection;
    media.getTracks().forEach((track) => connection.addTrack(track, media));
    connection.ontrack = (event) => {
      const remote = event.streams[0];
      remoteStream.current = remote;
      if (remoteVideo.current) remoteVideo.current.srcObject = remote;
      if (remoteAudio.current) remoteAudio.current.srcObject = remote;
    };
    return connection;
  }, []);

  const start = async (kind: "audio" | "video") => {
    if (!conversationId || busy) return;
    setBusy(true);
    try {
      const connection = await createPeer(kind);
      const offer = await connection.createOffer(); await connection.setLocalDescription(offer);
      if (connection.iceGatheringState !== "complete") await new Promise<void>((resolve) => {
        const onGathering = () => { if (connection.iceGatheringState === "complete") { connection.removeEventListener("icegatheringstatechange", onGathering); resolve(); } };
        connection.addEventListener("icegatheringstatechange", onGathering);
        window.setTimeout(resolve, 5000);
      });
      const created = await apiPost<Call>("/calls", { conversation_id: conversationId, call_type: kind, offer: connection.localDescription }, await getToken());
      setCall(created); callRef.current = created; setActive(true);
    } catch (error) {
      stopMedia(); toast.error(error instanceof Error ? error.message : "Could not start the call. Check microphone and camera permissions.");
    } finally { setBusy(false); }
  };

  const accept = async () => {
    if (!incoming) return;
    setBusy(true);
    try {
      const connection = await createPeer(incoming.call_type);
      await connection.setRemoteDescription(incoming.offer); remoteSet.current = true;
      const answer = await connection.createAnswer(); await connection.setLocalDescription(answer);
      if (connection.iceGatheringState !== "complete") await new Promise<void>((resolve) => {
        const onGathering = () => { if (connection.iceGatheringState === "complete") { connection.removeEventListener("icegatheringstatechange", onGathering); resolve(); } };
        connection.addEventListener("icegatheringstatechange", onGathering);
        window.setTimeout(resolve, 5000);
      });
      const updated = await apiPatch<Call>(`/calls/${incoming.id}`, { answer: connection.localDescription }, await getToken());
      setCall(updated); callRef.current = updated; setIncoming(null); setActive(true);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not accept the call."); stopMedia(); }
    finally { setBusy(false); }
  };

  const decline = async () => {
    if (!incoming) return;
    try { await apiPatch(`/calls/${incoming.id}`, { status: "rejected" }, await getToken()); } catch { /* best effort */ }
    setIncoming(null);
  };

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const token = await getToken();
        if (!callRef.current) {
          const list = await apiGet<Call[]>("/calls/incoming", token);
          if (alive) setIncoming(list.find((item) => item.conversation_id === conversationId) ?? null);
          return;
        }
        const activeCall = callRef.current;
        if (!activeCall) return;
        const current = await apiGet<Call>(`/calls/${activeCall.id}`, token);
        if (!alive) return;
        if (["ended", "rejected"].includes(current.status)) { toast.info(current.status === "ended" ? "Call ended" : "Call declined"); stopMedia(); return; }
        if (current.is_caller && current.answer && peer.current && !remoteSet.current) {
          await peer.current.setRemoteDescription(current.answer); remoteSet.current = true;
        }
        const candidates = current.is_caller ? current.callee_candidates : current.caller_candidates;
        while (candidateCursor.current < candidates.length) {
          const candidate = candidates[candidateCursor.current++];
          if (peer.current?.remoteDescription) await peer.current.addIceCandidate(candidate).catch(() => undefined);
        }
        setCall(current);
      } catch { /* transient polling errors should not interrupt a call */ }
    };
    void poll(); const timer = window.setInterval(() => void poll(), 1400);
    return () => { alive = false; window.clearInterval(timer); };
  }, [conversationId, getToken, stopMedia]);


  useEffect(() => {
    if (!active) return;
    if (localVideo.current && stream.current) localVideo.current.srcObject = stream.current;
    if (remoteVideo.current && remoteStream.current) remoteVideo.current.srcObject = remoteStream.current;
    if (remoteAudio.current && remoteStream.current) remoteAudio.current.srcObject = remoteStream.current;
  }, [active, call]);

  useEffect(() => () => { peer.current?.close(); stream.current?.getTracks().forEach((track) => track.stop()); }, []);

  const end = async () => {
    const current = callRef.current;
    if (current) try { await apiPatch(`/calls/${current.id}`, { status: "ended" }, await getToken()); } catch { /* best effort */ }
    stopMedia();
  };
  const toggleMute = () => { const next = !muted; stream.current?.getAudioTracks().forEach((track) => { track.enabled = !next; }); setMuted(next); };
  const toggleCamera = () => { const next = !cameraOff; stream.current?.getVideoTracks().forEach((track) => { track.enabled = !next; }); setCameraOff(next); };

  return (
    <div className="flex items-center gap-1.5">
      <Button type="button" size="icon" variant="outline" disabled={busy || active} title={`Voice call ${partnerName}`} aria-label="Start voice call" onClick={() => void start("audio")} className="rounded-full"><Phone className="size-4" /></Button>
      <Button type="button" size="icon" variant="outline" disabled={busy || active} title={`Video call ${partnerName}`} aria-label="Start video call" onClick={() => void start("video")} className="rounded-full"><Video className="size-4" /></Button>
      {incoming && !active && <div className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl"><div><p className="font-bold">Incoming {incoming.call_type} call</p><p className="text-xs text-stone-500">{partnerName} is calling you</p></div><div className="flex gap-2"><Button size="icon" onClick={() => void accept()} disabled={busy} className="rounded-full bg-emerald-600"><Phone className="size-4" /></Button><Button size="icon" variant="destructive" onClick={() => void decline()} className="rounded-full"><PhoneOff className="size-4" /></Button></div></div>}
      {active && <div className="fixed inset-0 z-[60] flex flex-col bg-[#101A18] p-4 text-white sm:p-8"><div className="flex items-center justify-between"><div><p className="font-semibold">{partnerName}</p><p className="text-xs text-white/60">{call?.call_type === "video" ? "Video call" : "Voice call"} · connected / calling</p></div><button type="button" onClick={() => void end()} aria-label="Close call" className="rounded-full p-2 hover:bg-white/10"><X /></button></div><div className="relative my-5 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-3xl bg-[#1C302B]"><video ref={remoteVideo} autoPlay playsInline className={`h-full max-h-full w-full object-contain ${call?.call_type === "audio" ? "hidden" : ""}`} /><audio ref={remoteAudio} autoPlay /><video ref={localVideo} autoPlay muted playsInline className={`absolute bottom-4 right-4 w-32 rounded-xl border border-white/20 bg-black/30 object-cover sm:w-48 ${call?.call_type === "audio" ? "hidden" : ""}`} />{call?.call_type === "audio" && <div className="text-center"><div className="mx-auto mb-4 flex size-24 items-center justify-center rounded-full bg-white/10"><Phone className="size-9" /></div><p className="text-xl font-semibold">Audio call with {partnerName}</p></div>}</div><div className="flex justify-center gap-3"><Button type="button" variant="secondary" onClick={toggleMute} className="rounded-full">{muted ? <MicOff className="mr-2 size-4" /> : <Mic className="mr-2 size-4" />}{muted ? "Unmute" : "Mute"}</Button>{call?.call_type === "video" && <Button type="button" variant="secondary" onClick={toggleCamera} className="rounded-full">{cameraOff ? <CameraOff className="mr-2 size-4" /> : <Camera className="mr-2 size-4" />}{cameraOff ? "Camera on" : "Camera off"}</Button>}<Button type="button" variant="destructive" onClick={() => void end()} className="rounded-full"><PhoneOff className="mr-2 size-4" />End call</Button></div></div>}
    </div>
  );
}
