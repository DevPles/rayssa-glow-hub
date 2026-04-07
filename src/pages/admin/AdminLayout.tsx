import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import OrbitalClouds from "@/components/OrbitalClouds";
import { useEffect, ReactNode } from "react";

interface AdminLayoutProps {
  title: string;
  children: ReactNode;
  backTo?: string;
}

const AdminLayout = ({ title, children, backTo = "/admin" }: AdminLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login");
    else if (user.role !== "admin" && user.role !== "super_admin") navigate("/dashboard");
  }, [user, navigate]);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) return null;

  return (
    <div className="min-h-screen relative">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(40,35%,93%)] via-[hsl(38,30%,90%)] to-[hsl(35,25%,85%)]" />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[hsla(38,40%,85%,0.4)] blur-[100px] animate-[float-blob1_18s_ease-in-out_infinite] top-[-10%] right-[-10%]" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[hsla(330,30%,85%,0.25)] blur-[120px] animate-[float-blob2_22s_ease-in-out_infinite] bottom-[10%] left-[-5%]" />
        <div className="absolute w-[350px] h-[350px] rounded-full bg-[hsla(40,45%,82%,0.4)] blur-[90px] animate-[float-blob3_20s_ease-in-out_infinite] top-[40%] right-[20%]" />
      </div>
      <OrbitalClouds />

      <div className="relative z-10 bg-card/60 backdrop-blur-xl border-b border-border/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={backTo}>
            <Button size="icon" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-heading font-bold text-lg text-foreground">{title}</h1>
        </div>
      </div>
      <div className="relative z-10 container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
