import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import VideoCall from "@/components/VideoCall";

const AdminVideoCall = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  if (!roomId) {
    return (
      <AdminLayout title="Videochamada">
        <p className="text-muted-foreground">Sala não encontrada.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Videochamada">
      <div className="h-[calc(100vh-12rem)] min-h-[400px]">
        <VideoCall
          roomId={roomId}
          role="admin"
          onEnd={() => navigate("/admin/agendamentos")}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminVideoCall;
