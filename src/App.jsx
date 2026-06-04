import { useState, useEffect, useRef } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// ── THEME ────────────────────────────────────────────────────────────────────

// ── FIREBASE ──────────────────────────────────────────────────────────────────
// Firebase is optional: if window.FIREBASE_CONFIG is not set, app runs locally.
const FB = (() => {
  try {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg) return null;

    // Load Firebase from CDN (injected in HTML)
    const app  = firebase.initializeApp(cfg);
    const auth = firebase.auth();
    const db   = firebase.firestore();

    // Persistence: keep user logged in across sessions
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    return { auth, db };
  } catch(e) {
    console.warn('[SecOps Quest] Firebase not configured — running in local mode');
    return null;
  }
})();

// Save user progress to Firestore
async function fbSave(userId, data) {
  if (!FB) return;
  try {
    await FB.db.doc(`users/${userId}`).set(data, { merge: true });
  } catch(e) { console.warn('fbSave failed', e.message); }
}

// Load user progress from Firestore
async function fbLoad(userId) {
  if (!FB) return null;
  try {
    const snap = await FB.db.doc(`users/${userId}`).get();
    return snap.exists ? snap.data() : null;
  } catch(e) { console.warn('fbLoad failed', e.message); return null; }
}

// Update leaderboard entry
async function fbLeaderboard(userId, entry) {
  if (!FB) return;
  try {
    await FB.db.doc(`leaderboard/${userId}`).set({
      ...entry, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch(e) { console.warn('fbLeaderboard failed', e.message); }
}

// Fetch leaderboard top 50
async function fbGetLeaderboard() {
  if (!FB) return [];
  try {
    const snap = await FB.db.collection('leaderboard')
      .orderBy('dx', 'desc').limit(50).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) { console.warn('fbGetLeaderboard failed', e.message); return []; }
}

// ─────────────────────────────────────────────────────────────────────────────

const DARK = {
  // Base surfaces — from Sizing Tool exact values
  bg:"#0a0b0c", surface:"#1c1e21", surface2:"#15171a", border:"rgba(255,255,255,0.07)", borderBright:"rgba(255,255,255,0.15)",
  // Card depth
  cardBg:"#1c1e21", cardDepth:"rgba(255,255,255,0.07)",
  // Text hierarchy
  text:"#f0f0f1", textMid:"#c6c6c7", textDim:"#6b7580",
  // Accent — pink/magenta from Sizing Tool
  accent:"#ff1a75", accentDim:"rgba(255,26,117,0.12)", accentBorder:"rgba(255,26,117,0.28)",
  // Semantic colors
  cyan:"#00c4cc", cyanDim:"rgba(0,196,204,0.12)",
  green:"#22d3a0", greenDim:"rgba(34,211,160,0.12)", greenShadow:"#0d9e78",
  red:"#ff4d4d",  redDim:"rgba(255,77,77,0.12)",   redShadow:"#cc0000",
  amber:"#f59e0b", amberDim:"rgba(245,158,11,0.12)",
  purple:"#a78bfa", purpleDim:"rgba(167,139,250,0.12)",
  pink:"#ff1a75",  orange:"#fb923c", teal:"#00c4cc", tealDim:"rgba(0,196,204,0.12)",
  indigo:"#6366f1", blue:"#3b82f6",
  // Quiz states
  correct:"#22d3a0", correctBg:"rgba(34,211,160,0.12)", correctBorder:"rgba(34,211,160,0.3)",
  wrong:"#ff4d4d",   wrongBg:"rgba(255,77,77,0.12)",    wrongBorder:"rgba(255,77,77,0.3)",
  optionBorder:"rgba(255,255,255,0.1)", optionSelected:"rgba(255,26,117,0.18)", optionBg:"#1c1e21",
  // 3D button shadows
  btn3d_green:"#0d9e78", btn3d_cyan:"#0090a0", btn3d_amber:"#b45309", btn3d_red:"#cc0000",
  btn3d_purple:"#7c3aed", btn3d_teal:"#0090a0", btn3d_orange:"#c2410c",
  btnRadius:14,
};

// Dark theme only
const C = DARK;
const F = { mono:"'Roboto Mono','Share Tech Mono',monospace", display:"'Inter','Nunito',sans-serif", sans:"'Inter','Nunito',sans-serif" };

// ─── LOGO SVG ────────────────────────────────────────────────────────────────
function Logo({ size=80 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 560"
      width={size} height={size * 560/680} style={{ display:"block" }}>
      <defs>
        <style>{`
          .lg-bg   { fill: #07080f; }
          .lg-bm   { fill: none; stroke: #4ade80; stroke-width: 3.5; }
          .lg-bi   { fill: none; stroke: #4ade80; stroke-width: 1; opacity: 0.25; }
          .lg-glow { fill: #4ade80; opacity: 0.07; }
          .lg-cir  { stroke: #38bdf8; stroke-width: 1.2; fill: none; opacity: 0.3; }
          .lg-dot  { fill: #38bdf8; opacity: 0.5; }
          .lg-dg   { fill: #4ade80; opacity: 0.6; }
          .lg-lb   { fill: #4ade80; }
          .lg-ls   { fill: none; stroke: #4ade80; stroke-width: 9; stroke-linecap: round; }
          .lg-li   { fill: #07080f; }
          .lg-er   { fill: none; stroke: #38bdf8; stroke-width: 2; opacity: 0.6; }
          .lg-ed   { fill: #38bdf8; }
          .lg-pul  { fill: none; stroke: #4ade80; stroke-width: 1; opacity: 0.15; }
          .lg-tick { fill: none; stroke: #4ade80; stroke-width: 2.5; stroke-linecap: round; }
        `}</style>
      </defs>
      <ellipse cx="340" cy="305" rx="195" ry="215" className="lg-glow"/>
      <ellipse cx="340" cy="305" rx="155" ry="170" className="lg-pul"/>
      <ellipse cx="340" cy="305" rx="130" ry="143" className="lg-pul" opacity="0.1"/>
      <path d="M340 82 L498 142 L498 318 Q498 448 340 538 Q182 448 182 318 L182 142 Z" className="lg-bg"/>
      <path d="M340 82 L498 142 L498 318 Q498 448 340 538 Q182 448 182 318 L182 142 Z" className="lg-bm"/>
      <path d="M340 108 L474 162 L474 316 Q474 432 340 512 Q206 432 206 316 L206 162 Z" className="lg-bi"/>
      <path d="M204 160 L204 176 L220 176" className="lg-tick"/>
      <path d="M476 160 L476 176 L460 176" className="lg-tick"/>
      <path d="M330 526 L340 537 L350 526" className="lg-tick"/>
      <line x1="220" y1="200" x2="270" y2="200" className="lg-cir"/>
      <line x1="220" y1="200" x2="220" y2="220" className="lg-cir"/>
      <circle cx="220" cy="223" r="3" className="lg-dot"/>
      <line x1="270" y1="200" x2="270" y2="182" className="lg-cir"/>
      <circle cx="270" cy="180" r="2.5" className="lg-dg"/>
      <line x1="410" y1="200" x2="460" y2="200" className="lg-cir"/>
      <line x1="460" y1="200" x2="460" y2="220" className="lg-cir"/>
      <circle cx="460" cy="223" r="3" className="lg-dot"/>
      <line x1="410" y1="200" x2="410" y2="182" className="lg-cir"/>
      <circle cx="410" cy="180" r="2.5" className="lg-dg"/>
      <line x1="255" y1="430" x2="255" y2="455" className="lg-cir"/>
      <line x1="255" y1="430" x2="290" y2="430" className="lg-cir"/>
      <circle cx="255" cy="458" r="2.5" className="lg-dot"/>
      <line x1="425" y1="430" x2="425" y2="455" className="lg-cir"/>
      <line x1="390" y1="430" x2="425" y2="430" className="lg-cir"/>
      <circle cx="425" cy="458" r="2.5" className="lg-dot"/>
      <path d="M298 300 L298 264 Q298 230 340 230 Q382 230 382 264 L382 300" className="lg-ls"/>
      <rect x="278" y="298" width="124" height="96" rx="14" className="lg-lb"/>
      <rect x="285" y="305" width="110" height="82" rx="10" className="lg-li"/>
      <circle cx="340" cy="334" r="18" fill="#4ade80" opacity="0.9"/>
      <circle cx="340" cy="334" r="10" className="lg-li"/>
      <rect x="334" y="344" width="12" height="20" rx="4" fill="#4ade80" opacity="0.9"/>
      <circle cx="340" cy="310" r="74" className="lg-er"/>
      <circle cx="340" cy="310" r="58" stroke="#38bdf8" strokeWidth="1" fill="none" opacity="0.2"/>
      <circle cx="340" cy="236" r="3.5" className="lg-ed" opacity="0.5"/>
      <circle cx="414" cy="310" r="3.5" className="lg-ed" opacity="0.5"/>
      <circle cx="266" cy="310" r="3.5" className="lg-ed" opacity="0.5"/>
      <circle cx="340" cy="384" r="3.5" className="lg-ed" opacity="0.5"/>
      <circle cx="215" cy="350" r="2.5" className="lg-dg" opacity="0.5"/>
      <circle cx="465" cy="350" r="2.5" className="lg-dg" opacity="0.5"/>
    </svg>
  );
}


// ─── GLOSSÁRIO ────────────────────────────────────────────────────────────────
const GLOSSARIO = [
  { term:"UDM",            cat:"Arquitetura", def:"Unified Data Model — schema padrão do Google SecOps para normalizar logs de qualquer fabricante num formato comum. Uma regra YARA-L escrita sobre UDM funciona para todos os produtos." },
  { term:"Raw Log",        cat:"Arquitetura", def:"Log bruto original, exatamente como chegou do produto antes da normalização. O Google SecOps armazena raw log e UDM lado a lado para auditoria." },
  { term:"Parser",         cat:"Arquitetura", def:"Componente que lê o raw log de um produto específico e converte para campos UDM. O Google mantém +500 parsers prontos para os principais fabricantes." },
  { term:"SIEM",           cat:"Arquitetura", def:"Security Information and Event Management — sistema que centraliza, correlaciona e analisa logs de segurança em tempo real." },
  { term:"SOAR",           cat:"Arquitetura", def:"Security Orchestration, Automation and Response — automatiza respostas a incidentes via Playbooks. Integrado nativamente ao Google SecOps." },
  { term:"Rules Engine",   cat:"Arquitetura", def:"Motor do Google SecOps que executa regras YARA-L continuamente sobre eventos normalizados e gera Detections quando as condições são atendidas." },
  { term:"Detection",      cat:"Arquitetura", def:"Alerta gerado pelo Rules Engine quando uma regra YARA-L casa com eventos. Aparece na fila de triagem do SOC para investigação." },
  { term:"BindPlane",      cat:"Arquitetura", def:"Agente de coleta de logs open-source que envia dados de fontes on-premises para o Google SecOps. É a principal opção de Forwarder." },


  { term:"Playbook",       cat:"Arquitetura", def:"Fluxo automatizado no SOAR que define ações em resposta a um alerta: abrir ticket no Jira, bloquear IP, notificar Slack, isolar endpoint." },
  { term:"event_type",     cat:"UDM",        def:"Campo obrigatório em todo evento UDM que define o tipo de atividade. Ex: USER_LOGIN, NETWORK_CONNECTION, FILE_CREATION, NETWORK_DNS, PROCESS_LAUNCH." },
  { term:"principal",      cat:"UDM",        def:"Seção UDM que representa o ator que iniciou a ação — IP de origem ($e.principal.ip), hostname, usuário ($e.principal.user.userid), processo pai." },
  { term:"target",         cat:"UDM",        def:"Seção UDM que representa o alvo da ação — IP de destino ($e.target.ip), porta ($e.target.port), arquivo ($e.target.file.full_path), usuário-alvo." },
  { term:"metadata",       cat:"UDM",        def:"Seção presente em todo evento UDM. Contém event_type, event_timestamp, product_name e vendor_name." },
  { term:"security_result",cat:"UDM",        def:"Seção com a decisão de segurança tomada pelo produto: ALLOW, BLOCK, QUARANTINE, UNKNOWN_ACTION. Acessado via $e.security_result.action." },
  { term:"network",        cat:"UDM",        def:"Seção com dados da camada de rede: bytes enviados ($e.network.sent_bytes), protocolo, campos DNS ($e.network.dns.questions.name), HTTP." },
  { term:"YARA-L",         cat:"YARA-L",    def:"YARA for Logging — linguagem de detecção proprietária do Google SecOps para criar regras que identificam padrões em eventos UDM." },
  { term:"meta",           cat:"YARA-L",    def:"Seção obrigatória da regra com metadados: rule_name, severity, author, mitre_attack_technique_id. Não afeta a lógica de detecção." },
  { term:"events",         cat:"YARA-L",    def:"Seção central da regra com os filtros nos campos UDM. Variáveis $e, $e1, $e2 representam eventos. Toda regra precisa desta seção." },
  { term:"match",          cat:"YARA-L",    def:"Seção opcional que agrupa eventos por uma placeholder variable (ex: $ip) dentro de uma janela de tempo (ex: over 10m). Sem match = evento único." },
  { term:"condition",      cat:"YARA-L",    def:"Seção que define o threshold de disparo. Ex: #e > 5 (mais de 5 eventos), #e >= 1 (qualquer ocorrência), #e1 >= 1 and #e2 >= 1 (ambos presentes)." },
  { term:"outcome",        cat:"YARA-L",    def:"Seção opcional com variáveis calculadas via sum(), count(), max(), array_distinct(). Usada em composite rules e exibida nos alertas do SOAR." },
  { term:"nocase",         cat:"YARA-L",    def:"Modificador que torna o match insensível a maiúsculas/minúsculas. Ex: $e.target.hostname = \"desktop-01\" nocase" },
  { term:"net.ip_in_range_cidr()",         cat:"YARA-L",    def:"Verifica se IP está em range CIDR. Sintaxe: net.ip_in_range_cidr($e.principal.ip, \"10.0.0.0/8\"). Exemplo com not: not net.ip_in_range_cidr($e.target.ip, \"192.168.0.0/16\")" },
  { term:"re.regex()",     cat:"YARA-L",    def:"Função de expressão regular com backticks para o padrão. Ex: re.regex($e.target.process.file.full_path, `cmd\\.exe|powershell\\.exe`) nocase" },
  { term:"re.capture()",   cat:"YARA-L",    def:"Extrai um grupo de captura de um campo para uma variável. Ex: $domain = re.capture($e.network.dns.questions.name, `\\.([^.]+)\\.[^.]+$`)" },
  { term:"in %",           cat:"YARA-L",    def:"Verifica se um campo está em uma reference list. Ex: $e.target.hostname in %blocklist_domains. Prefixo % sempre indica reference list." },
  { term:"BindPlane Agent",     cat:"Ingestão",  def:"Pipeline de telemetria moderno para coleta on-prem de logs (Windows, Linux, firewalls). Substituto recomendado do Forwarder legado. Gerenciado via BindPlane OP console. Suporta OpenTelemetry. Envia ao Google SecOps via Ingestion API." },
  { term:"Connector",            cat:"Ingestão",  def:"Componente SOAR baixado via Content Hub que ingere alertas de fontes externas (EDR, NGFW, cloud) para o Google SecOps SOAR. Diferente de Feed (ingesta logs brutos no SIEM) — Connector ingesta alertas já processados para o workflow de resposta." },
  { term:"Feed",                cat:"Ingestão",  def:"Mecanismo de ingestão configurado na UI do SecOps. Tipos: Pull (GCS, S3, APIs de terceiros), Push/Webhook (HTTPS endpoint), Pub/Sub (GCP nativo), Amazon Data Firehose." },
  { term:"Webhook HTTPS Push",  cat:"Ingestão",  def:"Método push onde a fonte envia logs ao endpoint HTTPS do SecOps. Limite: 4MB/request, 15.000 QPS. Auth via API key no header. Útil para ferramentas SaaS com suporte a webhook." },
  { term:"Forwarder",           cat:"Ingestão",  def:"Componente de software legado que coleta logs/packets na rede do cliente e envia ao Google SecOps. Ainda documentado e funcional. Para novos projetos, o BindPlane Agent é o substituto moderno com gerenciamento centralizado e suporte a OpenTelemetry." },
  { term:"Pub/Sub",             cat:"Ingestão",  def:"Integração nativa GCP: Cloud Logging → Log Sink → Pub/Sub Topic → Google SecOps. Sem agente ou BindPlane necessários para logs GCP nativos." },
  { term:"Reference List", cat:"YARA-L",    def:"Lista centralizada no Google SecOps (tipo string, regex ou CIDR) referenciada por regras com %. Atualizar a lista atualiza todas as regras automaticamente." },
  { term:"Composite Rule", cat:"YARA-L",    def:"Regra que opera sobre Detections geradas por outras regras. Campos: $d.detection.outcomes[\"var\"] (outcomes), $d.detection.risk_score, $d.detection.rule_labels.key/value (meta), $d.detection.detection_depth = 0 (anti-loop). Ideal para risk-based alerting somando scores de múltiplas regras." },
  { term:"over",           cat:"YARA-L",    def:"Palavra-chave do match que define a janela de tempo. Ex: $ip over 10m — agrupa eventos do mesmo IP em 10 minutos. Suporta s, m, h, d." },
  { term:"#e / #e1",       cat:"YARA-L",    def:"Na condition, representa a contagem de eventos correspondentes. #e > 5 = mais de 5 eventos. Usar #e1, #e2 para múltiplas variáveis de evento." },
  { term:"Curated Detections", cat:"Operações", def:"Regras YARA-L prontas mantidas pelo Google/Mandiant, mapeadas para MITRE ATT&CK. Atualizam automaticamente. Disponíveis nos pacotes Enterprise e Enterprise Plus." },
  { term:"MITRE ATT&CK",   cat:"Operações", def:"Framework de táticas e técnicas de ataque. 14 táticas, centenas de técnicas. Ex: T1110 = Brute Force, T1055 = Process Injection, T1486 = Data Encrypted for Impact." },
  { term:"IOC",            cat:"Operações", def:"Indicator of Compromise — artefato que indica possível comprometimento: IP malicioso, hash de malware, domínio de C2. Geralmente armazenado em reference lists." },
  { term:"Triage",         cat:"Operações", def:"Processo de avaliação e priorização de alertas na fila do SOC. O Google SecOps possui Triage Agent com IA para automatizar parte deste processo." },
  { term:"Risk Analytics", cat:"Operações", def:"UEBA integrado ao SecOps. Usa entidade como unidade primária. Agrega $risk_score de múltiplas regras para usuários/assets ao longo do tempo com decaimento. Defaults: Alert = 40pts, Detection = 15pts." },
  { term:"Cases & Alerts", cat:"Operações", def:"Cases agrupam Alerts (detecções individuais) correlacionados para investigação. Alert Grouping define agrupamento automático. O analista trabalha no Case com SLA timer e prioridade." },
  { term:"Graph Investigator", cat:"Operações", def:"Ferramenta de visualização em grafo: nós (User, Asset, IP, Domínio, Hash) ligados por eventos. Identifica blast radius e movimento lateral. Disponível na fase Investigate." },
  { term:"Content Hub",    cat:"Operações", def:"Marketplace do SecOps: Integrations, Playbooks prontos, Parsers, Dashboards, Use Cases. Instalável em 1 clique, atualizado automaticamente." },
  { term:"Data RBAC",      cat:"Admin",     def:"Role-Based Access Control nos dados do SecOps. Scoped users: acesso a labels específicos. Global users: acesso total. Risk Analytics exige Global user." },
  { term:"Asset Aliasing", cat:"UDM",       def:"Enriquecimento automático: DHCP → hostname → usuário. O SecOps correlaciona IPs com logs DHCP para adicionar contexto automaticamente, sem join manual em YARA-L." },
];

// ─── GLOSSÁRIO MODAL ──────────────────────────────────────────────────────────
function GlossarioModal({ onClose }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todos");
  const cats = ["Todos", "Arquitetura", "UDM", "YARA-L", "Operações"];
  const filtered = GLOSSARIO.filter(g =>
    (cat === "Todos" || g.cat === cat) &&
    (search === "" || g.term.toLowerCase().includes(search.toLowerCase()) || g.def.toLowerCase().includes(search.toLowerCase()))
  );
  const catColors = { Arquitetura:C.cyan, UDM:C.green, "YARA-L":C.amber, Operações:C.purple };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(5,10,18,0.92)", zIndex:1000, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 18px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, letterSpacing:3 }}>REFERÊNCIA</div>
          <div style={{ fontFamily:F.display, color:C.text, fontSize:22, fontWeight:700 }}>📖 Glossário SecOps</div>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:C.textMid, fontSize:19, cursor:"pointer", padding:0 }}>✕</button>
      </div>

      {/* Search */}
      <div style={{ padding:"12px 18px 0", background:C.surface, flexShrink:0 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar termo..."
          style={{ width:"100%", background:C.bg, border:`1px solid ${C.borderBright}`, borderRadius:10, padding:"10px 14px", fontFamily:F.mono, color:C.text, fontSize:19, outline:"none" }} />
      </div>

      {/* Category filter */}
      <div style={{ display:"flex", gap:6, padding:"10px 18px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0, overflowX:"auto" }}>
        {cats.map(c => (
          <button key={c} onClick={()=>setCat(c)}
            style={{ background:cat===c?(catColors[c]||C.cyan)+"22":C.bg, border:`1px solid ${cat===c?(catColors[c]||C.cyan)+"66":C.border}`, borderRadius:20, padding:"5px 12px", fontFamily:F.mono, color:cat===c?(catColors[c]||C.cyan):C.textDim, fontSize:19, cursor:"pointer", whiteSpace:"nowrap", letterSpacing:1 }}>
            {c}
          </button>
        ))}
      </div>

      {/* Terms list */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px max(16px, calc((100% - 568px) / 2)) 40px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", fontFamily:F.mono, color:C.textDim, fontSize:19, marginTop:40 }}>Nenhum termo encontrado</div>
        )}
        {filtered.map(g => (
          <div key={g.term} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 15px", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ fontFamily:F.display, color:C.text, fontSize:22, fontWeight:700 }}>{g.term}</span>
              <span style={{ fontFamily:F.mono, color:catColors[g.cat]||C.cyan, fontSize:19, background:(catColors[g.cat]||C.cyan)+"18", border:`1px solid ${(catColors[g.cat]||C.cyan)}33`, borderRadius:20, padding:"2px 8px", letterSpacing:1 }}>{g.cat}</span>
            </div>
            <div style={{ fontFamily:F.mono, color:C.textMid, fontSize:19, lineHeight:1.9 }}>{g.def}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


function useAnimVal(target,dur=800){
  const [v,setV]=useState(0);
  useEffect(()=>{
    let s=null;
    const step=ts=>{if(!s)s=ts;const p=Math.min((ts-s)/dur,1);setV(Math.floor(target*p));if(p<1)requestAnimationFrame(step);};
    requestAnimationFrame(step);
  },[target]);
  return v;
}

// ── DUOLINGO-STYLE FEEDBACK BANNER ──────────────────────────────────────────
// ─── DUOLINGO DESIGN SYSTEM ──────────────────────────────────────────────────

// 3D Button — Duolingo signature press effect
function Btn3D({ onClick, color, shadow, disabled, children, style={} }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)}
      onMouseLeave={()=>setPressed(false)}
      onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{ width:"100%", border:"none", borderRadius:C.btnRadius,
        background: disabled ? C.border : color,
        borderBottom: disabled ? `4px solid ${C.textDim}` : `4px solid ${shadow}`,
        padding: pressed ? "18px 16px 14px" : "16px",
        marginTop: pressed ? "4px" : "0px",
        fontFamily:F.display, fontWeight:900, fontSize:11, letterSpacing:".5px",
        color: disabled ? C.textDim : "#fff",
        cursor: disabled ? "default" : "pointer",
        transition:"padding .08s, margin .08s",
        ...style }}>
      {children}
    </button>
  );
}

// Option Card — depth border like Duolingo
function OptionCard({ selected, correct, wrong, disabled, onClick, children, icon }) {
  let bg = C.surface, borderSide = C.cardDepth, borderBot = C.cardDepth, color = C.text;
  if (selected) { bg=C.cyanDim; borderSide=C.cyan; borderBot=C.cyan; color=C.cyan; }
  if (correct)  { bg=C.correctBg; borderSide=C.correct; borderBot=C.btn3d_green; color=C.correct; }
  if (wrong)    { bg=C.wrongBg; borderSide=C.wrong; borderBot=C.btn3d_red; color=C.wrong; }
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ width:"100%", background:bg,
        border:`2px solid ${borderSide}`, borderBottom:`4px solid ${borderBot}`,
        borderRadius:16, padding:"14px 16px", marginBottom:12,
        display:"flex", alignItems:"center", gap:14,
        cursor:disabled?"default":"pointer",
        textAlign:"left", transition:"all .12s", minHeight:58 }}>
      {icon && (
        <div style={{ width:38, height:38, borderRadius:10,
          border:`2px solid ${color}44`, background:color+"18",
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0, fontFamily:F.mono, color, fontSize:19, fontWeight:700 }}>
          {icon}
        </div>
      )}
      <span style={{ fontFamily:F.display, color, fontSize:21, fontWeight:800, lineHeight:1.35, flex:1 }}>
        {children}
      </span>
      {(correct || wrong) && (
        <span style={{ fontSize:19, marginLeft:"auto" }}>{correct?"✓":"✗"}</span>
      )}
    </button>
  );
}

// Progress Bar
// ── BOTTOM CTA BAR ────────────────────────────────────────────────────────────
// Centralized, max 600px, consistent across all screens
function BottomCTA({ children, gradient = true }) {
  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:90,
      background: gradient
        ? `linear-gradient(to top,${C.bg} 60%,transparent)`
        : C.surface,
      borderTop: gradient ? "none" : `1px solid ${C.border}`,
      padding: gradient ? "14px 16px 28px" : "10px 16px 16px",
    }}>
      <div style={{ maxWidth:600, margin:"0 auto", display:"flex", flexDirection:"column", gap:8 }}>
        {children}
      </div>
    </div>
  );
}

// Standard CTA button — accent color, 3D border-bottom like Duolingo cards
function CTABtn({ onClick, disabled, color, children, secondary }) {
  const bg = disabled ? C.surface2 : (color || C.accent);
  const shadow = disabled ? C.border : (
    color === C.green  ? C.greenShadow :
    color === C.amber  ? "#b45309" :
    color === C.cyan   ? "#0090a0" :
    color === C.purple ? "#7c3aed" :
    color === C.teal   ? "#0f766e" :
    "rgba(0,0,0,0.4)"
  );
  if (secondary) return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:"none", border:`1.5px solid ${C.border}`, borderRadius:12,
        padding:"10px 20px", fontFamily:F.display, fontWeight:700, fontSize:15,
        color:C.textDim, cursor:disabled?"not-allowed":"pointer", width:"100%" }}>
      {children}
    </button>
  );
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:bg, border:"none",
        borderBottom:`4px solid ${shadow}`, borderRadius:14,
        padding:"13px 20px", fontFamily:F.display, fontWeight:900, fontSize:16,
        color: disabled ? C.textDim : "#fff",
        cursor:disabled?"not-allowed":"pointer", width:"100%",
        opacity: disabled ? .5 : 1,
        transition:"transform .1s, opacity .1s" }}>
      {children}
    </button>
  );
}

