import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight, Play, Music } from "lucide-react";
import { useBlog, type BlogPost } from "@/contexts/BlogContext";
import BlogPostModal from "@/components/BlogPostModal";
import blog1 from "@/assets/blog-1.jpg";
import blog2 from "@/assets/blog-2.jpg";
import blog3 from "@/assets/blog-3.jpg";

const fallbackImages = [blog1, blog2, blog3];

const BlogSection = () => {
  const { posts } = useBlog();
  const publishedPosts = posts.filter((p) => p.published).slice(0, 6);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (publishedPosts.length === 0) return null;

  return (
    <section id="blog" className="py-24 md:py-32 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-heading font-semibold text-secondary tracking-widest uppercase mb-4 bg-secondary/10 px-4 py-1.5 rounded-full">
            Blog
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-5">
            Dicas e <span className="text-secondary">Artigos</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Saiba mais sobre estética e saúde materna com nossos conteúdos especializados.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {publishedPosts.map((post, index) => (
            <Card
              key={post.id}
              onClick={() => { setSelectedPost(post); setSelectedIndex(index); }}
              className="group border-0 shadow-lg overflow-hidden hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
            >
              <div className="h-52 overflow-hidden relative">
                <img
                  src={post.imageUrl || fallbackImages[index % fallbackImages.length]}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {(post.videoUrl || post.spotifyUrl) && (
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {post.videoUrl && (
                      <span className="bg-primary/90 text-primary-foreground rounded-full p-1.5">
                        <Play className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {post.spotifyUrl && (
                      <span className="bg-green-600/90 text-white rounded-full p-1.5">
                        <Music className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-secondary/10 text-secondary border-0 font-heading text-xs hover:bg-secondary/20">
                    {post.category}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {post.readTime}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-foreground mb-3 group-hover:text-secondary transition-colors line-clamp-2 text-lg">
                  {post.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-2">
                  {post.summary}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                  <span className="flex items-center gap-1 text-sm font-heading font-semibold text-secondary group-hover:gap-2 transition-all">
                    Ler Mais <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <BlogPostModal
        post={selectedPost}
        index={selectedIndex}
        open={!!selectedPost}
        onOpenChange={(open) => { if (!open) setSelectedPost(null); }}
      />
    </section>
  );
};

export default BlogSection;
