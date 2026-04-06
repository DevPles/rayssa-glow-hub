import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoFallback from "@/assets/logo.png";

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  description: string;
  features: string[];
  active: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  ownerEmail: string;
  plan: string; // plan id
  active: boolean;
  createdAt: string;
  // Banking
  pixKey: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  holderName: string;
  holderDocument: string;
}

export interface PageConfig {
  photoUrl: string | null;
  expertName: string;
  expertSubtitle: string;
  pageTitle: string;
  pageDescription: string;
}

export interface SectionVisibility {
  services: boolean;
  blog: boolean;
  testimonials: boolean;
}

export interface SystemSettings {
  id: string;
  companyName: string;
  companyShortName: string;
  companySubtitle: string;
  logoUrl: string | null;
  heroPhotoUrl: string | null;
  heroCardName: string;
  heroCardSubtitle: string;
  heroDescription: string;
  tenantId: string | null;
  pageConfigs: Record<string, PageConfig>;
  sectionVisibility: SectionVisibility;
}

export interface PaymentType {
  id: string;
  name: string;
  active: boolean;
  tenantId: string | null;
}

interface SystemSettingsContextType {
  settings: SystemSettings;
  paymentTypes: PaymentType[];
  tenants: Tenant[];
  plans: Plan[];
  activeTenantId: string | null;
  logoSrc: string;
  loading: boolean;
  setActiveTenantId: (id: string | null) => void;
  updateSettings: (s: Partial<Omit<SystemSettings, "id" | "tenantId">>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  uploadHeroPhoto: (file: File) => Promise<string>;
  uploadPagePhoto: (pageKey: string, file: File) => Promise<string>;
  updatePageConfig: (pageKey: string, data: Partial<PageConfig>) => Promise<void>;
  updateSectionVisibility: (data: Partial<SectionVisibility>) => Promise<void>;
  addPaymentType: (name: string) => Promise<void>;
  togglePaymentType: (id: string, active: boolean) => Promise<void>;
  deletePaymentType: (id: string) => Promise<void>;
  // Plan management
  addPlan: (data: Omit<Plan, "id">) => Promise<Plan>;
  updatePlan: (id: string, data: Partial<Omit<Plan, "id">>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  // Tenant management
  addTenant: (data: { name: string; ownerEmail: string; plan: string; pixKey?: string; bankName?: string; bankAgency?: string; bankAccount?: string; holderName?: string; holderDocument?: string }) => Promise<Tenant>;
  updateTenant: (id: string, data: Partial<Omit<Tenant, "id" | "createdAt">>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultPageConfigs: Record<string, PageConfig> = {
  "estetica-avancada": { photoUrl: null, expertName: "Equipe Médica", expertSubtitle: "Obstetrícia & Pré-Natal", pageTitle: "Pré-Natal & Consultas", pageDescription: "" },
  "nucleo-materno": { photoUrl: null, expertName: "Equipe Especializada", expertSubtitle: "Acompanhamento Gestacional", pageTitle: "Linha do Tempo & Cuidados Gestacionais", pageDescription: "" },
  "produtos-programas": { photoUrl: null, expertName: "Loja Gestante", expertSubtitle: "Produtos Selecionados", pageTitle: "Produtos para Gestantes", pageDescription: "" },
  
};

const defaultSectionVisibility: SectionVisibility = { services: true, blog: true, testimonials: true };

const defaults: SystemSettings = {
  id: "",
   companyName: "LeMater",
   companyShortName: "LeMater",
   companySubtitle: "Acompanhamento Gestacional",
  logoUrl: null,
  heroPhotoUrl: null,
  heroCardName: "Equipe GestaCare",
  heroCardSubtitle: "Especialistas em Saúde Materna",
  heroDescription: "Acompanhamento gestacional completo com consultas pré-natal, linha do tempo da gestação, registro clínico digital e serviços especializados para gestantes e puérperas.",
  tenantId: null,
  pageConfigs: defaultPageConfigs,
  sectionVisibility: defaultSectionVisibility,
};

const SystemSettingsContext = createContext<SystemSettingsContextType>({
  settings: defaults,
  paymentTypes: [],
  tenants: [],
  plans: [],
  activeTenantId: null,
  logoSrc: logoFallback,
  loading: true,
  setActiveTenantId: () => {},
  updateSettings: async () => {},
  uploadLogo: async () => "",
  uploadHeroPhoto: async () => "",
  uploadPagePhoto: async () => "",
  updatePageConfig: async () => {},
  updateSectionVisibility: async () => {},
  addPaymentType: async () => {},
  togglePaymentType: async () => {},
  deletePaymentType: async () => {},
  addPlan: async () => ({} as Plan),
  updatePlan: async () => {},
  deletePlan: async () => {},
  addTenant: async () => ({} as Tenant),
  updateTenant: async () => {},
  deleteTenant: async () => {},
  refresh: async () => {},
});

export const useSystemSettings = () => useContext(SystemSettingsContext);

export const SystemSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaults);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    const { data } = await supabase.from("plans" as any).select("*").order("price_monthly", { ascending: true });
    if (data) {
      const mapped = (data as any[]).map((p: any) => ({
        id: p.id,
        name: p.name,
        priceMonthly: Number(p.price_monthly),
        description: p.description || "",
        features: p.features || [],
        active: p.active,
      }));
      setPlans(mapped);
      return mapped;
    }
    return [];
  }, []);

