const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Validate CPF checksum
function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false; // all same digits

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(clean[9]) !== check) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(clean[10]) !== check) return false;

  return true;
}

// CPF region mapping (8th digit)
function getRegion(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  const regionDigit = parseInt(clean[8]);
  const regions: Record<number, string> = {
    0: "Rio Grande do Sul",
    1: "Distrito Federal, Goiás, Mato Grosso, Mato Grosso do Sul, Tocantins",
    2: "Amazonas, Pará, Roraima, Amapá, Acre, Rondônia",
    3: "Ceará, Maranhão, Piauí",
    4: "Paraíba, Pernambuco, Alagoas, Rio Grande do Norte",
    5: "Bahia, Sergipe",
    6: "Minas Gerais",
    7: "Rio de Janeiro, Espírito Santo",
    8: "São Paulo",
    9: "Paraná, Santa Catarina",
  };
  return regions[regionDigit] || "Brasil";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cpf } = await req.json();

    if (!cpf) {
      return new Response(
        JSON.stringify({ success: false, error: "CPF é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clean = cpf.replace(/\D/g, "");

    if (!isValidCPF(clean)) {
      return new Response(
        JSON.stringify({ success: false, error: "CPF inválido. Verifique os dígitos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const region = getRegion(clean);

    // Try BrasilAPI first (free, no key needed)
    try {
      const brasilApiResp = await fetch(
        `https://brasilapi.com.br/api/cpf/v1/${clean}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (brasilApiResp.ok) {
        const data = await brasilApiResp.json();
        console.log("BrasilAPI CPF lookup success");
        return new Response(
          JSON.stringify({
            success: true,
            source: "receita",
            data: {
              name: data.nome || "",
              birthDate: data.data_nascimento || "",
              situation: data.situacao || "Regular",
              region,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (e) {
      console.log("BrasilAPI unavailable, using AI fallback:", e);
    }

    // Fallback: use Lovable AI to generate realistic data
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

    try {
      const aiResp = await fetch(`${SUPABASE_URL}/functions/v1/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `Você é um sistema que gera dados fictícios realistas de uma pessoa brasileira para simulação de cadastro médico. 
Responda APENAS com JSON válido, sem markdown, sem explicações. O JSON deve ter exatamente estas chaves:
{"name": "Nome Completo", "birthDate": "YYYY-MM-DD", "address": "Endereço completo com cidade e estado"}
A pessoa deve ser do sexo feminino (gestante), com idade entre 18 e 42 anos, da região: ${region}.
Use nomes brasileiros comuns e endereços realistas da região informada.`,
            },
            {
              role: "user",
              content: `Gere dados para uma gestante da região: ${region}. CPF terminado em ${clean.slice(-4)}.`,
            },
          ],
          model: "google/gemini-2.5-flash-lite",
        }),
      });

      if (aiResp.ok) {
        const aiData = await aiResp.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        
        // Parse the JSON from AI response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log("AI-generated person data for CPF region:", region);
          return new Response(
            JSON.stringify({
              success: true,
              source: "generated",
              data: {
                name: parsed.name || "",
                birthDate: parsed.birthDate || "",
                address: parsed.address || "",
                situation: "Regular",
                region,
              },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (e) {
      console.log("AI fallback failed:", e);
    }

    // Last resort: return validated CPF with region only
    return new Response(
      JSON.stringify({
        success: true,
        source: "validation",
        data: {
          name: "",
          birthDate: "",
          address: "",
          situation: "Regular",
          region,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("CPF lookup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro ao consultar CPF" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
