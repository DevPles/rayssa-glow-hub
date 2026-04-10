import { useParams, useNavigate } from "react-router-dom";
import VideoCall from "@/components/VideoCall";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const VideoRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  if (!roomId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">Sala não encontrada.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <span className="text-sm font-medium">Teleconsulta</span>
      </div>
      <div className="flex-1 min-h-0 p-2">
        <VideoCall
          roomId={roomId}
          role="patient"
          onEnd={() => navigate("/dashboard")}
        />
      </div>
    </div>
  );
};

export default VideoRoom;
