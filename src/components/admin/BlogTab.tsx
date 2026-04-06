import { useState } from "react";
import { useBlog, type BlogPost } from "@/contexts/BlogContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Save, X, ImagePlus, Eye, EyeOff, Video, Music, Link } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const emptyForm: Omit<BlogPost, "id"> = {
  title: "",
  category: "",
  summary: "",
  content: "",
  date: new Date().toLocaleDateString("pt-BR"),
  readTime: "3 min",
  imageUrl: "",
  videoUrl: "",
  spotifyUrl: "",
  published: true,
};

const categories = ["Estética", "Gestação", "Pós-Parto", "Saúde da Mulher", "Dicas", "Novidades"];

export const BlogTab = () => {
  const { posts, addPost, updatePost, deletePost } = useBlog();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<BlogPost, "id">>(emptyForm);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...emptyForm, date: new Date().toLocaleDateString("pt-BR") });
    setDialogOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setForm({
      title: post.title,
      category: post.category,
      summary: post.summary,
      content: post.content,
      date: post.date,
      readTime: post.readTime,
      imageUrl: post.imageUrl,
      videoUrl: post.videoUrl,
      spotifyUrl: post.spotifyUrl,
      published: post.published,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.summary || !form.category) {
      toast({ title: "Preencha título, resumo e categoria", variant: "destructive" });
      return;
    }
    if (editingId) {
      updatePost(editingId, form);
      toast({ title: "Postagem atualizada!" });
    } else {
      addPost(form);
      toast({ title: "Postagem criada!" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deletePost(id);
    toast({ title: "Postagem removida" });
  };

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Imagem muito grande", description: "Máx: 10MB", variant: "destructive" });
        return;
      }
      setForm((prev) => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
      toast({ title: "Imagem adicionada!" });
    };
    input.click();
  };

  const togglePublish = (post: BlogPost) => {
    updatePost(post.id, { published: !post.published });
    toast({ title: post.published ? "Postagem despublicada" : "Postagem publicada!" });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-foreground text-lg">Blog ({posts.length} postagens)</h2>
          <p className="text-xs text-muted-foreground">Crie e gerencie conteúdos para a página inicial</p>
        </div>
        <Button onClick={openNew} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading rounded-full px-5 shadow-md shadow-secondary/20">
          <Plus className="h-4 w-4 mr-1.5" /> Nova Postagem
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => (
          <Card key={post.id} className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow overflow-hidden">
            {post.imageUrl && (
              <div className="h-36 overflow-hidden">
                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-foreground text-sm truncate">{post.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>
                    <span className="text-[10px] text-muted-foreground">{post.date}</span>
                    {!post.published && (
                      <Badge variant="outline" className="text-[10px] border-yellow-300 text-yellow-700">Rascunho</Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => togglePublish(post)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={post.published ? "Despublicar" : "Publicar"}>
                    {post.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => openEdit(post)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-2">{post.summary}</p>
              <div className="text-[10px] text-muted-foreground mt-2">{post.readTime} de leitura</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Editar Postagem" : "Nova Postagem"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="font-heading">Título *</Label>
              <Input placeholder="Título da postagem" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-heading">Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-heading">Tempo de leitura</Label>
                <Input placeholder="Ex: 5 min" value={form.readTime} onChange={(e) => setForm({ ...form, readTime: e.target.value })} className="rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-heading">Resumo *</Label>
              <Textarea placeholder="Resumo que aparecerá na página inicial..." value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="rounded-xl min-h-[70px]" />
            </div>

            <div className="space-y-2">
              <Label className="font-heading">Conteúdo completo</Label>
              <Textarea placeholder="Escreva o artigo completo aqui..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="rounded-xl min-h-[120px]" />
            </div>

            <div className="space-y-2">
              <Label className="font-heading flex items-center gap-2"><ImagePlus className="h-4 w-4 text-primary" /> Imagem de capa</Label>
              {form.imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border h-36">
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setForm({ ...form, imageUrl: "" })} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={handleImageUpload} className="w-full rounded-xl border-dashed border-2 py-4 hover:border-primary/40 hover:bg-primary/5">
                  <ImagePlus className="h-4 w-4 mr-2" /> Adicionar imagem
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-heading flex items-center gap-2"><Video className="h-4 w-4 text-primary" /> Vídeo (YouTube ou upload)</Label>
              {form.videoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border bg-black aspect-video">
                  {form.videoUrl.includes("youtube") || form.videoUrl.includes("youtu.be") ? (
                    <iframe src={form.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} className="w-full h-full" allowFullScreen />
                  ) : (
                    <video src={form.videoUrl} controls className="w-full h-full object-contain" />
                  )}
                  <button onClick={() => setForm({ ...form, videoUrl: "" })} className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input placeholder="Cole o link do YouTube" value="" onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className="rounded-xl flex-1" />
                  <Button type="button" variant="outline" onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "video/mp4,video/webm";
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      if (file.size > 100 * 1024 * 1024) {
                        toast({ title: "Vídeo muito grande", description: "Máx: 100MB", variant: "destructive" });
                        return;
                      }
                      setForm((prev) => ({ ...prev, videoUrl: URL.createObjectURL(file) }));
                      toast({ title: "Vídeo adicionado!" });
                    };
                    input.click();
                  }} className="rounded-xl shrink-0">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-heading flex items-center gap-2"><Music className="h-4 w-4 text-green-600" /> Link do Spotify</Label>
              <Input placeholder="Cole o link do episódio/podcast no Spotify" value={form.spotifyUrl} onChange={(e) => setForm({ ...form, spotifyUrl: e.target.value })} className="rounded-xl" />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              <Label className="font-heading text-sm">{form.published ? "Publicado" : "Rascunho"}</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 rounded-full font-heading">Cancelar</Button>
              <Button onClick={handleSave} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading shadow-md shadow-secondary/20">
                <Save className="h-4 w-4 mr-1.5" /> {editingId ? "Salvar" : "Publicar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
