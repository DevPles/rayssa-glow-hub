import { createContext, useContext, useState, type ReactNode } from "react";

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  date: string;
  readTime: string;
  imageUrl: string;
  videoUrl: string;
  spotifyUrl: string;
  published: boolean;
}

interface BlogContextType {
  posts: BlogPost[];
  addPost: (data: Omit<BlogPost, "id">) => void;
  updatePost: (id: string, data: Partial<BlogPost>) => void;
  deletePost: (id: string) => void;
}

const BlogContext = createContext<BlogContextType | null>(null);

const initialPosts: BlogPost[] = [
  {
    id: "bp1",
    title: "Cuidados com a Pele Durante a Gestação: Guia Completo",
    category: "Gestação",
    summary: "Descubra quais procedimentos estéticos são seguros durante a gravidez e como manter sua pele radiante nessa fase tão especial.",
    content: "",
    date: "10/02/2026",
    readTime: "5 min",
    imageUrl: "",
    videoUrl: "",
    spotifyUrl: "",
    published: true,
  },
  {
    id: "bp2",
    title: "Radiofrequência: O Que é e Como Funciona",
    category: "Estética",
    summary: "Conheça os benefícios da radiofrequência para o rejuvenescimento facial e corporal. Um dos tratamentos mais procurados da atualidade.",
    content: "",
    date: "05/02/2026",
    readTime: "4 min",
    imageUrl: "",
    videoUrl: "",
    spotifyUrl: "",
    published: true,
  },
  {
    id: "bp3",
    title: "Recuperação Pós-Parto: Quando Iniciar os Cuidados Estéticos",
    category: "Pós-Parto",
    summary: "Saiba o momento ideal para retomar os cuidados estéticos após o parto e quais tratamentos são mais indicados para cada fase.",
    content: "",
    date: "01/02/2026",
    readTime: "6 min",
    imageUrl: "",
    videoUrl: "",
    spotifyUrl: "",
    published: true,
  },
];

export const BlogProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);

  const addPost = (data: Omit<BlogPost, "id">) => {
    setPosts((prev) => [{ id: `bp${Date.now()}`, ...data }, ...prev]);
  };

  const updatePost = (id: string, data: Partial<BlogPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const deletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <BlogContext.Provider value={{ posts, addPost, updatePost, deletePost }}>
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const ctx = useContext(BlogContext);
  if (!ctx) throw new Error("useBlog must be used within BlogProvider");
  return ctx;
};
