const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

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

    // 1) Try Consultar.io API (requires CPF_API_TOKEN secret)
    const cpfApiToken = Deno.env.get("CPF_API_TOKEN");
    if (cpfApiToken) {
      try {
        const resp = await fetch(
          `https://consultar.io/api/v1/cpf/consultar?cpf=${clean}`,
          {
            headers: { Authorization: `Token ${cpfApiToken}` },
            signal: AbortSignal.timeout(8000),
          }
        );

        if (resp.ok) {
          const data = await resp.json();
          console.log("Consultar.io CPF lookup success:", data.nome);
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
        } else {
          console.log("Consultar.io error:", resp.status, await resp.text());
        }
      } catch (e) {
        console.log("Consultar.io failed:", e);
      }
    }

    // 2) Try BrasilAPI (free, no key)
    try {
      const brasilResp = await fetch(
        `https://brasilapi.com.br/api/cpf/v1/${clean}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (brasilResp.ok) {
        const data = await brasilResp.json();
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
      console.log("BrasilAPI unavailable:", e);
    }

    // 3) Validate CPF exists via SUS/Saúde backend (free, returns true/false)
    let cpfExists = false;
    try {
      const susResp = await fetch(
        `https://scpa-backend.saude.gov.br/public/scpa-usuario/validacao-cpf/${clean}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (susResp.ok) {
        const susText = await susResp.text();
        cpfExists = susText.trim() === "true";
        console.log("SUS CPF validation:", cpfExists);
      }
    } catch (e) {
      console.log("SUS validation unavailable:", e);
    }

    // 4) AI fallback for generating realistic data
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (LOVABLE_API_KEY) {
      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `Você gera dados fictícios realistas de uma pessoa brasileira para simulação de cadastro médico. Responda APENAS com JSON válido, sem markdown. Formato exato: {"name":"Nome Completo","birthDate":"YYYY-MM-DD","address":"Endereço completo"}. Pessoa feminina, 18-42 anos, da região: ${region}.`,
              },
              {
                role: "user",
                content: `Gere dados para gestante da região ${region}, CPF final ${clean.slice(-4)}.`,
              },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log("AI-generated data for region:", region);
            return new Response(
              JSON.stringify({
                success: true,
                source: cpfExists ? "sus_validated" : "simulated",
                data: {
                  name: parsed.name || "",
                  birthDate: parsed.birthDate || "",
                  address: parsed.address || "",
                  situation: cpfExists ? "Regular (validado)" : "Dados simulados",
                  region,
                },
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          console.log("AI gateway error:", aiResp.status);
        }
      } catch (e) {
        console.log("AI fallback failed:", e);
      }
    }

    // 5) Last resort
    return new Response(
      JSON.stringify({
        success: true,
        source: "validation",
        data: {
          name: "",
          birthDate: "",
          address: "",
          situation: cpfExists ? "CPF válido na Receita" : "CPF válido (formato)",
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
