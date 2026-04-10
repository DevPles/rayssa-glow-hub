import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type RoomStatus = "waiting" | "active" | "ended";

interface VideoRoom {
  id: string;
  created_by: string;
  patient_name: string;
  patient_phone: string | null;
  status: RoomStatus;
  created_at: string;
}

export function useVideoCall(roomId: string, role: "admin" | "patient") {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [room, setRoom] = useState<VideoRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch room info
  useEffect(() => {
    const fetchRoom = async () => {
      const { data, error: err } = await supabase
        .from("video_rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (err) {
        setError("Sala não encontrada");
        return;
      }
      setRoom(data as VideoRoom);
    };
    fetchRoom();
  }, [roomId]);

  // Start local media
  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch {
      setError("Não foi possível acessar câmera/microfone. Verifique as permissões.");
      return null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(
    (stream: MediaStream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const remote = new MediaStream();
      setRemoteStream(remote);

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remote.addTrack(track);
        });
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remote;
        }
        setIsConnected(true);
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await supabase.from("video_signals").insert({
            room_id: roomId,
            sender_role: role,
            signal_type: "ice-candidate",
            payload: JSON.stringify(event.candidate.toJSON()),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          setIsConnected(false);
        }
      };

      return pc;
    },
    [roomId, role]
  );

  // Listen for signals via Realtime
  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`video-signals-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_signals",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const signal = payload.new as {
            sender_role: string;
            signal_type: string;
            payload: string;
          };

          // Ignore own signals
          if (signal.sender_role === role) return;

          const pc = pcRef.current;
          if (!pc) return;

          try {
            if (signal.signal_type === "offer") {
              const offer = JSON.parse(signal.payload);
              await pc.setRemoteDescription(new RTCSessionDescription(offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await supabase.from("video_signals").insert({
                room_id: roomId,
                sender_role: role,
                signal_type: "answer",
                payload: JSON.stringify(answer),
              });
            } else if (signal.signal_type === "answer") {
              const answer = JSON.parse(signal.payload);
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } else if (signal.signal_type === "ice-candidate") {
              const candidate = JSON.parse(signal.payload);
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } catch (err) {
            console.error("Signal handling error:", err);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room, roomId, role]);

  // Start call (admin creates offer, patient waits)
  const startCall = useCallback(async () => {
    const stream = await startMedia();
    if (!stream) return;

    const pc = createPeerConnection(stream);

    if (role === "admin") {
      // Admin creates offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await supabase.from("video_signals").insert({
        room_id: roomId,
        sender_role: role,
        signal_type: "offer",
        payload: JSON.stringify(offer),
      });
      // Update room status
      await supabase
        .from("video_rooms")
        .update({ status: "active" })
        .eq("id", roomId);
    } else {
      // Patient: check if there's already an offer
      const { data: signals } = await supabase
        .from("video_signals")
        .select("*")
        .eq("room_id", roomId)
        .eq("signal_type", "offer")
        .order("created_at", { ascending: false })
        .limit(1);

      if (signals && signals.length > 0) {
        const offer = JSON.parse(signals[0].payload as string);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await supabase.from("video_signals").insert({
          room_id: roomId,
          sender_role: role,
          signal_type: "answer",
          payload: JSON.stringify(answer),
        });
      }

      // Also apply any existing ICE candidates
      const { data: iceCandidates } = await supabase
        .from("video_signals")
        .select("*")
        .eq("room_id", roomId)
        .eq("signal_type", "ice-candidate")
        .neq("sender_role", role);

      if (iceCandidates) {
        for (const c of iceCandidates) {
          try {
            const candidate = JSON.parse(c.payload as string);
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {}
        }
      }
    }
  }, [startMedia, createPeerConnection, roomId, role]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsMuted((prev) => !prev);
    }
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setIsCameraOff((prev) => !prev);
    }
  }, [localStream]);

  const endCall = useCallback(async () => {
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);

    await supabase
      .from("video_rooms")
      .update({ status: "ended" })
      .eq("id", roomId);
  }, [localStream, roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pcRef.current?.close();
      localStream?.getTracks().forEach((t) => t.stop());
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [localStream]);

  return {
    room,
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isCameraOff,
    error,
    localVideoRef,
    remoteVideoRef,
    startCall,
    toggleMute,
    toggleCamera,
    endCall,
  };
}

// Helper: create a new room
export async function createVideoRoom(
  createdBy: string,
  patientName: string,
  patientPhone?: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("video_rooms")
    .insert({
      created_by: createdBy,
      patient_name: patientName,
      patient_phone: patientPhone || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating video room:", error);
    return null;
  }
  return data.id;
}

// Helper: get active rooms
export async function getActiveRooms(): Promise<VideoRoom[]> {
  const { data } = await supabase
    .from("video_rooms")
    .select("*")
    .in("status", ["waiting", "active"])
    .order("created_at", { ascending: false });

  return (data as VideoRoom[]) || [];
}