function ProgressBar({ value, color, onBack, right, onGloss }) {
  return (
    <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`,
      padding:"10px 14px 10px", display:"flex", alignItems:"center", gap:10 }}>
      {onBack && (
        <button onClick={onBack}
          style={{ background:"none", border:"none", color:C.textDim,
            fontSize:22, cursor:"pointer", padding:"8px 10px", lineHeight:1,
            flexShrink:0, minWidth:44, minHeight:44,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
          ✕
        </button>
      )}
      <div style={{ flex:1, background:C.border, borderRadius:99, height:14, overflow:"hidden" }}>
        <div style={{ width:`${Math.max(2,value)}%`, height:"100%", background:color||C.green,
          borderRadius:99, transition:"width .5s cubic-bezier(.22,1,.36,1)",
          boxShadow:`inset 0 -3px 0 rgba(0,0,0,.2)` }} />
      </div>
      {right && <div style={{ flexShrink:0 }}>{right}</div>}
    </div>
  );
}

// Lives Row
function LivesRow({ count, max=3 }) {
  return (
    <div style={{ display:"flex", gap:3, alignItems:"center" }}>
      {Array.from({length:max}).map((_,i) => (
        <span key={i} style={{ fontSize:19, opacity:i<count?1:.15,
          transition:"opacity .3s, transform .3s",
          transform:i<count?"scale(1)":"scale(.75)", display:"inline-block" }}>🛡</span>
      ))}
    </div>
  );
}

// Feedback Banner — slides up, full Duolingo style
function FeedbackBanner({ correct, wrongAnswer, hint, onNext }) {
  const color  = correct ? C.correct : C.wrong;
  const shadow = correct ? C.btn3d_green : C.btn3d_red;
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0,
      background: correct ? C.correctBg : C.wrongBg,
      borderTop:`3px solid ${color}`, padding:"20px 20px 36px",
      animation:"slideUp .2s cubic-bezier(.22,1,.36,1)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
        <div style={{ width:38, height:38, borderRadius:"50%", background:color,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:19, flexShrink:0, fontWeight:900 }}>
          {correct?"✓":"✗"}
        </div>
        <div>
          <div style={{ fontFamily:F.display, color, fontSize:23, fontWeight:900 }}>
            {correct?"Correto!":"Incorreto"}
          </div>
          {!correct && wrongAnswer && (
            <div style={{ fontFamily:F.display, color:C.textMid, fontSize:18, marginTop:2, fontWeight:700 }}>
              Resposta: <span style={{ color, fontWeight:900 }}>{wrongAnswer}</span>
            </div>
          )}
        </div>
      </div>
      {hint && (
        <div style={{ background:C.surface, borderRadius:12, padding:"10px 14px", marginBottom:14,
          border:`1px solid ${C.border}`, fontFamily:F.mono, color:C.textMid, fontSize:14, lineHeight:1.7 }}>
          <span style={{ color:C.amber, fontWeight:700 }}>📖 </span>{hint}
        </div>
      )}
      <Btn3D color={color} shadow={shadow} onClick={onNext}>CONTINUAR</Btn3D>
    </div>
  );
}

// Challenge Card — full Duolingo redesign
function ChallengeCard({ ch, onCorrect, onWrong, onNext, showNext }) {
  const [picked, setPicked] = React.useState(null);
  const isCorrect = picked !== null && (
    ch.type === "truefalse" ? picked === String(ch.answer) : picked === ch.blank
  );
  const correctAnswer = ch.type === "truefalse"
    ? (ch.answer ? "Verdadeiro" : "Falso") : ch.blank;

  const handlePick = (val) => {
    if (picked !== null) return;
    setPicked(val);
    const ok = ch.type === "truefalse" ? val === String(ch.answer) : val === ch.blank;
    if (ok) onCorrect(); else onWrong();
  };

  // Shuffle options once on mount using seeded Fisher-Yates
  const shuffledOpts = React.useMemo(() => {
    if (ch.type === "truefalse")
      return [{label:"Verdadeiro",val:"true",icon:"✓"},{label:"Falso",val:"false",icon:"✗"}];
    const arr = ch.options.map((o,i) => ({label:o,val:o,icon:String.fromCharCode(65+i)}));
    // Seed: use hash of first option to get consistent-per-question shuffle
    let seed = ch.options[0].split('').reduce((a,c) => a + c.charCodeAt(0), 0);
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = Math.floor((seed / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Re-label icons A,B,C,D after shuffle
    return arr.map((o,i) => ({...o, icon:String.fromCharCode(65+i)}));
  }, [ch]);
  const opts = shuffledOpts;

  return (
    <div style={{ paddingBottom: picked ? 160 : 20 }}>
      <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11,
        letterSpacing:2, marginBottom:16 }}>
        {ch.type==="truefalse" ? "VERDADEIRO OU FALSO?" : "COMPLETE A FRASE"}
      </div>

      {/* Sentence card */}
      <div style={{ background:C.surface, border:`2px solid ${C.cardDepth}`,
        borderBottom:`4px solid ${C.cardDepth}`,
        borderRadius:20, padding:"20px 18px", marginBottom:24,
        fontFamily:F.display, color:C.text, fontSize:23, lineHeight:1.7, fontWeight:700 }}>
        {ch.type === "complete"
          ? ch.sentence.split(ch.blank).flatMap((part,i,arr) => i < arr.length-1
              ? [part, <span key={i} style={{
                  color: picked?(isCorrect?C.correct:C.wrong):C.cyan,
                  background: picked?(isCorrect?C.correctBg:C.wrongBg):C.cyanDim,
                  borderRadius:8, padding:"2px 12px", margin:"0 4px",
                  fontWeight:900, borderBottom:`3px solid ${picked?(isCorrect?C.btn3d_green:C.btn3d_red):"#0369a1"}`,
                  display:"inline-block",
                }}>{picked||"______"}</span>]
              : [part])
          : ch.statement}
      </div>

      {/* Options */}
      {opts.map(opt => {
        const isSel = picked === opt.val;
        const isRight = opt.val === (ch.type==="truefalse"?String(ch.answer):ch.blank);
        const reveal = picked !== null;
        return (
          <OptionCard key={opt.val}
            selected={isSel && !reveal}
            correct={reveal && isRight}
            wrong={reveal && isSel && !isRight}
            disabled={reveal}
            onClick={() => handlePick(opt.val)}
            icon={opt.icon}>
            {opt.label}
          </OptionCard>
        );
      })}

      {showNext && picked !== null && (
        <FeedbackBanner correct={isCorrect}
          wrongAnswer={isCorrect?null:correctAnswer}
          hint={!isCorrect?ch.hint:null}
          onNext={onNext} />
      )}
    </div>
  );
}


// ─── MODULE 0 — GENERIC ARCHITECTURE PUZZLE ──────────────────────────────────
const M0_PUZZLE = {
  nodes: [
    { id:"source",    label:"Fonte de Log",        sub:"Endpoint · Firewall · Cloud · SaaS",          icon:"📡", color:C.cyan,   blank:false },
    { id:"collect",   label:"Coleta / Ingestão",   sub:"Forwarder · BindPlane · Feed · Webhook",       icon:"⚙️", color:C.cyan,   blank:true  },
    { id:"secops",    label:"Google SecOps",        sub:"Plataforma SIEM/SOAR Cloud native",            icon:"🏛", color:C.green,  blank:false },
    { id:"parser",    label:"Parser → UDM",         sub:"Normaliza raw logs no schema UDM",             icon:"🔄", color:C.green,  blank:true  },
    { id:"rules",     label:"Regras YARA-L",        sub:"Rules Engine detecta padrões nos eventos UDM", icon:"🎯", color:C.purple, blank:false },
    { id:"detection", label:"Detection / Alerta",   sub:"Aparece na fila de triagem do SOC",            icon:"🚨", color:C.amber,  blank:true  },
    { id:"invest",    label:"Investigação",          sub:"Cases & Alerts · Graph Investigator · Search", icon:"🔍", color:C.amber,  blank:false },
    { id:"soar",      label:"SOAR Playbook",         sub:"Orquestração e automação de resposta",         icon:"🤖", color:C.red,    blank:true  },
    { id:"response",  label:"Resposta Automática",   sub:"Block IP · Isolate · Ticket · Notify",         icon:"🛡", color:C.red,    blank:false },
  ],
  distractors: ["Chronicle Forwarder v1", "Syslog direto", "SOAR Connector", "Dashboard Widget"],
  explanation: [
    { node:"Coleta / Ingestão",  info:"O Google SecOps suporta múltiplos métodos: Forwarder/BindPlane Agent (on-prem), Feeds (pull de APIs SaaS e buckets cloud), Webhooks HTTPS (push da fonte), Pub/Sub (GCP nativo) e Connectors SOAR (Content Hub). Ref: security.googlecloudcommunity.com/siem-26" },
    { node:"Parser → UDM",       info:"Parsers normalizam raw logs de qualquer fabricante para o schema UDM (Unified Data Model). O Google mantém +500 parsers prontos. Você pode criar parsers customizados (CBN/ANTLR). O SecOps guarda ambos: raw log e UDM normalizado." },
    { node:"Detection / Alerta", info:"Quando uma regra YARA-L casa com eventos UDM, o Rules Engine gera uma Detection. Ela aparece na fila de alertas do SOC com contexto de entidade, severidade e mapeamento MITRE ATT&CK." },
    { node:"Investigação",       info:"Step 4 da jornada oficial: Cases & Alerts agrupam detecções relacionadas. O Graph Investigator visualiza o quem/quê/quando do ataque. A pesquisa UDM permite investigar histórico de até 12 meses. Ref: security.googlecloudcommunity.com/secops-enterprise-25" },
    { node:"SOAR Playbook",      info:"Step 5: após investigação, o SOAR executa playbooks de resposta automática configurados no Designer de Playbook. Pode integrar com ferramentas externas via Content Hub (Jira, PagerDuty, firewalls, etc.)." },
  ],
};

// ─── MODULE 6 — SPECIFIC SOURCE PUZZLES ──────────────────────────────────────
const M6_PUZZLES = [
  {
    id:"windows", emoji:"🖥", title:"Windows Events",
    tag:"WinEVT + Sysmon", color:C.cyan, xp:150,
    story:"DC01 está gerando eventos de segurança — logins, processos, alterações de arquivo. Monte o caminho completo desde o endpoint Windows até a resposta automática do SOAR.",
    nodes:[
      { id:"dc01",     label:"DC01",              sub:"Windows Server 2022 · 10.10.10.10",  icon:"🖥", color:C.cyan,   blank:false },
      { id:"sysmon",   label:"Sysmon",            sub:"Coleta eventos granulares no host",  icon:"📡", color:C.cyan,   blank:true  },
      { id:"bp_agent", label:"BindPlane Agent",   sub:"Encaminha logs ao gateway local",    icon:"⚙️", color:C.amber,  blank:false },
      { id:"bp_gw",    label:"BindPlane Gateway", sub:"10.10.10.40 — roteia telemetria",    icon:"🔀", color:C.amber,  blank:true  },
      { id:"secops",   label:"Google SecOps",     sub:"Ingere via Ingestion API (BP Gateway envia direto)",  icon:"🏛", color:C.green,  blank:true  },
      { id:"parser",   label:"Parser Windows",    sub:"Normaliza WinEVT/Sysmon → UDM",     icon:"🔄", color:C.green,  blank:false },
      { id:"udm",      label:"UDM Events",        sub:"USER_LOGIN · PROCESS_LAUNCH etc.",   icon:"📊", color:C.purple, blank:true  },
      { id:"yaral",    label:"YARA-L Rules",      sub:"Detecta padrões de ameaça",          icon:"🎯", color:C.purple, blank:false },
      { id:"detect",   label:"Detection",         sub:"Alerta gerado na fila do SOC",       icon:"🚨", color:C.red,    blank:true  },
      { id:"soar",     label:"SOAR Playbook",     sub:"Resposta automática",                icon:"🤖", color:C.red,    blank:false },
    ],
    distractors:["Syslog TCP","DHCP Server","BindPlane Gateway","DNS Resolver"],
    explanation:[
      { node:"Sysmon",            info:"Sysmon é um driver do sistema que captura eventos granulares: criação de processo, conexões de rede, modificação de arquivo. Muito mais detalhe que o WinEVT padrão." },
      { node:"BindPlane Gateway", info:"O Gateway recebe logs de todos os agents na LAN e envia DIRETAMENTE ao Google SecOps via Ingestion API (malachiteingestion-pa.googleapis.com) — sem passar por BindPlane Cloud, que é o plano de gerenciamento (console). Uma única conexão de saída consolida múltiplos agents." },
      { node:"Google SecOps",     info:"Recebe logs via Ingestion API e armazena em dois formatos: raw log (original) e UDM normalizado. Retenção padrão: 12 meses." },
      { node:"UDM Events",        info:"UDM normaliza logs de qualquer fabricante. Evento Sysmon de processo vira $e.metadata.event_type = 'PROCESS_LAUNCH' com campos padronizados." },
      { node:"Detection",         info:"Quando uma regra YARA-L casa com eventos no Rules Engine, uma Detection é gerada e aparece na fila de triagem do SOC." },
    ],
  },
  {
    id:"linux", emoji:"🐧", title:"Linux auditd",
    tag:"auditd → BindPlane → SecOps", color:C.green, xp:150,
    story:"Ubuntu-SRV está gerando logs de auditoria do kernel. Monte o fluxo completo desde o servidor Linux até a detecção e resposta automática.",
    nodes:[
      { id:"ubuntu",   label:"Ubuntu Server",     sub:"10.10.10.30 · Ubuntu 22.04",         icon:"🐧", color:C.green,  blank:false },
      { id:"auditd",   label:"auditd",            sub:"Daemon de auditoria do kernel Linux", icon:"📋", color:C.green,  blank:true  },
      { id:"bp_agent", label:"BindPlane Agent",   sub:"Coleta e encaminha logs locais",      icon:"⚙️", color:C.amber,  blank:false },
      { id:"bp_gw",    label:"BindPlane Gateway", sub:"10.10.10.40 — roteia telemetria",     icon:"🔀", color:C.amber,  blank:true  },
      { id:"secops",   label:"Google SecOps",     sub:"Ingere e processa os logs",           icon:"🏛", color:C.cyan,   blank:false },
      { id:"parser",   label:"Parser Linux",      sub:"Normaliza auditd logs → UDM",         icon:"🔄", color:C.cyan,   blank:true  },
      { id:"udm",      label:"UDM Events",        sub:"PROCESS_LAUNCH · FILE_CREATION",      icon:"📊", color:C.purple, blank:false },
      { id:"yaral",    label:"YARA-L Rules",      sub:"Ex: Process Injection detection",     icon:"🎯", color:C.purple, blank:true  },
      { id:"detect",   label:"Detection",         sub:"Alerta no SOC",                       icon:"🚨", color:C.red,    blank:false },
      { id:"soar",     label:"SOAR Playbook",     sub:"SSH block · Isolate host",            icon:"🤖", color:C.red,    blank:true  },
    ],
    distractors:["WinRM Agent","Active Directory","DHCP Server","IIS Server"],
    explanation:[
      { node:"auditd",            info:"auditd é o framework de auditoria do kernel Linux. Monitora syscalls, acessos a arquivos, mudanças de permissão e execução de comandos com precisão de processo." },
      { node:"BindPlane Gateway", info:"Um único Gateway na LAN centraliza logs de múltiplos servidores Linux antes de enviar ao cloud — reduz conexões de saída e simplifica o firewall." },
      { node:"Parser Linux",      info:"Converte o formato texto do auditd para campos UDM: syscalls mapeiam para PROCESS_LAUNCH, FILE_CREATION etc." },
      { node:"YARA-L Rules",      info:"A mesma sintaxe YARA-L funciona para logs Linux e Windows — porque ambos são normalizados para UDM antes da detecção." },
      { node:"SOAR Playbook",     info:"O SOAR responde via SSH para isolar o host Linux, bloqueia o IP no FortiGate via REST API e abre ticket automaticamente." },
    ],
  },
  {
    id:"fortigate", emoji:"🔥", title:"FortiGate Firewall",
    tag:"Syslog → BindPlane → SecOps", color:C.orange, xp:175,
    story:"O FortiGate envia logs via Syslog para um BindPlane Agent que atua como coletor. O BindPlane Gateway consolida e encaminha ao Google SecOps. Monte este fluxo correto.",
    nodes:[
      { id:"fg",       label:"FortiGate VM",      sub:"WAN 192.168.1.60 · FortiOS 7.4",       icon:"🔥", color:C.orange, blank:false },
      { id:"syslog",   label:"Syslog UDP 514",    sub:"FortiGate envia ao BindPlane Agent",    icon:"📤", color:C.orange, blank:true  },
      { id:"bp_agent", label:"BindPlane Agent",   sub:"Recebe Syslog · coleta no collector",   icon:"⚙️", color:C.amber,  blank:false },
      { id:"bp_gw",    label:"BindPlane Gateway", sub:"Consolida e encaminha ao SecOps",       icon:"🔀", color:C.amber,  blank:true  },
      { id:"secops",   label:"Google SecOps",     sub:"Ingere via Ingestion API",              icon:"🏛", color:C.green,  blank:false },
      { id:"parser",   label:"Parser FortiGate",  sub:"Normaliza FortiOS logs → UDM",          icon:"🔄", color:C.green,  blank:true  },
      { id:"udm",      label:"UDM Events",        sub:"NETWORK_CONNECTION · USER_LOGIN",       icon:"📊", color:C.purple, blank:false },
      { id:"yaral",    label:"YARA-L Rules",      sub:"C2 Beaconing · DNS Tunneling",          icon:"🎯", color:C.purple, blank:true  },
      { id:"detect",   label:"Detection",         sub:"Alerta gerado na fila do SOC",          icon:"🚨", color:C.red,    blank:false },
      { id:"soar",     label:"SOAR Playbook",     sub:"Chama FortiGate REST API",              icon:"🤖", color:C.red,    blank:true  },
      { id:"action",   label:"Block IP Policy",   sub:"Política de bloqueio automático",       icon:"🛡", color:C.red,    blank:false },
    ],
    distractors:["Syslog direto ao SecOps","WinRM","auditd","SNMP Trap"],
    explanation:[
      { node:"Syslog UDP 514",    info:"O FortiGate é configurado em Log & Report → Log Settings para enviar Syslog UDP 514 ao IP do servidor onde o BindPlane Agent está instalado — NÃO diretamente ao SecOps. Ref: docs.bindplane.observiq.com" },
      { node:"BindPlane Gateway", info:"O BindPlane Gateway recebe os dados de múltiplos agents na rede local e os encaminha ao Google SecOps via Ingestion API HTTPS — uma única conexão de saída para o firewall. Ref: cloud.google.com/chronicle/docs/forwarder-overview" },
      { node:"Parser FortiGate",  info:"Parser nativo converte logs de tráfego FortiOS para UDM: network.sent_bytes, network.received_bytes, security_result.action (ALLOW/BLOCK), target.port. Ref: cloud.google.com/chronicle/docs/parsers" },
      { node:"YARA-L Rules",      info:"Com logs do FortiGate no UDM, regras de C2 Beaconing e DNS Tunneling funcionam — os mesmos campos UDM independente da fonte do log." },
      { node:"SOAR Playbook",     info:"O SOAR chama a REST API do FortiGate (FortiManager ou diretamente) para criar policy de bloqueio em tempo real. Ref: cloud.google.com/chronicle/docs/soar" },
    ],
  },
  {
    id:"cloud", emoji:"☁️", title:"Cloud APIs (Feed)",
    tag:"GCP · AWS · Azure via Feed pull", color:C.teal, xp:200,
    story:"Para GCP, logs chegam via Cloud Logging → Pub/Sub → SecOps (integração nativa, sem BindPlane). Para AWS/Azure, usa-se Feed com pull do bucket S3/Blob. Monte o fluxo GCP nativo.",
    nodes:[
      { id:"gcp",      label:"GCP Services",      sub:"Cloud Audit · VPC Flow · DNS",        icon:"☁️", color:C.teal,   blank:false },
      { id:"clogging", label:"Cloud Logging",     sub:"Centraliza logs nativos do GCP",       icon:"📋", color:C.teal,   blank:true  },
      { id:"pubsub",   label:"Pub/Sub Topic",     sub:"Exporta logs em tempo real",           icon:"📨", color:C.cyan,   blank:false },
      { id:"secops",   label:"Google SecOps",     sub:"Subscreve o Pub/Sub — sem agente",     icon:"🏛", color:C.cyan,   blank:true  },
      { id:"parser",   label:"Parser GCP",        sub:"Cloud Audit Logs → UDM",               icon:"🔄", color:C.green,  blank:false },
      { id:"udm",      label:"UDM Events",        sub:"USER_RESOURCE_UPDATE · USER_LOGIN",    icon:"📊", color:C.purple, blank:true  },
      { id:"yaral",    label:"YARA-L Rules",      sub:"Privilege Escalation · Impossible Travel", icon:"🎯", color:C.purple, blank:false },
      { id:"detect",   label:"Detection",         sub:"Alerta de atividade suspeita",         icon:"🚨", color:C.red,    blank:true  },
      { id:"soar",     label:"SOAR Playbook",     sub:"Revoke IAM · Disable service account", icon:"🤖", color:C.red,   blank:false },
    ],
    distractors:["BindPlane Agent","Syslog UDP","Storage Bucket direto","SNMP"],
    explanation:[
      { node:"Cloud Logging",  info:"GCP Cloud Logging coleta automaticamente logs de todos os serviços GCP: Cloud Audit Logs (admin, data access, system events), VPC Flow Logs, Cloud DNS. Ref: cloud.google.com/logging/docs" },
      { node:"Pub/Sub Topic",  info:"Um Log Sink exporta logs do Cloud Logging para um tópico Pub/Sub em tempo real. O Google SecOps assina este tópico diretamente — integração nativa GCP sem BindPlane. Ref: cloud.google.com/chronicle/docs/ingestion/cloud-pubsub" },
      { node:"Google SecOps",  info:"Para GCP: integração nativa via Pub/Sub. Para AWS (CloudTrail) e Azure: Feed com pull do bucket S3/Azure Blob Storage. BindPlane NÃO é necessário para logs cloud nativos. Ref: cloud.google.com/chronicle/docs/ingestion" },
      { node:"UDM Events",     info:"Atividades cloud mapeiam para UDM: mudança de role IAM → USER_RESOURCE_UPDATE_PERMISSIONS, criação de VM → RESOURCE_CREATION, login → USER_LOGIN com geolocalização via IP." },
      { node:"Detection",      info:"Regras de Impossible Travel, Privilege Escalation e Shadow AI funcionam com logs de cloud — os mesmos campos UDM independente da fonte do log." },
    ],
  },
  {
    id:"email", emoji:"📧", title:"Email Security",
    tag:"Gmail · O365 via Feed API", color:C.pink, xp:175,
    story:"Logs de email corporativo chegam via Feed usando APIs autenticadas. Monte o fluxo para detectar exfiltração de dados via email e phishing.",
    nodes:[
      { id:"email_src",label:"Email Provider",    sub:"Gmail Enterprise · Microsoft 365",    icon:"📧", color:C.pink,   blank:false },
      { id:"api",      label:"Email API",         sub:"Gmail API · Graph API (O365)",         icon:"🔌", color:C.pink,   blank:true  },
      { id:"feed",     label:"SecOps Feed",       sub:"Pull via API autenticada (OAuth)",     icon:"📥", color:C.indigo, blank:false },
      { id:"secops",   label:"Google SecOps",     sub:"Ingere eventos de email",             icon:"🏛", color:C.indigo, blank:true  },
      { id:"parser",   label:"Parser Email",      sub:"Normaliza headers e metadados → UDM", icon:"🔄", color:C.green,  blank:false },
      { id:"udm",      label:"UDM Events",        sub:"EMAIL_TRANSACTION · destinatários",   icon:"📊", color:C.purple, blank:true  },
      { id:"yaral",    label:"YARA-L Rules",      sub:"Email Exfiltration · Phishing detection", icon:"🎯", color:C.purple, blank:false },
      { id:"detect",   label:"Detection",         sub:"Alerta de exfiltração por email",     icon:"🚨", color:C.red,    blank:true  },
      { id:"soar",     label:"SOAR Playbook",     sub:"Quarantine · Block sender",           icon:"🤖", color:C.red,    blank:false },
    ],
    distractors:["Syslog UDP","BindPlane Agent","LDAP","SNMP"],
    explanation:[
      { node:"Email API",    info:"Para Gmail Enterprise, usa service account com Gmail API. Para Office 365, usa Microsoft Graph API. Ambas retornam metadados: remetente, destinatário, assunto, anexos." },
      { node:"Google SecOps",info:"O Feed faz pull dos logs periodicamente com credenciais OAuth. Sem agente de email — só autenticação via API do provider." },
      { node:"UDM Events",   info:"Emails viram eventos EMAIL_TRANSACTION com campos específicos: network.email.to.user.email_addresses (destinatários), network.email.subject (assunto)." },
      { node:"Detection",    info:"A regra de Email Exfiltration usa 'in %corporate_domains' com reference list. Mais de 20 emails externos em 1h gera alerta de insider threat." },
    ],
  },
  {
    id:"webhook", emoji:"🔗", title:"Webhook HTTPS Push",
    tag:"HTTPS Push → SecOps Feed", color:C.indigo, xp:175,
    story:"Uma ferramenta de segurança SaaS (ex: CrowdStrike, SentinelOne) suporta webhook. Em vez de usar Feed pull com polling, você vai configurar o push direto ao endpoint HTTPS do Google SecOps. Monte este fluxo.",
    nodes:[
      { id:"saas",     label:"SaaS Security Tool",  sub:"CrowdStrike · SentinelOne · Okta etc.",   icon:"🛡", color:C.indigo,  blank:false },
      { id:"webhook",  label:"Webhook Config",       sub:"URL + API Key no header da ferramenta",   icon:"🔗", color:C.indigo,  blank:true  },
      { id:"https",    label:"HTTPS Endpoint",       sub:"SecOps Feed URL — push até 4MB/req",       icon:"📡", color:C.cyan,   blank:false },
      { id:"feed",     label:"SecOps Feed",          sub:"Tipo: HTTPS Push · autentica via API key", icon:"📥", color:C.cyan,   blank:true  },
      { id:"secops",   label:"Google SecOps",        sub:"Recebe e processa o payload JSON",         icon:"🏛", color:C.green,  blank:false },
      { id:"parser",   label:"Parser SaaS",          sub:"Normaliza payload JSON → UDM",             icon:"🔄", color:C.green,  blank:true  },
      { id:"udm",      label:"UDM Events",           sub:"PROCESS_LAUNCH · USER_LOGIN etc.",         icon:"📊", color:C.purple, blank:false },
      { id:"yaral",    label:"YARA-L Rules",         sub:"Detecção de ameaças nos eventos",          icon:"🎯", color:C.purple, blank:true  },
      { id:"detect",   label:"Detection",            sub:"Alerta gerado na fila do SOC",             icon:"🚨", color:C.red,    blank:false },
    ],
    distractors:["BindPlane Agent","Syslog UDP","Pub/Sub","Feed Pull (S3)"],
    explanation:[
      { node:"Webhook Config",  info:"Na ferramenta SaaS, configure o destino webhook com a URL do feed do SecOps e o API key no header X-Chronicle-Access-Token (recomendado) ou como query param ?key=. Limite: 4MB por request, 15.000 QPS. Ref: cloud.google.com/chronicle/docs/administration/feed-management" },
      { node:"SecOps Feed",     info:"No SecOps: Settings → Feeds → Add Feed → HTTPS Push. O SecOps gera uma URL única e um secret. Configure o log type para o parser correto da ferramenta. Feed Pull vs Webhook: pull faz polling periódico, webhook é tempo real. Ref: cloud.google.com/chronicle/docs/administration/feed-management" },
      { node:"Parser SaaS",     info:"Cada ferramenta tem um parser dedicado no SecOps (+500 parsers disponíveis). O parser extrai campos do JSON da ferramenta e mapeia para UDM: alertas → security_result, processos → PROCESS_LAUNCH, usuários → principal.user.userid." },
      { node:"YARA-L Rules",    info:"Com os dados no UDM, as mesmas regras YARA-L funcionam — independente de a fonte ter chegado via webhook, BindPlane ou Pub/Sub. O UDM é o normalizador universal." },
    ],
  },
  {
    id:"onboarding", emoji:"🚀", title:"Ativação da Instância SecOps",
    tag:"Day 1 · Onboarding do Cliente", color:C.indigo, xp:200,
    story:"Um novo cliente adquiriu o Google SecOps Enterprise. Você é o arquiteto do Day 1. Monte a sequência correta para ativar e configurar a instância — do GCP Project até a primeira detecção.",
    nodes:[
      { id:"gcp",     label:"GCP Project",        sub:"Projeto GCP com billing e APIs habilitadas",        icon:"☁️", color:C.cyan,   blank:false },
      { id:"iam",     label:"IAM & Roles",         sub:"Papéis: Chronicle Admin · Editor · Viewer",         icon:"🔐", color:C.cyan,   blank:true  },
      { id:"idp",     label:"Identity Provider",   sub:"Google Workspace / Cloud Identity / 3rd-party IdP", icon:"🪪", color:C.teal,  blank:false },
      { id:"console", label:"SecOps Console",      sub:"Acesso autenticado via IDP configurado",             icon:"🖥", color:C.teal,  blank:true  },
      { id:"ingest",  label:"Fonte de Dados",      sub:"1º Feed ou BindPlane Agent configurado",             icon:"📡", color:C.green, blank:false },
      { id:"parser",  label:"Parser UDM",          sub:"Normaliza logs no schema UDM",                       icon:"🔄", color:C.green, blank:true  },
      { id:"rules",   label:"Curated Detections",  sub:"Regras prontas ativas no Rules Engine",              icon:"🎯", color:C.amber, blank:false },
      { id:"alert",   label:"1ª Detection",        sub:"Primeiro alerta — fluxo end-to-end validado",        icon:"🚨", color:C.amber, blank:true  },
    ],
    distractors:["SIEM Legacy Migration","SSO Token","Firewall Rule","GKE Cluster"],
    explanation:[
      { node:"IAM & Roles",       info:"O SecOps usa IAM com papéis pré-definidos: Chronicle Admin (acesso total), Chronicle Editor, Chronicle Viewer (somente leitura), Chronicle SOAR Admin. Devem ser atribuídos antes de qualquer usuário acessar o console. Ref: community Step 1.1 Initial Config" },
      { node:"SecOps Console",    info:"O console é acessado via URL do cliente (ex: customer.backstory.chronicle.security). Requer IDP configurado — sem isso nenhum usuário consegue logar. Suporta Google Workspace, Cloud Identity ou IdPs externos (Okta, Azure AD) via SAML/OIDC. Ref: community Step 1.1 Configure IDP" },
      { node:"Parser UDM",        info:"Ao configurar o primeiro Feed ou BindPlane Agent, o SecOps aplica automaticamente o parser do fabricante. Se não existe parser pronto (+500 disponíveis), é necessário criar um custom parser (CBN/ANTLR) antes da normalização UDM. Ref: community Step 2.1" },
      { node:"1ª Detection",      info:"O milestone do Day 1 é validar o fluxo end-to-end: log ingerido → UDM normalizado → regra disparou → alerta na fila. Com Curated Detections ativas (Enterprise/Enterprise+), esse fluxo funciona sem escrever uma linha de YARA-L. Ref: community Step 3.1 Threat Detection" },
    ],
  },
  {
    id:"kali", emoji:"☠️", title:"Simulação de Ataque",
    tag:"Kali DMZ → Detecção → Resposta SOAR", color:"#ff6b6b", xp:250,
    story:"Kali-Lab (10.10.20.100) está realizando SSH Brute Force contra Ubuntu-SRV. Monte o fluxo de como o SecOps detecta e bloqueia automaticamente.",
    nodes:[
      { id:"kali",     label:"Kali Linux",        sub:"10.10.20.100 · DMZ Attacker",         icon:"☠️", color:"#ff6b6b", blank:false },
      { id:"attack",   label:"SSH Brute Force",   sub:"Centenas de tentativas porta 22",      icon:"⚔️", color:"#ff6b6b", blank:true  },
      { id:"fg",       label:"FortiGate Logs",    sub:"Registra BLOCK na política DMZ→LAN",   icon:"🔥", color:C.orange,  blank:false },
      { id:"syslog",   label:"Syslog UDP 514",    sub:"FortiGate envia logs via UDP:514 ao BindPlane",  icon:"📤", color:C.orange,  blank:true  },
      { id:"bp",       label:"BindPlane Agent",   sub:"Recebe syslog e encaminha ao SecOps",            icon:"⚙️", color:C.amber,   blank:false },
      { id:"secops",   label:"Google SecOps",     sub:"Correlaciona eventos do firewall",               icon:"🏛", color:C.green,   blank:true  },
      { id:"udm",      label:"UDM Events",        sub:"USER_LOGIN BLOCK · principal.ip=$kali", icon:"📊", color:C.purple, blank:true  },
      { id:"yaral",    label:"YARA-L: SSH BF",    sub:"#e > 5 do mesmo $ip em 10min",        icon:"🎯", color:C.purple,  blank:false },
      { id:"detect",   label:"Detection",         sub:"SSH Brute Force alertado",             icon:"🚨", color:C.red,     blank:true  },
      { id:"soar",     label:"SOAR Playbook",     sub:"Chama FortiGate REST API",             icon:"🤖", color:C.red,     blank:false },
      { id:"blocked",  label:"IP Bloqueado",      sub:"Kali isolado automaticamente",         icon:"🛡", color:C.red,     blank:true  },
    ],
    distractors:["BindPlane Agent","auditd","DNS Feed","Cloud API"],
    explanation:[
      { node:"SSH Brute Force", info:"O Kali usa Hydra ou Medusa para tentar centenas de senhas via SSH (porta 22). Cada tentativa gera um evento USER_LOGIN BLOCK no FortiGate com o IP do Kali." },
      { node:"Syslog UDP 514",  info:"O FortiGate envia cada evento de bloqueio via Syslog para o Google SecOps em tempo real — sem agente, sem delay." },
      { node:"UDM Events",      info:"O parser FortiGate normaliza: IP do Kali → principal.ip, Ubuntu → target.ip, porta 22 → target.port, decisão → security_result.action = BLOCK." },
      { node:"Detection",       info:"A regra SSH Brute Force detecta >5 eventos USER_LOGIN BLOCK do mesmo $ip em 10min. O Kali fazendo centenas de tentativas dispara em segundos." },
      { node:"IP Bloqueado",    info:"O SOAR chama a REST API do FortiGate para criar policy de bloqueio do IP do Kali. Resposta completa e automática em menos de 1 minuto." },
    ],
  },
];

// ─── MODULE 1 DATA — CONCEITOS ────────────────────────────────────────────────
const M1_LESSONS = [
  { id:1, title:"O que é um SIEM?", icon:"🏛",
    cards:[
      { q:"O que significa SIEM?", a:"Security Information and Event Management — sistema que coleta, correlaciona e analisa logs de segurança em tempo real." },
      { q:"Por que um SIEM existe?", a:"Sem ele, um analista teria que abrir dezenas de consoles diferentes. O SIEM centraliza tudo num único lugar e numa linha do tempo única." },
      { q:"O que é o Google SecOps?", a:"Google Security Operations (Google SecOps) é uma plataforma SIEM/SOAR Cloud native da Google, totalmente gerenciada, sem necessidade de infraestrutura própria." },
      { q:"Qual é a retenção de logs padrão do Google SecOps?", a:"Todos os tiers do Google SecOps incluem 12 meses de hot data retention. O modelo de licenciamento é baseado em volume de ingestão (TB/ano) — não por EPS (evento/segundo) ou por usuário. Diferencial: sem custo extra por armazenamento dentro dos 12 meses." },
      { q:"O Google SecOps tem inteligência artificial?", a:"Sim. Possui agentes de IA embutidos: Gemini para investigação autônoma, Triage Agent para priorizar alertas e AI-powered detections com regras sugeridas automaticamente." },
      { q:"O que o Google SecOps armazena?", a:"Cada evento em dois formatos: o log bruto original (raw log) e o registro normalizado no schema UDM (Unified Data Model)." },
    ],
    challenges:[
      { type:"complete", sentence:"O Google SecOps é uma plataforma SIEM/____ Cloud native da Google.", blank:"SOAR", options:["SOAR","DNS","WAF","EDR"] },
      { type:"truefalse", statement:"A retenção padrão de hot data no Google SecOps Standard é de 30 dias.", answer:false },
      { type:"complete", sentence:"O Google SecOps possui agentes de ____ embutidos, como o Gemini.", blank:"IA", options:["IA","firewall","VLAN","parser"] },
      { type:"complete", sentence:"O SIEM centraliza logs para que o analista não precise abrir dezenas de ____ diferentes.", blank:"consoles", options:["consoles","arquivos","usuários","regras"] },
    ]},
  { id:2, title:"Normalização e UDM", icon:"🔄",
    cards:[
      { q:"O que é normalização de logs?", a:"Converter logs de formatos diferentes (Palo Alto, Windows, Linux) para um schema comum — o UDM (Unified Data Model)." },
      { q:"Por que normalizar?", a:"Sem normalização você precisaria de uma regra diferente para cada fabricante. Com UDM, uma regra cobre todos os produtos." },
      { q:"O que é um Parser?", a:"Componente que lê o log bruto de um produto e converte para campos UDM. O Google mantém +500 parsers prontos para os principais fabricantes." },
      { q:"Quais são as seções principais do UDM?", a:"metadata (obrigatória), principal, target, network, security_result + src, intermediary (proxy/relay), observer (sniffer), about, extensions. Apenas metadata é obrigatória — as outras só aparecem quando necessárias para o evento." },
      { q:"O que é 'raw log'?", a:"O log bruto original, exatamente como chegou do produto — antes de ser normalizado. O Google SecOps guarda os dois: raw log e UDM normalizado." },
      { q:"O que é o Entity Data Model do UDM?", a:"Modelo de contexto que enriquece eventos UDM com dados de fontes como Active Directory e LDAP. Ex: um login tem target.user.userid=\"frank.kolzig\", mas target.user.department=\"Marketing\" vem automaticamente do LDAP ingerido — sem estar no log original." },
    ],
    challenges:[
      { type:"complete", sentence:"O schema comum usado pelo Google SecOps para normalizar logs chama-se ____.", blank:"UDM", options:["UDM","JSON","YAML","XML"] },
      { type:"complete", sentence:"O componente que converte o log bruto para UDM é chamado de ____.", blank:"Parser", options:["Parser","Firewall","Agent","Index"] },
      { type:"truefalse", statement:"Com UDM, uma mesma regra YARA-L funciona para logs de diferentes fabricantes.", answer:true },
      { type:"complete", sentence:"O campo ____ no UDM define quais outros campos são obrigatórios num evento.", blank:"event_type", options:["event_type","metadata","principal","target"] },
    ]},
  { id:3, title:"Arquitetura Google SecOps", icon:"🏗",
    cards:[
      { q:"Como os dados chegam ao Google SecOps?", a:"Principais métodos:\n• Forwarders/BindPlane Agent — coleta on-prem (Windows, Linux, firewalls)\n• Feeds — pull de APIs e buckets cloud (GCS, S3, APIs SaaS)\n• Webhooks HTTPS — push da fonte para o SecOps\n• Pub/Sub — integração nativa GCP\n• Ingestion API — apps customizados\n• Connectors — ingestão de alertas via SOAR (Content Hub)" },
      { q:"O que é o Rules Engine?", a:"Motor que executa as regras YARA-L continuamente sobre os eventos normalizados e gera detecções (alertas) quando as condições são atendidas." },
      { q:"O que é uma Detection?", a:"Alerta gerado pelo Rules Engine quando uma regra YARA-L casa com eventos nos logs. Aparece na fila de triagem do SOC para investigação." },
      { q:"O que é o SOAR e o que ele faz?", a:"Security Orchestration, Automation and Response — automatiza respostas a incidentes via Playbooks. Pode abrir tickets, bloquear IPs e notificar equipes automaticamente." },
      { q:"Qual é o diferencial do Google SecOps vs SIEMs tradicionais?", a:"Infraestrutura Google: 12 meses de hot retention em todos os tiers, licenciamento por TB/ano (não por EPS ou usuário), velocidade de busca petabyte-scale e IA embarcada (Gemini)." },
    ],
    challenges:[
      { type:"complete", sentence:"O BindPlane é um tipo de ____ que envia logs ao Google SecOps.", blank:"Forwarder", options:["Forwarder","Parser","Detection","Playbook"] },
      { type:"complete", sentence:"Quando uma regra YARA-L casa com eventos, o resultado é chamado de ____.", blank:"Detection", options:["Detection","Parser","Feed","UDM"] },
      { type:"truefalse", statement:"O SOAR do Google SecOps pode automatizar respostas a incidentes via Playbooks.", answer:true },
      { type:"complete", sentence:"O Google SecOps possui retenção de hot data de ____ meses por padrão.", blank:"12", options:["12","3","6","24"] },
    ]},
  { id:4, title:"Pacotes e Licenças", icon:"📦",
    cards:[
      { q:"Quantos pacotes o Google SecOps oferece?", a:"Três: Standard, Enterprise e Enterprise Plus. O preço é baseado em volume de ingestão (dados) e não por número de eventos ou usuários." },
      { q:"O que inclui o pacote Standard?", a:"Ingestão de dados, detecção de ameaças, investigação, resposta e 12 meses de hot data retention. Licenciado por TB/ano de ingestão. Ideal para organizações que precisam de operações de segurança fundamentais." },
      { q:"O que o Enterprise adiciona ao Standard?", a:"Threat intelligence avançada, UEBA (User and Entity Behavior Analytics), assistência de IA generativa (Gemini) e SOAR para automação de respostas." },
      { q:"O que o Enterprise Plus adiciona ao Enterprise?", a:"Inteligência completa de Mandiant e VirusTotal, gerenciamento avançado de pipeline de dados e opções de armazenamento estendido. Para ambientes complexos com máxima necessidade de defesa." },
      { q:"O que é o Google Unified Security?", a:"Pacote que inclui tudo do Enterprise Plus e adiciona Chrome Enterprise Premium, Security Command Center e Web Risk — a oferta mais completa da Google para segurança." },
      { q:"Como funciona o modelo de preço do Google SecOps?", a:"Baseado em volume de ingestão (TB/ano). Todos os tiers incluem 12 meses de hot data retention. Diferente de SIEMs tradicionais que cobram por EPS (evento por segundo) ou por usuário — o Google SecOps dimensiona por volume total ingerido." },
    ],
    challenges:[
      { type:"complete", sentence:"O Google SecOps tem ____ pacotes: Standard, Enterprise e Enterprise Plus.", blank:"3", options:["3","2","4","5"] },
      { type:"complete", sentence:"O pacote que inclui UEBA e Gemini AI é o ____.", blank:"Enterprise", options:["Enterprise","Standard","Basic","Starter"] },
      { type:"truefalse", statement:"O Enterprise Plus inclui inteligência completa de Mandiant e VirusTotal.", answer:true },
      { type:"complete", sentence:"O modelo de preço do Google SecOps é baseado em volume de ____.", blank:"ingestão", hint:"Licenciamento por TB/ano de volume ingerido — não por EPS, usuário ou host. Todos os tiers incluem 12 meses de hot data. Ref: cloud.google.com/chronicle/docs/secops/secops-packages", options:["ingestão","usuários","eventos","regras"] },
    ]},
  { id:5, title:"Métodos de Ingestão", icon:"📥",
    cards:[
      { q:"Quais são os métodos de ingestão do Google SecOps?", a:"6 métodos principais:\n1. BindPlane Agent — on-prem (Windows, Linux, firewalls)\n2. Feed Pull — pull de cloud/SaaS (GCS, S3, APIs)\n3. Webhook HTTPS — fonte envia ao endpoint do SecOps (push)\n4. Pub/Sub — integração nativa GCP\n5. Ingestion API direta — apps customizados\n6. Forwarder — legado (prefira BindPlane Agent em novos projetos)" },
      { q:"O que é o BindPlane Agent e quando usar?", a:"Pipeline de telemetria moderno para ambientes on-prem. Use para: firewalls (FortiGate), servidores Windows/Linux, qualquer fonte sem API nativa no SecOps. É o substituto recomendado do Forwarder legado. Gerenciado via BindPlane OP console. Suporta OpenTelemetry. Ref: cloud.google.com/chronicle/docs/ingestion/use-bindplane-agent" },
      { q:"O que é um Feed no Google SecOps?", a:"Mecanismo de ingestão configurado na UI do SecOps. Tipos:\n• Pull: SecOps busca ativamente (GCS, S3, Azure Blob, APIs de terceiros como Okta, Microsoft 365)\n• Push/Webhook: fonte envia ao endpoint HTTPS do SecOps\n• Pub/Sub: assinatura nativa GCP\n• Amazon Data Firehose: streaming AWS\n\nCada feed = data source type + log type." },
      { q:"Como funciona o Webhook no Google SecOps?", a:"Fonte envia logs ao endpoint HTTPS do SecOps (push). Limites: 4 MB por request, 15.000 QPS por instância. Auth via API key no header (recomendado) ou query param. Configurado em Settings → Feeds → HTTPS Push. Use quando a fonte suporta webhooks mas não tem connector nativo." },
      { q:"Qual é a diferença entre Forwarder e BindPlane Agent?", a:"Forwarder: componente legado que roda na rede do cliente, coleta logs e packets e envia ao SecOps. Ainda funcional e documentado nos guias oficiais.\nBindPlane Agent: substituto moderno com suporte a OpenTelemetry, gerenciamento centralizado via BindPlane OP e mais flexibilidade. Novos projetos devem preferir o BindPlane Agent. Ref: cloud.google.com/chronicle/docs/ingestion/use-bindplane-agent" },
    ],
    challenges:[
      { type:"complete", sentence:"Para novos projetos de coleta on-premises, o método moderno recomendado é o ____.", blank:"BindPlane Agent", hint:"O BindPlane Agent é o substituto moderno do Forwarder legado. Suporta Windows, Linux, firewalls e é gerenciado via BindPlane OP. O Forwarder ainda funciona mas novos projetos devem usar BindPlane Agent. Ref: cloud.google.com/chronicle/docs/ingestion/use-bindplane-agent", options:["BindPlane Agent","Forwarder","Webhook","Pub/Sub"] },
      { type:"truefalse", statement:"O Webhook no Google SecOps permite que a fonte envie logs diretamente ao endpoint HTTPS do SecOps.", answer:true, hint:"Correto. Webhook = push: a fonte envia ao endpoint HTTPS do SecOps. Limite: 4MB por request, 15K QPS por instância. Auth via API key no header. Ref: cloud.google.com/chronicle/docs/administration/feed-management" },
      { type:"complete", sentence:"Para GCP, o método nativo de ingestão sem BindPlane é via ____.", blank:"Pub/Sub", hint:"Cloud Logging → Log Sink → Pub/Sub Topic → Google SecOps (assinatura nativa). Sem agente, sem BindPlane. Para AWS/Azure usa-se Feed pull do bucket S3/Blob. Ref: cloud.google.com/chronicle/docs/ingestion/cloud-pubsub", options:["Pub/Sub","BindPlane Agent","Webhook","Forwarder"] },
      { type:"truefalse", statement:"O Forwarder do Google SecOps é o método recomendado para novas implementações.", answer:false, hint:"Incorreto. O Forwarder está DEPRECIADO — EOL Janeiro 2027. Para novos projetos use o BindPlane Agent. A partir de Abril/2026 novos clientes não podem criar Forwarders. Ref: cloud.google.com/chronicle/docs/install/install-forwarder" },
    ]},
  { id:6, title:"Investigação: Cases, SIEM Search & Graph", icon:"🔍",
    cards:[
      { q:"O que é a fase de Investigação no SecOps?", a:"Step 4 da jornada oficial. Após uma Detection, o analista investiga com 3 ferramentas:\n\n1. SIEM Search — busca de eventos UDM com query syntax\n2. Cases & Alerts — agrupa detecções relacionadas num caso\n3. Graph Investigator — visualiza relações entidade→evento→entidade\n\nObjetivo: confirmar se a Detection é True Positive e qual foi o escopo do ataque." },
      { q:"Como fazer uma busca no SIEM Search?", a:"Sintaxe de busca UDM no console do SecOps:\n\nmetadata.event_type = \"USER_LOGIN\"\nAND principal.ip = \"192.168.1.100\"\nAND security_result.action = \"ALLOW\"\n\nFiltros de tempo: LAST 24 HOURS, LAST 7 DAYS, range customizado.\nBusca qualquer campo UDM: hostname, userid, URL, hash de arquivo, IP." },
      { q:"O que são Cases & Alerts?", a:"Alert = detecção individual de uma regra YARA-L\nCase = conjunto de Alerts correlacionados em 1 caso de investigação\n\nAlert Grouping: configura como Alerts são agrupados automaticamente em Cases (ex: mesmo IP, mesmo usuário)\nSLA timer: prazo para triagem\nPriority: Low / Medium / High / Critical\n\nO analista trabalha no Case, não em cada Alert individualmente." },
      { q:"O que é o Graph Investigator?", a:"Visualização de relações em grafo:\n• Nós: Usuário, Asset (hostname), IP, Domínio, Hash de arquivo\n• Arestas: eventos que conectam entidades (LOGIN, PROCESS_LAUNCH, NETWORK_CONNECTION)\n• Timeline View: ordena eventos cronologicamente\n\nUso: identificar blast radius (escopo) do ataque, ver assets comprometidos, traçar movimento lateral." },
    ],
    challenges:[
      { type:"complete", sentence:"No SIEM Search, campos UDM são conectados com o operador ____.", blank:"AND", hint:"Sintaxe: metadata.event_type = \"USER_LOGIN\" AND principal.ip = \"x.x.x.x\". Outros: OR, NOT. Filtros de tempo: LAST 24 HOURS, LAST 7 DAYS. Você busca qualquer campo UDM diretamente no console. Ref: community Step 4.1 Investigation", options:["AND","WHERE","JOIN","FILTER"] },
      { type:"complete", sentence:"Um ____ agrupa múltiplas Detections relacionadas para investigação pelo analista.", blank:"Case", hint:"Alert = 1 Detection de 1 regra. Case = conjunto de Alerts correlacionados (mesmo usuário, IP ou timeline). Alert Grouping define como Alerts são agrupados. O analista trabalha no Case, não em cada Alert separado. Ref: community Step 4.2 Cases & Alerts", options:["Case","Alert","Detection","Rule"] },
      { type:"truefalse", statement:"O Graph Investigator mostra relações entre entidades (users, assets, IPs) em forma de grafo.", answer:true, hint:"Correto. Grafo com nós (User, Asset, IP, Domínio, Hash) e arestas (eventos). Permite identificar blast radius, movimento lateral e reconstruir a cadeia de ataque. Disponível na fase Investigate do SecOps. Ref: community Step 4.1" },
    ]},
  { id:7, title:"Content Hub, SOAR & Resposta", icon:"🛒",
    cards:[
      { q:"O que é o Content Hub (Marketplace) do SecOps?", a:"Hub central para instalar conteúdo pré-construído:\n• Integrations — conectores para ferramentas (Jira, PagerDuty, CrowdStrike...)\n• Playbooks prontos — fluxos de resposta a incidentes\n• Parsers — normalizadores para novas fontes de log\n• Analytics/Dashboards — painéis pré-configurados\n• Use Cases — pacotes completos por cenário\n\nTudo instalável em 1 clique, atualizado automaticamente. Ref: community Step 2.2" },
      { q:"Estrutura de um SOAR Playbook:", a:"Um Playbook tem 3 componentes:\n• Trigger: o que dispara (novo Alert, novo Case, schedule)\n• Actions: o que executar (consultar VirusTotal, bloquear IP, criar ticket no Jira)\n• Flow: lógica condicional (if/else, branches, loops)\n\nExemplo:\nNovo Alert SSH BF → Enriquecer IP no VirusTotal → Se score>70: bloquear IP → Criar ticket no Jira → Fechar Case" },
      { q:"Connector vs. Feed vs. BindPlane — quando usar cada um?", a:"Feed (SIEM): SecOps faz pull de APIs → para SaaS com API (Okta, M365)\nWebhook (SIEM): fonte faz push → para SaaS com webhook\nBindPlane Agent (SIEM): on-prem → endpoints, servidores, firewalls\nConnector (SOAR): ingere ALERTAS de ferramentas externas → para workflow de resposta\n\nFeed/BindPlane = logs→SIEM→YARA-L\nConnector = alertas→SOAR→Playbook" },
      { q:"Jobs Scheduler no SOAR:", a:"Scripts Python periódicos para tarefas automáticas:\n• Enrichment: buscar threat intel periodicamente\n• Cleanup: fechar cases antigos\n• Sync: sincronizar IOCs entre ferramentas\n• Reports: gerar relatórios semanais\n\nDiferença de Playbooks:\nJobs → rodam por SCHEDULE (periódico)\nPlaybooks → rodam por TRIGGER (evento)\nAmbos usam as mesmas Integrations do Marketplace." },
    ],
    challenges:[
      { type:"complete", sentence:"Para instalar parsers, playbooks e integrações prontas, usa-se o ____ do SecOps.", blank:"Content Hub", hint:"Content Hub (Marketplace): hub central com Integrations, Playbooks, Parsers, Dashboards, Use Cases. Instalável em 1 clique. Atualizado automaticamente. Distingue-se do SIEM onde você escreve regras YARA-L manualmente. Ref: community Step 2.2 Marketplace", options:["Content Hub","App Store","API Hub","Google Play"] },
      { type:"complete", sentence:"Em um Playbook SOAR, o que DISPARA a execução é chamado de ____.", blank:"Trigger", hint:"Playbook = Trigger + Actions + Flow. Trigger: novo Alert, novo Case, ou schedule periódico. Actions: consultar APIs, bloquear IP, criar ticket. Flow: lógica if/else. O Jobs Scheduler usa schedule direto — sem Trigger de evento. Ref: community Step 5.1 Response", options:["Trigger","Action","Flow","Event"] },
      { type:"complete", sentence:"Para ingerir ALERTAS de ferramentas externas (EDR, NGFW) no SOAR, usa-se um ____.", blank:"Connector", hint:"Connector (SOAR) = alertas externos para workflow de resposta. Feed/BindPlane (SIEM) = logs brutos para detecção. A distinção é arquitetural: Feed/BindPlane alimentam YARA-L. Connector alimenta Playbooks. Ref: community Step 2.1 e Step 2.2", options:["Connector","Feed","Parser","BindPlane Agent"] },
    ]},
];

// Desafio final do Módulo 1 — 10 questões mistas
const M1_FINAL_CHALLENGE = [
  { type:"complete", sentence:"O Google SecOps é uma plataforma SIEM/____ Cloud native.", blank:"SOAR", options:["SOAR","NGFW","VPN","IDS"] },
  { type:"truefalse", statement:"A hot data retention padrão do Google SecOps Standard é 12 meses sem custo por volume.", answer:true },
  { type:"complete", sentence:"O componente que converte raw log para UDM é o ____.", blank:"Parser", options:["Parser","Agent","Rule","Feed"] },
  { type:"truefalse", statement:"Sem normalização, você precisaria de uma regra YARA-L diferente para cada fabricante.", answer:true },
  { type:"complete", sentence:"O motor que executa regras YARA-L e gera alertas é o ____.", blank:"Rules Engine", options:["Rules Engine","UDM","SOAR","BindPlane"] },
  { type:"complete", sentence:"O Google SecOps possui agentes de ____ embutidos, como o Gemini.", blank:"IA", options:["IA","antivírus","VPN","proxy"] },
  { type:"complete", sentence:"O pacote com UEBA, Gemini e SOAR incluídos é o Google SecOps ____.", blank:"Enterprise", options:["Enterprise","Standard","Basic","Free"] },
  { type:"truefalse", statement:"O Enterprise Plus inclui threat intelligence completa de Mandiant e VirusTotal.", answer:true },
  { type:"complete", sentence:"O schema de normalização do Google SecOps chama-se ____.", blank:"UDM", options:["UDM","JSON","CEF","LEEF"] },
  { type:"complete", sentence:"O Google SecOps tem ____ pacotes de licença disponíveis.", blank:"3", options:["3","2","4","5"] },
  { type:"complete", sentence:"No SIEM Search, campos UDM são conectados com o operador ____.", blank:"AND", hint:"Sintaxe: metadata.event_type = \"USER_LOGIN\" AND principal.ip = \"x.x.x.x\". Outros: OR, NOT. Você busca qualquer campo UDM diretamente no console. Ref: community Step 4.1 Investigation", options:["AND","WHERE","JOIN","FILTER"] },
  { type:"complete", sentence:"Um ____ agrupa múltiplas Detections relacionadas para investigação pelo analista SOC.", blank:"Case", hint:"Alert = 1 Detection de 1 regra. Case = conjunto de Alerts correlacionados (mesmo usuário, IP, timeline). O analista trabalha no Case, não em cada Alert individual. Ref: community Step 4.2 Cases & Alerts", options:["Case","Alert","Detection","Rule"] },
  { type:"complete", sentence:"Para instalar parsers, playbooks e integrações prontas no SecOps, usa-se o ____.", blank:"Content Hub", hint:"Content Hub (Marketplace): Integrations, Playbooks prontos, Parsers, Dashboards, Use Cases. Instalável em 1 clique, atualizado automaticamente. Ref: community Step 2.2 Marketplace", options:["Content Hub","App Store","API Hub","Google Play"] },
  { type:"truefalse", statement:"Jobs Scheduler no SOAR roda por schedule periódico, diferente de Playbooks que rodam por Trigger.", answer:true, hint:"Correto. Jobs: scripts periódicos (enrichment, cleanup, sync, reports). Playbooks: disparam por Trigger (novo Alert, novo Case). Ambos usam as mesmas Integrations do Content Hub. Ref: community Step 5.1 Response" },
];

// ─── MODULE 2 DATA — UDM ─────────────────────────────────────────────────────
const UDM_SECTIONS = [
  { id:"metadata", color:C.amber, icon:"🏷", label:"metadata",
    desc:"Presente em todo evento. Define o tipo, timestamp e produto de origem.",
    fields:[
      { name:"metadata.event_type", type:"enum", example:'"USER_LOGIN"', desc:"Tipo do evento. Define quais campos são obrigatórios." },
      { name:"metadata.event_timestamp", type:"timestamp", example:'"2024-03-15T14:22:10Z"', desc:"Quando o evento ocorreu (UTC)." },
      { name:"metadata.product_name", type:"string", example:'"Windows"', desc:"Produto que gerou o log." },
      { name:"metadata.vendor_name", type:"string", example:'"Microsoft"', desc:"Fabricante do produto." },
      { name:"metadata.ingested_timestamp", type:"timestamp", example:'"2024-03-15T14:22:15Z"', desc:"Quando o Google SecOps recebeu o log." },
    ]},
  { id:"principal", color:C.cyan, icon:"👤", label:"principal",
    desc:"O ator que iniciou a ação — usuário, processo, host de origem.",
    fields:[
      { name:"principal.ip", type:"string", example:'"192.168.1.10"', desc:"IP de origem do evento." },
      { name:"principal.hostname", type:"string", example:'"DESKTOP-ABC01"', desc:"Hostname do host de origem." },
      { name:"principal.user.userid", type:"string", example:'"jsilva"', desc:"ID do usuário no sistema de origem. ATENÇÃO: em USER_LOGIN, o usuário que logou fica em target.user.userid, não aqui." },
      { name:"principal.user.email_addresses", type:"string[]", example:'"j.silva@corp.com"', desc:"Email do usuário principal." },
      { name:"principal.process.file.full_path", type:"string", example:'"C:\\Windows\\cmd.exe"', desc:"Caminho completo do processo pai." },
      { name:"principal.ip_geo_artifact.location.country_or_region", type:"string", example:'"Brazil"', desc:"País de origem do IP (geolocalização)." },
    ]},
  { id:"target", color:C.green, icon:"🎯", label:"target",
    desc:"O alvo da ação — servidor, usuário-alvo, arquivo, porta de destino.",
    fields:[
      { name:"target.ip", type:"string", example:'"10.0.0.1"', desc:"IP de destino." },
      { name:"target.port", type:"integer", example:"22", desc:"Porta de destino." },
      { name:"target.hostname", type:"string", example:'"srv-prod-01"', desc:"Hostname do alvo." },
      { name:"target.user.userid", type:"string", example:'"frank.kolzig"', desc:"Usuário-alvo da ação. Em USER_LOGIN, é aqui que fica quem logou (não em principal.user). Ex: target.user.userid = \"frank.kolzig\"" },
      { name:"target.user.attribute.roles.name", type:"string", example:'"admin"', desc:"Role atribuído ao usuário-alvo." },
      { name:"target.file.full_path", type:"string", example:'"/etc/passwd"', desc:"Caminho completo do arquivo alvo." },
      { name:"target.process.file.full_path", type:"string", example:'"powershell.exe"', desc:"Caminho do processo filho (target)." },
    ]},
  { id:"network", color:C.purple, icon:"🌐", label:"network",
    desc:"Dados da camada de rede — bytes, protocolo, DNS, HTTP.",
    fields:[
      { name:"network.sent_bytes", type:"integer", example:"104857600", desc:"Bytes enviados pelo principal." },
      { name:"network.received_bytes", type:"integer", example:"2048", desc:"Bytes recebidos pelo principal." },
      { name:"network.ip_protocol", type:"enum", example:'"TCP"', desc:"Protocolo IP: TCP, UDP, ICMP." },
      { name:"network.dns.questions.name", type:"string", example:'"evil.c2.io"', desc:"Nome consultado na query DNS." },
      { name:"network.http.method", type:"string", example:'"POST"', desc:"Método HTTP da requisição." },
      { name:"network.email.to.user.email_addresses", type:"string", example:'"externo@gmail.com"', desc:"Destinatário do email." },
    ]},
  { id:"security_result", color:C.red, icon:"🛡", label:"security_result",
    desc:"Decisão de segurança tomada pelo produto — ALLOW, BLOCK, UNKNOWN.",
    fields:[
      { name:"security_result.action", type:"enum", example:'"BLOCK"', desc:"Ação tomada: ALLOW, BLOCK, FAIL, QUARANTINE, UNKNOWN_ACTION. FAIL é usado em tentativas de login falhadas (brute force)." },
      { name:"security_result.severity", type:"enum", example:'"HIGH"', desc:"Severidade: INFORMATIONAL, LOW, MEDIUM, HIGH, CRITICAL." },
      { name:"security_result.summary", type:"string", example:'"Malware.Gen detected"', desc:"Descrição textual do resultado." },
      { name:"security_result.threat_name", type:"string", example:'"Trojan.Agent"', desc:"Nome da ameaça detectada." },
    ]},
  { id:"other", color:C.teal, icon:"🔀", label:"src · intermediary · observer",
    desc:"Seções adicionais usadas conforme necessário. src: fonte diferente do principal. intermediary: proxy/SMTP relay. observer: sniffer passivo. about: objetos adicionais. Só aparecem quando necessárias.",
    fields:[
      { name:"src.ip", type:"string", example:'"203.0.113.10"', desc:"IP da fonte do tráfego — quando a origem é diferente do principal. Ex: um firewall usa src (IP externo) e principal (o próprio firewall)." },
      { name:"intermediary.ip", type:"string", example:'"10.0.0.1"', desc:"IP do sistema intermediário (proxy, SMTP relay). Representa o 'middle man' entre origem e destino." },
      { name:"observer.ip", type:"string", example:'"192.168.1.254"', desc:"IP de sistema que monitora passivamente o tráfego (IDS/NDR passivo, packet sniffer). Não participa ativamente." },
      { name:"network.direction", type:"enum", example:'"OUTBOUND"', desc:"Direção do tráfego: INBOUND, OUTBOUND, UNKNOWN_DIRECTION. Essencial para detectar exfiltração (OUTBOUND + muitos bytes)." },
    ]},
];

const EVENT_TYPES = [
  { type:"USER_LOGIN", color:C.cyan, desc:"Autenticação de usuário (sucesso ou falha)", fields:["principal.user","principal.ip","security_result.action","target.port"] },
  { type:"NETWORK_CONNECTION", color:C.green, desc:"Conexão de rede estabelecida", fields:["principal.ip","target.ip","target.port","network.sent_bytes"] },
  { type:"NETWORK_DNS", color:C.teal, desc:"Consulta DNS realizada", fields:["principal.hostname","network.dns.questions.name","principal.ip"] },
  { type:"PROCESS_LAUNCH", color:C.orange, desc:"Processo iniciado no endpoint", fields:["principal.process.file.full_path","target.process.file.full_path","principal.hostname"] },
  { type:"FILE_CREATION", color:C.amber, desc:"Arquivo criado no sistema", fields:["target.file.full_path","principal.user.userid","principal.hostname"] },
  { type:"USER_RESOURCE_UPDATE_PERMISSIONS", color:C.purple, desc:"Alteração de permissão/role de usuário (IAM, GCP, AD). Ex: atribuição de role admin. Diferente de UPDATE_CONTENT que é modificação de conteúdo.", fields:["principal.user.userid","target.user.attribute.roles.name"] },
  { type:"EMAIL_TRANSACTION", color:C.pink, desc:"Transação de email enviada/recebida", fields:["principal.user.email_addresses","network.email.to.user.email_addresses"] },
  { type:"FILE_DELETION", color:C.red, desc:"Arquivo deletado no sistema", fields:["target.file.full_path","principal.user.userid","principal.hostname"] },
  { type:"USER_CREATION", color:C.green, desc:"Conta de usuário criada.", fields:["target.user.userid","target.user.email_addresses","principal.user.userid"] },
  { type:"USER_DELETION", color:C.red, desc:"Conta de usuário deletada. Correlaciona com USER_CREATION para detectar contas descartáveis criadas e removidas rapidamente.", fields:["target.user.userid","principal.user.userid"] },
  { type:"NETWORK_HTTP", color:C.teal, desc:"Tráfego HTTP/HTTPS — request e response. Captura URL, método, status code. Use após NETWORK_DNS para confirmar acesso real (DNS pode ser pre-fetch do browser). Campos: target.url, network.http.method, network.http.response_code.", fields:["target.url","target.hostname","network.http.method","principal.hostname"] },
  { type:"SCAN_FILE", color:C.orange, desc:"Evento de scan antivírus/EDR num arquivo. Inclui o resultado (ALLOW, BLOCK, QUARANTINE) e categoria da ameaça. Use security_result.category = 'SOFTWARE_MALICIOUS' e security_result.action para detectar malware que foi ALLOW (passou pelo AV).", fields:["target.file.full_path","security_result.action","security_result.category","security_result.threat_name"] },
  { type:"RULE_DETECTION", color:C.purple, desc:"Evento gerado quando uma regra YARA-L dispara — usado em composite rules. O campo $d.detection.risk_score contém o score da detection. $d.detection.outcomes['campo'] acessa outcome variables. $d.detection.rule_labels.key/value acessa labels da regra.", fields:["detection.risk_score","detection.rule_name","detection.outcomes","detection.rule_labels"] },
];


// ─── MODULE 2 CHALLENGE ───────────────────────────────────────────────────────
const M2_CHALLENGE = [
  { type:"complete", sentence:"O campo ____ define o tipo de atividade em todo evento UDM.", blank:"metadata.event_type", hint:"metadata.event_type é obrigatório em todo evento UDM. Valores: USER_LOGIN, NETWORK_CONNECTION, PROCESS_LAUNCH etc. Ref: cloud.google.com/chronicle/docs/reference/udm-field-list", options:["metadata.event_type","principal.ip","target.port","security_result.action"] },
  { type:"complete", sentence:"O IP de origem de um evento fica em ____.", blank:"principal.ip", hint:"principal = quem iniciou a ação. target = destino da ação. Nunca confunda: um USER_LOGIN tem principal.ip = IP do cliente, target.ip = IP do servidor. Ref: cloud.google.com/chronicle/docs/unified-data-model", options:["principal.ip","target.ip","network.ip","source.ip"] },
  { type:"complete", sentence:"O IP de destino de um evento fica em ____.", blank:"target.ip", hint:"target.ip é o destino da ação. Em conexões de rede: principal.ip é quem conecta, target.ip é quem recebe. Ref: cloud.google.com/chronicle/docs/reference/udm-field-list", options:["target.ip","principal.ip","dest.ip","network.dest"] },
  { type:"truefalse", statement:"O campo metadata.event_type é obrigatório em todo evento UDM.", answer:true, hint:"Correto. Sem metadata.event_type o evento não pode ser indexado corretamente. É o campo mais fundamental do UDM. Ref: cloud.google.com/chronicle/docs/unified-data-model" },
  { type:"complete", sentence:"Para acessar o usuário que executou a ação, usa-se ____.", blank:"principal.user.userid", hint:"Em YARA-L: $e.principal.user.userid. O 'principal' é sempre quem iniciou — em USER_LOGIN é o usuário que fez login. Ref: cloud.google.com/chronicle/docs/reference/udm-field-list", options:["principal.user.userid","user.id","target.user.userid","metadata.user"] },
  { type:"complete", sentence:"A decisão do firewall (ALLOW/BLOCK) fica em ____.", blank:"security_result.action", hint:"security_result.action aceita: ALLOW, BLOCK, QUARANTINE, UNKNOWN_ACTION. Nota: UDM usa BLOCK (não DENY). Ref: cloud.google.com/chronicle/docs/reference/udm-field-list", options:["security_result.action","network.action","metadata.decision","principal.action"] },
  { type:"complete", sentence:"O hostname do alvo do evento fica em ____.", blank:"target.hostname", hint:"target.hostname é o FQDN ou nome NetBIOS do destino. Diferente de target.ip que é o endereço IP. Ref: cloud.google.com/chronicle/docs/reference/udm-field-list", options:["target.hostname","dest.host","principal.hostname","network.host"] },
  { type:"truefalse", statement:"principal.ip e target.ip podem ter o mesmo valor num evento de loopback.", answer:true, hint:"Correto. Em conexões localhost (127.0.0.1→127.0.0.1) ambos podem ser iguais. O UDM não impede isso. Ref: cloud.google.com/chronicle/docs/unified-data-model" },
  { type:"complete", sentence:"Bytes enviados na conexão ficam em ____.", blank:"network.sent_bytes", hint:"network.sent_bytes (enviados pelo principal) e network.received_bytes (recebidos pelo principal). Tipo: integer. Ref: cloud.google.com/chronicle/docs/reference/udm-field-list", options:["network.sent_bytes","principal.bytes","target.sent","metadata.bytes"] },
  { type:"complete", sentence:"O event_type para login de usuário é ____.", blank:"USER_LOGIN", hint:"USER_LOGIN representa autenticação bem-sucedida ou falha. Para logoff: USER_LOGOUT. Para mudança de senha: USER_ACCOUNT_MODIFICATION. Ref: cloud.google.com/chronicle/docs/reference/udm-event-types", options:["USER_LOGIN","AUTH_LOGIN","USER_AUTH","NETWORK_LOGIN"] },
  { type:"complete", sentence:"O event_type para criação de processo é ____.", blank:"PROCESS_LAUNCH", hint:"PROCESS_LAUNCH = novo processo iniciado. Contém: principal.process (processo pai), target.process (processo filho), target.process.file.full_path. Ref: cloud.google.com/chronicle/docs/reference/udm-event-types", options:["PROCESS_LAUNCH","PROCESS_CREATE","PROCESS_START","EXEC_PROCESS"] },
  { type:"truefalse", statement:"Em USER_LOGIN, o usuário que fez login fica em target.user.userid (não em principal.user.userid).", answer:true, hint:"Correto. No UDM: principal = entidade que origina a ação (ex: máquina). Em USER_LOGIN, target = usuário que autenticou. Ref: community blog UDM" },
    { type:"truefalse", statement:"O Google SecOps descarta o raw log original após normalizar para UDM.", answer:false, hint:"Incorreto. O Google SecOps armazena AMBOS: o raw log original E o evento UDM normalizado. Os dois ficam disponíveis por 12 meses (em todos os tiers). Licenciamento por TB/ano. Ref: cloud.google.com/chronicle/docs/overview Ref: cloud.google.com/chronicle/docs/overview" },
];


// ─── MODULE 3 DATA — YARA-L BÁSICO ───────────────────────────────────────────
const M3_LESSONS = [
  { id:1, icon:"📐", title:"Anatomia de uma regra", content:`Uma regra YARA-L 2.0 tem 5 seções principais + 1 opcional:\n\n1. meta      — metadados (nome, severidade, autor)\n2. events    — filtros nos campos UDM\n3. match     — agrupamento e janela de tempo (opcional)\n4. condition — threshold para disparo (obrigatório)\n5. outcome   — variáveis calculadas (opcional)\n6. options   — ex: suppression_window = 5m (opcional)\n\n⚠️ FAIL-FAST: sempre coloque metadata.event_type PRIMEIRO\nna seção events. Sem isso, o engine executa regex e CIDR\ncontra TODOS os logs da plataforma — DNS, firewall, tudo.\nCom event_type no topo, o engine descarta 99% dos eventos\nantes de chegar nas comparações caras.`, quiz:[
    { q:"Qual seção define quando o alerta dispara?", opts:["meta","events","condition","match"], correct:2 },
    { q:"Qual seção é obrigatória em toda regra?", opts:["match","outcome","events","condition"], correct:2 },
  ]},
  { id:2, icon:"🔤", title:"Variáveis de evento", content:`Em YARA-L, você nomeia eventos com variáveis:\n\n$e — variável padrão de evento\n$e1, $e2 — para correlacionar dois eventos diferentes\n$ip, $user — placeholder variables (ligadas a campos)\n\nExemplo:\n$e.metadata.event_type = "USER_LOGIN"\n$e.principal.ip = $ip   ← $ip vira a chave do match`, quiz:[
    { q:"Como se chama a variável que é usada no match?", opts:["event var","placeholder var","meta var","rule var"], correct:1 },
    { q:'O que "$e1" representa?', opts:["campo UDM","segundo tipo de evento","resultado","metadado"], correct:1 },
  ]},
  { id:3, icon:"⏱", title:"Match e janelas de tempo", content:`O match agrupa eventos e define a janela temporal:\n\nmatch:\n  $ip over 10m    ← agrupa por IP em 10 minutos\n\nJanelas suportadas:\n• Xs / Xm / Xh / Xd (segundos, minutos, horas, dias)\n\nMúltiplas chaves:\n  $host, $domain over 5m\n\nSem match: regra de evento único (não precisa de janela)`, quiz:[
    { q:"Qual sintaxe agrupa por usuário em 30 minutos?", opts:["$user in 30m","$user over 30m","match $user 30m","user over 30min"], correct:1 },
    { q:"Quando NÃO usar a seção match?", opts:["sempre usar","regra de evento único","regras de DNS","regras de rede"], correct:1 },
  ]},
  { id:4, icon:"⚡", title:"Condition e operadores", content:`A condition define o threshold de disparo:\n\n#e > 5          ← mais de 5 eventos\n#e >= 1         ← pelo menos 1 evento\n$e              ← equivale a #e > 0 (pelo menos 1)\n#e1 >= 1 and #e2 >= 1   ← ambos os eventos presentes\n\nOperadores na seção events:\nnocase                              ← case-insensitive\nre.regex($e.field, \`padrão\`)       ← regex (backticks)\n$e.field = /padrão/ nocase          ← regex literal (outra sintaxe)\nnet.ip_in_range_cidr($e.ip, "x/y")  ← filtro CIDR\n$e.field in %minha_lista            ← reference list\n\n⚠️ ZERO VALUES: match filtra automaticamente "" e 0.\nSe $ip está no match, a regra já exclui $ip = "" implicitamente.`, quiz:[
    { q:"Como escrever 'mais de 10 eventos'?", opts:["#e >= 10","#e > 10","count > 10","events > 10"], correct:1 },
    { q:"Qual operador faz match case-insensitive?", opts:["ignorecase","nocase","icase","caseless"], correct:1 },
    { q:"O que '$e' sozinho na condition significa?", opts:["$e == true","#e > 0","$e exists","#e = 1"], correct:1 },
    { q:"Por que metadata.event_type deve ser PRIMEIRO na seção events?", opts:["Regra de sintaxe obrigatória","Fail-fast: descarta logs antes de executar regex/CIDR caros","Ordem alfabética","Melhora legibilidade"], correct:1 },
  ]},
];

