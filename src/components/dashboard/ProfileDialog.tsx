import { useState } from "react";
import { Camera, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, MockUser } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleAvatarUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setAvatarUrl(URL.createObjectURL(file));
      }
    };
    input.click();
  };

  const handleSave = () => {
    const data: Partial<Pick<MockUser, "name" | "email" | "phone" | "password">> = {};
    if (name !== user.name) data.name = name;
    if (email !== user.email) data.email = email;
    if (phone !== user.phone) data.phone = phone;
    if (password) data.password = password;

    if (Object.keys(data).length > 0) {
      updateUser(user.id, data);
      toast({ title: "Perfil atualizado com sucesso!" });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Meu Perfil</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-heading font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarUpload}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Clique no ícone para alterar a foto</p>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-heading">Nome completo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading">E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading">Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="font-heading">Nova senha (opcional)</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Deixe em branco para manter" className="rounded-xl" />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4 mr-2" /> Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
