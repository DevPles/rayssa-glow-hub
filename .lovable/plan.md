

## Plano: Videochamadas Nativas no Navegador (WebRTC)

Implementar videochamadas peer-to-peer usando WebRTC nativo do navegador, com sinalização via banco de dados em tempo real (Realtime).

### Como funciona

```text
Admin (Médica)                    Paciente (Dashboard)
     │                                    │
     ├── Cria sala de vídeo ──────────────┤
     │   (registra no banco)              │
     │                                    │
     ├── Troca de sinais WebRTC ──────────┤
     │   (via Realtime / canal)           │
     │                                    │
     └── Conexão P2P estabelecida ────────┘
         (vídeo direto entre navegadores)
```

### Etapas

1. **Criar tabelas no banco de dados**
   - `video_rooms` — salas de vídeo (id, created_by, patient_id, status, created_at)
   - `video_signals` — sinais WebRTC/SDP/ICE trocados entre os participantes (room_id, sender, type, payload)
   - Habilitar Realtime na tabela `video_signals` para troca instantânea de sinais
   - RLS: apenas participantes da sala podem ler/escrever

2. **Criar componente de videochamada**
   - `src/components/VideoCall.tsx` — componente reutilizável com:
     - Captura de câmera/microfone (`getUserMedia`)
     - Conexão WebRTC (`RTCPeerConnection`) com servidores STUN públicos do Google
     - Controles: ligar/desligar câmera, mudo, encerrar chamada
     - Exibição do vídeo local (pequeno) e remoto (tela cheia)

3. **Adicionar videochamada no painel admin**
   - Na página de agendamentos ou na aba de agenda, botão "Iniciar Videochamada" ao lado de cada consulta
   - Ao clicar, cria a sala e abre o componente de vídeo
   - Rota `/admin/videochamada/:roomId`

4. **Adicionar videochamada no dashboard da paciente**
   - Indicador de "Chamada disponível" quando a médica iniciar
   - Botão "Entrar na Videochamada" que conecta à sala existente
   - Modal/página de vídeo com os mesmos controles

5. **Atualizar rotas e navegação**
   - Adicionar rotas no `App.tsx`
   - Links de acesso rápido no admin e no dashboard

### Limitações importantes

- **WebRTC P2P** funciona bem para chamadas 1-a-1, mas não escala para grupos grandes
- Usa servidores STUN gratuitos do Google para descoberta de rede (não garante funcionamento atrás de NATs restritivos — sem servidor TURN)
- A qualidade depende da conexão de internet de ambas as partes

### Arquivos que serão criados/editados

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabelas `video_rooms` e `video_signals` |
| `src/components/VideoCall.tsx` | Novo — componente principal |
| `src/hooks/useVideoCall.ts` | Novo — lógica WebRTC + sinalização |
| `src/pages/admin/AdminVideoCall.tsx` | Novo — página admin |
| `src/pages/DashboardCliente.tsx` | Editar — adicionar acesso à chamada |
| `src/App.tsx` | Editar — adicionar rotas |