// ─── M3 SKIP CHALLENGE ───────────────────────────────────────────────────────
const M3_SKIP_CHALLENGE = [
  // Lição 1 — Anatomia
  { type:"complete", sentence:"A seção obrigatória de toda regra YARA-L que define o disparo é ____.", blank:"condition", hint:"condition é a única seção verdadeiramente obrigatória nas detection rules. meta, events, match e outcome são opcionais dependendo do caso.", options:["condition","events","match","outcome"] },
  { type:"complete", sentence:"Para performance, o primeiro filtro na seção events deve ser ____.", blank:"metadata.event_type", hint:"FAIL-FAST: colocar metadata.event_type primeiro descarta 99% dos logs antes de executar regex e CIDR caros. Sem isso, o engine processa TODO o tráfego. Ref: community.google guide YARA-L optimization", options:["metadata.event_type","principal.ip","re.regex()","nocase"] },
  { type:"truefalse", statement:"A seção 'match' é obrigatória em toda regra YARA-L.", answer:false, hint:"match é OPCIONAL. Regras de evento único não precisam de match. Sem match, a regra avalia cada evento individualmente. Com match, agrupa eventos por chave em uma janela de tempo." },
  { type:"truefalse", statement:"A seção 'outcome' é obrigatória em toda regra YARA-L.", answer:false, hint:"outcome é OPCIONAL. Só necessária quando você quer calcular variáveis como sum(), count(), max() para usar na condition ou exportar com write_row." },
  // Lição 2 — Variáveis
  { type:"complete", sentence:"Para correlacionar dois tipos de evento diferentes na mesma regra, usa-se ____.", blank:"$e1 e $e2", hint:"$e1 e $e2 são variáveis de evento distintas. Ex: $e1 = USER_LOGIN, $e2 = FILE_CREATION. Cada uma filtra um tipo de evento. O join é feito via placeholder compartilhado no match.", options:["$e1 e $e2","$a e $b","$event1 e $event2","$first e $second"] },
  { type:"complete", sentence:"Em YARA-L, $ip em '$e.principal.ip = $ip' é chamado de ____ variable.", blank:"placeholder", hint:"Placeholder variables ($ip, $user, $host) capturam valores específicos de campos UDM e se tornam chaves do match. São diferentes de event variables ($e1, $e2) que representam eventos inteiros." },
  // Lição 3 — Match
  { type:"complete", sentence:"Para agrupar por IP em janela de 10 minutos: match: $ip ____ 10m.", blank:"over", hint:"Sintaxe do match: match: $chave over DURAÇÃO. A duração pode ser em segundos (s), minutos (m), horas (h) ou dias (d). Ex: match: $ip, $port over 30m." , options:["over","in","during","for"] },
  { type:"truefalse", statement:"O match filtra automaticamente placeholder variables com valor vazio ('') ou zero.", answer:true, hint:"Correto. Google SecOps implicitly filters out zero values: '' para strings, 0 para números. Se $ip está no match, a regra já exclui $ip = '' implicitamente. Ref: docs.cloud.google.com/chronicle/docs/yara-l/match-syntax" },
  // Lição 4 — Condition e operadores
  { type:"complete", sentence:"'$e' sozinho na seção condition equivale a ____.", blank:"#e > 0", hint:"$e na condition = #e > 0 = pelo menos 1 evento. É o caso de evento único sem threshold. Exemplo da doc: condition: $e1 — detecta toda ocorrência do evento, sem necessidade de contar.", options:["#e > 0","#e = 1","#e >= 1","count($e) > 0"] },
  { type:"complete", sentence:"O operador ____ torna comparações de string insensíveis a maiúsculas.", blank:"nocase", hint:"nocase funciona com strings literais ($e.field = 'value' nocase), com regex literal ($e.field = /pattern/ nocase) e com re.regex() (re.regex($e.field, `pattern`) nocase). Keywords são case-insensitive por padrão.", options:["nocase","ignorecase","icase","caseless"] },
  { type:"complete", sentence:"Para filtrar por range de rede em YARA-L: ____($e.principal.ip, '10.0.0.0/8').", blank:"net.ip_in_range_cidr", hint:"net.ip_in_range_cidr($e.principal.ip, '10.0.0.0/8') — retorna true se o IP está no range CIDR. Não use cidr() — a função correta é net.ip_in_range_cidr(). Ref: docs.cloud.google.com/chronicle/docs/detection/yara-l-2-0-overview", options:["net.ip_in_range_cidr","cidr","ip.in_range","net.cidr_match"] },
  { type:"complete", sentence:"A sintaxe ALTERNATIVA de regex literal em YARA-L é: $e.field = ____ nocase.", blank:"/padrão/", hint:"YARA-L aceita DUAS formas de regex: (1) re.regex($e.field, `padrão`) nocase e (2) $e.field = /padrão/ nocase. A forma com barras é mais compacta para patterns simples. Ambas suportam nocase. Ref: docs.cloud.google.com/chronicle/docs/yara-l/yara-l-2-0-examples", options:["/padrão/","'padrão'","`padrão`","re(/padrão/)"] },
];

