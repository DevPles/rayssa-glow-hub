import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Music, Play } from "lucide-react";
import type { BlogPost } from "@/contexts/BlogContext";
import blog1 from "@/assets/blog-1.jpg";
import blog2 from "@/assets/blog-2.jpg";
import blog3 from "@/assets/blog-3.jpg";

const fallbackImages = [blog1, blog2, blog3];

interface BlogPostModalProps {
  post: BlogPost | null;
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BlogPostModal = ({ post, index, open, onOpenChange }: BlogPostModalProps) => {
  if (!post) return null;

  const image = post.imageUrl || fallbackImages[index % fallbackImages.length];
  const isYoutube = post.videoUrl?.includes("youtube.com") || post.videoUrl?.includes("youtu.be");

  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  const getSpotifyEmbedUrl = (url: string) => {
    // Convert open.spotify.com links to embed
    if (url.includes("open.spotify.com")) {
      return url.replace("open.spotify.com", "open.spotify.com/embed");
    }
    return url;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-background border-border max-h-[90vh] overflow-y-auto p-0">
        {/* Cover image */}
        <div className="relative h-56 sm:h-72 overflow-hidden rounded-t-lg">
          <img src={image} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <Badge className="bg-secondary/90 text-secondary-foreground border-0 font-heading text-xs mb-2">
              {post.category}
            </Badge>
            <h2 className="font-heading font-bold text-white text-xl sm:text-2xl leading-tight drop-shadow-lg">
              {post.title}
            </h2>
          </div>
        </div>

        <div className="px-5 sm:px-7 pb-6 pt-2 space-y-5">
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{post.date}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {post.readTime}
            </span>
            {post.videoUrl && (
              <Badge variant="outline" className="text-xs border-primary/30 text-primary gap-1">
                <Play className="h-3 w-3" /> Vídeo Blog
              </Badge>
            )}
          </div>

          {/* Video player */}
          {post.videoUrl && (
            <div className="rounded-xl overflow-hidden border border-border bg-black aspect-video">
              {isYoutube ? (
                <iframe
                  src={getYoutubeEmbedUrl(post.videoUrl)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={post.title}
                />
              ) : (
                <video
                  src={post.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  preload="metadata"
                />
              )}
            </div>
          )}

          {/* Summary */}
          <p className="text-muted-foreground leading-relaxed font-medium italic border-l-4 border-secondary/40 pl-4">
            {post.summary}
          </p>

          {/* Content */}
          {post.content && (
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          )}

          {/* Spotify embed */}
          {post.spotifyUrl && (
            <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50">
                <Music className="h-4 w-4 text-primary" />
                <span className="font-heading font-semibold text-sm text-foreground">Ouça no Spotify</span>
              </div>
              <iframe
                src={getSpotifyEmbedUrl(post.spotifyUrl)}
                className="w-full"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ borderRadius: 0 }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogPostModal;
