import { useEffect } from "react";
import { useVideoCall } from "@/hooks/useVideoCall";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Phone,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface VideoCallProps {
  roomId: string;
  role: "admin" | "patient";
  onEnd?: () => void;
}

const VideoCall = ({ roomId, role, onEnd }: VideoCallProps) => {
  const {
    room,
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
  } = useVideoCall(roomId, role);

  useEffect(() => {
    startCall();
  }, [startCall]);

  const handleEnd = async () => {
    await endCall();
    onEnd?.();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-destructive font-medium text-center">{error}</p>
        <Button variant="outline" onClick={onEnd}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-black/95 rounded-xl overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80">
        <div className="flex items-center gap-2">
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className={`text-xs ${isConnected ? "bg-green-600" : "bg-yellow-600"}`}
          >
            {isConnected ? "Conectado" : "Aguardando..."}
          </Badge>
          {room && (
            <span className="text-white/70 text-sm truncate max-w-[200px]">
              {room.patient_name}
            </span>
          )}
        </div>
        {!isConnected && (
          <Loader2 className="h-4 w-4 text-white/50 animate-spin" />
        )}
      </div>

      {/* Video area */}
      <div className="relative flex-1 min-h-0">
        {/* Remote video (full) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Placeholder when no remote */}
        {!isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
              <Phone className="h-8 w-8 text-white/40" />
            </div>
            <p className="text-white/50 text-sm">
              {role === "admin"
                ? "Aguardando paciente entrar..."
                : "Conectando à chamada..."}
            </p>
          </div>
        )}

        {/* Local video (pip) */}
        <Card className="absolute bottom-3 right-3 w-28 h-20 sm:w-36 sm:h-28 overflow-hidden border-2 border-white/20 bg-black rounded-lg shadow-xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isCameraOff ? "hidden" : ""}`}
          />
          {isCameraOff && (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <VideoOff className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-4 bg-black/80">
        <Button
          size="lg"
          variant={isMuted ? "destructive" : "secondary"}
          className="rounded-full h-12 w-12 p-0"
          onClick={toggleMute}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Button
          size="lg"
          variant={isCameraOff ? "destructive" : "secondary"}
          className="rounded-full h-12 w-12 p-0"
          onClick={toggleCamera}
        >
          {isCameraOff ? (
            <VideoOff className="h-5 w-5" />
          ) : (
            <Video className="h-5 w-5" />
          )}
        </Button>

        <Button
          size="lg"
          variant="destructive"
          className="rounded-full h-12 w-12 p-0"
          onClick={handleEnd}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default VideoCall;