// ─── MODULE 4 MISSIONS ────────────────────────────────────────────────────────
const MISSIONS = [
  // DETECÇÃO TÉCNICA
  { id:1,cat:"TÉCNICA",emoji:"🔐",title:"Brute Force SSH",tag:"AUTENTICAÇÃO",tagColor:C.cyan,xp:150,mitre:"T1110",
    story:"Detecte mais de 5 falhas de autenticação via SSH do mesmo IP em 10 minutos.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados da regra",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "ssh_brute_force"',correct:true},{id:"b",text:'rule_name = "login_ok"',correct:false},
        {id:"c",text:'severity = "HIGH"',correct:true},{id:"d",text:'severity = "INFO"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"Filtre os eventos corretos",multi:true,minCorrect:4,options:[
        {id:"a",text:'$e.metadata.event_type = "USER_LOGIN"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "NETWORK_CONNECTION"',correct:false},
        {id:"c",text:'$e.security_result.action = "FAIL"',correct:true},
        {id:"d",text:'$e.security_result.action = "BLOCK"',correct:false},
        {id:"e",text:"$e.target.port = 22",correct:true},
        {id:"f",text:"$e.target.port = 443",correct:false},
        {id:"g",text:"$e.principal.ip = $ip",correct:true}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por IP em 10 min",multi:false,minCorrect:1,options:[
        {id:"a",text:"$ip over 10m",correct:true},{id:"b",text:"$ip over 1h",correct:false},{id:"c",text:"$user over 10m",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Dispare com mais de 5 tentativas",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e > 5",correct:true},{id:"b",text:"#e > 1",correct:false},{id:"c",text:"#e > 100",correct:false}]},
    ],
    logs:[
      {id:1,icon:"🖥",desc:"192.168.1.50",detail:"8× BLOCK · USER_LOGIN · porta 22",alert:true},
      {id:2,icon:"✅",desc:"10.0.0.1",detail:"1× ALLOW · USER_LOGIN · porta 22",alert:false},
      {id:3,icon:"🌐",desc:"172.16.0.99",detail:"15× BLOCK · NETWORK_CONNECTION · porta 22",alert:false},
      {id:4,icon:"🖥",desc:"45.33.32.156",detail:"12× BLOCK · USER_LOGIN · porta 22 · 8min",alert:true},
    ],
    explanation:'USER_LOGIN + BLOCK + porta 22, agrupado por $ip em 10min. #e > 5 captura brute force sem alertar tentativas legítimas ocasionais.',
  },
  { id:2,cat:"TÉCNICA",emoji:"📤",title:"Exfiltração de Dados",tag:"DATA LOSS",tagColor:C.red,xp:200,mitre:"T1048",
    story:"Detecte transferências acima de 100 MB (104857600 bytes) para IPs fora da rede interna.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados da regra",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "data_exfiltration"',correct:true},{id:"b",text:'severity = "CRITICAL"',correct:true},
        {id:"c",text:'severity = "LOW"',correct:false},{id:"d",text:'rule_name = "file_upload"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"Filtre NETWORK_CONNECTION com volume alto e IP externo",multi:true,minCorrect:4,options:[
        {id:"a",text:'$e.metadata.event_type = "NETWORK_CONNECTION"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "USER_LOGIN"',correct:false},
        {id:"c",text:"$e.network.sent_bytes > 104857600",correct:true},
        {id:"d",text:"$e.network.sent_bytes > 1024",correct:false},
        {id:"e",text:'not net.ip_in_range_cidr($e.target.ip, "10.0.0.0/8")',correct:true},
        {id:"f",text:'$e.target.ip = "10.0.0.1"',correct:false},
        {id:"g",text:"$e.principal.user.userid = $user",correct:true}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por usuário em 1h",multi:false,minCorrect:1,options:[
        {id:"a",text:"$user over 1h",correct:true},{id:"b",text:"$user over 5m",correct:false},{id:"c",text:"$ip over 1h",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Um único evento já basta",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e >= 1",correct:true},{id:"b",text:"#e > 10",correct:false},{id:"c",text:"$e",correct:false}]},
    ],
    logs:[
      {id:1,icon:"📤",desc:"jsilva → 203.45.67.89",detail:"500 MB · NETWORK_CONNECTION · IP externo",alert:true},
      {id:2,icon:"📁",desc:"maria → 10.0.0.5",detail:"50 MB · NETWORK_CONNECTION · IP interno",alert:false},
      {id:3,icon:"🔑",desc:"admin → 8.8.8.8",detail:"200 MB · USER_LOGIN (event_type errado)",alert:false},
      {id:4,icon:"📤",desc:"pedro → 185.220.101.1",detail:"2 GB · NETWORK_CONNECTION · IP externo",alert:true},
    ],
    explanation:'NETWORK_CONNECTION + network.sent_bytes > 100MB + net.ip_in_range_cidr() para excluir RFC1918. Um evento já é suficiente — exfiltração não precisa de repetição.',
  },
  { id:3,cat:"TÉCNICA",emoji:"🌀",title:"DNS Tunneling",tag:"C2 EXFIL",tagColor:C.teal,xp:250,mitre:"T1071.004",
    story:"Detecte quando um host faz mais de 50 consultas DNS para o mesmo domínio em 5 minutos.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "dns_tunneling"',correct:true},{id:"b",text:'severity = "HIGH"',correct:true},
        {id:"c",text:'rule_name = "dns_query"',correct:false},{id:"d",text:'severity = "LOW"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"Use NETWORK_DNS e os campos corretos",multi:true,minCorrect:3,options:[
        {id:"a",text:'$e.metadata.event_type = "NETWORK_DNS"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "NETWORK_CONNECTION"',correct:false},
        {id:"c",text:"$e.network.dns.questions.name = $domain",correct:true},
        {id:"d",text:"$e.network.dns.response_code = 0",correct:false},
        {id:"e",text:"$e.principal.hostname = $host",correct:true},
        {id:"f",text:"$e.target.port = 53",correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por host E domínio em 5min",multi:false,minCorrect:1,options:[
        {id:"a",text:"$host, $domain over 5m",correct:true},{id:"b",text:"$host over 5m",correct:false},{id:"c",text:"$domain over 1h",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Mais de 50 queries",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e > 50",correct:true},{id:"b",text:"#e > 5",correct:false},{id:"c",text:"#e >= 1",correct:false}]},
    ],
    logs:[
      {id:1,icon:"🌀",desc:"host-01 → evil.c2.io",detail:"87× NETWORK_DNS · 4min · subdomains aleatórios",alert:true},
      {id:2,icon:"✅",desc:"host-02 → google.com",detail:"12× NETWORK_DNS · 5min · consultas normais",alert:false},
      {id:3,icon:"🌀",desc:"host-03 → malware-c2.ru",detail:"120× NETWORK_DNS · 3min · payload em subdomínio",alert:true},
      {id:4,icon:"✅",desc:"host-04 → corp-dns.local",detail:"30× NETWORK_DNS · 5min · abaixo do limiar",alert:false},
    ],
    explanation:'NETWORK_DNS (não NETWORK_CONNECTION!) com network.dns.questions.name. Agrupamento duplo $host,$domain evita falsos positivos. 50+ queries/5min é o padrão de tunelamento.',
  },
  { id:4,cat:"TÉCNICA",emoji:"💉",title:"Process Injection",tag:"ENDPOINT",tagColor:C.orange,xp:300,mitre:"T1055",
    story:"lsass.exe ou winlogon.exe nunca devem lançar shells. Detecte PROCESS_LAUNCH com pai suspeito e filho sendo cmd.exe ou powershell.exe.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "process_injection"',correct:true},{id:"b",text:'severity = "CRITICAL"',correct:true},
        {id:"c",text:'severity = "LOW"',correct:false},{id:"d",text:'rule_name = "new_process"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"Filtre processo pai e filho corretos",multi:true,minCorrect:3,options:[
        {id:"a",text:'$e.metadata.event_type = "PROCESS_LAUNCH"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "USER_LOGIN"',correct:false},
        {id:"c",text:'re.regex($e.principal.process.file.full_path, `lsass\\.exe|winlogon\\.exe`) nocase',correct:true},
        {id:"d",text:'$e.principal.process.file.full_path = "explorer.exe"',correct:false},
        {id:"e",text:'re.regex($e.target.process.file.full_path, `cmd\\.exe|powershell\\.exe`) nocase',correct:true},
        {id:"f",text:'$e.principal.hostname = "DC01"',correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por host em 5min",multi:false,minCorrect:1,options:[
        {id:"a",text:"$e.principal.hostname over 5m",correct:true},{id:"b",text:"$e.principal.ip over 5m",correct:false},{id:"c",text:"$e.principal.user.userid over 5m",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Um evento já é crítico",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e >= 1",correct:true},{id:"b",text:"#e > 3",correct:false},{id:"c",text:"#e > 10",correct:false}]},
    ],
    logs:[
      {id:1,icon:"💉",desc:"lsass.exe → cmd.exe",detail:"PROCESS_LAUNCH · DC01 · injeção clássica",alert:true},
      {id:2,icon:"✅",desc:"explorer.exe → notepad.exe",detail:"PROCESS_LAUNCH · processo pai legítimo",alert:false},
      {id:3,icon:"💉",desc:"winlogon.exe → powershell",detail:"PROCESS_LAUNCH · WS01 · shell suspeito",alert:true},
      {id:4,icon:"✅",desc:"chrome.exe → chrome.exe",detail:"PROCESS_LAUNCH · subprocesso normal",alert:false},
    ],
    explanation:'PROCESS_LAUNCH com re.regex() em principal.process (pai) e target.process (filho). O operador nocase é nativo YARA-L 2.0. Um único evento deste tipo já é CRÍTICO.',
  },
  { id:5,cat:"TÉCNICA",emoji:"🦠",title:"Ransomware",tag:"ENDPOINT",tagColor:C.red,xp:350,mitre:"T1486",
    story:"Endpoint criando centenas de arquivos .encrypted ou .locked em 2 minutos — sinal clássico de ransomware em ação.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "ransomware_encryption"',correct:true},{id:"b",text:'severity = "CRITICAL"',correct:true},
        {id:"c",text:'severity = "MEDIUM"',correct:false},{id:"d",text:'rule_name = "file_create"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"FILE_CREATION com extensão suspeita",multi:true,minCorrect:3,options:[
        {id:"a",text:'$e.metadata.event_type = "FILE_CREATION"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "PROCESS_LAUNCH"',correct:false},
        {id:"c",text:'re.regex($e.target.file.full_path, `\\.encrypted|\\.locked|\\.crypt`) nocase',correct:true},
        {id:"d",text:'$e.target.file.size > 1000000',correct:false},
        {id:"e",text:"$e.principal.hostname = $host",correct:true},
        {id:"f",text:"$e.target.file.mime_type = $mime",correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por host em 2 minutos",multi:false,minCorrect:1,options:[
        {id:"a",text:"$host over 2m",correct:true},{id:"b",text:"$host over 1h",correct:false},{id:"c",text:"$ip over 2m",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Mais de 20 arquivos suspeitos",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e > 20",correct:true},{id:"b",text:"#e >= 1",correct:false},{id:"c",text:"#e > 500",correct:false}]},
    ],
    logs:[
      {id:1,icon:"🦠",desc:"DESKTOP-01",detail:"350× FILE_CREATION · .encrypted · 1min 40s",alert:true},
      {id:2,icon:"✅",desc:"LAPTOP-05",detail:"3× FILE_CREATION · .docx · arquivos normais",alert:false},
      {id:3,icon:"🦠",desc:"SERVER-DB",detail:"89× FILE_CREATION · .locked · 1min 55s",alert:true},
      {id:4,icon:"✅",desc:"DESKTOP-02",detail:"10× FILE_CREATION · .crypt · abaixo do limiar",alert:false},
    ],
    explanation:'FILE_CREATION + re.regex() nas extensões + janela curtíssima de 2min. Threshold de 20 arquivos elimina deploys legítimos — ransomware é muito mais agressivo.',
  },
  { id:6,cat:"TÉCNICA",emoji:"📡",title:"C2 Beaconing",tag:"C2 COMM",tagColor:C.teal,xp:400,mitre:"T1071",
    story:"Malware faz check-ins periódicos para o servidor do atacante. Detecte 100+ conexões para o mesmo IP externo em 30 minutos.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "c2_beaconing"',correct:true},{id:"b",text:'severity = "CRITICAL"',correct:true},
        {id:"c",text:'severity = "INFO"',correct:false},{id:"d",text:'rule_name = "outbound_conn"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"Filtre conexões externas repetitivas",multi:true,minCorrect:4,options:[
        {id:"a",text:'$e.metadata.event_type = "NETWORK_CONNECTION"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "NETWORK_DNS"',correct:false},
        {id:"c",text:'not net.ip_in_range_cidr($e.target.ip, "10.0.0.0/8")',correct:true},
        {id:"d",text:'not net.ip_in_range_cidr($e.target.ip, "192.168.0.0/16")',correct:true},
        {id:"e",text:"$e.principal.hostname = $host",correct:true},
        {id:"f",text:'$e.network.ip_protocol = "UDP"',correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por host em 30min",multi:false,minCorrect:1,options:[
        {id:"a",text:"$host over 30m",correct:true},{id:"b",text:"$host over 5m",correct:false},{id:"c",text:"$dest over 30m",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Mais de 100 conexões",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e > 100",correct:true},{id:"b",text:"#e > 5",correct:false},{id:"c",text:"#e >= 1",correct:false}]},
    ],
    logs:[
      {id:1,icon:"📡",desc:"WS-FIN-01 → 185.220.101.5",detail:"142× NETWORK_CONNECTION · 28min · externo",alert:true},
      {id:2,icon:"✅",desc:"WS-DEV-03 → github.com",detail:"15× NETWORK_CONNECTION · 30min · normal",alert:false},
      {id:3,icon:"📡",desc:"WS-HR-07 → 91.121.55.34",detail:"230× NETWORK_CONNECTION · 25min · externo",alert:true},
      {id:4,icon:"✅",desc:"WS-IT-04 → 192.168.1.1",detail:"500× NETWORK_CONNECTION · RFC1918 interno",alert:false},
    ],
    explanation:'Dois cidr() com not para excluir RFC1918 (10.x e 192.168.x). 100+ conexões/30min captura o heartbeat do malware sem alertar tráfego legítimo de APIs.',
  },

  // REGRAS COMPORTAMENTAIS
  { id:7,cat:"COMPORTAMENTAL",emoji:"🌙",title:"Acesso Fora do Horário",tag:"COMPORTAMENTAL",tagColor:C.indigo,xp:300,mitre:"T1078 — Valid Accounts",
    story:"Analistas legítimos não acessam sistemas sensíveis às 3h da manhã. Detecte USER_LOGIN com ALLOW fora do horário comercial (antes das 8h ou depois das 20h) usando a função timestamp.get_hour().",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados da regra comportamental",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "after_hours_access"',correct:true},{id:"b",text:'severity = "MEDIUM"',correct:true},
        {id:"c",text:'severity = "LOW"',correct:false},{id:"d",text:'rule_name = "login_monitor"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"Filtre login ALLOW com horário suspeito",multi:true,minCorrect:4,options:[
        {id:"a",text:'$e.metadata.event_type = "USER_LOGIN"',correct:true},
        {id:"b",text:'$e.security_result.action = "ALLOW"',correct:true},
        {id:"c",text:'$e.security_result.action = "BLOCK"',correct:false},
        {id:"d",text:'timestamp.get_hour($e.metadata.event_timestamp, "America/Sao_Paulo") < 8',correct:true},
        {id:"e",text:"$e.principal.user.userid = $user",correct:true},
        {id:"f",text:'timestamp.get_hour($e.metadata.event_timestamp, "UTC") < 8',correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por usuário em 1h",multi:false,minCorrect:1,options:[
        {id:"a",text:"$user over 1h",correct:true},{id:"b",text:"$user over 5m",correct:false},{id:"c",text:"$e.principal.ip over 1h",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Um único login fora do horário já dispara",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e >= 1",correct:true},{id:"b",text:"#e > 5",correct:false},{id:"c",text:"#e > 10",correct:false}]},
    ],
    logs:[
      {id:1,icon:"🌙",desc:"ana.silva — 03:14",detail:"USER_LOGIN ALLOW · America/SP · fora do horário",alert:true},
      {id:2,icon:"☀️",desc:"carlos.m — 09:30",detail:"USER_LOGIN ALLOW · America/SP · horário normal",alert:false},
      {id:3,icon:"🌙",desc:"root — 02:47",detail:"USER_LOGIN ALLOW · America/SP · madrugada",alert:true},
      {id:4,icon:"🔒",desc:"hacker — 03:00",detail:"USER_LOGIN BLOCK · tentativa bloqueada",alert:false},
      {id:5,icon:"☀️",desc:"pedro.c — 14:22",detail:"USER_LOGIN ALLOW · America/SP · horário comercial",alert:false},
    ],
    explanation:'timestamp.get_hour() é função nativa YARA-L 2.0. Usar timezone correto ("America/Sao_Paulo") é crítico — UTC pode criar falsos negativos. BLOCK não interessa — só logins bem-sucedidos fora do horário.',
  },
  { id:8,cat:"COMPORTAMENTAL",emoji:"✈️",title:"Impossible Travel",tag:"COMPORTAMENTAL",tagColor:C.pink,xp:350,mitre:"T1078 — Valid Accounts",
    story:"Mesmo usuário logou em São Paulo e 10 minutos depois em Moscou. Fisicamente impossível. Detecte dois USER_LOGIN ALLOW de países diferentes do mesmo usuário em 30 minutos.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "impossible_travel"',correct:true},{id:"b",text:'severity = "HIGH"',correct:true},
        {id:"c",text:'severity = "LOW"',correct:false},{id:"d",text:'rule_name = "geo_login"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"Dois eventos $e1 e $e2 — mesmo usuário",multi:true,minCorrect:4,options:[
        {id:"a",text:'$e1.metadata.event_type = "USER_LOGIN"',correct:true},
        {id:"b",text:'$e2.metadata.event_type = "USER_LOGIN"',correct:true},
        {id:"c",text:'$e1.security_result.action = "ALLOW"',correct:true},
        {id:"d",text:'$e1.security_result.action = "BLOCK"',correct:false},
        {id:"e",text:"$e1.principal.user.userid = $user",correct:true},
        {id:"f",text:"$e2.principal.user.userid = $user",correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por usuário em 30 minutos",multi:false,minCorrect:1,options:[
        {id:"a",text:"$user over 30m",correct:true},{id:"b",text:"$user over 24h",correct:false},{id:"c",text:"$ip over 30m",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Ambos os eventos presentes",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e1 >= 1 and #e2 >= 1",correct:true},{id:"b",text:"#e1 > 5",correct:false},{id:"c",text:"#e1 >= 1",correct:false}]},
    ],
    logs:[
      {id:1,icon:"✈️",desc:"ana.silva",detail:"LOGIN ALLOW · BR 09:00 → RU 09:10 · impossível",alert:true},
      {id:2,icon:"✅",desc:"carlos.mendes",detail:"LOGIN ALLOW · BR 09:00 → BR 09:30 · mesmo país",alert:false},
      {id:3,icon:"✈️",desc:"pedro.costa",detail:"LOGIN ALLOW · US 14:00 → CN 14:08 · impossível",alert:true},
      {id:4,icon:"🔒",desc:"maria.lima",detail:"LOGIN BLOCK · BR → RU · bloqueado (não ALLOW)",alert:false},
    ],
    explanation:'Correlação de dois event variables ($e1, $e2) via placeholder $user. O campo de geolocalização é principal.ip_geo_artifact.location.country_or_region. Para garantir ordem cronológica, use: $e1.metadata.event_timestamp.seconds < $e2.metadata.event_timestamp.seconds na seção events. Community Guide: timestamp ordering é obrigatório em multi-event correlations.',
  },
  { id:9,cat:"COMPORTAMENTAL",emoji:"📧",title:"Email Exfiltration",tag:"INSIDER THREAT",tagColor:C.pink,xp:400,mitre:"T1114.003",
    story:"Funcionário insatisfeito está encaminhando emails corporativos para conta pessoal. Detecte mais de 20 EMAIL_TRANSACTION para domínios externos em 1 hora pelo mesmo usuário.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "email_exfiltration"',correct:true},{id:"b",text:'severity = "HIGH"',correct:true},
        {id:"c",text:'severity = "LOW"',correct:false},{id:"d",text:'rule_name = "email_send"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"EMAIL_TRANSACTION para domínios externos",multi:true,minCorrect:3,options:[
        {id:"a",text:'$e.metadata.event_type = "EMAIL_TRANSACTION"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "NETWORK_CONNECTION"',correct:false},
        {id:"c",text:'not $e.network.email.to.user.email_addresses in %corporate_domains',correct:true},
        {id:"d",text:'$e.network.email.to.user.email_addresses = "external@gmail.com"',correct:false},
        {id:"e",text:"$e.principal.user.userid = $user",correct:true},
        {id:"f",text:"$e.target.port = 25",correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por usuário em 1h",multi:false,minCorrect:1,options:[
        {id:"a",text:"$user over 1h",correct:true},{id:"b",text:"$user over 5m",correct:false},{id:"c",text:"$dest over 1h",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Mais de 20 emails externos",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e > 20",correct:true},{id:"b",text:"#e >= 1",correct:false},{id:"c",text:"#e > 100",correct:false}]},
    ],
    logs:[
      {id:1,icon:"📧",desc:"jose.silva → gmail.com",detail:"35× EMAIL_TRANSACTION · externo · 45min",alert:true},
      {id:2,icon:"✅",desc:"maria → colega@corp.com",detail:"5× EMAIL_TRANSACTION · domínio interno",alert:false},
      {id:3,icon:"📧",desc:"pedro → hotmail.com",detail:"28× EMAIL_TRANSACTION · externo · 1h",alert:true},
      {id:4,icon:"✅",desc:"ana → parceiro@empresa.com",detail:"3× EMAIL_TRANSACTION · domínio externo mas baixo volume",alert:false},
    ],
    explanation:'EMAIL_TRANSACTION + reference list %corporate_domains (operador in %) para identificar destinatários externos. O operador % referencia listas de referência do Google SecOps — mais flexível que hardcodar domínios.',
  },
  { id:10,cat:"COMPORTAMENTAL",emoji:"🚪",title:"Lateral Movement RDP",tag:"MOVIMENTO",tagColor:C.orange,xp:400,mitre:"T1021.001",
    story:"Atacante comprometeu uma máquina e está se movendo pela rede via RDP. Detecte 3+ conexões RDP (porta 3389) originárias do mesmo IP para destinos diferentes em 15 minutos.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "rdp_lateral_movement"',correct:true},{id:"b",text:'severity = "HIGH"',correct:true},
        {id:"c",text:'severity = "LOW"',correct:false},{id:"d",text:'rule_name = "rdp_login"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"NETWORK_CONNECTION para porta RDP",multi:true,minCorrect:4,options:[
        {id:"a",text:'$e.metadata.event_type = "NETWORK_CONNECTION"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "USER_LOGIN"',correct:false},
        {id:"c",text:"$e.target.port = 3389",correct:true},
        {id:"d",text:"$e.target.port = 22",correct:false},
        {id:"e",text:'$e.security_result.action = "ALLOW"',correct:true},
        {id:"f",text:"$e.principal.ip = $src",correct:true},
        {id:"g",text:"$e.target.ip = $src",correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por IP origem em 15min",multi:false,minCorrect:1,options:[
        {id:"a",text:"$src over 15m",correct:true},{id:"b",text:"$src over 1h",correct:false},{id:"c",text:"$dst over 15m",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Mais de 3 conexões RDP",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e > 3",correct:true},{id:"b",text:"#e >= 1",correct:false},{id:"c",text:"#e > 50",correct:false}]},
    ],
    logs:[
      {id:1,icon:"🚪",desc:"192.168.10.5 → múltiplos hosts",detail:"7× NETWORK_CONNECTION · RDP 3389 · ALLOW · 12min",alert:true},
      {id:2,icon:"✅",desc:"192.168.1.100 → 192.168.1.200",detail:"1× NETWORK_CONNECTION · RDP 3389 · admin legítimo",alert:false},
      {id:3,icon:"🚪",desc:"10.0.5.22 → 5 servidores",detail:"5× NETWORK_CONNECTION · RDP 3389 · ALLOW · 10min",alert:true},
      {id:4,icon:"✅",desc:"10.0.0.1 → 10.0.0.2",detail:"2× NETWORK_CONNECTION · SSH porta 22 (não RDP)",alert:false},
    ],
    explanation:'Porta 3389 é RDP. Agrupando por $src detecta um host se movendo para múltiplos destinos. Threshold baixo (>3) porque 3 saltos RDP em 15min é claramente anômalo. Em regras multi-evento, garanta ordem cronológica com $e1.metadata.event_timestamp.seconds < $e2.metadata.event_timestamp.seconds.',
  },
  { id:11,cat:"COMPORTAMENTAL",emoji:"👁",title:"Privilege Escalation",tag:"IDENTIDADE",tagColor:C.purple,xp:450,mitre:"T1078 — Valid Accounts",
    story:"Usuário comum ganhou role de 'admin' em múltiplos sistemas. Detecte USER_RESOURCE_UPDATE_PERMISSIONS com role = admin para qualquer usuário.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "privilege_escalation"',correct:true},{id:"b",text:'severity = "CRITICAL"',correct:true},
        {id:"c",text:'severity = "MEDIUM"',correct:false},{id:"d",text:'rule_name = "admin_login"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"Filtre o event_type correto de mudança de role",multi:true,minCorrect:3,options:[
        {id:"a",text:'$e.metadata.event_type = "USER_RESOURCE_UPDATE_PERMISSIONS"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "USER_ACCOUNT_MODIFICATION"',correct:false},
        {id:"c",text:'$e.target.user.attribute.roles.name = "admin"',correct:true},
        {id:"d",text:'$e.target.user.attribute.roles.name = "viewer"',correct:false},
        {id:"e",text:"$e.principal.user.userid = $user",correct:true},
        {id:"f",text:"$e.principal.ip = $ip",correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por usuário em 15min",multi:false,minCorrect:1,options:[
        {id:"a",text:"$user over 15m",correct:true},{id:"b",text:"$user over 24h",correct:false},{id:"c",text:"$ip over 15m",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Um único evento já é crítico",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e >= 1",correct:true},{id:"b",text:"#e > 5",correct:false},{id:"c",text:"#e > 10",correct:false}]},
    ],
    logs:[
      {id:1,icon:"👑",desc:"hacker_user",detail:"USER_RESOURCE_UPDATE → role: admin · 3 sistemas",alert:true},
      {id:2,icon:"👤",desc:"normal_user",detail:"USER_RESOURCE_UPDATE → role: viewer",alert:false},
      {id:3,icon:"👑",desc:"svc_account",detail:"USER_RESOURCE_UPDATE → role: admin · 1 sistema",alert:true},
      {id:4,icon:"🔐",desc:"john.doe",detail:"USER_ACCOUNT_MODIFICATION (event_type diferente)",alert:false},
    ],
    explanation:'USER_RESOURCE_UPDATE_PERMISSIONS é o event_type real do UDM para mudança de roles. target.user.attribute.roles.name é o campo exato da documentação Google SecOps.',
  },
  { id:12,cat:"COMPORTAMENTAL",emoji:"🗂",title:"Mass File Deletion",tag:"INSIDER THREAT",tagColor:C.red,xp:500,mitre:"T1485 — Data Destruction",
    story:"Funcionário demitido está deletando arquivos críticos antes de sair. Detecte mais de 50 FILE_DELETION em 5 minutos pelo mesmo usuário.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "mass_file_deletion"',correct:true},{id:"b",text:'severity = "CRITICAL"',correct:true},
        {id:"c",text:'severity = "LOW"',correct:false},{id:"d",text:'rule_name = "file_removed"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"FILE_DELETION com usuário identificado",multi:true,minCorrect:3,options:[
        {id:"a",text:'$e.metadata.event_type = "FILE_DELETION"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "FILE_CREATION"',correct:false},
        {id:"c",text:"$e.principal.user.userid = $user",correct:true},
        {id:"d",text:"$e.target.file.size > 0",correct:false},
        {id:"e",text:"$e.principal.hostname = $host",correct:true},
        {id:"f",text:"$e.target.file.mime_type = $mime",correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por usuário em 5 minutos",multi:false,minCorrect:1,options:[
        {id:"a",text:"$user over 5m",correct:true},{id:"b",text:"$user over 1h",correct:false},{id:"c",text:"$host over 5m",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Mais de 50 deletions em 5min",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e > 50",correct:true},{id:"b",text:"#e > 5",correct:false},{id:"c",text:"#e >= 1",correct:false}]},
    ],
    logs:[
      {id:1,icon:"🗂",desc:"pedro.demitido",detail:"380× FILE_DELETION · pasta /projetos · 4min",alert:true},
      {id:2,icon:"✅",desc:"sistema_backup",detail:"20× FILE_DELETION · rotina noturna · normal",alert:false},
      {id:3,icon:"🗂",desc:"maria.insatisfeita",detail:"95× FILE_DELETION · /financeiro · 3min",alert:true},
      {id:4,icon:"✅",desc:"dev.auto",detail:"10× FILE_DELETION · arquivos temporários",alert:false},
    ],
    explanation:'FILE_DELETION é o event_type correto para deletions no UDM. Janela de 5min com threshold 50 captura destruição em massa sem alertar limpezas de temp files ou rotinas de backup.',
  },

  // RISCOS DE IA
  { id:13,cat:"IA",emoji:"🤖",title:"Shadow AI",tag:"AI RISK",tagColor:"#a78bfa",xp:300,mitre:"T1567 — Exfil Over Web Service",
    story:"Política corporativa proíbe o uso de serviços de IA externos não aprovados. Detecte funcionários acessando ChatGPT, Claude, Gemini ou similares usando a reference list %unauthorized_ai_services — mais de 5 conexões em 1 hora dispara alerta.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados da regra",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "shadow_ai_usage"',correct:true},
        {id:"b",text:'severity = "MEDIUM"',correct:true},
        {id:"c",text:'rule_name = "ai_access"',correct:false},
        {id:"d",text:'severity = "LOW"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"NETWORK_CONNECTION com reference list de domínios de IA",multi:true,minCorrect:3,options:[
        {id:"a",text:'$e.metadata.event_type = "NETWORK_CONNECTION"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "NETWORK_DNS"',correct:false},
        {id:"c",text:"$e.target.hostname in %unauthorized_ai_services",correct:true},
        {id:"d",text:'$e.target.hostname = "openai.com"',correct:false},
        {id:"e",text:"$e.principal.user.userid = $user",correct:true},
        {id:"f",text:"$e.security_result.action = $act",correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por usuário em 1h",multi:false,minCorrect:1,options:[
        {id:"a",text:"$user over 1h",correct:true},
        {id:"b",text:"$user over 5m",correct:false},
        {id:"c",text:"$e.target.hostname over 1h",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Mais de 5 conexões para IA não autorizada",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e > 5",correct:true},
        {id:"b",text:"#e >= 1",correct:false},
        {id:"c",text:"#e > 50",correct:false}]},
    ],
    logs:[
      {id:1,icon:"🤖",desc:"joao.silva → chat.openai.com",detail:"18× NETWORK_CONNECTION · 45min · IP corporativo",alert:true},
      {id:2,icon:"✅",desc:"maria.dev → vertex.ai.google",detail:"3× NETWORK_CONNECTION · GCP aprovado via política",alert:false},
      {id:3,icon:"🤖",desc:"pedro.hr → claude.ai",detail:"12× NETWORK_CONNECTION · 1h · não autorizado",alert:true},
      {id:4,icon:"✅",desc:"ana.ti → gemini.google.com",detail:"2× NETWORK_CONNECTION · abaixo do limiar",alert:false},
      {id:5,icon:"🤖",desc:"carlos.fin → api.anthropic.com",detail:"9× NETWORK_CONNECTION · 30min · não autorizado",alert:true},
    ],
    explanation:'Reference lists (%unauthorized_ai_services) são listas mantidas centralmente no Google SecOps — muito mais flexíveis que hardcodar domínios. Ao adicionar um novo serviço de IA à lista, todas as regras que a referenciam passam a detectá-lo automaticamente.',
  },

  { id:14,cat:"IA",emoji:"🧠",title:"Exfiltração de Modelo ML",tag:"AI RISK",tagColor:"#a78bfa",xp:450,mitre:"T1048 — Exfiltration Over Alternative Protocol",
    story:"Pesquisador de ML está enviando um modelo proprietário treinado internamente para um servidor externo. Arquivos .safetensors, .onnx ou .pkl acima de 1 GB enviados para fora da rede são sinal claro de roubo de propriedade intelectual de IA.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados da regra",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "ml_model_exfiltration"',correct:true},
        {id:"b",text:'severity = "CRITICAL"',correct:true},
        {id:"c",text:'severity = "LOW"',correct:false},
        {id:"d",text:'rule_name = "file_upload"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"Arquivo de modelo ML grande enviado para exterior",multi:true,minCorrect:4,options:[
        {id:"a",text:'$e.metadata.event_type = "NETWORK_CONNECTION"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "FILE_CREATION"',correct:false},
        {id:"c",text:"$e.network.sent_bytes > 1073741824",correct:true},
        {id:"d",text:"$e.network.sent_bytes > 1024",correct:false},
        {id:"e",text:'re.regex($e.principal.process.file.full_path, `python|jupyter|pytorch`) nocase',correct:true},
        {id:"f",text:'not net.ip_in_range_cidr($e.target.ip, "10.0.0.0/8")',correct:true},
        {id:"g",text:'$e.target.port = 443',correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por usuário em 30 minutos",multi:false,minCorrect:1,options:[
        {id:"a",text:"$e.principal.user.userid over 30m",correct:true},
        {id:"b",text:"$e.principal.ip over 30m",correct:false},
        {id:"c",text:"$e.target.ip over 30m",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Um único envio já é suficiente",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e >= 1",correct:true},
        {id:"b",text:"#e > 5",correct:false},
        {id:"c",text:"#e > 10",correct:false}]},
    ],
    logs:[
      {id:1,icon:"🧠",desc:"researcher01 · python3",detail:"1.8 GB · NETWORK_CONNECTION → 185.45.12.99 · externo",alert:true},
      {id:2,icon:"✅",desc:"ml.team · jupyter",detail:"500 MB · NETWORK_CONNECTION → 10.0.1.50 · MLflow interno",alert:false},
      {id:3,icon:"🧠",desc:"data.sci · pytorch",detail:"3.2 GB · NETWORK_CONNECTION → 203.0.113.5 · externo",alert:true},
      {id:4,icon:"✅",desc:"devops · kubectl",detail:"50 MB · NETWORK_CONNECTION → externo · processo não é ML",alert:false},
    ],
    explanation:'1073741824 bytes = 1 GB. Modelos de IA modernos (LLaMA, Stable Diffusion etc.) pesam vários GB — muito acima de transferências normais. re.regex() no processo (python/jupyter/pytorch) reduz falsos positivos: exfiltração de modelo é quase sempre feita via ferramentas ML.',
  },

  { id:15,cat:"IA",emoji:"👾",title:"LLM como Canal C2",tag:"AI RISK",tagColor:"#a78bfa",xp:550,mitre:"T1102 — Web Service as C2",
    story:"Malware avançado usa APIs de LLMs (OpenAI, Anthropic) como canal de C2 — os comandos chegam disfarçados de respostas do chatbot. Detecte um processo não-browser fazendo beaconing regular para endpoints conhecidos de IA mais de 60 vezes em 15 minutos.",
    steps:[
      {id:"meta",label:"META",color:C.amber,icon:"🏷",instruction:"Metadados da regra",multi:true,minCorrect:2,options:[
        {id:"a",text:'rule_name = "llm_c2_channel"',correct:true},
        {id:"b",text:'severity = "CRITICAL"',correct:true},
        {id:"c",text:'severity = "LOW"',correct:false},
        {id:"d",text:'rule_name = "ai_usage"',correct:false}]},
      {id:"events",label:"EVENTS",color:C.cyan,icon:"📡",instruction:"Processo suspeito beaconando para APIs de IA",multi:true,minCorrect:4,options:[
        {id:"a",text:'$e.metadata.event_type = "NETWORK_CONNECTION"',correct:true},
        {id:"b",text:'$e.metadata.event_type = "NETWORK_DNS"',correct:false},
        {id:"c",text:"$e.target.hostname in %ai_api_endpoints",correct:true},
        {id:"d",text:'$e.target.hostname = "openai.com"',correct:false},
        {id:"e",text:'not re.regex($e.principal.process.file.full_path, `chrome|firefox|edge|safari`) nocase',correct:true},
        {id:"f",text:"$e.principal.hostname = $host",correct:true},
        {id:"g",text:'$e.security_result.action = "BLOCK"',correct:false}]},
      {id:"match",label:"MATCH",color:C.purple,icon:"🔗",instruction:"Agrupe por host em 15 minutos",multi:false,minCorrect:1,options:[
        {id:"a",text:"$host over 15m",correct:true},
        {id:"b",text:"$host over 1h",correct:false},
        {id:"c",text:"$e.principal.ip over 15m",correct:false}]},
      {id:"condition",label:"CONDITION",color:C.green,icon:"⚡",instruction:"Mais de 60 chamadas em 15min — beaconing de LLM",multi:false,minCorrect:1,options:[
        {id:"a",text:"#e > 60",correct:true},
        {id:"b",text:"#e > 5",correct:false},
        {id:"c",text:"#e >= 1",correct:false}]},
    ],
    logs:[
      {id:1,icon:"👾",desc:"WS-FIN-03 · svchost.exe",detail:"95× NETWORK_CONNECTION → api.openai.com · 12min · não-browser",alert:true},
      {id:2,icon:"✅",desc:"WS-DEV-01 · chrome.exe",detail:"40× NETWORK_CONNECTION → api.anthropic.com · browser legítimo",alert:false},
      {id:3,icon:"👾",desc:"WS-HR-09 · updater.exe",detail:"130× NETWORK_CONNECTION → api.openai.com · 10min · processo suspeito",alert:true},
      {id:4,icon:"✅",desc:"WS-IT-02 · python.exe",detail:"20× NETWORK_CONNECTION → api.openai.com · abaixo do limiar",alert:false},
      {id:5,icon:"✅",desc:"WS-MKT-05 · msedge.exe",detail:"80× NETWORK_CONNECTION → claude.ai · browser detectado",alert:false},
    ],
    explanation:'LLM-as-C2 é uma técnica emergente: malware envia dados no prompt e recebe comandos na resposta — tráfego parece legítimo para um firewall. A chave é excluir browsers (re.regex + not) e detectar processos incomuns batendo em AI APIs com frequência de beaconing (>60/15min).',
  },
];