  const fetchTenants = useCallback(async () => {
    const { data } = await supabase.from("tenants" as any).select("*").order("created_at", { ascending: true });
    if (data) {
      const mapped = (data as any[]).map((t: any) => ({
        id: t.id,
        name: t.name,
        ownerEmail: t.owner_email,
        plan: t.plan,
        active: t.active,
        createdAt: t.created_at,
        pixKey: t.pix_key || "",
        bankName: t.bank_name || "",
        bankAgency: t.bank_agency || "",
        bankAccount: t.bank_account || "",
        holderName: t.holder_name || "",
        holderDocument: t.holder_document || "",
      }));
      setTenants(mapped);
      if (!activeTenantId && mapped.length > 0) {
        setActiveTenantId(mapped[0].id);
      }
      return mapped;
    }
    return [];
  }, [activeTenantId]);

  const fetchSettingsForTenant = useCallback(async (tenantId: string) => {
    const [{ data: sData }, { data: pData }] = await Promise.all([
      supabase.from("system_settings" as any).select("*").eq("tenant_id", tenantId).limit(1).single(),
      supabase.from("payment_types" as any).select("*").eq("tenant_id", tenantId).order("created_at", { ascending: true }),
    ]);
    if (sData) {
      const s = sData as any;
      setSettings({ id: s.id, companyName: s.company_name, companyShortName: s.company_short_name, companySubtitle: s.company_subtitle, logoUrl: s.logo_url, heroPhotoUrl: s.hero_photo_url || null, heroCardName: s.hero_card_name || "Rayssa Leslie", heroCardSubtitle: s.hero_card_subtitle || "Esteticista & Enfermeira Obstetra", heroDescription: s.hero_description || "", tenantId: s.tenant_id, pageConfigs: s.page_configs || defaultPageConfigs, sectionVisibility: s.section_visibility || defaultSectionVisibility });
    } else {
      const tenant = tenants.find(t => t.id === tenantId);
      const { data: newS } = await supabase.from("system_settings" as any).insert({
        company_name: tenant?.name || "Minha Empresa", company_short_name: tenant?.name?.split(" ")[0] || "Empresa", company_subtitle: "Estética & Saúde", tenant_id: tenantId,
      }).select().single();
      if (newS) {
        const s = newS as any;
        setSettings({ id: s.id, companyName: s.company_name, companyShortName: s.company_short_name, companySubtitle: s.company_subtitle, logoUrl: s.logo_url, heroPhotoUrl: s.hero_photo_url || null, heroCardName: s.hero_card_name || "Rayssa Leslie", heroCardSubtitle: s.hero_card_subtitle || "Esteticista & Enfermeira Obstetra", heroDescription: s.hero_description || "", tenantId: s.tenant_id, pageConfigs: s.page_configs || defaultPageConfigs, sectionVisibility: s.section_visibility || defaultSectionVisibility });
      }
    }
    if (pData) {
      setPaymentTypes((pData as any[]).map((p: any) => ({ id: p.id, name: p.name, active: p.active, tenantId: p.tenant_id })));
    } else {
      setPaymentTypes([]);
    }
  }, [tenants]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await fetchPlans();
    const mapped = await fetchTenants();
    if (mapped.length > 0) {
      const tid = activeTenantId || mapped[0].id;
      await fetchSettingsForTenant(tid);
    }
    setLoading(false);
  }, [fetchPlans, fetchTenants, fetchSettingsForTenant, activeTenantId]);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (activeTenantId) fetchSettingsForTenant(activeTenantId);
  }, [activeTenantId]);

  // Settings
  const updateSettings = async (partial: Partial<Omit<SystemSettings, "id" | "tenantId">>) => {
    const mapped: Record<string, any> = {};
    if (partial.companyName !== undefined) mapped.company_name = partial.companyName;
    if (partial.companyShortName !== undefined) mapped.company_short_name = partial.companyShortName;
    if (partial.companySubtitle !== undefined) mapped.company_subtitle = partial.companySubtitle;
    if (partial.logoUrl !== undefined) mapped.logo_url = partial.logoUrl;
    if (partial.heroPhotoUrl !== undefined) mapped.hero_photo_url = partial.heroPhotoUrl;
    if (partial.heroCardName !== undefined) mapped.hero_card_name = partial.heroCardName;
    if (partial.heroCardSubtitle !== undefined) mapped.hero_card_subtitle = partial.heroCardSubtitle;
    if (partial.heroDescription !== undefined) mapped.hero_description = partial.heroDescription;
    if (partial.pageConfigs !== undefined) mapped.page_configs = partial.pageConfigs;
    if (partial.sectionVisibility !== undefined) mapped.section_visibility = partial.sectionVisibility;
    mapped.updated_at = new Date().toISOString();
    await supabase.from("system_settings" as any).update(mapped).eq("id", settings.id);
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const uploadLogo = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${activeTenantId || "default"}/logo.${ext}`;
    await supabase.storage.from("system-assets").remove([path]);
    const { error } = await supabase.storage.from("system-assets").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("system-assets").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    await updateSettings({ logoUrl: url });
    return url;
  };

  const uploadHeroPhoto = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${activeTenantId || "default"}/hero-photo.${ext}`;
    await supabase.storage.from("system-assets").remove([path]);
    const { error } = await supabase.storage.from("system-assets").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("system-assets").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    await updateSettings({ heroPhotoUrl: url });
    return url;
  };

  const uploadPagePhoto = async (pageKey: string, file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${activeTenantId || "default"}/page-${pageKey}.${ext}`;
    await supabase.storage.from("system-assets").remove([path]);
    const { error } = await supabase.storage.from("system-assets").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("system-assets").getPublicUrl(path);
    const url = data.publicUrl + "?t=" + Date.now();
    const newConfigs = { ...settings.pageConfigs, [pageKey]: { ...settings.pageConfigs[pageKey], photoUrl: url } };
    await updateSettings({ pageConfigs: newConfigs });
    return url;
  };

  const updatePageConfig = async (pageKey: string, data: Partial<PageConfig>) => {
    const newConfigs = { ...settings.pageConfigs, [pageKey]: { ...settings.pageConfigs[pageKey], ...data } };
    await updateSettings({ pageConfigs: newConfigs });
  };

  const updateSectionVisibility = async (data: Partial<SectionVisibility>) => {
    const newVis = { ...settings.sectionVisibility, ...data };
    await updateSettings({ sectionVisibility: newVis });
  };

  // Payment types
  const addPaymentType = async (name: string) => {
    const { data } = await supabase.from("payment_types" as any).insert({ name, tenant_id: activeTenantId }).select().single();
    if (data) { const d = data as any; setPaymentTypes((prev) => [...prev, { id: d.id, name: d.name, active: d.active, tenantId: d.tenant_id }]); }
  };
  const togglePaymentType = async (id: string, active: boolean) => {
    await supabase.from("payment_types" as any).update({ active }).eq("id", id);
    setPaymentTypes((prev) => prev.map((p) => (p.id === id ? { ...p, active } : p)));
  };
  const deletePaymentType = async (id: string) => {
    await supabase.from("payment_types" as any).delete().eq("id", id);
    setPaymentTypes((prev) => prev.filter((p) => p.id !== id));
  };

  // Plans CRUD
  const addPlan = async (data: Omit<Plan, "id">): Promise<Plan> => {
    const { data: row } = await supabase.from("plans" as any).insert({
      name: data.name, price_monthly: data.priceMonthly, description: data.description, features: data.features, active: data.active,
    }).select().single();
    const r = row as any;
    const plan: Plan = { id: r.id, name: r.name, priceMonthly: Number(r.price_monthly), description: r.description, features: r.features || [], active: r.active };
    setPlans((prev) => [...prev, plan]);
    return plan;
  };

  const updatePlan = async (id: string, data: Partial<Omit<Plan, "id">>) => {
    const mapped: Record<string, any> = {};
    if (data.name !== undefined) mapped.name = data.name;
    if (data.priceMonthly !== undefined) mapped.price_monthly = data.priceMonthly;
    if (data.description !== undefined) mapped.description = data.description;
    if (data.features !== undefined) mapped.features = data.features;
    if (data.active !== undefined) mapped.active = data.active;
    mapped.updated_at = new Date().toISOString();
    await supabase.from("plans" as any).update(mapped).eq("id", id);
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const deletePlan = async (id: string) => {
    await supabase.from("plans" as any).delete().eq("id", id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  // Tenant CRUD
  const addTenant = async (data: { name: string; ownerEmail: string; plan: string; pixKey?: string; bankName?: string; bankAgency?: string; bankAccount?: string; holderName?: string; holderDocument?: string }): Promise<Tenant> => {
    const { data: row } = await supabase.from("tenants" as any).insert({
      name: data.name, owner_email: data.ownerEmail, plan: data.plan,
      pix_key: data.pixKey || "", bank_name: data.bankName || "", bank_agency: data.bankAgency || "",
      bank_account: data.bankAccount || "", holder_name: data.holderName || "", holder_document: data.holderDocument || "",
    }).select().single();
    const r = row as any;
    const tenant: Tenant = {
      id: r.id, name: r.name, ownerEmail: r.owner_email, plan: r.plan, active: r.active, createdAt: r.created_at,
      pixKey: r.pix_key || "", bankName: r.bank_name || "", bankAgency: r.bank_agency || "",
      bankAccount: r.bank_account || "", holderName: r.holder_name || "", holderDocument: r.holder_document || "",
    };
    setTenants((prev) => [...prev, tenant]);
    // Create default settings
    await supabase.from("system_settings" as any).insert({ company_name: data.name, company_short_name: data.name.split(" ")[0], company_subtitle: "Estética & Saúde", tenant_id: tenant.id });
    // Create default payment types
    const defaultPayments = ["Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito"];
    for (const pm of defaultPayments) {
      await supabase.from("payment_types" as any).insert({ name: pm, tenant_id: tenant.id });
    }
    return tenant;
  };

  const updateTenant = async (id: string, data: Partial<Omit<Tenant, "id" | "createdAt">>) => {
    const mapped: Record<string, any> = {};
    if (data.name !== undefined) mapped.name = data.name;
    if (data.ownerEmail !== undefined) mapped.owner_email = data.ownerEmail;
    if (data.plan !== undefined) mapped.plan = data.plan;
    if (data.active !== undefined) mapped.active = data.active;
    if (data.pixKey !== undefined) mapped.pix_key = data.pixKey;
    if (data.bankName !== undefined) mapped.bank_name = data.bankName;
    if (data.bankAgency !== undefined) mapped.bank_agency = data.bankAgency;
    if (data.bankAccount !== undefined) mapped.bank_account = data.bankAccount;
    if (data.holderName !== undefined) mapped.holder_name = data.holderName;
    if (data.holderDocument !== undefined) mapped.holder_document = data.holderDocument;
    mapped.updated_at = new Date().toISOString();
    await supabase.from("tenants" as any).update(mapped).eq("id", id);
    setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };

  const deleteTenant = async (id: string) => {
    await supabase.from("tenants" as any).delete().eq("id", id);
    setTenants((prev) => prev.filter((t) => t.id !== id));
    if (activeTenantId === id) {
      const remaining = tenants.filter((t) => t.id !== id);
      setActiveTenantId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const logoSrc = settings.logoUrl || logoFallback;

  return (
    <SystemSettingsContext.Provider
      value={{
        settings, paymentTypes, tenants, plans, activeTenantId, logoSrc, loading,
        setActiveTenantId, updateSettings, uploadLogo, uploadHeroPhoto, uploadPagePhoto, updatePageConfig, updateSectionVisibility,
        addPaymentType, togglePaymentType, deletePaymentType,
        addPlan, updatePlan, deletePlan, addTenant, updateTenant, deleteTenant, refresh: fetchAll,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
};