// ─── MODULE 0 — GENERIC PUZZLE ───────────────────────────────────────────────
function Module0Screen({ onBack, onComplete }) {
  const puzzle = M0_PUZZLE;
  const blanks = puzzle.nodes.filter(n => n.blank);
  const [allOptions] = useState(() => [...blanks.map(b => b.label), ...puzzle.distractors].sort(() => Math.random() - 0.5));
  const [placed, setPlaced] = useState({});
  const [selected, setSelected] = useState(null);
  const [errors, setErrors] = useState({});
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState("build");
  const [animStep, setAnimStep] = useState(-1);
  const [usedBank, setUsedBank] = useState([]);

  useEffect(() => {
    if (phase !== "animate") return;
    if (animStep >= puzzle.nodes.length) { setTimeout(() => setPhase("done"), 400); return; }
    const t = setTimeout(() => setAnimStep(s => s+1), 380);
    return () => clearTimeout(t);
  }, [phase, animStep]);

  useEffect(() => {
    if (phase !== "build") return;
    if (blanks.every(b => placed[b.id] === b.label)) setTimeout(() => { setPhase("animate"); setAnimStep(0); }, 400);
  }, [placed]);

  const tap = (nodeId, correct) => {
    if (!selected) return;
    if (selected === correct) {
      setPlaced(p => ({ ...p, [nodeId]: selected }));
      setUsedBank(u => [...u, selected]);
      setSelected(null);
    } else {
      setErrors(e => ({ ...e, [nodeId]: true }));
      setLives(l => l-1);
      setTimeout(() => setErrors(e => { const n={...e}; delete n[nodeId]; return n; }), 600);
      setSelected(null);
    }
  };
  const remove = (nodeId) => {
    const label = placed[nodeId];
    setPlaced(p => { const n={...p}; delete n[nodeId]; return n; });
    setUsedBank(u => u.filter(l => l !== label));
  };
  const reset = () => { setPlaced({}); setUsedBank([]); setSelected(null); setLives(3); setErrors({}); setPhase("build"); setAnimStep(-1); };

  if (lives <= 0) return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
      <div style={{ fontSize:56, marginBottom:16 }}>💔</div>
      <div style={{ fontFamily:F.display, color:C.red, fontSize:29, fontWeight:800, marginBottom:16 }}>Sem vidas!</div>
      <button onClick={reset} style={{ background:C.teal, color:C.bg, border:"none", borderRadius:14, padding:"15px 32px", fontFamily:F.display, fontWeight:800, fontSize:21, cursor:"pointer" }}>↺ TENTAR NOVAMENTE</button>
    </div>
  );

  if (phase === "done") {
    const hasExplain = puzzle.explanation && puzzle.explanation.length > 0;
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:14 }}>🗺️</div>
        <div style={{ fontFamily:F.display, fontSize:29, fontWeight:800, color:C.teal, marginBottom:8 }}>ARQUITETURA COMPLETA!</div>
        <div style={{ fontFamily:F.mono, fontSize:17, color:C.amber, marginBottom:16 }}>+100 DX</div>
        <div style={{ background:C.surface, border:`1px solid ${C.teal}44`, borderRadius:14, padding:18, maxWidth:400, width:"100%", marginBottom:20, textAlign:"left" }}>
          <div style={{ fontFamily:F.mono, color:C.teal, fontSize:11, letterSpacing:2, marginBottom:10 }}>O QUE VOCÊ MONTOU</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
            {puzzle.nodes.map(n => (
              <span key={n.id} style={{ fontFamily:F.mono, color:n.color, fontSize:10, background:n.color+"18", border:`1px solid ${n.color}33`, borderRadius:6, padding:"3px 8px" }}>{n.label}</span>
            ))}
          </div>
          <div style={{ fontFamily:F.mono, color:C.textMid, fontSize:13, lineHeight:1.9 }}>
            Você montou o fluxo completo: da fonte de log até a resposta automática, passando por Investigação. No Módulo 6, você faz isso com fluxos específicos por tipo de fonte.
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:360 }}>
          {hasExplain && (
            <button onClick={() => setPhase("explain")}
              style={{ background:C.surface, color:C.teal, border:`2px solid ${C.teal}55`, borderBottom:`3px solid ${C.teal}88`, borderRadius:14, padding:"13px", fontFamily:F.display, fontWeight:800, fontSize:16, cursor:"pointer" }}>
              📖 VER EXPLICAÇÃO DOS NÓS
            </button>
          )}
          <button onClick={() => { onComplete(); onBack(); }}
            style={{ background:C.teal, color:C.bg, border:"none", borderRadius:14, padding:"16px 32px", fontFamily:F.display, fontWeight:800, fontSize:21, cursor:"pointer", boxShadow:`0 0 24px ${C.teal}44` }}>
            ▶ CONTINUAR PARA MÓDULO UDM
          </button>
        </div>
      </div>
    );
  }

  if (phase === "explain") {
    const [explIdx, setExplIdx] = React.useState(0);
    const expls = puzzle.explanation;
    const e = expls[explIdx];
    const isLast = explIdx >= expls.length - 1;
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"12px 18px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => setPhase("done")} style={{ background:"none", border:"none", color:C.textDim, fontSize:24, cursor:"pointer" }}>‹</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.mono, color:C.teal, fontSize:10, letterSpacing:3 }}>MÓDULO 1 · EXPLICAÇÃO</div>
            <div style={{ fontFamily:F.display, color:C.text, fontSize:15, fontWeight:800 }}>{e.node}</div>
          </div>
          <span style={{ fontFamily:F.mono, color:C.textDim, fontSize:14 }}>{explIdx+1}/{expls.length}</span>
        </div>
        <div style={{ flex:1, overflowX:"auto", background:C.surface2, borderBottom:`1px solid ${C.border}`, padding:"10px 16px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:0, minWidth:"max-content" }}>
            {puzzle.nodes.map((node, i) => (
              <div key={node.id} style={{ display:"flex", alignItems:"center" }}>
                <div style={{ background:node.label===e.node?node.color+"33":C.surface, border:`1.5px solid ${node.label===e.node?node.color:C.border}`, borderRadius:8, padding:"5px 9px", textAlign:"center", minWidth:54 }}>
                  <div style={{ fontSize:16 }}>{node.icon}</div>
                  <div style={{ fontFamily:F.mono, color:node.label===e.node?node.color:C.textDim, fontSize:9, marginTop:2, whiteSpace:"nowrap" }}>{node.label.split(" ")[0]}</div>
                </div>
                {i<puzzle.nodes.length-1&&<div style={{ width:10, height:1, background:C.borderBright }} />}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"20px max(16px, calc((100% - 568px) / 2)) 120px" }}>
          <div style={{ fontFamily:F.display, color:C.teal, fontSize:18, fontWeight:800, marginBottom:12 }}>{e.node}</div>
          <div style={{ fontFamily:F.mono, color:C.textMid, fontSize:14, lineHeight:2 }}>{e.info}</div>
        </div>
        <BottomCTA>
          {isLast
            ? <CTABtn onClick={() => { onComplete(); onBack(); }}>▶ CONTINUAR</CTABtn>
            : <CTABtn color={C.teal} onClick={() => setExplIdx(i => i+1)}>PRÓXIMO →</CTABtn>}
        </BottomCTA>
      </div>
    );
  }


  const bankAvailable = allOptions.filter(o => !usedBank.includes(o));
  const isAnim = (id) => { const idx=puzzle.nodes.findIndex(n=>n.id===id); return phase==="animate"&&idx<=animStep; };

  return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"12px 18px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.textMid, fontSize:19, cursor:"pointer", padding:0 }}>‹</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:F.mono, color:C.teal, fontSize:11, letterSpacing:3 }}>MÓDULO 0 · INTRODUÇÃO</div>
          <div style={{ fontFamily:F.display, color:C.text, fontSize:22, fontWeight:700 }}>Arquitetura SecOps</div>
        </div>
        <div style={{ display:"flex", gap:3 }}>{[0,1,2].map(i=><span key={i} style={{ fontSize:19, opacity:i<lives?1:.2 }}>🛡</span>)}</div>
      </div>
      <div style={{ padding:"10px 18px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:19, lineHeight:1.8 }}>Monte o fluxo genérico do Google SecOps — do dado bruto até a resposta automática.</div>
        {selected && <div style={{ fontFamily:F.mono, color:C.teal, fontSize:19, marginTop:6 }}>✦ "{selected}" — toque num slot vazio</div>}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px max(16px, calc((100% - 568px) / 2)) 8px" }}>
        {puzzle.nodes.map((node, i) => {
          const anim = isAnim(node.id);
          const hasPlaced = placed[node.id];
          const isError = errors[node.id];
          return (
            <div key={node.id} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              {i > 0 && <div style={{ display:"flex", flexDirection:"column", alignItems:"center", margin:"2px 0" }}>
                <div style={{ width:2, height:16, background:anim?C.teal:C.border, transition:"background .3s", borderRadius:2 }} />
                <div style={{ width:0, height:0, borderLeft:"5px solid transparent", borderRight:"5px solid transparent", borderTop:`6px solid ${anim?C.teal:C.border}`, transition:"border-top-color .3s" }} />
              </div>}
              {node.blank ? (
                <div onClick={() => { if(hasPlaced){ remove(node.id); return; } if(selected) tap(node.id, node.label); }}
                  style={{ background:isError?C.redDim:hasPlaced?node.color+"20":selected?"#0a1520":C.surface, border:`2px solid ${isError?C.red:hasPlaced?node.color:selected?C.teal+"66":C.borderBright}`, borderRadius:12, padding:"12px 18px", width:"100%", maxWidth:380, display:"flex", alignItems:"center", gap:12, cursor:selected||hasPlaced?"pointer":"default", transition:"all .2s", animation:isError?"shake .3s ease":"none" }}>
                  {hasPlaced ?
                    <><span style={{ fontSize:19 }}>{node.icon}</span><div style={{ flex:1 }}><div style={{ fontFamily:F.display, color:node.color, fontSize:21, fontWeight:700 }}>{hasPlaced}</div><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:19, marginTop:2 }}>{node.sub}</div></div><span style={{ fontFamily:F.mono, color:C.textDim, fontSize:19 }}>✕</span></> :
                    <><div style={{ width:22, height:22, borderRadius:6, border:`2px dashed ${selected?C.teal:C.textDim}`, flexShrink:0 }} /><div style={{ fontFamily:F.mono, color:selected?C.teal:C.textDim, fontSize:19 }}>{selected?"← toque para colocar":"← slot vazio"}</div></>
                  }
                </div>
              ) : (
                <div style={{ background:anim?node.color+"20":C.surface, border:`1px solid ${anim?node.color:C.border}`, borderRadius:12, padding:"12px 18px", width:"100%", maxWidth:380, display:"flex", alignItems:"center", gap:12, transition:"all .3s", boxShadow:anim?`0 0 16px ${node.color}44`:"none" }}>
                  <span style={{ fontSize:19 }}>{node.icon}</span>
                  <div style={{ flex:1 }}><div style={{ fontFamily:F.display, color:anim?node.color:C.text, fontSize:21, fontWeight:700, transition:"color .3s" }}>{node.label}</div><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:19, marginTop:2 }}>{node.sub}</div></div>
                  {anim && <div style={{ width:8, height:8, borderRadius:"50%", background:node.color, boxShadow:`0 0 8px ${node.color}` }} />}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ height:160 }} />
      </div>
      {phase === "build" && (
        <BottomCTA gradient={false}>
          <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, letterSpacing:2, marginBottom:8 }}>BANCO DE PEÇAS</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {bankAvailable.map(opt => <button key={opt} onClick={() => setSelected(s => s===opt?null:opt)} style={{ background:selected===opt?C.teal+"22":C.bg, border:`2px solid ${selected===opt?C.teal:C.borderBright}`, borderRadius:10, padding:"8px 14px", fontFamily:F.mono, color:selected===opt?C.teal:C.textMid, fontSize:19, cursor:"pointer", transition:"all .15s" }}>{opt}</button>)}
          </div>
        </BottomCTA>
      )}
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
    </div>
  );
}

// ─── MODULE 6 — SOURCE FLOW PUZZLES ──────────────────────────────────────────

function Module1Screen({ onBack, onComplete, completed, skipMode=false }) {
  const [phase, setPhase] = useState(skipMode ? "final" : "list");
  const [lessonIdx, setLessonIdx] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [chalIdx, setChalIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [finalIdx, setFinalIdx] = useState(0);
  const [finalLives, setFinalLives] = useState(3);
  const [finalScore, setFinalScore] = useState(0);
  const [finalDone, setFinalDone] = useState(false);
  const allDone = M1_LESSONS.every(l => (completed||[]).includes(l.id));
  const resetFinal = () => { setFinalIdx(0); setFinalLives(3); setFinalScore(0); setFinalDone(false); };
  const resetLesson = (idx) => { setLessonIdx(idx); setCardIdx(0); setFlipped(false); setLives(3); setScore(0); setChalIdx(0); };

  if (phase === "list") return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.textDim, fontSize:24, cursor:"pointer", padding:0 }}>‹</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:9, letterSpacing:3 }}>MÓDULO 0</div>
          <div style={{ fontFamily:F.display, color:C.text, fontSize:16, fontWeight:800 }}>Conceitos Fundamentais</div>
        </div>
        <span style={{ fontFamily:F.mono, color:C.cyan, fontSize:13 }}>{(completed||[]).length}/{M1_LESSONS.length}</span>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px max(16px, calc((100% - 568px) / 2)) 120px" }}>
        {M1_LESSONS.map((l,i) => {
          const done=(completed||[]).includes(l.id);
          const locked=i>0&&!(completed||[]).includes(M1_LESSONS[i-1].id);
          return (
            <div key={l.id} onClick={()=>!locked&&(resetLesson(i),setPhase("cards"))}
              style={{ background:locked?C.surface2:C.surface, border:`1px solid ${done?C.cyan+"55":locked?C.border:C.borderBright}`, borderRadius:16, padding:"16px 18px", marginBottom:12, display:"flex", alignItems:"center", gap:14, opacity:locked?.4:1, cursor:locked?"default":"pointer" }}>
              <div style={{ fontSize:28 }}>{done?"✅":locked?"🔒":l.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:F.display, color:C.text, fontSize:15, fontWeight:700 }}>{l.title}</div>
                <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, marginTop:2 }}>{done?"✓ Completo":locked?"Complete a lição anterior":`${l.cards.length} cards + ${l.challenges.length} desafios`}</div>
              </div>
              {!locked&&<div style={{ color:C.textDim, fontSize:20 }}>›</div>}
            </div>
          );
        })}
        {allDone && (
          <div onClick={()=>{resetFinal();setPhase("final");}}
            style={{ background:C.surface, border:`2px solid ${C.amber}66`, borderRadius:16, padding:"20px 18px", cursor:"pointer", textAlign:"center", marginTop:8 }}>
            <div style={{ fontSize:32, marginBottom:6 }}>🏆</div>
            <div style={{ fontFamily:F.display, color:C.amber, fontSize:17, fontWeight:800 }}>DESAFIO FINAL</div>
            <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, marginTop:4 }}>10 questões · precisa de 8/10</div>
          </div>
        )}
      </div>
    </div>
  );

  if (phase === "cards") {
    const lesson = M1_LESSONS[lessonIdx];
    const card = lesson.cards[cardIdx];
    const isLast = cardIdx === lesson.cards.length - 1;
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <ProgressBar value={(cardIdx/lesson.cards.length)*50} color={C.cyan} onBack={()=>setPhase("list")} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 20px 120px" }}>
          <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:9, letterSpacing:3, marginBottom:16 }}>LIÇÃO {lessonIdx+1} · {lesson.title.toUpperCase()}</div>
          <div onClick={()=>setFlipped(f=>!f)}
            style={{ background:flipped?C.surface2:C.surface, border:`2px solid ${flipped?C.cyan+"66":C.border}`, borderRadius:20, padding:"28px 24px", width:"100%", maxWidth:440, minHeight:200, display:"flex", flexDirection:"column", justifyContent:"center", cursor:"pointer", transition:"all .3s" }}>
            <div style={{ fontFamily:F.mono, color:flipped?C.cyan:C.textDim, fontSize:9, letterSpacing:3, marginBottom:12 }}>{flipped?"RESPOSTA ▼":"👆 Toque para ver a resposta"}</div>
            <div style={{ fontFamily:F.mono, color:flipped?C.text:C.textMid, fontSize:14, lineHeight:1.9 }}>{flipped?card.a:card.q}</div>
          </div>
          <div style={{ display:"flex", gap:6, marginTop:18 }}>
            {lesson.cards.map((_,i)=><div key={i} style={{ width:i===cardIdx?20:8, height:8, borderRadius:4, background:i<cardIdx?C.green:i===cardIdx?C.cyan:C.border, transition:"all .3s" }} />)}
          </div>
        </div>
        <BottomCTA>
          {isLast ? (
            <CTABtn color={C.cyan} onClick={()=>{setChalIdx(0);setLives(3);setScore(0);setPhase("challenges");}}>▶ FAZER OS DESAFIOS</CTABtn>
          ) : (
            <div style={{ display:"flex", gap:10 }}>
              {cardIdx>0&&<button onClick={()=>{setCardIdx(i=>i-1);setFlipped(false);}} style={{ background:C.surface, color:C.textMid, border:`1px solid ${C.border}`, borderRadius:C.btnRadius, padding:"16px 20px", fontFamily:F.display, fontWeight:700, fontSize:15, cursor:"pointer" }}>‹</button>}
              <CTABtn color={C.cyan} onClick={()=>{setCardIdx(i=>i+1);setFlipped(false);}}>PRÓXIMO →</CTABtn>
            </div>
          )}
        </BottomCTA>
      </div>
    );
  }

  if (phase === "challenges") {
    const lesson = M1_LESSONS[lessonIdx];
    if (lives <= 0) return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:16 }}>💔</div>
        <div style={{ fontFamily:F.display, color:C.red, fontSize:22, fontWeight:800, marginBottom:24 }}>Sem vidas!</div>
        <CTABtn color={C.cyan} onClick={()=>{setCardIdx(0);setFlipped(false);setPhase("cards");}}>↺ REVER FLASHCARDS</CTABtn>
      </div>
    );
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <ProgressBar value={50+((chalIdx/lesson.challenges.length)*50)} color={C.green} onBack={()=>{setCardIdx(lesson.cards.length-1);setFlipped(false);setPhase("cards");}} right={<LivesRow count={lives} />} />
        <div style={{ flex:1, overflowY:"auto", padding:"20px max(16px, calc((100% - 568px) / 2)) 20px" }}>
          <ChallengeCard key={chalIdx} ch={lesson.challenges[chalIdx]}
            onCorrect={()=>setScore(s=>s+1)} onWrong={()=>setLives(l=>l-1)}
            onNext={()=>{ if(chalIdx===lesson.challenges.length-1){onComplete(lesson.id);setPhase("list");} else setChalIdx(i=>i+1); }}
            showNext={true} />
        </div>
      </div>
    );
  }

  if (phase === "final") {
    if (finalLives<=0||finalDone) {
      const passed = finalScore >= 8;
      return (
        <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:14 }}>{passed?"🏆":"💔"}</div>
          <div style={{ fontFamily:F.display, fontSize:24, fontWeight:800, color:passed?C.green:C.red, marginBottom:8 }}>{passed?"MÓDULO COMPLETO!":"Não passou"}</div>
          <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:14, marginBottom:24 }}>{finalScore}/{M1_FINAL_CHALLENGE.length} corretas</div>
          {!passed&&<div style={{ fontFamily:F.mono, color:C.amber, fontSize:13, marginBottom:24 }}>Precisa de 8/10.</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:360 }}>
            <button onClick={resetFinal} style={{ background:"transparent", color:C.cyan, border:`2px solid ${C.cyan}44`, borderRadius:C.btnRadius, padding:"14px", fontFamily:F.display, fontWeight:700, fontSize:14, cursor:"pointer" }}>↺ TENTAR NOVAMENTE</button>
            <Btn3D color={passed?C.green:C.surface} shadow={passed?C.greenShadow:C.cardDepth} onClick={()=>{ if(passed){ M1_LESSONS.forEach(l=>onComplete(l.id)); } onBack(); }}>{passed?"▶ MÓDULO 1 DESBLOQUEADO":"← VOLTAR"}</Btn3D>
          </div>
        </div>
      );
    }
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <ProgressBar value={(finalIdx/M1_FINAL_CHALLENGE.length)*100} color={C.amber} onBack={()=>setPhase("list")} right={<LivesRow count={finalLives} />} />
        <div style={{ flex:1, overflowY:"auto", padding:"20px max(16px, calc((100% - 568px) / 2)) 20px" }}>
          <ChallengeCard key={finalIdx} ch={M1_FINAL_CHALLENGE[finalIdx]}
            onCorrect={()=>setFinalScore(s=>s+1)} onWrong={()=>setFinalLives(l=>l-1)}
            onNext={()=>{ if(finalIdx===M1_FINAL_CHALLENGE.length-1) setFinalDone(true); else setFinalIdx(i=>i+1); }}
            showNext={true} />
        </div>
      </div>
    );
  }
  return null;
}

function Module2Screen({ onBack, onComplete, completed, skipMode=false }) {
  const [view, setView] = useState(skipMode?"challenge":"menu");
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const resetChallenge=()=>{setChalIdx(0);setLives(3);setScore(0);};

  if (view==="menu") return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.textDim, fontSize:24, cursor:"pointer", padding:0 }}>‹</button>
        <div style={{ flex:1 }}><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:9, letterSpacing:3 }}>MÓDULO 2</div><div style={{ fontFamily:F.display, color:C.text, fontSize:16, fontWeight:800 }}>UDM — Modelo de Dados</div></div>
        {completed&&<div style={{ fontFamily:F.mono, color:C.green, fontSize:11 }}>✓ COMPLETO</div>}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px max(16px, calc((100% - 568px) / 2)) 120px" }}>
        {[{id:"sections",icon:"🔬",title:"Seções UDM",sub:"metadata · principal · target · src · network · security_result · intermediary · observer"},{id:"eventtypes",icon:"📋",title:"Event Types",sub:"Os principais event_types e quando usar"}].map(item=>(
          <div key={item.id} onClick={()=>setView(item.id)} style={{ background:C.surface, border:`1px solid ${C.borderBright}`, borderRadius:16, padding:"16px 18px", marginBottom:10, cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:28 }}>{item.icon}</div>
            <div style={{ flex:1 }}><div style={{ fontFamily:F.display, color:C.text, fontSize:15, fontWeight:700 }}>{item.title}</div><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, marginTop:2 }}>{item.sub}</div></div>
            <div style={{ color:C.textDim, fontSize:20 }}>›</div>
          </div>
        ))}
        <div onClick={()=>{resetChallenge();setView("challenge");}} style={{ background:completed?C.greenDim:C.surface, border:`2px solid ${completed?C.green+"55":C.green+"88"}`, borderRadius:16, padding:"18px", cursor:"pointer", textAlign:"center", marginTop:8 }}>
          <div style={{ fontSize:28, marginBottom:6 }}>{completed?"✅":"🧪"}</div>
          <div style={{ fontFamily:F.display, color:completed?C.green:C.text, fontSize:16, fontWeight:800 }}>{completed?"TESTE CONCLUÍDO":"FAZER O TESTE"}</div>
          <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, marginTop:4 }}>12 questões · precisa de 10/12</div>
        </div>
      </div>
    </div>
  );

  if (view==="sections"&&!selectedSection) return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={()=>setView("menu")} style={{ background:"none", border:"none", color:C.textDim, fontSize:24, cursor:"pointer", padding:0 }}>‹</button>
        <div style={{ fontFamily:F.display, color:C.text, fontSize:16, fontWeight:800 }}>Seções UDM</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px max(16px, calc((100% - 568px) / 2)) 16px" }}>
        {UDM_SECTIONS.map(sec=>(
          <div key={sec.id} onClick={()=>setSelectedSection(sec)} style={{ background:C.surface, border:`1px solid ${sec.color}33`, borderRadius:14, padding:"14px 16px", marginBottom:10, cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ fontSize:28 }}>{sec.icon}</div>
            <div style={{ flex:1 }}><div style={{ fontFamily:F.mono, color:sec.color, fontSize:13, fontWeight:700 }}>{sec.label}</div><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, marginTop:2 }}>{sec.desc}</div></div>
            <div style={{ color:C.textDim, fontSize:20 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (view==="sections"&&selectedSection) return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={()=>{setSelectedSection(null);setSelectedField(null);}} style={{ background:"none", border:"none", color:C.textDim, fontSize:24, cursor:"pointer", padding:0 }}>‹</button>
        <div style={{ fontFamily:F.display, color:C.text, fontSize:16, fontWeight:800 }}>{selectedSection.icon} {selectedSection.label}</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px max(16px, calc((100% - 568px) / 2)) 16px" }}>
        {selectedSection.fields.map(f=>(
          <div key={f.name} onClick={()=>setSelectedField(selectedField?.name===f.name?null:f)} style={{ background:selectedField?.name===f.name?C.surface2:C.surface, border:`1px solid ${selectedField?.name===f.name?selectedSection.color+"55":C.border}`, borderRadius:12, padding:"13px 14px", marginBottom:8, cursor:"pointer" }}>
            <div style={{ fontFamily:F.mono, color:selectedSection.color, fontSize:13 }}>{f.name}</div>
            <span style={{ fontFamily:F.mono, color:C.purple, fontSize:10, background:C.purpleDim, borderRadius:6, padding:"2px 8px", marginTop:4, display:"inline-block" }}>{f.type}</span>
            {selectedField?.name===f.name&&<div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${C.border}` }}><div style={{ fontFamily:F.mono, color:C.textMid, fontSize:12, lineHeight:1.8, marginBottom:8 }}>{f.desc}</div><div style={{ background:C.surface2, borderRadius:8, padding:"8px 12px", fontFamily:F.mono, color:C.green, fontSize:12 }}>$e.{f.name} = {f.example}</div></div>}
          </div>
        ))}
      </div>
    </div>
  );

  if (view==="eventtypes") return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={()=>setView("menu")} style={{ background:"none", border:"none", color:C.textDim, fontSize:24, cursor:"pointer", padding:0 }}>‹</button>
        <div style={{ fontFamily:F.display, color:C.text, fontSize:16, fontWeight:800 }}>Event Types</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px max(16px, calc((100% - 568px) / 2)) 16px" }}>
        {EVENT_TYPES.map(et=>(
          <div key={et.type} style={{ background:C.surface, border:`1px solid ${et.color}33`, borderRadius:12, padding:"14px 15px", marginBottom:10 }}>
            <div style={{ fontFamily:F.mono, color:et.color, fontSize:13, fontWeight:700, marginBottom:4 }}>{et.type}</div>
            <div style={{ fontFamily:F.mono, color:C.textMid, fontSize:12, marginBottom:8, lineHeight:1.7 }}>{et.desc}</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {et.fields.map(f=><span key={f} style={{ fontFamily:F.mono, color:et.color, fontSize:10, background:et.color+"14", border:`1px solid ${et.color}33`, borderRadius:6, padding:"2px 8px" }}>{f}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (view==="challenge") {
    if (lives<=0) return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:16 }}>💔</div>
        <div style={{ fontFamily:F.display, color:C.red, fontSize:22, fontWeight:800, marginBottom:24 }}>Sem vidas!</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:320 }}>
          <button onClick={()=>setView("sections")} style={{ background:C.surface, color:C.textMid, border:`1px solid ${C.border}`, borderRadius:C.btnRadius, padding:"14px", fontFamily:F.display, fontWeight:700, fontSize:14, cursor:"pointer" }}>🔬 REVER UDM</button>
          <Btn3D color={C.green} shadow={C.greenShadow} onClick={resetChallenge}>↺ TENTAR NOVAMENTE</Btn3D>
        </div>
      </div>
    );
    if (chalIdx>=M2_CHALLENGE.length) {
      const passed=score>=10;
      return (
        <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:14 }}>{passed?"🎯":"💔"}</div>
          <div style={{ fontFamily:F.display, fontSize:24, fontWeight:800, color:passed?C.green:C.red, marginBottom:6 }}>{passed?"MÓDULO 2 COMPLETO!":"Não passou"}</div>
          <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:14, marginBottom:24 }}>{score}/{M2_CHALLENGE.length} corretas</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:360 }}>
            <button onClick={resetChallenge} style={{ background:"transparent", color:C.cyan, border:`2px solid ${C.cyan}44`, borderRadius:C.btnRadius, padding:"14px", fontFamily:F.display, fontWeight:700, fontSize:14, cursor:"pointer" }}>↺ TENTAR NOVAMENTE</button>
            <Btn3D color={passed?C.green:C.surface} shadow={passed?C.greenShadow:C.cardDepth} onClick={()=>{if(passed&&!completed){onComplete();}onBack();}}>{passed?"▶ MÓDULO 3 DESBLOQUEADO":"← VOLTAR"}</Btn3D>
          </div>
        </div>
      );
    }
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <ProgressBar value={(chalIdx/M2_CHALLENGE.length)*100} color={C.green} onBack={()=>setView("menu")} right={<LivesRow count={lives} />} />
        <div style={{ flex:1, overflowY:"auto", padding:"20px max(16px, calc((100% - 568px) / 2)) 20px" }}>
          <ChallengeCard key={chalIdx} ch={M2_CHALLENGE[chalIdx]}
            onCorrect={()=>setScore(s=>s+1)} onWrong={()=>setLives(l=>l-1)}
            onNext={()=>setChalIdx(i=>i+1)} showNext={true} />
        </div>
      </div>
    );
  }
  return null;
}

function Module3Screen({ onBack, onComplete, completed, skipMode=false }) {
  const [lessonIdx, setLessonIdx] = useState(null);
  const [phase, setPhase] = useState("read");
  const [quizIdx, setQuizIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [skipIdx, setSkipIdx] = useState(0);
  const [skipLives, setSkipLives] = useState(3);
  const [skipScore, setSkipScore] = useState(0);
  const [skipDone, setSkipDone] = useState(false);

  if (skipMode) {
    if (skipLives<=0||skipDone) {
      const passed=skipScore>=8;
      return (
        <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:14 }}>{passed?"🏆":"💔"}</div>
          <div style={{ fontFamily:F.display, fontSize:22, fontWeight:800, color:passed?C.green:C.red, marginBottom:8 }}>{passed?"MÓDULO 3 COMPLETO!":"Não passou"}</div>
          <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:14, marginBottom:24 }}>{skipScore}/{M3_SKIP_CHALLENGE.length} corretas</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:360 }}>
            <button onClick={()=>{setSkipIdx(0);setSkipLives(3);setSkipScore(0);setSkipDone(false);}} style={{ background:"transparent", color:C.cyan, border:`2px solid ${C.cyan}44`, borderRadius:C.btnRadius, padding:"14px", fontFamily:F.display, fontWeight:700, fontSize:14, cursor:"pointer" }}>↺ TENTAR NOVAMENTE</button>
            <Btn3D color={passed?C.green:C.surface} shadow={passed?C.greenShadow:C.cardDepth} onClick={()=>{if(passed)M3_LESSONS.forEach(l=>onComplete(l.id));onBack();}}>{passed?"▶ MISSÕES DESBLOQUEADAS":"← VOLTAR"}</Btn3D>
          </div>
        </div>
      );
    }
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <ProgressBar value={(skipIdx/M3_SKIP_CHALLENGE.length)*100} color={C.amber} onBack={onBack} right={<LivesRow count={skipLives} />} />
        <div style={{ flex:1, overflowY:"auto", padding:"20px max(16px, calc((100% - 568px) / 2)) 20px" }}>
          <ChallengeCard key={skipIdx} ch={M3_SKIP_CHALLENGE[skipIdx]}
            onCorrect={()=>setSkipScore(s=>s+1)} onWrong={()=>setSkipLives(l=>l-1)}
            onNext={()=>{if(skipIdx===M3_SKIP_CHALLENGE.length-1)setSkipDone(true);else setSkipIdx(i=>i+1);}}
            showNext={true} />
        </div>
      </div>
    );
  }

  if (lessonIdx===null) return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.textDim, fontSize:24, cursor:"pointer", padding:0 }}>‹</button>
        <div style={{ flex:1 }}><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:9, letterSpacing:3 }}>MÓDULO 3</div><div style={{ fontFamily:F.display, color:C.text, fontSize:16, fontWeight:800 }}>YARA-L Básico</div></div>
        <div style={{ fontFamily:F.mono, color:C.amber, fontSize:13 }}>{(completed||[]).length}/{M3_LESSONS.length}</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px max(16px, calc((100% - 568px) / 2)) 16px" }}>
        {M3_LESSONS.map((l,i)=>{
          const done=(completed||[]).includes(l.id);
          const locked=i>0&&!(completed||[]).includes(M3_LESSONS[i-1].id);
          return (
            <div key={l.id} onClick={()=>!locked&&(setLessonIdx(i),setPhase("read"),setQuizIdx(0),setPicked(null))}
              style={{ background:locked?C.surface2:C.surface, border:`1px solid ${done?C.amber+"44":locked?C.border:C.borderBright}`, borderRadius:14, padding:"15px 17px", marginBottom:12, display:"flex", alignItems:"center", gap:14, opacity:locked?.4:1, cursor:locked?"default":"pointer" }}>
              <div style={{ fontSize:28 }}>{done?"✅":locked?"🔒":l.icon}</div>
              <div style={{ flex:1 }}><div style={{ fontFamily:F.display, color:C.text, fontSize:15, fontWeight:700 }}>{l.title}</div><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, marginTop:2 }}>{done?"✓ Completo":locked?"Complete a lição anterior":`Leitura + ${l.quiz.length} questões`}</div></div>
              {!locked&&<div style={{ color:C.textDim, fontSize:20 }}>›</div>}
            </div>
          );
        })}
      </div>
    </div>
  );

  const lesson=M3_LESSONS[lessonIdx];
  if (phase==="read") return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <ProgressBar value={0} color={C.amber} onBack={()=>setLessonIdx(null)} />
      <div style={{ flex:1, overflowY:"auto", padding:"20px max(16px, calc((100% - 568px) / 2)) 130px" }}>
        <div style={{ fontFamily:F.display, color:C.text, fontSize:20, fontWeight:700, marginBottom:12 }}>{lesson.icon} {lesson.title}</div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:18, fontFamily:F.mono, fontSize:13, lineHeight:2, color:C.textMid, whiteSpace:"pre-wrap" }}>{lesson.content}</div>
      </div>
      <BottomCTA>
        <CTABtn color={C.amber} onClick={()=>setPhase("quiz")}>▶ FAZER O QUIZ</CTABtn>
      </BottomCTA>
    </div>
  );

  const q=lesson.quiz[quizIdx];
  const isLastQ=quizIdx===lesson.quiz.length-1;
  return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <ProgressBar value={(quizIdx/lesson.quiz.length)*100} color={C.amber} onBack={()=>setPhase("read")} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"24px 20px 120px" }}>
        <div style={{ fontFamily:F.display, color:C.text, fontSize:18, fontWeight:700, marginBottom:24, lineHeight:1.5 }}>{q.q}</div>
        {q.opts.map((opt,i)=>{
          const isSel=picked===i; const isRight=i===q.correct; const reveal=picked!==null;
          return (
            <button key={i} onClick={()=>picked===null&&setPicked(i)}
              style={{ background:reveal?(isRight?C.correctBg:isSel?C.wrongBg:C.surface):C.surface, border:`2px solid ${reveal?(isRight?C.correct:isSel?C.wrong:C.border):C.border}`, borderRadius:14, padding:"15px 16px", marginBottom:10, textAlign:"left", cursor:picked===null?"pointer":"default", fontFamily:F.mono, color:reveal?(isRight?C.correct:isSel?C.wrong:C.textDim):C.textMid, fontSize:14, display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:18 }}>{reveal?(isRight?"✓":isSel?"✗":"·"):"○"}</span>{opt}
            </button>
          );
        })}
      </div>
      {picked!==null&&(
        <FeedbackBanner correct={picked===q.correct} wrongAnswer={picked!==q.correct?q.opts[q.correct]:null}
          onNext={()=>{ if(isLastQ){onComplete(lesson.id);if(lessonIdx===M3_LESSONS.length-1)onBack();else setLessonIdx(null);} else{setQuizIdx(i=>i+1);setPicked(null);} }} />
      )}
    </div>
  );
}

function Module4Screen({ onBack, onComplete, completed, addXp, mode }) {
  const [view, setView] = useState("list");
  const [mIdx, setMIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [selections, setSelections] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [revealed, setRevealed] = useState([]);
  const [logsDone, setLogsDone] = useState(false);
  const animXp = useAnimVal(lastResult?.xp||0);
  const isFree = mode==="free";
  const mission = MISSIONS[mIdx];
  const techMissions = MISSIONS.filter(m=>m.cat==="TÉCNICA");
  const behMissions  = MISSIONS.filter(m=>m.cat==="COMPORTAMENTAL");
  const aiMissions   = MISSIONS.filter(m=>m.cat==="IA");

  useEffect(()=>{ if(view==="preview"){setPreviewReady(false);const t=setTimeout(()=>setPreviewReady(true),1000);return()=>clearTimeout(t);} },[view,mIdx]);
  useEffect(()=>{ if(view==="test"){ setRevealed([]);setLogsDone(false); mission.logs.forEach((log,i)=>setTimeout(()=>{setRevealed(r=>[...r,log.id]);if(i===mission.logs.length-1)setTimeout(()=>setLogsDone(true),500);},500+i*650)); } },[view,mIdx]);

  const startMission=(idx)=>{setMIdx(idx);setStepIdx(0);setSelections({});setLastResult(null);setView("step");};
  const toggle=(sId,oId,multi)=>setSelections(prev=>{const cur=prev[sId]||[];if(!multi)return{...prev,[sId]:cur.includes(oId)?[]:[oId]};return{...prev,[sId]:cur.includes(oId)?cur.filter(x=>x!==oId):[...cur,oId]};});
  const evalRule=()=>{let ok=0;mission.steps.forEach(s=>{const sel=selections[s.id]||[];const good=sel.filter(id=>s.options.find(o=>o.id===id)?.correct).length;const bad=sel.filter(id=>!s.options.find(o=>o.id===id)?.correct).length;if(good>=s.minCorrect&&bad===0)ok++;});return ok===mission.steps.length;};

  const renderCat=(title,missions,unlocked)=>(
    <div style={{ marginBottom:24 }}>
      <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:10, letterSpacing:3, marginBottom:10 }}>{title}</div>
      {missions.map((m,i)=>{
        const done=completed.includes(m.id);
        const locked=false; // free mode
        return (
          <div key={m.id} onClick={()=>!locked&&startMission(MISSIONS.findIndex(x=>x.id===m.id))}
            style={{ background:locked?C.surface2:C.surface, border:`1px solid ${done?m.tagColor+"55":locked?C.border:C.borderBright}`, borderRadius:12, padding:"13px 15px", marginBottom:8, display:"flex", alignItems:"center", gap:12, opacity:locked?.35:1, cursor:locked?"default":"pointer" }}>
            <div style={{ fontSize:24 }}>{done?"✅":locked?"🔒":m.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:2 }}>
                <span style={{ fontFamily:F.mono, color:m.tagColor, fontSize:9, background:m.tagColor+"18", border:`1px solid ${m.tagColor}33`, borderRadius:20, padding:"2px 8px" }}>{m.tag}</span>
              </div>
              <div style={{ fontFamily:F.display, color:C.text, fontSize:14, fontWeight:700 }}>{m.title}</div>
              <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:10, marginTop:2 }}>{done?`✓ +${m.xp} DX`:locked?"BLOQUEADA":`+${m.xp} DX`}</div>
            </div>
            {!locked&&<div style={{ color:C.textDim, fontSize:20 }}>›</div>}
          </div>
        );
      })}
    </div>
  );

  if (view==="list") return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.textDim, fontSize:24, cursor:"pointer", padding:0 }}>‹</button>
        <div style={{ flex:1 }}><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:9, letterSpacing:3 }}>MÓDULO 4</div><div style={{ fontFamily:F.display, color:C.text, fontSize:16, fontWeight:800 }}>Missões de Detecção</div></div>
        <div style={{ fontFamily:F.mono, color:C.red, fontSize:13 }}>{completed.length}/{MISSIONS.length}</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px max(16px, calc((100% - 568px) / 2)) 40px" }}>
        {renderCat("TÉCNICA · "+techMissions.length, techMissions, true)}
        {renderCat("COMPORTAMENTAL · "+behMissions.length, behMissions, isFree||techMissions.every(m=>completed.includes(m.id)))}
        {renderCat("RISCOS DE IA · "+aiMissions.length, aiMissions, isFree||behMissions.every(m=>completed.includes(m.id)))}
      </div>
    </div>
  );

  if (view==="step") {
    const step=mission.steps[stepIdx];
    const sel=selections[step.id]||[];
    const good=sel.filter(id=>step.options.find(o=>o.id===id)?.correct).length;
    const bad=sel.filter(id=>!step.options.find(o=>o.id===id)?.correct).length;
    const ready=good>=step.minCorrect&&bad===0;
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <ProgressBar value={(stepIdx/mission.steps.length)*100} color={step.color} onBack={()=>stepIdx===0?setView("list"):setStepIdx(i=>i-1)} />
        <div style={{ flex:1, overflowY:"auto", padding:"16px max(16px, calc((100% - 568px) / 2)) 130px" }}>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", marginBottom:16, fontFamily:F.mono, color:C.textDim, fontSize:12, lineHeight:1.8 }}>{mission.story}</div>
          <div style={{ fontFamily:F.display, color:C.text, fontSize:17, fontWeight:700, marginBottom:4 }}>{step.instruction}</div>
          <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, marginBottom:14 }}>{step.multi?`Mínimo ${step.minCorrect} correto(s) · sem erros`:"Escolha a opção correta"}</div>
          {step.options.map(opt=>{
            const isSel=sel.includes(opt.id);
            return (
              <button key={opt.id} onClick={()=>toggle(step.id,opt.id,step.multi)}
                style={{ background:isSel?step.color+"16":C.surface, border:`2px solid ${isSel?step.color:C.border}`, borderRadius:12, padding:"13px 15px", marginBottom:9, display:"flex", alignItems:"flex-start", gap:12, cursor:"pointer", textAlign:"left", width:"100%", transition:"all .15s" }}>
                <div style={{ width:20, height:20, borderRadius:step.multi?5:"50%", border:`2px solid ${isSel?step.color:C.textDim}`, background:isSel?step.color:"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", marginTop:1 }}>
                  {isSel&&<span style={{ color:C.bg, fontSize:11, fontWeight:900 }}>✓</span>}
                </div>
                <span style={{ fontFamily:F.mono, color:isSel?step.color:C.textMid, fontSize:13, lineHeight:1.6, wordBreak:"break-word" }}>{opt.text}</span>
              </button>
            );
          })}
        </div>
        <BottomCTA>
          {sel.length>0&&<div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:10 }}>
            {good>0&&<span style={{ fontFamily:F.mono, color:C.green, fontSize:12 }}>✓ {good} certo{good>1?"s":""}</span>}
            {bad>0&&<span style={{ fontFamily:F.mono, color:C.red, fontSize:12 }}>✗ {bad} errado{bad>1?"s":""}</span>}
          </div>}
          <button onClick={()=>{if(stepIdx+1<mission.steps.length)setStepIdx(i=>i+1);else setView("preview");}} disabled={!ready}
            style={{ width:"100%", background:ready?step.color:C.border, color:ready?C.bg:C.textDim, border:"none", borderRadius:C.btnRadius, padding:"16px", fontFamily:F.display, fontWeight:800, fontSize:15, cursor:ready?"pointer":"default", transition:"all .2s", boxShadow:ready?`0 4px 0 ${step.color}88`:"none" }}>
            {stepIdx+1<mission.steps.length?`PRÓXIMO: ${mission.steps[stepIdx+1].label} ›`:"▶ TESTAR REGRA"}
          </button>
        </BottomCTA>
      </div>
    );
  }

  if (view==="preview") {
    const getLines=sid=>{const s=mission.steps.find(x=>x.id===sid);return(selections[sid]||[]).map(id=>s.options.find(o=>o.id===id)?.text).filter(Boolean);};
    const secColors={meta:C.amber,events:C.cyan,match:C.purple,condition:C.green};
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>{setStepIdx(mission.steps.length-1);setView("step");}} style={{ background:"none", border:"none", color:C.textDim, fontSize:24, cursor:"pointer", padding:0 }}>‹</button>
          <div style={{ fontFamily:F.display, color:C.text, fontSize:15, fontWeight:700 }}>Revisão · {mission.title}</div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px max(16px, calc((100% - 568px) / 2)) 130px" }}>
          <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:14, padding:18, fontFamily:F.mono, fontSize:13, lineHeight:2 }}>
            <div><span style={{ color:C.cyan }}>rule</span> <span style={{ color:C.amber }}>detection</span> {"{"}</div>
            {["meta","events","match","condition"].map(sec=>(
              <div key={sec} style={{ paddingLeft:16 }}><span style={{ color:secColors[sec] }}>{sec}:</span>{getLines(sec).map((l,i)=><div key={i} style={{ paddingLeft:16, color:C.textMid, wordBreak:"break-all" }}>{l}</div>)}</div>
            ))}
            <div>{"}"}</div>
          </div>
        </div>
        <BottomCTA>
          <button onClick={()=>setView("test")} disabled={!previewReady}
            style={{ width:"100%", background:previewReady?C.green:C.border, color:previewReady?C.bg:C.textDim, border:"none", borderRadius:C.btnRadius, padding:"16px", fontFamily:F.display, fontWeight:800, fontSize:15, cursor:previewReady?"pointer":"default", boxShadow:previewReady?`0 4px 0 ${C.greenShadow}`:"none", transition:"all .3s" }}>
            {previewReady?"⚡ EXECUTAR NOS LOGS":"compilando…"}
          </button>
        </BottomCTA>
      </div>
    );
  }

  if (view==="test") {
    const ruleValid=evalRule();
    const xp=ruleValid?mission.xp:Math.floor(mission.xp*.2);
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 18px" }}>
          <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:9, letterSpacing:3 }}>SIMULAÇÃO · LOGS UDM</div>
          <div style={{ fontFamily:F.display, color:C.text, fontSize:14, fontWeight:700 }}>Testando sua regra…</div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px max(16px, calc((100% - 568px) / 2)) 130px" }}>
          {mission.logs.map(log=>{
            const isRev=revealed.includes(log.id); const alerted=ruleValid?log.alert:false;
            return (
              <div key={log.id} style={{ background:isRev?(alerted?C.redDim:C.surface):C.surface2, border:`1px solid ${isRev?(alerted?C.red+"55":C.border):C.border}`, borderRadius:12, padding:"13px 14px", marginBottom:8, opacity:isRev?1:.2, transition:"all .5s ease" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ fontSize:24 }}>{log.icon}</div>
                  <div style={{ flex:1 }}><div style={{ fontFamily:F.display, color:C.text, fontSize:14, fontWeight:700 }}>{log.desc}</div><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, marginTop:2 }}>{log.detail}</div></div>
                  {isRev&&<div style={{ background:alerted?C.red+"22":C.greenDim, border:`1px solid ${alerted?C.red+"55":C.green+"44"}`, borderRadius:8, padding:"3px 9px", fontFamily:F.mono, color:alerted?C.red:C.green, fontSize:11 }}>{alerted?"⚡ ALERTA":"○ OK"}</div>}
                </div>
                {isRev&&<div style={{ marginTop:5, paddingLeft:36, fontFamily:F.mono, color:C.textDim, fontSize:10 }}>esperado: <span style={{ color:log.alert?C.red:C.green }}>{log.alert?"ALERTAR":"ignorar"}</span></div>}
              </div>
            );
          })}
        </div>
        {logsDone&&<BottomCTA>
          <button onClick={()=>{setLastResult({success:ruleValid,xp});if(ruleValid&&!completed.includes(mission.id)){onComplete(mission.id);addXp(xp);}setView("result");}}
            style={{ width:"100%", background:ruleValid?C.green:C.amber, color:C.bg, border:"none", borderRadius:C.btnRadius, padding:"16px", fontFamily:F.display, fontWeight:800, fontSize:15, cursor:"pointer", boxShadow:`0 4px 0 ${ruleValid?C.greenShadow:C.amber+"88"}` }}>VER RESULTADO →</button>
        </BottomCTA>}
      </div>
    );
  }

  if (view==="result"&&lastResult) {
    const nextIdx=MISSIONS.findIndex(x=>x.id===mission.id)+1;
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"52px 24px 48px", overflowY:"auto" }}>
        <div style={{ fontSize:64, marginBottom:12 }}>{lastResult.success?"🎯":"💀"}</div>
        <div style={{ fontFamily:F.display, fontSize:24, fontWeight:800, color:lastResult.success?C.green:C.red, marginBottom:6 }}>{lastResult.success?"REGRA APROVADA!":"TENTE NOVAMENTE"}</div>
        <div style={{ fontFamily:F.display, fontSize:36, color:C.amber, marginBottom:8 }}>+{animXp} DX</div>
        <div style={{ background:C.surface, border:`1px solid ${lastResult.success?C.green+"33":C.border}`, borderRadius:14, padding:16, maxWidth:400, width:"100%", marginTop:16, marginBottom:24 }}>
          <div style={{ fontFamily:F.mono, color:lastResult.success?C.green:C.amber, fontSize:9, letterSpacing:2, marginBottom:8 }}>{lastResult.success?"✓ POR QUE FUNCIONA":"! O QUE REVISAR"}</div>
          <div style={{ fontFamily:F.mono, color:C.textMid, fontSize:12, lineHeight:1.9 }}>{lastResult.success?mission.explanation:"Revise o event_type, campos UDM, janela do match e threshold do condition."}</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:400 }}>
          {!lastResult.success&&<button onClick={()=>{setStepIdx(0);setSelections({});setView("step");}} style={{ background:"transparent", color:C.cyan, border:`2px solid ${C.cyan}44`, borderRadius:C.btnRadius, padding:"14px", fontFamily:F.display, fontWeight:700, fontSize:14, cursor:"pointer" }}>↺ TENTAR NOVAMENTE</button>}
          <Btn3D color={C.green} shadow={C.greenShadow} onClick={()=>{if(nextIdx<MISSIONS.length){setMIdx(nextIdx);setStepIdx(0);setSelections({});setLastResult(null);setView("step");}else setView("list");}}>
            {nextIdx<MISSIONS.length?"PRÓXIMA MISSÃO →":"🏆 VER LISTA"}
          </Btn3D>
        </div>
      </div>
    );
  }
  return null;
}

function Module5Screen({ onBack, onComplete, completed, mode, skipMode=false }) {
  const [phase, setPhase] = useState(skipMode?"final":"list");
  const [lessonIdx, setLessonIdx] = useState(0);
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [chalIdx, setChalIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [finalIdx, setFinalIdx] = useState(0);
  const [finalLives, setFinalLives] = useState(3);
  const [finalScore, setFinalScore] = useState(0);
  const [finalDone, setFinalDone] = useState(false);
  const isFree = mode==="free";
  const allDone = M5_LESSONS.every(l=>(completed||[]).includes(l.id));
  const resetFinal=()=>{setFinalIdx(0);setFinalLives(3);setFinalScore(0);setFinalDone(false);};

  if (phase==="list") return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"14px 18px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.textDim, fontSize:24, cursor:"pointer", padding:0 }}>‹</button>
        <div style={{ flex:1 }}><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:9, letterSpacing:3 }}>MÓDULO 5</div><div style={{ fontFamily:F.display, color:C.text, fontSize:16, fontWeight:800 }}>YARA-L Avançado</div></div>
        <div style={{ fontFamily:F.mono, color:C.purple, fontSize:13 }}>{(completed||[]).length}/{M5_LESSONS.length}</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px max(16px, calc((100% - 568px) / 2)) 120px" }}>
        {M5_LESSONS.map((l,i)=>{
          const done=(completed||[]).includes(l.id);
          const locked=false; // free mode
          return (
            <div key={l.id} onClick={()=>!locked&&(setLessonIdx(i),setCardIdx(0),setFlipped(false),setLives(3),setChalIdx(0),setPhase("cards"))}
              style={{ background:locked?C.surface2:C.surface, border:`1px solid ${done?C.purple+"55":locked?C.border:C.borderBright}`, borderRadius:14, padding:"16px 18px", marginBottom:12, display:"flex", alignItems:"center", gap:14, opacity:locked?.4:1, cursor:locked?"default":"pointer" }}>
              <div style={{ fontSize:28 }}>{done?"✅":locked?"🔒":l.icon}</div>
              <div style={{ flex:1 }}><div style={{ fontFamily:F.display, color:C.text, fontSize:15, fontWeight:700 }}>{l.title}</div><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, marginTop:2 }}>{done?"✓ Completo":locked?"Complete a lição anterior":`${l.cards.length} cards + ${l.challenges.length} desafios`}</div></div>
              {!locked&&<div style={{ color:C.textDim, fontSize:20 }}>›</div>}
            </div>
          );
        })}
        {(allDone||isFree)&&(
          <div onClick={()=>{resetFinal();setPhase("final");}} style={{ background:C.surface, border:`2px solid ${C.purple}66`, borderRadius:16, padding:"20px 18px", cursor:"pointer", textAlign:"center", marginTop:8 }}>
            <div style={{ fontSize:32, marginBottom:6 }}>🏆</div>
            <div style={{ fontFamily:F.display, color:C.purple, fontSize:17, fontWeight:800 }}>DESAFIO FINAL AVANÇADO</div>
            <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, marginTop:4 }}>10 questões · precisa de 8/10</div>
          </div>
        )}
      </div>
    </div>
  );

  if (phase==="cards") {
    const lesson=M5_LESSONS[lessonIdx]; const card=lesson.cards[cardIdx]; const isLast=cardIdx===lesson.cards.length-1;
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <ProgressBar value={(cardIdx/lesson.cards.length)*50} color={C.purple} onBack={()=>setPhase("list")} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 20px 120px" }}>
          <div onClick={()=>setFlipped(f=>!f)} style={{ background:flipped?C.purpleDim:C.surface, border:`2px solid ${flipped?C.purple+"66":C.border}`, borderRadius:20, padding:"28px 24px", width:"100%", maxWidth:440, minHeight:210, display:"flex", flexDirection:"column", justifyContent:"center", cursor:"pointer", transition:"all .3s" }}>
            <div style={{ fontFamily:F.mono, color:flipped?C.purple:C.textDim, fontSize:9, letterSpacing:3, marginBottom:12 }}>{flipped?"RESPOSTA ▼":"👆 Toque para ver"}</div>
            <div style={{ fontFamily:F.mono, color:flipped?C.text:C.textMid, fontSize:13, lineHeight:2, whiteSpace:"pre-wrap" }}>{flipped?card.a:card.q}</div>
          </div>
          <div style={{ display:"flex", gap:6, marginTop:18 }}>
            {lesson.cards.map((_,i)=><div key={i} style={{ width:i===cardIdx?20:8, height:8, borderRadius:4, background:i<cardIdx?C.green:i===cardIdx?C.purple:C.border, transition:"all .3s" }} />)}
          </div>
        </div>
        <BottomCTA>
          {isLast ? <CTABtn color={C.purple} onClick={()=>{setChalIdx(0);setLives(3);setPhase("challenges");}}>▶ FAZER OS DESAFIOS</CTABtn>
          : <div style={{ display:"flex", gap:10 }}>
              {cardIdx>0&&<button onClick={()=>{setCardIdx(i=>i-1);setFlipped(false);}} style={{ background:C.surface, color:C.textMid, border:`1px solid ${C.border}`, borderRadius:C.btnRadius, padding:"16px 20px", fontFamily:F.display, fontWeight:700, fontSize:15, cursor:"pointer" }}>‹</button>}
              <CTABtn color={C.purple} onClick={()=>{setCardIdx(i=>i+1);setFlipped(false);}}>PRÓXIMO →</CTABtn>
            </div>}
        </BottomCTA>
      </div>
    );
  }

  if (phase==="challenges") {
    const lesson=M5_LESSONS[lessonIdx];
    if(lives<=0) return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:16 }}>💔</div>
        <div style={{ fontFamily:F.display, color:C.red, fontSize:22, fontWeight:800, marginBottom:24 }}>Sem vidas!</div>
        <CTABtn color={C.purple} onClick={()=>{setCardIdx(0);setFlipped(false);setPhase("cards");}}>↺ REVER FLASHCARDS</CTABtn>
      </div>
    );
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <ProgressBar value={50+((chalIdx/lesson.challenges.length)*50)} color={C.purple} onBack={()=>{setCardIdx(lesson.cards.length-1);setFlipped(false);setPhase("cards");}} right={<LivesRow count={lives} />} />
        <div style={{ flex:1, overflowY:"auto", padding:"20px max(16px, calc((100% - 568px) / 2)) 20px" }}>
          <ChallengeCard key={chalIdx} ch={lesson.challenges[chalIdx]}
            onCorrect={()=>{}} onWrong={()=>setLives(l=>l-1)}
            onNext={()=>{if(chalIdx===lesson.challenges.length-1){onComplete(lesson.id);setPhase("list");}else setChalIdx(i=>i+1);}}
            showNext={true} />
        </div>
      </div>
    );
  }

  if (phase==="final") {
    if(finalLives<=0||finalDone){
      const passed=finalScore>=8;
      return (
        <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
          <div style={{ fontSize:64, marginBottom:14 }}>{passed?"🏆":"💔"}</div>
          <div style={{ fontFamily:F.display, fontSize:24, fontWeight:800, color:passed?C.green:C.red, marginBottom:8 }}>{passed?"MÓDULO 5 COMPLETO!":"Não passou"}</div>
          <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:14, marginBottom:24 }}>{finalScore}/{M5_FINAL_CHALLENGE.length} corretas</div>
          {passed&&<div style={{ fontFamily:F.mono, color:C.purple, fontSize:13, marginBottom:24 }}>+300 DX · Mestre em YARA-L! 🎖</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:360 }}>
            <button onClick={resetFinal} style={{ background:"transparent", color:C.purple, border:`2px solid ${C.purple}44`, borderRadius:C.btnRadius, padding:"14px", fontFamily:F.display, fontWeight:700, fontSize:14, cursor:"pointer" }}>↺ TENTAR NOVAMENTE</button>
            <Btn3D color={passed?C.purple:C.surface} shadow={passed?"#7c3aed":C.cardDepth} onClick={()=>{if(passed)onComplete("final");onBack();}}>{passed?"🎖 CONCLUIR":"← VOLTAR"}</Btn3D>
          </div>
        </div>
      );
    }
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <ProgressBar value={(finalIdx/M5_FINAL_CHALLENGE.length)*100} color={C.purple} onBack={()=>setPhase("list")} right={<LivesRow count={finalLives} />} />
        <div style={{ flex:1, overflowY:"auto", padding:"20px max(16px, calc((100% - 568px) / 2)) 20px" }}>
          <ChallengeCard key={finalIdx} ch={M5_FINAL_CHALLENGE[finalIdx]}
            onCorrect={()=>setFinalScore(s=>s+1)} onWrong={()=>setFinalLives(l=>l-1)}
            onNext={()=>{if(finalIdx===M5_FINAL_CHALLENGE.length-1)setFinalDone(true);else setFinalIdx(i=>i+1);}}
            showNext={true} />
        </div>
      </div>
    );
  }
  return null;
}

function Module6Screen({ onBack, onComplete, completed, mode }) {
  const [view, setView] = useState("list");
  const [pIdx, setPIdx] = useState(0);
  const [placed, setPlaced] = useState({});
  const [selected, setSelected] = useState(null);
  const [errors, setErrors] = useState({});
  const [lives, setLives] = useState(3);
  const [usedBank, setUsedBank] = useState([]);
  const [phase, setPhase] = useState("build");
  const [animStep, setAnimStep] = useState(-1);
  const [explainIdx, setExplainIdx] = useState(0);
  const [optionsCache, setOptionsCache] = useState([]);
  const animXp = useAnimVal(phase==="done"?M6_PUZZLES[pIdx].xp:0);
  const isFree = mode === "free";
  const puzzle = M6_PUZZLES[pIdx];

  const startPuzzle = (i) => {
    const p = M6_PUZZLES[i];
    const blanks = p.nodes.filter(n=>n.blank);
    const opts = [...blanks.map(b=>b.label), ...p.distractors].sort(()=>Math.random()-0.5);
    setPIdx(i); setPlaced({}); setSelected(null); setErrors({});
    setLives(3); setUsedBank([]); setPhase("build"); setAnimStep(-1); setExplainIdx(0);
    setOptionsCache(opts); setView("puzzle");
  };

  const blanks = puzzle.nodes.filter(n=>n.blank);

  useEffect(() => {
    if (phase !== "animate") return;
    if (animStep >= puzzle.nodes.length) { setTimeout(() => setPhase("explain"), 400); return; }
    const t = setTimeout(() => setAnimStep(s=>s+1), 360);
    return () => clearTimeout(t);
  }, [phase, animStep]);

  useEffect(() => {
    if (phase !== "build") return;
    if (blanks.every(b => placed[b.id] === b.label)) setTimeout(() => { setPhase("animate"); setAnimStep(0); }, 400);
  }, [placed]);

  const tap = (nodeId, correct) => {
    if (!selected) return;
    if (selected === correct) {
      setPlaced(p=>({...p,[nodeId]:selected})); setUsedBank(u=>[...u,selected]); setSelected(null);
    } else {
      setErrors(e=>({...e,[nodeId]:true})); setLives(l=>l-1);
      setTimeout(()=>setErrors(e=>{const n={...e};delete n[nodeId];return n;}),600); setSelected(null);
    }
  };
  const remove = (nodeId) => { const l=placed[nodeId]; setPlaced(p=>{const n={...p};delete n[nodeId];return n;}); setUsedBank(u=>u.filter(x=>x!==l)); };
  const isAnim = (id) => { const i=puzzle.nodes.findIndex(n=>n.id===id); return phase==="animate"&&i<=animStep; };
  const bankAvailable = optionsCache.filter(o=>!usedBank.includes(o));

  if (view==="list") return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <TopBar onBack={onBack} sub="MÓDULO 6" title="Fluxos por Fonte de Log"
        right={<PillBadge text={`${(completed||[]).length}/${M6_PUZZLES.length}`} color={C.orange} />} />
      <div style={{ flex:1, overflowY:"auto", padding:"16px max(16px, calc((100% - 568px) / 2)) 40px" }}>
        <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:19, lineHeight:1.8, marginBottom:16, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px" }}>
          Agora que você domina UDM, YARA-L e as missões de detecção, monte os fluxos reais de cada tipo de fonte — com todos os detalhes técnicos.
        </div>
        {M6_PUZZLES.map((p,i) => {
          const done=(completed||[]).includes(p.id);
          const locked=!isFree&&i>0&&!(completed||[]).includes(M6_PUZZLES[i-1].id);
          return (
            <div key={p.id} onClick={()=>!locked&&startPuzzle(i)}
              style={{ background:locked?C.bg:C.surface, border:`1px solid ${done?p.color+"55":locked?C.border:C.borderBright}`, borderRadius:14, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:14, opacity:locked?.35:1, cursor:locked?"default":"pointer" }}>
              <div style={{ fontSize:19 }}>{done?"✅":locked?"🔒":p.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:F.display, color:C.text, fontSize:22, fontWeight:700 }}>{p.title}</div>
                <div style={{ fontFamily:F.mono, color:p.color, fontSize:19, marginTop:2, letterSpacing:1 }}>{p.tag}</div>
                <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:19, marginTop:2 }}>
                  {done?`✓ +${p.xp} DX`:locked?"Complete o puzzle anterior":`${p.nodes.filter(n=>n.blank).length} etapas · +${p.xp} DX`}
                </div>
              </div>
              {!locked && <div style={{ color:C.textDim, fontSize:19 }}>›</div>}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (lives<=0) return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
      <div style={{ fontSize:56, marginBottom:16 }}>💔</div>
      <div style={{ fontFamily:F.display, color:C.red, fontSize:29, fontWeight:800, marginBottom:8 }}>Sem vidas!</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:320, marginTop:16 }}>
        <button onClick={()=>startPuzzle(pIdx)} style={{ background:puzzle.color, color:C.bg, border:"none", borderRadius:14, padding:"15px", fontFamily:F.display, fontWeight:800, fontSize:21, cursor:"pointer" }}>↺ TENTAR NOVAMENTE</button>
        <button onClick={()=>setView("list")} style={{ background:"transparent", color:C.textMid, border:`1px solid ${C.border}`, borderRadius:14, padding:"13px", fontFamily:F.display, fontWeight:700, fontSize:21, cursor:"pointer" }}>← LISTA</button>
      </div>
    </div>
  );

  if (phase==="explain") {
    const expls=puzzle.explanation; const isLast=explainIdx>=expls.length-1; const e=expls[explainIdx];
    return (
      <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
        <TopBar onBack={()=>setView("list")} sub={`M6 · ${puzzle.title.toUpperCase()}`} title="Explicação do Fluxo"
          right={<span style={{ fontFamily:F.mono, color:C.textDim, fontSize:19 }}>{explainIdx+1}/{expls.length}</span>} />
        <div style={{ padding:"8px 18px", overflowX:"auto", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:0, minWidth:"max-content" }}>
            {puzzle.nodes.map((node,i) => (
              <div key={node.id} style={{ display:"flex", alignItems:"center" }}>
                <div style={{ background:(placed[node.id]||node.label)===e.node?node.color+"33":C.surface, border:`1px solid ${(placed[node.id]||node.label)===e.node?node.color:C.border}`, borderRadius:7, padding:"4px 8px", textAlign:"center", minWidth:55 }}>
                  <div style={{ fontSize:19 }}>{node.icon}</div>
                  <div style={{ fontFamily:F.mono, color:(placed[node.id]||node.label)===e.node?node.color:C.textDim, fontSize:19, marginTop:1, whiteSpace:"nowrap" }}>{(placed[node.id]||node.label).split(" ")[0]}</div>
                </div>
                {i<puzzle.nodes.length-1&&<div style={{ width:8, height:1, background:C.borderBright, flexShrink:0 }} />}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex:1, padding:"16px 18px 120px", overflowY:"auto" }}>
          <div style={{ background:puzzle.color+"16", border:`1px solid ${puzzle.color}44`, borderRadius:14, padding:20 }}>
            <div style={{ fontFamily:F.mono, color:puzzle.color, fontSize:11, letterSpacing:2, marginBottom:10 }}>📍 {e.node}</div>
            <div style={{ fontFamily:F.mono, color:C.text, fontSize:19, lineHeight:1.9 }}>{e.info}</div>
          </div>
        </div>
        <BottomCTA>
          <button onClick={() => {
            if(isLast){ if(!(completed||[]).includes(puzzle.id)) onComplete(puzzle.id); setPhase("done"); }
            else setExplainIdx(i=>i+1);
          }} style={{ width:"100%", background:isLast?C.green:puzzle.color, color:C.bg, border:"none", borderRadius:14, padding:"16px", fontFamily:F.display, fontWeight:800, fontSize:21, cursor:"pointer", boxShadow:`0 0 24px ${isLast?C.green:puzzle.color}44` }}>
            {isLast?"🏆 CONCLUIR PUZZLE":"PRÓXIMA ETAPA →"}
          </button>
        </BottomCTA>
      </div>
    );
  }

  if (phase==="done") return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
      <div style={{ fontSize:64, marginBottom:12 }}>🎯</div>
      <div style={{ fontFamily:F.display, fontSize:29, fontWeight:800, color:C.green, marginBottom:6 }}>FLUXO COMPLETO!</div>
      <div style={{ fontFamily:F.mono, fontSize:36, color:C.amber, marginBottom:8 }}>+{animXp} DX</div>
      <div style={{ fontFamily:F.mono, color:puzzle.color, fontSize:11, letterSpacing:2, marginBottom:24 }}>{puzzle.tag}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:360 }}>
        {pIdx+1<M6_PUZZLES.length && <button onClick={()=>startPuzzle(pIdx+1)} style={{ background:C.green, color:C.bg, border:"none", borderRadius:14, padding:"16px", fontFamily:F.display, fontWeight:800, fontSize:21, cursor:"pointer", boxShadow:`0 0 24px ${C.green}44` }}>PRÓXIMO: {M6_PUZZLES[pIdx+1].emoji} {M6_PUZZLES[pIdx+1].title} →</button>}
        <button onClick={()=>setView("list")} style={{ background:"transparent", color:C.textMid, border:`1px solid ${C.border}`, borderRadius:14, padding:"13px", fontFamily:F.display, fontWeight:700, fontSize:21, cursor:"pointer" }}>← TODOS OS PUZZLES</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      <TopBar onBack={()=>setView("list")} sub={`M6 · ${puzzle.tag.toUpperCase()}`} title={puzzle.title}
        right={<div style={{ display:"flex", gap:3 }}>{[0,1,2].map(i=><span key={i} style={{ fontSize:19, opacity:i<lives?1:.2 }}>🛡</span>)}</div>} />
      <div style={{ padding:"10px 18px", background:C.surface, borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:19, lineHeight:1.7 }}>{puzzle.story}</div>
        {selected&&<div style={{ fontFamily:F.mono, color:puzzle.color, fontSize:19, marginTop:6 }}>✦ "{selected}" — toque num slot</div>}
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px max(16px, calc((100% - 568px) / 2)) 8px" }}>
        {puzzle.nodes.map((node,i) => {
          const anim=isAnim(node.id); const hasPlaced=placed[node.id]; const isError=errors[node.id];
          return (
            <div key={node.id} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              {i>0&&<div style={{ display:"flex", flexDirection:"column", alignItems:"center", margin:"2px 0" }}>
                <div style={{ width:2, height:14, background:anim?puzzle.color:C.border, transition:"background .3s", borderRadius:2 }} />
                <div style={{ width:0, height:0, borderLeft:"5px solid transparent", borderRight:"5px solid transparent", borderTop:`6px solid ${anim?puzzle.color:C.border}`, transition:"border-top-color .3s" }} />
              </div>}
              {node.blank ? (
                <div onClick={()=>{ if(hasPlaced){remove(node.id);return;} if(selected)tap(node.id,node.label); }}
                  style={{ background:isError?C.redDim:hasPlaced?node.color+"20":selected?"#0a1520":C.surface, border:`2px solid ${isError?C.red:hasPlaced?node.color:selected?puzzle.color+"66":C.borderBright}`, borderRadius:12, padding:"10px 15px", width:"100%", maxWidth:380, display:"flex", alignItems:"center", gap:12, cursor:selected||hasPlaced?"pointer":"default", transition:"all .2s", animation:isError?"shake .3s ease":"none" }}>
                  {hasPlaced ?
                    <><span style={{ fontSize:19 }}>{node.icon}</span><div style={{ flex:1 }}><div style={{ fontFamily:F.display, color:node.color, fontSize:21, fontWeight:700 }}>{hasPlaced}</div><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:19, marginTop:1 }}>{node.sub}</div></div><span style={{ fontFamily:F.mono, color:C.textDim, fontSize:19 }}>✕</span></> :
                    <><div style={{ width:20, height:20, borderRadius:5, border:`2px dashed ${selected?puzzle.color:C.textDim}`, flexShrink:0 }} /><div style={{ fontFamily:F.mono, color:selected?puzzle.color:C.textDim, fontSize:19 }}>{selected?"← toque para colocar":"← slot vazio"}</div></>
                  }
                </div>
              ) : (
                <div style={{ background:anim?node.color+"20":C.surface, border:`1px solid ${anim?node.color:C.border}`, borderRadius:12, padding:"10px 15px", width:"100%", maxWidth:380, display:"flex", alignItems:"center", gap:12, transition:"all .3s", boxShadow:anim?`0 0 14px ${node.color}44`:"none" }}>
                  <span style={{ fontSize:19 }}>{node.icon}</span>
                  <div style={{ flex:1 }}><div style={{ fontFamily:F.display, color:anim?node.color:C.text, fontSize:21, fontWeight:700, transition:"color .3s" }}>{node.label}</div><div style={{ fontFamily:F.mono, color:C.textDim, fontSize:19, marginTop:1 }}>{node.sub}</div></div>
                  {anim&&<div style={{ width:7, height:7, borderRadius:"50%", background:node.color, boxShadow:`0 0 7px ${node.color}` }} />}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ height:155 }} />
      </div>
      {phase==="build"&&<BottomCTA gradient={false}>
        {bankAvailable.length===0 && blanks.every(b=>placed[b.id]) ? (
          <button onClick={()=>{ if(blanks.every(b=>placed[b.id]===b.label)){ if(!(completed||[]).includes(puzzle.id)) onComplete(puzzle.id); setPhase("done"); } }}
            style={{ width:"100%", background:puzzle.color, color:C.bg, border:"none", borderRadius:14, padding:"16px", fontFamily:F.display, fontWeight:800, fontSize:21, cursor:"pointer", boxShadow:`0 0 24px ${puzzle.color}44`, marginBottom:8 }}>
            🏆 VER RESULTADO
          </button>
        ) : (
          <>
            <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, letterSpacing:2, marginBottom:8 }}>
              BANCO DE PEÇAS · {Object.keys(placed).length}/{blanks.length} colocados
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {bankAvailable.map(opt=><button key={opt} onClick={()=>setSelected(s=>s===opt?null:opt)} style={{ background:selected===opt?puzzle.color+"22":C.bg, border:`2px solid ${selected===opt?puzzle.color:C.borderBright}`, borderRadius:9, padding:"7px 13px", fontFamily:F.mono, color:selected===opt?puzzle.color:C.textMid, fontSize:19, cursor:"pointer", transition:"all .15s" }}>{opt}</button>)}
            </div>
          </>
        )}
      </BottomCTA>}
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
    </div>
  );
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const TopBar = ({ onBack, title, sub, right }) => (
  <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"13px 18px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
    {onBack && <button onClick={onBack} style={{ background:"none", border:"none", color:C.textMid, fontSize:19, cursor:"pointer", padding:0, lineHeight:1 }}>‹</button>}
    <div style={{ flex:1 }}>
      {sub && <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, letterSpacing:3 }}>{sub}</div>}
      <div style={{ fontFamily:F.display, color:C.text, fontSize:22, fontWeight:700 }}>{title}</div>
    </div>
    {right}
  </div>
);

const PillBadge = ({ text, color }) => (
  <span style={{ fontFamily:F.mono, color, fontSize:11, letterSpacing:2, background:color+"18", border:`1px solid ${color}44`, borderRadius:20, padding:"3px 10px" }}>{text}</span>
);

// ─── HOME ─────────────────────────────────────────────────────────────────────

const M5_LESSONS = [
  { id:1, icon:"📊", title:"Outcome Variables",
    cards:[
      { q:"O que é a seção outcome em YARA-L?", a:"Seção opcional com variáveis calculadas. Funções: sum(), max(), min(), count(), count_distinct(), array(), array_distinct(). Pode ser usada em regras COM ou SEM match section." },
      { q:"Outcome em single-event vs multi-event — qual a diferença?", a:"Single-event (sem match): outcome calcula por evento individual, sem aggregation obrigatória. Ex: $risk = 75\n\nMulti-event (com match): TODA variável DEVE usar aggregation. Ex: $total = count($e.campo)\n\nQuebrar esta regra causa erro de compilação!" },
      { q:"Como usar conditional math no outcome?", a:"$risk_score = max(100 - if($secAction = \"BLOCK\", 70, 0))\n\nSe ação = BLOCK → score cai para 30. Na condition: $e and $risk_score > 49\nAssim, eventos bloqueados não geram alerta — elimina alert fatigue." },
      { q:"Diferença entre count() e count_distinct():", a:"count($e.campo) — conta todas as ocorrências, incluindo duplicatas.\ncount_distinct($e.campo) — conta valores únicos. Ex: count_distinct($e.target.ip) > 20 detecta port scan. Em multi-event, ambos exigem aggregation." },
    ],
    challenges:[
      { type:"complete", sentence:"A seção outcome usa ____ para contar ocorrências únicas de um campo.", blank:"count_distinct()", hint:"count_distinct($e.target.ip) > 20 detecta port scan. count() conta tudo incluindo repetições. Em multi-event, TODA variável de outcome DEVE usar aggregation. Ref: docs.cloud.google.com/chronicle/docs/detection/yara-l-2-0-overview", options:["count_distinct()","count_unique()","distinct_count()","count()"] },
      { type:"truefalse", statement:"Em regras multi-event (com match), toda variável no outcome deve usar aggregation.", answer:true, hint:"Correto. Doc oficial: every outcome variable must be encapsulated within an aggregation (max, count, sum, array_distinct...). Em single-event sem match, aggregation nao e obrigatoria. Ref: docs.cloud.google.com/chronicle/docs/yara-l/yara-l-2-0-examples" },
      { type:"truefalse", statement:"A seção outcome pode ser usada em regras sem match (single-event).", answer:true, hint:"Correto. Outcome nao exige match. Em single-event voce pode calcular $risk_score = 75 sem match. A diferenca: sem match nao precisa de aggregation, com match e obrigatorio." },
    ]},
  { id:2, icon:"📋", title:"Reference Lists",
    cards:[
      { q:"O que é uma Reference List no Google SecOps?", a:"Lista de valores mantida centralmente no console do SecOps. Tipos: STRING (texto exato), REGEX (expressão regular), CIDR (ranges de rede). Referenciada em YARA-L com %. Atualizar a lista atualiza automaticamente todas as regras que a utilizam." },
      { q:"Como referenciar uma Reference List em YARA-L?", a:"Na seção events:\n$e.principal.hostname in %hosts_bloqueados\n$e.network.email.from in %dominios_suspeitos\nnot $e.principal.ip in cidr %redes_confiáveis\n\nO % antes do nome identifica a lista. O operador in faz o match." },
      { q:"Diferença entre Reference List e hardcode de valores:", a:"Hardcode: $e.target.hostname = \"malware.com\" — precisa editar a regra para mudar\nReference List: $e.target.hostname in %ioc_domains — atualizar a lista sem tocar na regra. Para IOCs que mudam frequentemente (IPs, domínios C2), Reference List é muito superior." },
    ],
    challenges:[
      { type:"complete", sentence:"Para referenciar uma reference list de domínios: $e.target.hostname ____ %blocklist.", blank:"in", hint:"Sintaxe: $e.campo in %nome_lista. Para negação: not $e.campo in %lista. Para CIDR: $e.principal.ip in cidr %trusted_nets. O % identifica reference lists e data tables.", options:["in","equals","matches","contains"] },
      { type:"truefalse", statement:"Atualizar uma reference list atualiza automaticamente todas as regras que a utilizam.", answer:true, hint:"Correto. Esta é a grande vantagem das Reference Lists vs hardcode. Atualizar a lista no console propaga automaticamente para todas as regras que a referenciam." },
    ]},
  { id:3, icon:"🔗", title:"Correlação Multi-evento",
    cards:[
      { q:"Como correlacionar dois eventos com ordenação cronológica?", a:"Use $e1/$e2 + placeholder compartilhado + timestamp ordering:\n\nevents:\n  $e1.metadata.event_type = \"USER_LOGIN\"\n  $e1.principal.user.userid = $user\n  $e2.metadata.event_type = \"FILE_CREATION\"\n  $e2.principal.user.userid = $user\n  $e1.metadata.event_timestamp.seconds < $e2.metadata.event_timestamp.seconds\nmatch:\n  $user over 30m" },
      { q:"Golden Pattern: conta criada, usada e deletada em 4h", a:"events:\n  $c.metadata.event_type = \"USER_CREATION\"\n  $c.target.user.userid = $user\n  $l.metadata.event_type = \"USER_LOGIN\"\n  $l.target.user.userid = $user\n  $d.metadata.event_type = \"USER_DELETION\"\n  $d.target.user.userid = $user\n  $c.metadata.event_timestamp.seconds < $l.metadata.event_timestamp.seconds\n  $l.metadata.event_timestamp.seconds < $d.metadata.event_timestamp.seconds\nmatch:\n  $user over 4h\ncondition: $c and $l and $d" },
      { q:"O que são Composite Rules?", a:"Regras que operam sobre DETECÇÕES geradas por outras regras ($d). Campos principais:\n• $d.detection.outcomes[\"campo\"] — acessa outcome variables da regra produtora\n• $d.detection.risk_score — score de risco\n• $d.detection.rule_name — nome da regra que gerou a detection\n• $d.detection.rule_labels.key / .value — labels da seção meta\n• $d.detection.detection_depth = 0 — previne feedback loops" },
      { q:"Como usar sliding window (janela deslizante)?", a:"A janela deslizante começa após um evento pivot:\nmatch:\n  $host over 10m after $e1\n\nSignifica: janela de 10min começa após cada $e1. Útil para detectar ausência:\ncondition: $e1 and !$e2\n→ detecta $e1 que NÃO é seguido por $e2 em 10min." },
    ],
    challenges:[
      { type:"complete", sentence:"Em composite rules, outcomes da regra produtora são acessados via $d.detection.____[\"campo\"].", blank:"outcomes", hint:"Sintaxe: $d.detection.outcomes[\"nome_outcome\"]. Outros campos: $d.detection.risk_score, $d.detection.rule_name, $d.detection.rule_labels.key/value. Anti-loop: $d.detection.detection_depth = 0. Ref: security.googlecloudcommunity.com/google-security-operations-66/adoption-guide-yara-l-optimization-7148", options:["outcomes","variables","fields","results"] },
      { type:"complete", sentence:"Para garantir que $e1 ocorre ANTES de $e2: $e1.metadata.event_timestamp.____ < $e2.metadata.event_timestamp.seconds.", blank:"seconds", hint:"Campos de timestamp: .seconds (Unix epoch) e .nanos. Comparar .seconds garante ordem cronologica. Essencial em brute force -> login, criacao -> uso -> exclusao de conta. Ref: docs.cloud.google.com/chronicle/docs/yara-l/yara-l-2-0-examples", options:["seconds","millis","timestamp","time"] },
      { type:"truefalse", statement:"Uma composite rule pode correlacionar alertas de múltiplas regras diferentes.", answer:true, hint:"Correto. Composite rules correlacionam DETECÇÕES de outras regras dentro de uma janela de tempo. Ex: detectar quando regra_A E regra_B disparam para o mesmo host em 1h." },
    ]},
  { id:4, icon:"🎯", title:"MITRE ATT&CK Mapping",
    cards:[
      { q:"Como mapear uma regra para MITRE ATT&CK?", a:"Na seção meta — que aceita qualquer par chave-valor livre. O Google usa dois padrões:\n• Padrão curto (doc oficial): tactic = \"Credential Access\" e technique = \"Brute Force\"\n• Padrão longo (community/parceiros): mitre_attack_tactic, mitre_attack_technique\nNas composite rules, acesse com: detection.detection.rule_labels[\"tactic\"]" },
      { q:"Para que serve o mapeamento MITRE no Google SecOps?", a:"Agrupa alertas por tática no dashboard MITRE, filtra detecções por técnica e integra com Mandiant threat intelligence automaticamente. Curated Detections já vêm mapeadas." },
      { q:"O que são Curated Detections?", a:"Regras YARA-L prontas mantidas pelo Google/Mandiant, já mapeadas para MITRE ATT&CK. Atualizam automaticamente. Disponíveis nos pacotes Enterprise e Enterprise Plus." },
    ],
    challenges:[
      { type:"complete", sentence:"Na seção meta do YARA-L, o campo ____ define a tática MITRE (padrão oficial Google).", blank:"tactic", hint:"A doc oficial usa: tactic = \"Credential Access\" e technique = \"Brute Force\". Nas composite rules, acesse com rule_labels[\"tactic\"]. O padrão mitre_attack_tactic também é válido — meta aceita qualquer chave. Ref: cloud.google.com/chronicle/docs/yara-l/meta-syntax", options:["tactic","mitre_attack_tactic","attack_tactic","mitre_tactic"] },
      { type:"truefalse", statement:"Curated Detections são regras YARA-L mantidas pelo Google/Mandiant.", answer:true, hint:"Correto. Curated Detections são regras prontas, mantidas pelo Google e Mandiant, já mapeadas para MITRE ATT&CK. Disponíveis a partir do pacote Enterprise." },
      { type:"complete", sentence:"A função ____ retorna o primeiro valor não-nulo entre dois campos.", blank:"strings.coalesce()", hint:"strings.coalesce(a, b, c...) retorna o primeiro argumento não-nulo. Útil para campos opcionais: strings.coalesce($e.principal.hostname, $e.principal.ip).", options:["strings.coalesce()","strings.first()","strings.or()","strings.fallback()"] },
    ]},
  { id:5, icon:"🔄", title:"Sliding Window e Negação",
    cards:[
      { q:"Como detectar eventos que NÃO ocorrem em sequência?", a:"Use sliding window com negação:\n\nrule login_sem_mfa {\n  events:\n    $e1.metadata.event_type = \"USER_LOGIN\"\n    $e1.security_result.action = \"ALLOW\"\n    $e1.principal.user.userid = $user\n    $e2.metadata.event_type = \"USER_LOGIN\"\n    $e2.additional.fields[\"mfa_used\"] = \"true\"\n    $e2.principal.user.userid = $user\n  match:\n    $user over 5m after $e1\n  condition:\n    $e1 and !$e2\n}" },
      { q:"Como usar o operador 'not' em YARA-L?", a:"Na seção events: not $e.campo = valor\nNa seção condition: $e1 and !$e2 (evento e2 NÃO deve existir)\n\nExemplo: detectar logins ALLOW onde NÃO há evento MFA associado ao mesmo usuário em 5min após o login." },
    ],
    challenges:[
      { type:"complete", sentence:"A janela deslizante em YARA-L usa a sintaxe: match: $host over 10m ____ $e1.", blank:"after", hint:"'after $pivot' define que a janela começa após o evento pivot. Ex: match: $host over 10m after $e1. Útil para detectar ausência de evento subsequente: condition: $e1 and !$e2. Ref: cloud.google.com/chronicle/docs/detection/yara-l-2-0-overview", options:["after","before","since","from"] },
      { type:"truefalse", statement:"A condição '$e1 and !$e2' detecta $e1 que NÃO é seguido por $e2 na janela.", answer:true, hint:"Correto. A sliding window (after $e1) cria uma janela de tempo após o evento pivot. !$e2 significa que o evento $e2 NÃO deve existir nessa janela. Padrão clássico para detectar login sem MFA." },
    ]},
  { id:6, icon:"🗃", title:"Data Tables e write_row",
    cards:[
      { q:"O que é uma Data Table no Google SecOps?", a:"Estrutura de dados multicolunas que permite importar dados próprios para o SecOps. Funciona como uma tabela de lookup com colunas definidas e dados em linhas. Pode ser criada pela UI, API ou por regras YARA-L com write_row." },
      { q:"Padrão de detecção com Data Table — DNS malicioso:", a:"events:\n  $e.metadata.event_type = \"NETWORK_DNS\"\n  $e.network.dns.questions.name = $domain\n  $domain in %malicious_domains_table.domain_name\n\nEste padrão substitui dezenas de regras estáticas com OR. 1 regra + Data Table = gestao centralizada de IOCs. Adoption Guide: Use Data Tables instead of creating redundant detection rules." },
      { q:"O que é o write_row e onde ele fica?", a:"write_row escreve o resultado de uma regra numa Data Table. Fica na seção export (após condition):\n\nexport:\n  write_row(%minha_tabela) {\n    key: $user\n    ip_address: $ip\n    login_count: $count\n  }\n\nSe a chave já existe, sobrescreve. Deve ser o último bloco da regra." },
      { q:"Quando usar Data Table vs Reference List?", a:"Reference List: uma coluna simples. Use para listas de IOCs simples.\n\nData Table: multiplas colunas. Use quando precisar de:\n- Multiplos atributos por IOC (dominio + categoria + score)\n- write_row para enriquecer com dados calculados por regras\n- Substituir dezenas de regras estaticas por 1 regra flexivel\n\nTipos de coluna: STRING, REGEX, CIDR (mesmo que Reference Lists)." },
    ],
    challenges:[
      { type:"complete", sentence:"A função write_row fica na seção ____ de uma regra YARA-L.", blank:"export", hint:"A seção export é exclusiva para write_row. Fica após condition e deve ser o último bloco da regra. Ref: cloud.google.com/chronicle/docs/investigation/data-tables", options:["export","outcome","condition","match"] },
      { type:"truefalse", statement:"write_row pode sobrescrever uma linha existente na Data Table se a chave já existir.", answer:true, hint:"Correto. Se a chave já existe, write_row sobrescreve a linha. Se não existe, cria nova linha. Ref: cloud.google.com/chronicle/docs/investigation/data-tables" },
      { type:"complete", sentence:"Data Tables diferem de Reference Lists porque suportam múltiplas ____.", blank:"colunas", hint:"Reference Lists: coluna única ($e.field in %lista). Data Tables: múltiplas colunas ($e.field in %tabela.coluna). Ideal para lookups complexos.", options:["colunas","linhas","tipos","chaves"] },
      { type:"complete", sentence:"Para filtrar por Data Table em YARA-L: $e.target.hostname in %tabela.____.", blank:"coluna", hint:"Sintaxe: %nome_tabela.nome_coluna. Você especifica qual coluna comparar. Diferente de Reference Lists onde não há coluna. Ref: cloud.google.com/chronicle/docs/yara-l/reference-list-syntax", options:["coluna","campo","key","index"] },
    ]},
  { id:7, icon:"📊", title:"Risk Analytics & UEBA",
    cards:[
      { q:"O que é Risk Analytics no Google SecOps?", a:"UEBA (User and Entity Behavior Analytics) integrado ao SecOps. Inverte o modelo de detecção: em vez de perguntar 'este evento é malicioso?', pergunta 'quão arriscada é esta entidade agora?'\n\nO Risk Engine agrega sinais, anomalias e detecções de uma entidade (usuário ou asset) numa janela de tempo deslizante com decaimento. O Dashboard Risk Analytics mostra entidades com maior risco acumulado." },
      { q:"Como o $risk_score conecta uma regra YARA-L ao Risk Engine?", a:"Use $risk_score na seção outcome. Se omitido, o SecOps usa defaults:\n• Alert gerado por regra = 40 pontos\n• Detection sem score explícito = 15 pontos\n\nCom $risk_score explícito:\noutcome:\n  $risk_score = max(if($e.security_result.action = \"FAIL\", 40, 0) +\n                   if($e.target.port = 22, 20, 0))\n\ncondition: $e and $risk_score > 0\n\nO SecOps acumula scores de múltiplas regras por entidade." },
      { q:"Score condicional baseado em criticidade do asset:", a:"rule risk_by_asset_criticality {\n  meta:\n    type = \"MULTI_EVENT\"\n  events:\n    $e.metadata.event_type = \"USER_LOGIN\"\n    $e.security_result.action = \"FAIL\"\n    $e.target.hostname = $host\n  match: $host over 10m\n  outcome:\n    $risk_score = max(\n      if($host = \"dc01\", 80,\n      if($host = \"prod-srv\", 60, 20)))\n    $count = count($e.metadata.event_type)\n  condition: $e and $count >= 5\n}" },
      { q:"O que são baselines comportamentais automáticos?", a:"O SecOps calcula métricas comportamentais automaticamente (UEBA nativo):\n• Logins por hora/dia por usuário\n• Bytes enviados por dia\n• Países de acesso\n• Processos lançados\n\nVocê pode acessar desvios dessas métricas em YARA-L sem configuração manual. Ex: detectar usuário que de repente acessa de 5+ cidades diferentes — Impossible Travel / VPN Anomaly." },
      { q:"Alert Suppression com Data Tables + $risk_score:", a:"Padrão avançado: regras com $risk_score baixo não disparam se estiverem na suppression list:\n\noutcome:\n  $risk = max(50 - if($host in %trusted_hosts.hostname, 50, 0))\ncondition: $e and $risk > 0\n\nOutra abordagem: Data Table como supressão dinâmica\n→ Playbook adiciona entidade na tabela\n→ Regra verifica: not $host in %suppressed.hostname\nReduz alert fatigue sem perder visibilidade." },
    ],
    challenges:[
      { type:"complete", sentence:"Se $risk_score é omitido no outcome, o SecOps usa ____ pontos para Alerts.", blank:"40", hint:"Defaults do Risk Engine: Alert gerado por uma regra = 40 pontos. Detection sem score explícito = 15 pontos. Ao definir $risk_score explicitamente, você controla a contribuição desta regra para o perfil de risco da entidade. Ref: security.googlecloudcommunity.com/google-security-operations-66/adoption-guide-risk-analytics", options:["40","15","100","0"] },
      { type:"truefalse", statement:"O $risk_score no outcome conecta a regra YARA-L ao Risk Analytics Engine do SecOps.", answer:true, hint:"Correto. Qualquer regra com $risk_score na seção outcome alimenta o Risk Engine. O score é acumulado por entidade (user ou asset) ao longo do tempo com decaimento. O Dashboard Risk Analytics exibe as entidades com maior risco acumulado. Ref: community adoption guide Risk Analytics" },
      { type:"complete", sentence:"O Risk Analytics usa ____ como unidade primária de análise (não o evento individual).", blank:"entidade", hint:"Entity-centric detection: a entidade (usuário ou asset) é o foco. O Risk Engine agrega sinais de MÚLTIPLAS regras para a MESMA entidade. Um único evento de baixo risco pode ser normal — mas 10 eventos de risco médio para a mesma entidade em 1h é um alerta. Ref: adoption guide Risk Analytics" , options:["entidade","evento","alerta","regra"] },
      { type:"truefalse", statement:"Alert Suppression com Data Tables evita alertas duplicados sem perder visibilidade nos logs.", answer:true, hint:"Correto. O padrão usa Data Table como suppression list dinâmica. A regra YARA-L verifica: not $host in %suppressed.hostname — eventos continuam sendo ingeridos e armazenados, mas não geram alerta. O Playbook SOAR adiciona entidades confiáveis à tabela. Ref: adoption guide Alert Suppression" },
    ]},
];

const M5_FINAL_CHALLENGE = [
  { type:"complete", sentence:"A seção ____ armazena variáveis calculadas como sum() e count().", blank:"outcome", hint:"outcome é a 5ª seção do YARA-L (opcional). Contém funções de agregação: sum(), max(), min(), count(), count_distinct(), array(), array_distinct().", options:["outcome","result","meta","events"] },
  { type:"truefalse", statement:"Reference lists se atualizam automaticamente em todas as regras.", answer:true, hint:"Correto. Atualizar uma reference list no console atualiza automaticamente todas as regras que a referenciam — sem precisar editar o código YARA-L." },
  { type:"complete", sentence:"Para referenciar uma reference list: $e.target.hostname ____ %blocklist.", blank:"in", hint:"Sintaxe: $e.campo in %nome_lista. Para negação: not $e.campo in %lista. Para CIDR: in cidr %lista. O % identifica reference lists e data tables.", options:["in","equals","matches","contains"] },
  { type:"complete", sentence:"A função que extrai um grupo de captura em YARA-L é ____.", blank:"re.capture()", hint:"re.capture($e.field, `pattern`) extrai o primeiro grupo de captura. Ex: re.capture($e.network.dns.questions.name, `.([^.]+).[^.]+$`) extrai o domínio raiz.", options:["re.capture()","re.extract()","re.group()","strings.capture()"] },
  { type:"truefalse", statement:"Composite rules operam diretamente sobre eventos UDM.", answer:false, hint:"Incorreto. Composite rules operam sobre DETECÇÕES ($d.detection.*). Campos: $d.detection.outcomes[campo] (outcomes), $d.detection.risk_score, $d.detection.rule_labels.key/value." },
  { type:"complete", sentence:"Na meta YARA-L, o campo ____ define a tática MITRE (padrão oficial Google).", blank:"tactic", hint:"A doc oficial usa: tactic = 'Credential Access'. Nas composite rules: rule_labels['tactic']. Meta aceita qualquer chave livre.", options:["tactic","mitre_attack_tactic","attack_tactic","mitre_tactic"] },
  { type:"complete", sentence:"write_row fica na seção ____ de uma regra YARA-L.", blank:"export", hint:"A seção export é exclusiva para write_row — deve ser o último bloco da regra. Ref: cloud.google.com/chronicle/docs/investigation/data-tables", options:["export","outcome","condition","match"] },
  { type:"truefalse", statement:"Data Table suporta múltiplas colunas, diferente de Reference List.", answer:true, hint:"Correto. Reference Lists: coluna única. Data Tables: múltiplas colunas ($e.field in %tabela.coluna). Ideal para lookups complexos." },
  { type:"complete", sentence:"Curated Detections estão disponíveis a partir do pacote ____.", blank:"Enterprise", hint:"Curated Detections requerem pacote Enterprise ou Enterprise Plus. No Standard, só regras customizadas.", options:["Enterprise","Standard","Essentials","Free"] },
  { type:"complete", sentence:"A função ____ retorna o primeiro valor não-nulo entre dois campos.", blank:"strings.coalesce()", hint:"strings.coalesce(a, b, c...) retorna o primeiro argumento não-nulo. Útil para campos opcionais.", options:["strings.coalesce()","strings.first()","strings.or()","strings.fallback()"] },
  { type:"truefalse", statement:"Em regras multi-event (com match), todas as variáveis de outcome devem usar aggregation.", answer:true, hint:"Correto. Doc: every outcome variable must be encapsulated within an aggregation function. Em single-event (sem match) não é obrigatório." },
  { type:"complete", sentence:"Para garantir ordem cronológica: $e1.metadata.event_timestamp.____ < $e2.metadata.event_timestamp.seconds.", blank:"seconds", hint:"Campos de timestamp: .seconds e .nanos. Comparar .seconds garante que $e1 ocorre antes de $e2. Essencial em correlações sequenciais.", options:["seconds","millis","timestamp","nanos"] },
  { type:"complete", sentence:"Se $risk_score é omitido no outcome, o Risk Engine usa ____ pontos por padrão (para Alerts).", blank:"40", hint:"Defaults do Risk Engine: Alert = 40 pontos, Detection sem score = 15 pontos. Ao definir $risk_score explicitamente, você controla a contribuição da regra para o perfil de risco da entidade. Ref: adoption guide Risk Analytics", options:["40","15","100","0"] },
  { type:"truefalse", statement:"O Risk Analytics usa a entidade (usuário ou asset) como unidade primária de análise.", answer:true, hint:"Correto. Entity-centric: o Risk Engine agrega sinais de MÚLTIPLAS regras para a MESMA entidade ao longo do tempo. Um único evento pode ser normal — mas acumulação de sinais indica comprometimento. Ref: adoption guide Risk Analytics" },
];


const AVATARS = ["🦊","🐺","🦁","🐯","🦝","🐻","🐼","🦄","🐉","🦅","🦋","🐙",
  "🤖","👾","🎮","🛡","⚔️","🔐","🏴‍☠️","🧙","🥷","🦸","🕵️","🧑‍💻",];


const MODULES_META = [
  { id:0, icon:"🏛",  title:"Conceitos Fundamentais",  sub:"SIEM · UDM · Ingestão · Investigação · Content Hub",      color:C.cyan,   lessons:7  },
  { id:1, icon:"🗺",  title:"Arquitetura SecOps",       sub:"Monte o fluxo completo · puzzle de fixação",   color:C.teal,   lessons:1  },
  { id:2, icon:"🔬",  title:"UDM — Modelo de Dados",    sub:"Inspecione campos e event types",              color:C.green,  lessons:2  },
  { id:3, icon:"📐",  title:"YARA-L Básico",             sub:"Anatomia de uma regra",                        color:C.amber,  lessons:4  },
  { id:4, icon:"🎮",  title:"Missões de Detecção",       sub:"15 casos reais · técnica, comportamental e IA",color:C.red,    lessons:15 },
  { id:5, icon:"🏆",  title:"YARA-L Avançado",           sub:"Outcome · Reference Lists · Data Tables · Risk Analytics",  color:C.purple, lessons:7  },
  { id:6, icon:"🔌",  title:"Fluxos e Onboarding",           sub:"6 puzzles específicos por tipo de log",        color:C.orange, lessons:6  },
];

function ProfileScreen({ userProfile, totalXp, streak, progress, onBack, onLogout, isAdmin }) {
  const doneMods = MODULES_META.filter((m,i) => {
    const p = [
      Math.round((progress.m1||[]).length/M1_LESSONS.length*100),
      progress.m0?100:0, progress.m2?100:0,
      Math.round((progress.m3||[]).length/M3_LESSONS.length*100),
      Math.round((progress.m4||[]).length/MISSIONS.length*100),
      Math.round((progress.m5||[]).length/(M5_LESSONS.length+1)*100),
      Math.round((progress.m6||[]).length/M6_PUZZLES.length*100),
    ];
    return p[i] === 100;
  }).length;

  const [confirmLogout, setConfirmLogout] = useState(null);

  return (
    <div style={{ minHeight:'100dvh', background:C.bg, display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`,
        padding:'12px 20px', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <button onClick={onBack}
          style={{ background:'none', border:'none', color:C.textDim, fontSize:24,
            cursor:'pointer', padding:'4px 8px', marginLeft:-8 }}>‹</button>
        <span style={{ fontFamily:F.display, color:C.text, fontSize:17, fontWeight:800 }}>Perfil</span>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'24px max(20px,calc((100%-568px)/2)) 80px' }}>

        {/* Avatar card */}
        <div style={{ background:C.surface, border:`2px solid ${C.border}`,
          borderBottom:`5px solid ${C.border}`, borderRadius:20, padding:'28px 24px',
          display:'flex', flexDirection:'column', alignItems:'center', gap:12, marginBottom:16,
          backgroundImage:'repeating-linear-gradient(-45deg,rgba(255,255,255,.02) 0px,rgba(255,255,255,.02) 1px,transparent 1px,transparent 10px)' }}>
          <div style={{ fontSize:64, lineHeight:1 }}>{userProfile?.avatar || '🛡'}</div>
          <div style={{ fontFamily:F.display, color:C.text, fontSize:22, fontWeight:900 }}>
            {userProfile?.name || 'Analista'}
          </div>
          <div style={{ fontFamily:F.mono, color:C.accent, fontSize:10, letterSpacing:3 }}>
            GOOGLE SECOPS ANALYST
          </div>
          {isAdmin && (
            <div style={{ background:"#ff1a75", color:"#fff", fontFamily:F.mono,
              fontSize:11, fontWeight:700, letterSpacing:2,
              borderRadius:20, padding:"4px 12px", marginTop:4 }}>
              👑 MODO ADMIN ATIVO
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          {[
            { label:'DX Total', value:totalXp, emoji:'⚡', color:C.purple },
            { label:'Sequência', value:`${streak} dias`, emoji:'🔥', color:C.amber },
            { label:'Módulos', value:`${doneMods}/7`, emoji:'🏛', color:C.cyan },
            { label:'Missões', value:(progress.m4||[]).length, emoji:'🎮', color:C.green },
          ].map(s => (
            <div key={s.label} style={{ background:C.surface, border:`1px solid ${C.border}`,
              borderRadius:16, padding:'16px', textAlign:'center' }}>
              <div style={{ fontSize:28 }}>{s.emoji}</div>
              <div style={{ fontFamily:F.display, color:s.color, fontSize:24, fontWeight:900, marginTop:4 }}>
                {s.value}
              </div>
              <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:10, letterSpacing:1, marginTop:2 }}>
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {/* Logout — just switches user, keeps nothing */}
          <button onClick={() => setConfirmLogout('logout')}
            style={{ background:C.surface, border:`1.5px solid ${C.border}`,
              borderRadius:14, padding:'14px 20px', fontFamily:F.display,
              fontWeight:800, fontSize:15, color:C.textMid, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            🚪 Sair do jogo
          </button>
          {/* Reset — destroys all progress */}
          <button onClick={() => setConfirmLogout('reset')}
            style={{ background:'none', border:`1.5px solid rgba(255,77,77,.3)`,
              borderRadius:14, padding:'14px 20px', fontFamily:F.display,
              fontWeight:800, fontSize:15, color:C.red, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            🗑 Resetar progresso
          </button>
        </div>
      </div>

      {/* Modal: Sair */}
      {confirmLogout === 'logout' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:500,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:'20px 20px 0 0', padding:'28px 20px 44px', width:'100%', maxWidth:600 }}>
            <div style={{ fontFamily:F.display, color:C.text, fontSize:20, fontWeight:900,
              textAlign:'center', marginBottom:8 }}>🚪 Sair do jogo?</div>
            <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:12, textAlign:'center',
              lineHeight:1.8, marginBottom:24 }}>
              Você será levado de volta à tela inicial.<br/>Seu progresso e DX continuam salvos.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setConfirmLogout(null)}
                style={{ flex:1, background:C.surface2, border:`1px solid ${C.border}`,
                  borderRadius:14, padding:'13px', fontFamily:F.display, fontWeight:800,
                  fontSize:15, color:C.textDim, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => { onLogout('logout'); setConfirmLogout(null); }}
                style={{ flex:1, background:C.accent, border:'none',
                  borderBottom:'4px solid rgba(0,0,0,.4)', borderRadius:14, padding:'13px',
                  fontFamily:F.display, fontWeight:900, fontSize:15, color:'#fff', cursor:'pointer' }}>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resetar — step 1 */}
      {confirmLogout === 'reset' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:500,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:'20px 20px 0 0', padding:'28px 20px 44px', width:'100%', maxWidth:600 }}>
            <div style={{ fontFamily:F.display, color:C.red, fontSize:20, fontWeight:900,
              textAlign:'center', marginBottom:8 }}>⚠️ Resetar progresso?</div>
            <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:12, textAlign:'center',
              lineHeight:1.8, marginBottom:24 }}>
              Todo o progresso, DX e configurações serão apagados.<br/>
              <span style={{ color:C.red }}>Esta ação não pode ser desfeita.</span>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setConfirmLogout(null)}
                style={{ flex:1, background:C.surface2, border:`1px solid ${C.border}`,
                  borderRadius:14, padding:'13px', fontFamily:F.display, fontWeight:800,
                  fontSize:15, color:C.textDim, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => setConfirmLogout('reset2')}
                style={{ flex:1, background:C.red, border:'none',
                  borderBottom:'4px solid rgba(0,0,0,.4)', borderRadius:14, padding:'13px',
                  fontFamily:F.display, fontWeight:900, fontSize:15, color:'#fff', cursor:'pointer' }}>
                Continuar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resetar — step 2 (segunda confirmação) */}
      {confirmLogout === 'reset2' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.9)', zIndex:500,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:C.surface, border:`2px solid ${C.red}44`,
            borderRadius:'20px 20px 0 0', padding:'28px 20px 44px', width:'100%', maxWidth:600 }}>
            <div style={{ fontSize:48, textAlign:'center', marginBottom:8 }}>🗑</div>
            <div style={{ fontFamily:F.display, color:C.red, fontSize:20, fontWeight:900,
              textAlign:'center', marginBottom:8 }}>Tem certeza absoluta?</div>
            <div style={{ background:`${C.red}15`, border:`1px solid ${C.red}33`,
              borderRadius:12, padding:'12px 16px', marginBottom:24, textAlign:'center' }}>
              <div style={{ fontFamily:F.mono, color:C.red, fontSize:12, lineHeight:1.8 }}>
                {totalXp} DX · {doneMods} módulos · progresso total
              </div>
              <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, marginTop:4 }}>
                serão apagados permanentemente.
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setConfirmLogout(null)}
                style={{ flex:1, background:C.surface2, border:`1px solid ${C.border}`,
                  borderRadius:14, padding:'13px', fontFamily:F.display, fontWeight:800,
                  fontSize:15, color:C.textDim, cursor:'pointer' }}>
                Não, manter tudo
              </button>
              <button onClick={() => { onLogout('reset'); setConfirmLogout(null); }}
                style={{ flex:1, background:C.red, border:'none',
                  borderBottom:'4px solid rgba(0,0,0,.5)', borderRadius:14, padding:'13px',
                  fontFamily:F.display, fontWeight:900, fontSize:14, color:'#fff', cursor:'pointer' }}>
                Sim, apagar tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeScreen({ onModule, onSkip, progress, totalXp, mode, onToggleMode, streak, userProfile, onLeaderboard, onGloss, onProfile, isAdmin }) {
  const pct = id => {
    if(isAdmin) return 100; // Admin: all modules appear complete
    if(id===0) return Math.round((progress.m1||[]).length / M1_LESSONS.length * 100);
    if(id===1) return progress.m0 ? 100 : 0;
    if(id===2) return progress.m2 ? 100 : 0;
    if(id===3) return Math.round((progress.m3||[]).length / M3_LESSONS.length * 100);
    if(id===4) return Math.round((progress.m4||[]).length / MISSIONS.length * 100);
    if(id===5) return Math.round((progress.m5||[]).length / (M5_LESSONS.length + 1) * 100);
    if(id===6) return Math.round((progress.m6||[]).length / M6_PUZZLES.length * 100);
    return 0;
  };

  const doneMods   = MODULES_META.filter(m => pct(m.id) === 100);
  const inProgMods = MODULES_META.filter(m => pct(m.id) > 0 && pct(m.id) < 100);
  const todoMods   = MODULES_META.filter(m => pct(m.id) === 0);
  const totalPct   = Math.round(doneMods.length / MODULES_META.length * 100);
  const nextMod    = inProgMods[0] || todoMods[0];

  const Section = ({ label, emoji, children }) => (
    <>
      <div style={{ display:'flex', alignItems:'center', gap:8, margin:'20px 0 10px' }}>
        <span style={{ fontSize:15 }}>{emoji}</span>
        <span style={{ fontFamily:F.mono, color:C.accent, fontSize:10, letterSpacing:3, fontWeight:700 }}>
          {label.toUpperCase()}
        </span>
        <div style={{ flex:1, height:'0.5px', background:C.border }} />
      </div>
      {children}
    </>
  );

  const ModCard = ({ m }) => {
    const p = pct(m.id);
    const isDone   = p === 100;
    const isActive = p > 0 && p < 100;
    const borderColor = isActive ? C.accent : isDone ? m.color : C.borderBright;
    const shadowColor = isActive ? C.accent  : isDone ? m.color : C.border;
    return (
      <div onClick={() => onModule(m.id)}
        style={{
          background: C.surface,
          backgroundImage: 'repeating-linear-gradient(-45deg,rgba(255,255,255,.025) 0px,rgba(255,255,255,.025) 1px,transparent 1px,transparent 10px)',
          border: `2px solid ${borderColor}`,
          borderBottom: `5px solid ${shadowColor}`,
          borderRadius: 20, padding: '18px 18px',
          marginBottom: 12, display: 'flex',
          alignItems: 'center', gap: 16,
          cursor: 'pointer', opacity: isDone ? .8 : 1,
          transition: 'transform .1s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
      >
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: isActive ? C.accent+'18' : isDone ? m.color+'18' : C.surface2,
          border: `2px solid ${isActive ? C.accent+'40' : isDone ? m.color+'40' : C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        }}>
          {isDone ? '✅' : m.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: F.mono, fontSize: 10, letterSpacing: 2, marginBottom: 3,
            color: isActive ? C.accent : isDone ? m.color : C.textDim,
          }}>
            MÓDULO {m.id}{isDone ? ' · CONCLUÍDO' : isActive ? ' · EM PROGRESSO' : ''}
          </div>
          <div style={{
            fontFamily: F.display, color: C.text, fontSize: 18, fontWeight: 900,
            lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {m.title}
          </div>
          <div style={{
            fontFamily: F.mono, color: C.textDim, fontSize: 12, marginTop: 3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {m.sub.split(' · ').slice(0, 3).join(' · ')}
          </div>
          {isActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1, height: 7, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  width: `${p}%`, height: '100%', borderRadius: 99,
                  background: `linear-gradient(90deg,${C.accent},${C.cyan})`,
                  transition: 'width .5s',
                }} />
              </div>
              <span style={{ fontFamily: F.mono, color: C.accent, fontSize: 12, fontWeight: 700 }}>{p}%</span>
            </div>
          )}
        </div>

        {/* Right arrow */}
        <div style={{ flexShrink: 0, fontSize: 22, color: C.textDim }}>›</div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, display: 'flex', flexDirection: 'column' }}>

      {/* ── TOP BAR ──────────────────────────────────────────────── */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '12px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0,
      }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: C.accent+'18', border: `2px solid ${C.accent}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {userProfile?.avatar || '🛡'}
          </div>
          <div>
            <div style={{ fontFamily: F.display, color: C.text, fontSize: 16, fontWeight: 900, lineHeight: 1 }}>
              {userProfile?.name || 'SecOps Quest'}
            </div>
            <div style={{ fontFamily: F.mono, color: C.textDim, fontSize: 10, letterSpacing: 1, marginTop: 2 }}>
              {doneMods.length}/{MODULES_META.length} módulos
            </div>
          </div>
        </div>

        {/* Streak + DX */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: C.amber+'18', border: `1.5px solid ${C.amber}40`,
            borderRadius: 12, padding: '5px 12px',
          }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={{ fontFamily: F.display, color: C.amber, fontSize: 17, fontWeight: 900 }}>{streak}</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: C.purple+'18', border: `1.5px solid ${C.purple}40`,
            borderRadius: 12, padding: '5px 12px',
          }}>
            <span style={{ fontSize: 14 }}>⚡</span>
            <span style={{ fontFamily: F.display, color: C.purple, fontSize: 17, fontWeight: 900 }}>{totalXp}</span>
            <span style={{ fontFamily: F.mono, color: C.purple, fontSize: 10, fontWeight: 700 }}>DX</span>
          </div>
        </div>
      </div>

      {/* ── MAIN COLUMN ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 20 }}>

          {/* Hero */}
          <div style={{
            background: C.surface, border: `2px solid ${C.border}`,
            borderBottom: `5px solid ${C.border}`, borderRadius: 20,
            padding: '20px', marginBottom: 4, display: 'flex', gap: 16, alignItems: 'center',
          }}>
            <Logo size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.display, color: C.text, fontSize: 22, fontWeight: 900, lineHeight: 1.1, marginBottom: 4 }}>
                {totalXp === 0 ? 'SecOps Quest' : `Olá, ${userProfile?.name || 'Analista'}!`}
              </div>
              <div style={{ fontFamily: F.mono, color: C.accent, fontSize: 10, letterSpacing: 2 }}>
                {totalXp === 0
                  ? 'GOOGLE SECOPS · YARA-L · UDM · SOAR'
                  : `${doneMods.length} DE ${MODULES_META.length} MÓDULOS · ${totalXp} DX`}
              </div>
              {totalXp > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <div style={{ flex: 1, height: 8, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      width: `${totalPct}%`, height: '100%', borderRadius: 99,
                      background: `linear-gradient(90deg,${C.accent},${C.cyan})`,
                      transition: 'width .6s',
                    }} />
                  </div>
                  <span style={{ fontFamily: F.mono, color: C.accent, fontSize: 12, fontWeight: 700, minWidth: 32 }}>{totalPct}%</span>
                </div>
              )}
            </div>
            {nextMod && (
              <div onClick={() => onModule(nextMod.id)}
                style={{
                  flexShrink: 0, background: C.accent, color: '#fff',
                  border: 'none', borderBottom: '4px solid rgba(0,0,0,.35)',
                  borderRadius: 14, padding: '10px 18px', fontFamily: F.display,
                  fontWeight: 900, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {totalXp === 0 ? '▶ Começar' : '▶ Continuar'}
              </div>
            )}
          </div>

          {/* Module sections */}
          {doneMods.length > 0 && (
            <Section label="Concluídos" emoji="✅">
              {doneMods.map(m => <ModCard key={m.id} m={m} />)}
            </Section>
          )}
          {inProgMods.length > 0 && (
            <Section label="Em progresso" emoji="▶">
              {inProgMods.map(m => <ModCard key={m.id} m={m} />)}
            </Section>
          )}
          {todoMods.length > 0 && (
            <Section label="Próximos" emoji="🔒">
              {todoMods.map(m => <ModCard key={m.id} m={m} />)}
            </Section>
          )}
        </div>
      </div>

      {/* ── BOTTOM NAV ───────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.surface, borderTop: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-around', zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom,0px)',
      }}>
        {[
          { emoji:'🧠', label:'Aprender',  act: () => {} },
          { emoji:'📖', label:'Glossário',  act: () => onGloss && onGloss() },
          { emoji:'🎮', label:'Missões',    act: () => onModule(4) },
          { emoji:'🏆', label:'Ranking',    act: () => onLeaderboard() },
          { emoji:'👤', label:'Perfil',     act: () => onProfile && onProfile() },
        ].map(n => (
          <button key={n.label} onClick={n.act}
            style={{
              flex: 1, background: 'none', border: 'none', padding: '10px 0 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              cursor: 'pointer',
            }}>
            <span style={{ fontSize: 20 }}>{n.emoji}</span>
            <span style={{ fontFamily: F.mono, color: C.textDim, fontSize: 9, letterSpacing: .5 }}>
              {n.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}



// ── FIREBASE AUTH SCREEN ──────────────────────────────────────────────────────
function FirebaseAuthScreen({ onAuth }) {
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const errMsg = (code) => ({
    'auth/user-not-found'      : 'Email não encontrado.',
    'auth/wrong-password'      : 'Senha incorreta.',
    'auth/email-already-in-use': 'Email já cadastrado. Faça login.',
    'auth/weak-password'       : 'Senha precisa ter pelo menos 6 caracteres.',
    'auth/invalid-email'       : 'Email inválido.',
    'auth/network-request-failed': 'Sem conexão. Tente novamente.',
  }[code] || 'Erro inesperado. Tente novamente.');

  const handleEmail = async () => {
    if (!email.trim() || !pass.trim()) { setError('Preencha email e senha.'); return; }
    setLoading(true); setError('');
    try {
      let cred;
      if (mode === 'register') {
        cred = await FB.auth.createUserWithEmailAndPassword(email.trim(), pass);
      } else {
        cred = await FB.auth.signInWithEmailAndPassword(email.trim(), pass);
      }
      onAuth(cred.user);
    } catch(e) { setError(errMsg(e.code)); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const cred = await FB.auth.signInWithPopup(provider);
      onAuth(cred.user);
    } catch(e) { setError(errMsg(e.code)); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100dvh', background:C.bg, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:'32px 20px' }}>
      <Logo size={72} />
      <div style={{ fontFamily:F.display, color:C.text, fontSize:26, fontWeight:900, marginTop:16, marginBottom:4 }}>
        SecOps Quest
      </div>
      <div style={{ fontFamily:F.mono, color:C.accent, fontSize:10, letterSpacing:3, marginBottom:32 }}>
        GOOGLE SECOPS · YARA-L · UDM · SOAR
      </div>

      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Google Sign-In */}
        <button onClick={handleGoogle} disabled={loading}
          style={{ width:'100%', background:C.surface, border:`2px solid ${C.border}`,
            borderBottom:`4px solid ${C.border}`, borderRadius:14, padding:'14px 20px',
            display:'flex', alignItems:'center', justifyContent:'center', gap:12,
            cursor:loading?'not-allowed':'pointer', marginBottom:20, opacity:loading?.6:1 }}>
          <span style={{ fontSize:22 }}>🔵</span>
          <span style={{ fontFamily:F.display, color:C.text, fontSize:16, fontWeight:800 }}>
            Entrar com Google
          </span>
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:'0.5px', background:C.border }} />
          <span style={{ fontFamily:F.mono, color:C.textDim, fontSize:10, letterSpacing:2 }}>OU</span>
          <div style={{ flex:1, height:'0.5px', background:C.border }} />
        </div>

        {/* Email/Password */}
        <input value={email} onChange={e=>setEmail(e.target.value)}
          placeholder="email@empresa.com" type="email"
          style={{ width:'100%', background:C.surface, border:`1.5px solid ${C.border}`,
            borderRadius:12, padding:'13px 16px', fontFamily:F.mono, fontSize:14,
            color:C.text, outline:'none', marginBottom:10 }} />
        <input value={pass} onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&handleEmail()}
          placeholder="Senha (mín. 6 caracteres)" type="password"
          style={{ width:'100%', background:C.surface, border:`1.5px solid ${C.border}`,
            borderRadius:12, padding:'13px 16px', fontFamily:F.mono, fontSize:14,
            color:C.text, outline:'none', marginBottom:16 }} />

        {error && (
          <div style={{ background:'rgba(255,77,77,.12)', border:'1px solid rgba(255,77,77,.3)',
            borderRadius:10, padding:'10px 14px', fontFamily:F.mono, color:C.red,
            fontSize:12, marginBottom:14, textAlign:'center' }}>
            {error}
          </div>
        )}

        <button onClick={handleEmail} disabled={loading||!email||!pass}
          style={{ width:'100%', background:C.accent, border:'none',
            borderBottom:'4px solid rgba(0,0,0,.4)', borderRadius:14, padding:'14px',
            fontFamily:F.display, fontWeight:900, fontSize:16, color:'#fff',
            cursor:(loading||!email||!pass)?'not-allowed':'pointer',
            opacity:(loading||!email||!pass)?.5:1 }}>
          {loading ? '...' : mode==='login' ? '▶ Entrar' : '▶ Criar conta'}
        </button>

        <div style={{ textAlign:'center', marginTop:16 }}>
          <button onClick={()=>{setMode(m=>m==='login'?'register':'login');setError('');}}
            style={{ background:'none', border:'none', fontFamily:F.mono, color:C.accent,
              fontSize:12, cursor:'pointer', letterSpacing:1 }}>
            {mode==='login' ? 'Não tem conta? Criar agora' : 'Já tem conta? Fazer login'}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserSetupScreen({ onDone }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🛡");
  const [saving, setSaving] = useState(false);
  const valid = name.trim().length >= 2;

  const handleStart = async () => {
    if (!valid) return;
    setSaving(true);
    const userId = "u_" + Date.now() + "_" + Math.random().toString(36).slice(2,7);
    const profile = { userId, name: name.trim(), avatar, dx: 0, streak: 0, lastSeen: Date.now() };
    try {
      await window.storage.set(`lb:${userId}`, JSON.stringify(profile), true);
    } catch(e) {}
    onDone(profile);
  };

  return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>

      {/* Avatar big */}
      <Logo size={90} />
      <div style={{ fontFamily:F.display, color:C.text, fontSize:29, fontWeight:900, marginBottom:4 }}>Bem-vindo! 👋</div>
      <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:13, marginBottom:32, textAlign:"center" }}>Crie seu perfil para salvar o progresso e entrar no ranking</div>

      {/* Name input */}
      <div style={{ width:"100%", maxWidth:360, marginBottom:24 }}>
        <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, letterSpacing:2, marginBottom:8 }}>SEU NOME</div>
        <input
          value={name} onChange={e=>setName(e.target.value)} autoFocus
          placeholder="Ex: João Silva"
          maxLength={24}
          style={{ width:"100%", background:C.surface, border:`2px solid ${valid?C.cyan:C.border}`,
            borderBottom:`4px solid ${valid?C.cyan:C.cardDepth}`,
            borderRadius:16, padding:"16px 18px",
            fontFamily:F.display, fontSize:19, color:C.text,
            outline:"none", transition:"border .2s" }}
        />
      </div>

      {/* Avatar picker */}
      <div style={{ width:"100%", maxWidth:360, marginBottom:32 }}>
        <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, letterSpacing:2, marginBottom:10 }}>SEU AVATAR</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
          {AVATARS.map(a => (
            <button key={a} onClick={()=>setAvatar(a)}
              style={{ width:52, height:52, borderRadius:14, fontSize:29,
                background: avatar===a ? C.cyanDim : C.surface,
                border: `3px solid ${avatar===a ? C.cyan : C.border}`,
                borderBottom: `4px solid ${avatar===a ? C.cyan : C.cardDepth}`,
                boxShadow: avatar===a ? `0 0 0 3px ${C.cyan}33` : "none",
                cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all .12s" }}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width:"100%", maxWidth:360 }}>
        <Btn3D color={C.green} shadow={C.btn3d_green} disabled={!valid || saving}
          onClick={handleStart}>
          {saving ? "SALVANDO..." : "▶ ENTRAR NO JOGO"}
        </Btn3D>
      </div>
    </div>
  );
}

// ─── LEADERBOARD SCREEN ───────────────────────────────────────────────────────
function LeaderboardScreen({ onBack, currentUserId, totalXp, streak }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Try Firebase Firestore first
        if (typeof fbGetLeaderboard === 'function') {
          const fbEntries = await fbGetLeaderboard();
          if (fbEntries && fbEntries.length > 0) {
            setEntries(fbEntries.sort((a,b) => (b.dx||0) - (a.dx||0)));
            setLoading(false);
            return;
          }
        }
        // Fallback: window.storage (Claude artifact API)
        const res = await window.storage?.list("lb:", true);
        const keys = res?.keys || [];
        const players = await Promise.all(
          keys.map(async k => {
            try {
              const r = await window.storage.get(k, true);
              return r ? JSON.parse(r.value) : null;
            } catch { return null; }
          })
        );
        const valid = players
          .filter(Boolean)
          .sort((a,b) => (b.dx||0) - (a.dx||0));
        setEntries(valid);
      } catch(e) {
        setEntries([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const myRank = entries.findIndex(e => e.userId === currentUserId) + 1;
  const me = entries.find(e => e.userId === currentUserId);

  const medalColor = (rank) => {
    if (rank === 1) return "#FFD700";
    if (rank === 2) return "#C0C0C0";
    if (rank === 3) return "#CD7F32";
    return C.textDim;
  };

  const medalEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div style={{ minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.textDim, fontSize:29, cursor:"pointer", padding:"8px 10px", minWidth:44, minHeight:44 }}>‹</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, letterSpacing:2 }}>RANKING GLOBAL</div>
          <div style={{ fontFamily:F.display, color:C.text, fontSize:22, fontWeight:900 }}>🏆 Leaderboard</div>
        </div>
        <button onClick={() => { setEntries([]); setLoading(true); }}
          style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:10,
            color:C.textDim, fontSize:18, cursor:"pointer", padding:"8px 10px" }}>↺</button>
        {myRank > 0 && (
          <div style={{ background:C.purple+"22", border:`1px solid ${C.purple}44`, borderRadius:12, padding:"6px 12px", textAlign:"center" }}>
            <div style={{ fontFamily:F.display, color:C.purple, fontSize:21, fontWeight:900 }}>#{myRank}</div>
            <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, letterSpacing:1 }}>SUA POS.</div>
          </div>
        )}
      </div>

      {/* My card if not in top */}
      {me && myRank > 10 && (
        <div style={{ margin:"12px 18px 0", background:C.purple+"16", border:`2px solid ${C.purple}55`, borderBottom:`4px solid ${C.purple}`, borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ fontFamily:F.display, color:C.purple, fontSize:21, fontWeight:900, minWidth:36 }}>#{myRank}</div>
          <div style={{ fontSize:30 }}>{me.avatar}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, color:C.text, fontSize:16, fontWeight:800 }}>{me.name} <span style={{ color:C.purple, fontSize:14 }}>• você</span></div>
            <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:12 }}>⚡ {me.dx||0} DX · 🔥 {me.streak||0} dias</div>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px max(16px, calc((100% - 568px) / 2)) 40px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:60 }}>
            <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:15 }}>Carregando ranking…</div>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign:"center", padding:60 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🏆</div>
            <div style={{ fontFamily:F.display, color:C.text, fontSize:21, fontWeight:800, marginBottom:8 }}>Seja o primeiro!</div>
            <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:15 }}>Nenhum jogador ainda no ranking.</div>
          </div>
        ) : (
          entries.slice(0, 50).map((entry, idx) => {
            const rank = idx + 1;
            const isMe = entry.userId === currentUserId;
            return (
              <div key={entry.userId}
                style={{ background: isMe ? C.purple+"16" : rank <= 3 ? medalColor(rank)+"12" : C.surface,
                  border: `2px solid ${isMe ? C.purple+"66" : rank <= 3 ? medalColor(rank)+"55" : C.border}`,
                  borderBottom: `4px solid ${isMe ? C.purple : rank <= 3 ? medalColor(rank) : C.cardDepth}`,
                  borderRadius:16, padding:"14px 16px", marginBottom:10,
                  display:"flex", alignItems:"center", gap:14, transition:"all .15s" }}>
                {/* Rank */}
                <div style={{ fontFamily:F.display, fontSize: rank <= 3 ? 24 : 17,
                  fontWeight:900, color:medalColor(rank), minWidth:40, textAlign:"center" }}>
                  {medalEmoji(rank)}
                </div>
                {/* Avatar */}
                <div style={{ fontSize:28 }}>{entry.avatar}</div>
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:F.display, color:C.text, fontSize:19, fontWeight:800 }}>
                    {entry.name}
                    {isMe && <span style={{ fontFamily:F.mono, color:C.purple, fontSize:11, marginLeft:8, background:C.purple+"22", borderRadius:8, padding:"2px 8px" }}>você</span>}
                  </div>
                  <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:12, marginTop:2 }}>
                    🔥 {entry.streak||0} dias · {entry.lastSeen ? new Date(entry.lastSeen).toLocaleDateString("pt-BR") : ""}
                  </div>
                </div>
                {/* DX */}
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily:F.display, color: rank<=3 ? medalColor(rank) : C.amber, fontSize:22, fontWeight:900 }}>{(entry.dx||0).toLocaleString()}</div>
                  <div style={{ fontFamily:F.mono, color:C.textDim, fontSize:11, letterSpacing:1 }}>DX</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("home");
  // Admin mode: ?admin=secops2025 in URL — bypasses all locks
  const [isAdmin] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('admin') === 'secops2025';
    } catch { return false; }
  });
  const [skipMode, setSkipMode] = useState(false);
  const [mode] = useState("free");
  const [progress, setProgress] = useState({ m0:false,m1:[],m2:false,m3:[],m4:[],m5:[],m6:[] });
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [glossOpen, setGlossOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [userProfile, setUserProfile] = useState(null); // { userId, name, avatar }
  const [setupDone, setSetupDone] = useState(false);

  // Firebase Auth listener + Load data
  const [fbUser, setFbUser] = useState(null);
  const [showLoginScreen, setShowLoginScreen] = useState(false); // força tela de login após logout

  useEffect(()=>{
    // If Firebase is configured, listen to auth state
    if (FB) {
      const unsub = FB.auth.onAuthStateChanged(async (user) => {
        setFbUser(user);
        if (user) {
          // Load from Firestore
          const remote = await fbLoad(user.uid);
          if (remote) {
            if(remote.progress)    setProgress(remote.progress);
            if(remote.totalXp)     setTotalXp(remote.totalXp);
            if(remote.onboarded)   setOnboarded(true);
            if(remote.userProfile) { setUserProfile(remote.userProfile); setSetupDone(true); }
            const today     = new Date().toDateString();
            const yesterday = new Date(Date.now()-86400000).toDateString();
            if(remote.lastPlayed===today)          setStreak(remote.streak||1);
            else if(remote.lastPlayed===yesterday) setStreak((remote.streak||0)+1);
            else setStreak(1);
          }
        }
        setLoaded(true);
      });
      return unsub;
    }
    // Fallback: localStorage only
    try {
      const raw = localStorage.getItem('secops-quest');
      if(raw){
        const saved = JSON.parse(raw);
        if(saved.progress)    setProgress(saved.progress);
        if(saved.totalXp)     setTotalXp(saved.totalXp);
        if(saved.onboarded)   setOnboarded(true);
        if(saved.userProfile) { setUserProfile(saved.userProfile); setSetupDone(true); }
        const today     = new Date().toDateString();
        const yesterday = new Date(Date.now()-86400000).toDateString();
        if(saved.lastPlayed===today)          setStreak(saved.streak||1);
        else if(saved.lastPlayed===yesterday) setStreak((saved.streak||0)+1);
        else setStreak(1);
      } else setStreak(1);
    } catch(e){}
    setLoaded(true);
  },[]);

  // Persist: localStorage + Firestore
  useEffect(()=>{
    if(!loaded) return;
    const data = { progress, totalXp, streak, mode, onboarded, userProfile,
      lastPlayed: new Date().toDateString() };
    // Always save locally (offline support)
    try { localStorage.setItem('secops-quest', JSON.stringify(data)); } catch(e){}
    // Also save to Firestore if Firebase is configured and user is logged in
    if (FB && fbUser) {
      fbSave(fbUser.uid, data);
    }
  },[progress,totalXp,streak,mode,loaded,onboarded,userProfile,fbUser]);

  // Sync DX to leaderboard (Firestore + Artifact storage fallback)
  useEffect(()=>{
    if(!loaded || !userProfile) return;
    const entry = { ...userProfile, dx: totalXp, streak, lastSeen: Date.now() };
    // Firebase leaderboard
    if (FB && fbUser) {
      fbLeaderboard(fbUser.uid, { name:userProfile.name, avatar:userProfile.avatar,
        dx:totalXp, streak, userId:userProfile.userId });
    }
    // Artifact storage fallback
    try {
      window.storage.set(`lb:${userProfile.userId}`, JSON.stringify(entry), true);
    } catch(e){}
  },[totalXp, streak, loaded, userProfile, fbUser]);

  // Logout modes: 'logout' = just go back to setup, 'reset' = clear everything
  const handleLogout = (type) => {
    // Both modes clear ALL in-memory state and localStorage.
    // Reason: single localStorage key — new user must start completely fresh.
    // Difference: 'reset' has 2-step confirmation in UI; 'logout' has 1-step.
    try { localStorage.removeItem('secops-quest'); } catch(e) {}
    if (FB) { try { FB.auth.signOut(); } catch(e) {} }
    setFbUser(null);
    setProgress({ m0:false, m1:[], m2:false, m3:[], m4:[], m5:[], m6:[] });
    setTotalXp(0);
    setStreak(1);
    setOnboarded(false);
    setUserProfile(null);
    setSetupDone(false);
    setScreen("home");
    if (FB) setShowLoginScreen(true); // força FirebaseAuthScreen se Firebase ativo
  };

  const completeM0=()=>{setProgress(p=>({...p,m0:true}));setTotalXp(x=>x+100);};
  const completeM1=(id)=>{if(!(progress.m1||[]).includes(id)){setProgress(p=>({...p,m1:[...new Set([...p.m1,id])]}));setTotalXp(x=>x+50);}};
  const completeM2=()=>{setProgress(p=>({...p,m2:true}));setTotalXp(x=>x+150);};
  const completeM3=(id)=>{if(!(progress.m3||[]).includes(id)){setProgress(p=>({...p,m3:[...new Set([...p.m3,id])]}));setTotalXp(x=>x+50);}};
  const completeM4=(id)=>setProgress(p=>({...p,m4:[...new Set([...p.m4,id])]}));
  const completeM5=(id)=>{if(!(progress.m5||[]).includes(id)){setProgress(p=>({...p,m5:[...new Set([...(p.m5||[]),id])]}));setTotalXp(x=>x+(id==="final"?300:75));}};
  const completeM6=(id)=>{setProgress(p=>({...p,m6:[...new Set([...(p.m6||[]),id])]}));setTotalXp(x=>x+(M6_PUZZLES.find(p=>p.id===id)?.xp||0));};
  const addXp=(n)=>setTotalXp(x=>x+n);
  const goModule=(id)=>{setSkipMode(false);setScreen(`m${id}`);};
  const goSkip=(id)=>{setSkipMode(true);setScreen(`m${id}`);};
  const goHome=()=>{setSkipMode(false);setScreen("home");};
  const toggleMode=()=>{};

  const handleOnboardingDone = (mod) => {
    setOnboarded(true);
    setScreen(`m${mod}`);
  };

  const handleSetupDone = async (profile) => {
    setUserProfile(profile);
    setSetupDone(true);
    setOnboarded(true);
    setScreen("home");
    // Explicitly save profile to Firestore immediately (don't rely on useEffect timing)
    if (FB && fbUser) {
      try {
        await fbSave(fbUser.uid, {
          userProfile: profile,
          progress, totalXp, streak, mode,
          onboarded: true,
          lastPlayed: new Date().toDateString()
        });
      } catch(e) { console.warn('handleSetupDone fbSave failed:', e.message); }
    }
    // Always save to localStorage as backup
    try {
      localStorage.setItem('secops-quest', JSON.stringify({
        userProfile: profile, progress, totalXp, streak, mode,
        onboarded: true, lastPlayed: new Date().toDateString()
      }));
    } catch(e) {}
  };

  const STYLE = `@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Nunito:wght@700;800;900&display=swap');*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0;}body{background:#07080f;}@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`;

  if(!loaded) return null;


  // 2. User setup (after onboarding, before home)
  // 1.5. Firebase Auth gate (only when Firebase is configured)
  if(loaded && (showLoginScreen || (FB && !fbUser))) return (
    <><style>{STYLE}</style>
      <FirebaseAuthScreen onAuth={async (user) => {
        setFbUser(user);
        setShowLoginScreen(false); // limpa flag de logout
        try {
          const data = await fbLoad(user.uid);
          if (data) {
            if(data.userProfile) { setUserProfile(data.userProfile); setSetupDone(true); }
            if(data.progress)    setProgress(data.progress);
            if(data.totalXp)     setTotalXp(data.totalXp);
            if(data.streak)      setStreak(data.streak);
            if(data.onboarded)   setOnboarded(true);
          }
        } catch(e) { console.warn('onAuth fbLoad failed:', e.message); }
      }} />
    </>
  );

  if(!setupDone) return (
    <><style>{STYLE}</style>
      <UserSetupScreen onDone={handleSetupDone} />
    </>
  );

  // 3. Main app
  return (
    <>
      <style>{STYLE}</style>

      {screen==="home"&&<HomeScreen
        onModule={goModule} onSkip={goSkip} progress={progress}
        totalXp={totalXp} mode={mode} onToggleMode={toggleMode}
        streak={streak} userProfile={userProfile}
        isAdmin={isAdmin}
        onLeaderboard={()=>setScreen("leaderboard")}
        onGloss={()=>setGlossOpen(true)}
        onProfile={()=>setScreen("profile")} />}

      {screen==="leaderboard"&&<LeaderboardScreen
        onBack={goHome}
        currentUserId={userProfile?.userId}
        totalXp={totalXp} streak={streak} />}
      {screen==="profile"&&<ProfileScreen
        userProfile={userProfile}
        totalXp={totalXp} streak={streak}
        progress={progress}
        onBack={goHome}
        onLogout={handleLogout}
        isAdmin={isAdmin} />}

      {screen==="m0"&&<Module1Screen onBack={goHome} onComplete={completeM1} completed={progress.m1} skipMode={skipMode} />}
      {screen==="m1"&&<Module0Screen onBack={goHome} onComplete={completeM0} completed={progress.m0} skipMode={skipMode} />}
      {screen==="m2"&&<Module2Screen onBack={goHome} onComplete={completeM2} completed={progress.m2} skipMode={skipMode} />}
      {screen==="m3"&&<Module3Screen onBack={goHome} onComplete={completeM3} completed={progress.m3} skipMode={skipMode} />}
      {screen==="m4"&&<Module4Screen onBack={goHome} onComplete={completeM4} completed={progress.m4} addXp={addXp} mode={mode} />}
      {screen==="m5"&&<Module5Screen onBack={goHome} onComplete={completeM5} completed={progress.m5} mode={mode} skipMode={skipMode} />}
      {screen==="m6"&&<Module6Screen onBack={goHome} onComplete={completeM6} completed={progress.m6||[]} mode={mode} />}

      {isAdmin && screen === "home" && (
        <div style={{ position:"fixed", top:8, right:16, zIndex:600,
          background:"#ff1a75", color:"#fff", fontFamily:"monospace",
          fontSize:10, fontWeight:700, letterSpacing:2,
          borderRadius:20, padding:"4px 10px", border:"2px solid #fff" }}>
          👑 ADMIN
        </div>
      )}
      {!glossOpen&&screen!=="leaderboard"&&(
        <button onClick={()=>setGlossOpen(true)}
          style={{ position:"fixed",top:"auto",bottom:96,right:16,zIndex:500,background:C.surface,
            border:`1px solid ${C.borderBright}`,borderRadius:12,padding:"6px 12px",
            display:"flex",alignItems:"center",gap:6,cursor:"pointer",
            boxShadow:"0 2px 12px rgba(0,0,0,0.4)",fontFamily:F.mono,color:C.textDim,
            fontSize:11,letterSpacing:1 }}>
          📖 <span>GLOSSÁRIO</span>
        </button>
      )}
      {glossOpen&&<GlossarioModal onClose={()=>setGlossOpen(false)} />}
    </>
  );
}
