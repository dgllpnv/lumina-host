import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { publicSiteService, PublicSiteData, PublicRoom } from "@/services";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:3003/api").replace(/\/api\/?$/, "");
const assetUrl = (path: string) => (path.startsWith("http") ? path : `${API_ORIGIN}${path}`);

const paymentLabels: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão de crédito/débito",
  dinheiro: "Dinheiro",
  transferencia: "Transferência bancária",
};

function nightsBetween(checkin: string, checkout: string) {
  if (!checkin || !checkout) return 0;
  const n = Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000);
  return n > 0 ? n : 0;
}

export default function SiteReserva() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [site, setSite] = useState<PublicSiteData | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "not_found" | "inactive">("loading");

  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [checkinDate, setCheckinDate] = useState("");
  const [checkoutDate, setCheckoutDate] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [formState, setFormState] = useState<"idle" | "checking" | "submitting" | "success" | "unavailable" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!orgSlug) return;
    publicSiteService
      .getSite(orgSlug)
      .then((data) => {
        setSite(data);
        setLoadState("ready");
        if (data.rooms.length > 0) setSelectedRoomId(data.rooms[0].id);
      })
      .catch((err) => setLoadState(err?.response?.status === 503 ? "inactive" : "not_found"));
  }, [orgSlug]);

  const selectedRoom: PublicRoom | undefined = useMemo(
    () => site?.rooms.find((r) => r.id === selectedRoomId),
    [site, selectedRoomId]
  );
  const nights = nightsBetween(checkinDate, checkoutDate);

  const gastronomia = site?.tips.filter((t) => t.tipo === "gastronomia") ?? [];
  const localTips = site?.tips.filter((t) => t.tipo === "passeio" || t.tipo === "transfer") ?? [];

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgSlug || !selectedRoom || !checkinDate || !checkoutDate || !guestName || !guestEmail) return;
    setErrorMessage("");
    setFormState("checking");
    try {
      const availability = await publicSiteService.getAvailability(orgSlug, selectedRoom.id, checkinDate, checkoutDate);
      if (!availability.available) {
        setFormState("unavailable");
        return;
      }
      setFormState("submitting");
      await publicSiteService.createReservation(orgSlug, {
        roomId: selectedRoom.id,
        guestName,
        guestEmail,
        guestPhone: guestPhone || undefined,
        checkinDate,
        checkoutDate,
      });
      setFormState("success");
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || "Não foi possível concluir a reserva. Tente novamente.");
      setFormState("error");
    }
  };

  if (loadState === "loading") return <div className="am-loading">Carregando...</div>;
  if (loadState === "not_found") return <div className="am-loading">Site não encontrado.</div>;
  if (loadState === "inactive" || !site) return <div className="am-loading">Site temporariamente indisponível.</div>;

  const heroPhoto = site.rooms[0]?.content?.fotos?.[0];
  const sobrePhoto = gastronomia[0]?.fotos?.[0] || heroPhoto;
  const vilaPhoto = site.rooms[1]?.content?.fotos?.[0] || heroPhoto;

  return (
    <div className="am-root">
      <style>{`
        /* ── tokens ported verbatim from the Claude Design site (Organic retuned to the Algas Marinhas crest) ── */
        .am-loading{min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;color:#0b1c3a}
        .am-root{
          --color-bg:#f5ead8; --color-surface:#ebddc5; --color-text:#201e1d;
          --color-divider: rgba(32,30,29,0.16);
          --color-neutral-700:#645c50; --color-neutral-800:#474238; --color-neutral-900:#2e2b25;
          --color-accent:#1f5d47; --color-accent-100:#e8f2ec; --color-accent-200:#cfe3d6; --color-accent-600:#1a4f3c; --color-accent-700:#14402f; --color-accent-800:#0e2c21;
          --color-accent-2:#143a72; --color-accent-2-100:#e8eef8; --color-accent-2-200:#cfdcf0; --color-accent-2-300:#a7bfe0; --color-accent-2-700:#143a72; --color-accent-2-800:#0d2650;
          --color-gold-100:#faf0d8; --color-gold-300:#e6c987; --color-gold-400:#d4ac52; --color-gold-500:#b8862b; --color-gold-700:#8a621d;
          --color-ink:#0b1c3a;
          --font-heading:"Marcellus",Georgia,serif; --font-body:"Figtree",-apple-system,sans-serif;
          --radius-lg: 32px;
          --shadow-sm: 0 1px 2px rgba(46,43,37,0.14);
          --shadow-md: 0 3px 10px rgba(46,43,37,0.16);
          --shadow-lg: 0 12px 32px rgba(46,43,37,0.22);
          background:var(--color-bg); color:var(--color-text); font-family:var(--font-body);
          overflow-x:hidden; font-size:15px; line-height:1.55;
        }
        .am-root h1,.am-root h2,.am-root h3,.am-root h4{ font-family:var(--font-heading); font-weight:400; line-height:1.12; letter-spacing:-0.015em; margin:0; }
        .am-root a{ color:var(--color-accent-700); text-decoration:none; }
        .am-root a:hover{ color:var(--color-accent); }
        .am-kicker{ display:flex; align-items:center; gap:10px; margin-bottom:18px; }
        .am-kicker .ln{ width:34px; height:1px; background:var(--color-gold-400); }
        .am-kicker .dot{ width:6px; height:6px; background:var(--color-gold-500); transform:rotate(45deg); }
        .am-kicker span.lbl{ font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:var(--color-gold-700); }
        .am-kicker.on-ink .lbl{ color:var(--color-gold-300); }
        .am-btn{ display:inline-flex; align-items:center; gap:10px; padding:16px 32px; border-radius:999px; font-family:var(--font-heading); font-size:17px; letter-spacing:0.02em; }
        .am-btn-gold{ background:var(--color-gold-400); color:var(--color-ink); box-shadow:var(--shadow-md); }
        .am-btn-gold:hover{ background:var(--color-gold-300); color:var(--color-ink); }
        .am-btn-outline{ border:1px solid rgba(253,248,238,.42); color:#fdf8ee; }
        .am-btn-outline:hover{ background:rgba(253,248,238,.12); color:#fdf8ee; }
        .am-section{ max-width:1240px; margin:0 auto; padding:96px 40px; }
        @keyframes riseIn{ from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }

        .am-header{ position:sticky; top:0; z-index:30; display:flex; flex-wrap:wrap; align-items:center; gap:26px; max-width:1240px; margin:0 auto; padding:20px 40px; background:var(--color-bg); }
        .am-nav a{ font-size:14px; color:var(--color-neutral-800); margin-left:26px; }
        .am-nav a:hover{ color:var(--color-accent); }

        .am-hero-card{ position:relative; border-radius:var(--radius-lg); overflow:hidden; height:min(80vh,700px); min-height:520px; background:var(--color-ink) center/cover; color:#f2ece1; animation:riseIn .8s cubic-bezier(.22,1,.36,1) both; }
        .am-hero-overlay{ position:absolute; inset:0; display:flex; align-items:center; }
        .am-hero-box{ margin:0 clamp(18px,3.4vw,44px); max-width:700px; padding:clamp(28px,3.4vw,50px); border-radius:var(--radius-lg); background:linear-gradient(155deg,rgba(11,28,58,.93) 0%,rgba(11,28,58,.8) 100%); backdrop-filter:blur(4px); }
        .am-hero-box h1{ font-size:clamp(40px,5.6vw,74px); line-height:1.06; color:#fdf8ee; margin:0 0 24px; }
        .am-hero-box p{ font-size:clamp(16px,1.4vw,19px); line-height:1.6; color:#e3ebf6; margin:0 0 34px; max-width:54ch; }
        .am-badges{ display:flex; flex-wrap:wrap; align-items:center; gap:14px; padding:22px 4px 0; }
        .am-badge{ display:flex; align-items:center; gap:12px; padding:10px 20px 10px 12px; border-radius:999px; background:var(--color-surface); font-size:13.5px; }
        .am-badge.accent{ background:var(--color-accent-100); color:var(--color-accent-700); }
        .am-badge.gold{ background:var(--color-gold-100); color:var(--color-gold-700); }
        .am-score{ display:grid; place-items:center; width:38px; height:38px; border-radius:999px; background:var(--color-accent-2); color:#fff; font-family:var(--font-heading); font-size:15px; }

        .am-grid-2{ display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr)); gap:64px; align-items:center; }
        .am-sobre-photo{ border-radius:var(--radius-lg); overflow:hidden; height:clamp(380px,44vw,560px); background:var(--color-surface); box-shadow:var(--shadow-md); }
        .am-sobre-photo img{ width:100%; height:100%; object-fit:cover; }
        .am-quote{ margin:0; padding:24px 28px; border-radius:var(--radius-lg); background:var(--color-gold-100); }
        .am-quote p{ font-family:var(--font-heading); font-size:21px; line-height:1.35; color:var(--color-neutral-900); margin:0; }
        .am-selos{ display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-top:56px; }
        .am-selo{ display:flex; align-items:center; gap:14px; padding:20px 24px; border-radius:999px; background:var(--color-surface); font-size:14px; color:var(--color-neutral-800); }

        .am-quartos-wrap{ background:var(--color-surface); padding:96px 0; }
        .am-quartos-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(270px,1fr)); gap:20px; }
        .am-room-card{ display:flex; flex-direction:column; border-radius:var(--radius-lg); overflow:hidden; background:var(--color-bg); color:inherit; box-shadow:var(--shadow-sm); cursor:pointer; text-align:left; border:none; font:inherit; }
        .am-room-card:hover{ box-shadow:var(--shadow-lg); }
        .am-room-card .photo{ height:200px; background:var(--color-surface); }
        .am-room-card .photo img{ width:100%; height:100%; object-fit:cover; }
        .am-room-card .body{ display:flex; flex-direction:column; gap:10px; flex:1; padding:26px; }
        .am-room-card .cap{ font-size:10.5px; letter-spacing:0.16em; text-transform:uppercase; color:var(--color-gold-700); }
        .am-room-card h3{ font-size:25px; line-height:1.15; }
        .am-room-card p{ font-size:15px; line-height:1.6; color:var(--color-neutral-800); margin:0; flex:1; }
        .am-room-card .cta{ display:inline-flex; align-items:center; gap:8px; font-size:14px; color:var(--color-accent-700); margin-top:4px; font-family:var(--font-heading); }

        .am-gastro-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:24px; }
        .am-gastro-card{ display:flex; flex-direction:column; border-radius:var(--radius-lg); overflow:hidden; background:var(--color-surface); }
        .am-gastro-card .photo{ height:clamp(240px,26vw,320px); background:var(--color-accent-100); }
        .am-gastro-card .photo img{ width:100%; height:100%; object-fit:cover; }
        .am-gastro-card .body{ display:flex; flex-direction:column; gap:14px; padding:32px; }
        .am-gastro-card h3{ font-size:29px; line-height:1.15; }
        .am-gastro-card p{ font-size:16px; line-height:1.65; color:var(--color-neutral-800); margin:0; }

        .am-ink{ background:var(--color-ink); color:#f2ece1; position:relative; overflow:hidden; }
        .am-ink-blob{ position:absolute; width:520px; height:520px; border-radius:999px; background:var(--color-accent-2-800,#0d2650); }
        .am-local-item{ display:flex; gap:18px; padding:20px 0; border-top:1px solid var(--color-accent-2-800,#0d2650); }
        .am-local-item .t{ font-family:var(--font-heading); font-size:21px; color:#fdf8ee; }
        .am-local-item .d{ font-size:14.5px; color:var(--color-accent-2-300); margin-top:4px; }
        .am-local-photo{ border-radius:var(--radius-lg); overflow:hidden; height:clamp(380px,46vw,580px); background:var(--color-accent-2-800,#0d2650); box-shadow:var(--shadow-lg); }
        .am-local-photo img{ width:100%; height:100%; object-fit:cover; }

        .am-score-panel{ display:flex; align-items:center; gap:24px; padding:26px 30px; border-radius:var(--radius-lg); background:var(--color-ink); color:#f2ece1; margin-bottom:22px; }
        .am-score-panel .n{ font-family:var(--font-heading); font-size:54px; line-height:1; color:var(--color-gold-300); }
        .am-bar-row{ display:flex; justify-content:space-between; align-items:baseline; margin-bottom:7px; font-size:14.5px; color:var(--color-neutral-800); }
        .am-bar-row b{ font-family:var(--font-heading); font-size:19px; color:var(--color-accent); font-weight:400; }
        .am-bar{ height:6px; border-radius:999px; background:var(--color-accent-200); }
        .am-bar-fill{ height:100%; border-radius:999px; background:var(--color-accent); }
        .am-quotes-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:16px; }
        .am-quotes-grid blockquote{ margin:0; padding:26px; border-radius:var(--radius-lg); background:var(--color-gold-100); }
        .am-quotes-grid blockquote p{ font-family:var(--font-heading); font-size:19px; line-height:1.4; color:var(--color-neutral-900); margin:0; }

        .am-form-section{ background:var(--color-bg); }
        .am-form{ max-width:640px; margin:0 auto; display:flex; flex-direction:column; gap:16px; padding:40px; border-radius:var(--radius-lg); background:var(--color-surface); box-shadow:var(--shadow-md); }
        .am-form label{ display:block; font-size:12px; margin-bottom:5px; color:rgba(32,30,29,0.7); }
        .am-form input,.am-form select{ width:100%; min-height:40px; padding:8px 14px; font:inherit; font-size:14px; color:var(--color-text); background:var(--color-bg); border:1px solid var(--color-divider); border-radius:999px; }
        .am-form-row{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .am-total{ font-family:var(--font-heading); font-size:19px; text-align:right; color:var(--color-accent-700); }
        .am-submit{ background:var(--color-accent); color:#fff; border:none; padding:14px 28px; border-radius:999px; font-family:var(--font-heading); font-size:17px; cursor:pointer; }
        .am-submit:hover{ background:var(--color-accent-600); }
        .am-submit:disabled{ opacity:.5; cursor:not-allowed; }
        .am-msg{ padding:16px 20px; border-radius:var(--radius-lg); font-size:14px; }
        .am-msg.ok{ background:var(--color-accent-100); color:var(--color-accent-800); }
        .am-msg.warn{ background:var(--color-gold-100); color:var(--color-gold-700); }
        .am-msg.err{ background:#fbe4e1; color:#a13d2e; }
        .am-pay{ display:flex; gap:10px; flex-wrap:wrap; }
        .am-pay span{ background:var(--color-bg); border:1px solid var(--color-divider); border-radius:999px; padding:6px 16px; font-size:13px; }

        .am-final-cta{ padding:100px 0; }
        .am-final-cta h2{ font-size:clamp(34px,4.4vw,58px); line-height:1.06; color:#fdf8ee; }
        .am-final-cta p{ font-size:18px; line-height:1.65; color:var(--color-accent-2-300); max-width:46ch; }

        .am-footer{ background:var(--color-bg); padding:60px 0 44px; }
        .am-footer-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:40px; padding-bottom:36px; border-bottom:1px solid var(--color-divider); }
        .am-footer-label{ font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:var(--color-gold-700); margin-bottom:14px; }
        .am-footer p{ font-size:14px; line-height:1.7; color:var(--color-neutral-800); margin:0; }
        .am-footer-bottom{ display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; padding-top:26px; }
        @media (max-width:720px){ .am-nav{ display:none; } .am-form-row{ grid-template-columns:1fr; } }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Marcellus&family=Figtree:wght@400;600;700&display=swap"
        rel="stylesheet"
      />

      {/* ── header ── */}
      <header className="am-header">
        <a href="#topo" style={{ display: "flex", alignItems: "center", gap: 12, marginRight: "auto", color: "inherit" }}>
          {site.organization.logoUrl && (
            <img src={assetUrl(site.organization.logoUrl)} alt="" style={{ width: 44, height: 44, borderRadius: 999, objectFit: "cover" }} />
          )}
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>{site.organization.nome}</span>
            <span style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-gold-700)" }}>
              Praia do Forte · Bahia
            </span>
          </span>
        </a>
        <nav className="am-nav">
          <a onClick={() => scrollTo("sobre")}>Sobre</a>
          <a onClick={() => scrollTo("quartos")}>Quartos</a>
          <a onClick={() => scrollTo("gastronomia")}>Gastronomia</a>
          <a onClick={() => scrollTo("localizacao")}>Localização</a>
        </nav>
        <button className="am-btn" style={{ background: "var(--color-accent)", color: "var(--color-bg)", border: "none", cursor: "pointer" }} onClick={() => scrollTo("reservar")}>
          Reservar agora
        </button>
      </header>

      {/* ── hero ── */}
      <section id="topo" className="am-section" style={{ paddingTop: 8 }}>
        <div className="am-hero-card" style={heroPhoto ? { backgroundImage: `url(${assetUrl(heroPhoto)})` } : undefined}>
          <div className="am-hero-overlay">
            <div className="am-hero-box">
              <div className="am-kicker on-ink"><span className="ln" /><span className="dot" /><span className="lbl">Tranquilidade e liberdade</span></div>
              <h1>A dois passos do mar,<br />no coração da Vila.</h1>
              <p>No Beco Dona Nita, 22 — virando a esquina do Projeto Tamar e da Praça dos Artistas. A Praia do Porto, os restaurantes e o mercado da vila ficam todos a pé.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <button className="am-btn am-btn-gold" style={{ border: "none", cursor: "pointer" }} onClick={() => scrollTo("reservar")}>Reservar agora →</button>
                <button className="am-btn am-btn-outline" style={{ background: "transparent", border: "1px solid rgba(253,248,238,.42)", cursor: "pointer" }} onClick={() => scrollTo("quartos")}>Ver os quartos</button>
              </div>
            </div>
          </div>
        </div>
        <div className="am-badges">
          <div className="am-badge"><span className="am-score">8,0</span><span><strong style={{ color: "var(--color-neutral-900)" }}>Muito bom</strong> · 834 avaliações no Booking.com</span></div>
          <div className="am-badge accent">Localização 9,5/10</div>
          <div className="am-badge gold">Casais 9,4/10</div>
        </div>
      </section>

      {/* ── sobre ── */}
      <section id="sobre" className="am-section">
        <div className="am-grid-2">
          <div>
            <div className="am-kicker"><span className="ln" /><span className="dot" /><span className="lbl">A casa</span></div>
            <h2 style={{ fontSize: "clamp(32px,3.8vw,50px)", marginBottom: 24 }}>Uma pousada onde a dona recebe você pessoalmente.</h2>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "var(--color-neutral-800)", marginBottom: 18 }}>
              A hospitalidade pessoal da proprietária é a marca registrada da {site.organization.nome} — e é o que mais aparece nas
              avaliações de quem se hospeda. Em 834 opiniões no Booking.com, a mesma frase se repete: a sensação de estar em casa.
            </p>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "var(--color-neutral-800)", marginBottom: 30 }}>
              A pousada fica dentro da Vila de Praia do Forte, no litoral norte da Bahia, onde as ruas de pedra levam a pé até a praia,
              os restaurantes e o santuário das tartarugas.
            </p>
            <blockquote className="am-quote">
              <p>"a dona da pousada muito simpática e nos fez sentir em casa"</p>
              <p style={{ fontSize: 12.5, color: "var(--color-gold-700)", marginTop: 12, fontFamily: "var(--font-body)" }}>Avaliação no Booking.com</p>
            </blockquote>
          </div>
          <div className="am-sobre-photo">{sobrePhoto && <img src={assetUrl(sobrePhoto)} alt="" />}</div>
        </div>
        <div className="am-selos">
          <div className="am-selo">Pets bem-vindos, sem custo adicional</div>
          <div className="am-selo">Check-in das 14h às 22h</div>
          <div className="am-selo">Check-out até as 12h</div>
          <div className="am-selo">WiFi avaliado 8,7/10</div>
        </div>
      </section>

      {/* ── quartos ── */}
      <section id="quartos" className="am-quartos-wrap">
        <div className="am-section" style={{ padding: "0 40px" }}>
          <div style={{ maxWidth: "60ch", marginBottom: 52 }}>
            <div className="am-kicker"><span className="ln" /><span className="dot" /><span className="lbl">Acomodações</span></div>
            <h2 style={{ fontSize: "clamp(32px,3.8vw,50px)", marginBottom: 20 }}>Quatro tipos de quarto.</h2>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "var(--color-neutral-800)" }}>
              Para o casal em viagem a dois ou para a família inteira. Escolha o quarto e reserve direto com a gente.
            </p>
          </div>
          <div className="am-quartos-grid">
            {site.rooms.map((room) => {
              const foto = room.content?.fotos?.[0];
              return (
                <button
                  key={room.id}
                  className="am-room-card"
                  onClick={() => {
                    setSelectedRoomId(room.id);
                    scrollTo("reservar");
                  }}
                >
                  <div className="photo">{foto && <img src={assetUrl(foto)} alt={room.nome} />}</div>
                  <div className="body">
                    <span className="cap">Até {room.capacidade} hóspedes</span>
                    <h3>{room.nome}</h3>
                    <p>{room.content?.descricaoLonga || room.descricao}</p>
                    <span className="cta">Reservar este quarto →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── gastronomia ── */}
      {gastronomia.length > 0 && (
        <section id="gastronomia" className="am-section">
          <div style={{ maxWidth: "60ch", marginBottom: 52 }}>
            <div className="am-kicker"><span className="ln" /><span className="dot" /><span className="lbl">Onde comer</span></div>
            <h2 style={{ fontSize: "clamp(32px,3.8vw,50px)", marginBottom: 20 }}>Café da manhã em buffet e cozinha italiana ao lado.</h2>
          </div>
          <div className="am-gastro-grid">
            {gastronomia.map((tip) => (
              <div className="am-gastro-card" key={tip.id}>
                <div className="photo">{tip.fotos?.[0] && <img src={assetUrl(tip.fotos[0])} alt={tip.titulo} />}</div>
                <div className="body">
                  <h3>{tip.titulo}</h3>
                  <p>{tip.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── localização ── */}
      <section id="localizacao" className="am-ink am-section">
        <div className="am-ink-blob" style={{ right: -160, top: -140 }} />
        <div className="am-grid-2" style={{ position: "relative" }}>
          <div>
            <div className="am-kicker on-ink"><span className="ln" /><span className="dot" /><span className="lbl">A pé</span></div>
            <h2 style={{ fontSize: "clamp(32px,3.8vw,50px)", marginBottom: 24, color: "#fdf8ee" }}>Tudo acontece na esquina.</h2>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "var(--color-accent-2-300)", marginBottom: 34, maxWidth: "48ch" }}>
              A {site.organization.nome} fica no Beco Dona Nita, 22, dentro da Vila de Praia do Forte. Daqui, você não precisa de carro.
            </p>
            <div>
              {(localTips.length > 0
                ? localTips
                : [
                    { id: "a", titulo: "Praia do Porto", descricao: "A poucos passos da pousada — piscinas naturais na maré baixa." },
                    { id: "b", titulo: "Projeto Tamar", descricao: "Virando a esquina: o santuário de tartarugas marinhas." },
                    { id: "c", titulo: "Praça dos Artistas", descricao: "Ao lado, no centro da vila." },
                  ]
              ).map((t) => (
                <div className="am-local-item" key={t.id}>
                  <div><div className="t">{t.titulo}</div><div className="d">{t.descricao}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="am-local-photo">{vilaPhoto && <img src={assetUrl(vilaPhoto)} alt="" />}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, fontSize: 14, color: "var(--color-accent-2-300)" }}>
              Beco Dona Nita, 22 · Vila de Praia do Forte · Bahia
            </div>
          </div>
        </div>
      </section>

      {/* ── avaliações ── */}
      <section className="am-section">
        <div className="am-grid-2" style={{ alignItems: "start" }}>
          <div>
            <div className="am-kicker"><span className="ln" /><span className="dot" /><span className="lbl">Avaliações</span></div>
            <h2 style={{ fontSize: "clamp(32px,3.8vw,50px)", marginBottom: 24 }}>O que dizem os hóspedes.</h2>
            <div className="am-score-panel">
              <div className="n">8,0</div>
              <div style={{ width: 1, height: 54, background: "var(--color-accent-2-700)" }} />
              <div><div style={{ fontFamily: "var(--font-heading)", fontSize: 21 }}>Muito bom</div><div style={{ fontSize: 13.5, color: "var(--color-accent-2-300)", marginTop: 4 }}>834 avaliações no Booking.com</div></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[["Localização", "9,5", 95], ["Casais", "9,4", 94]].map(([label, val, pct]) => (
                <div key={label as string}>
                  <div className="am-bar-row"><span>{label}</span><b>{val}</b></div>
                  <div className="am-bar"><div className="am-bar-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="am-quotes-grid">
            <blockquote><p>"a dona da pousada muito simpática e nos fez sentir em casa"</p></blockquote>
            <blockquote><p>"café da manhã completíssimo"</p></blockquote>
            <blockquote><p>"localização muito privilegiada"</p></blockquote>
            <blockquote><p>"nos sentimos em casa"</p></blockquote>
          </div>
        </div>
      </section>

      {/* ── reserva ── */}
      <section id="reservar" className="am-section am-form-section">
        <div style={{ maxWidth: "60ch", margin: "0 auto 40px", textAlign: "center" }}>
          <div className="am-kicker" style={{ justifyContent: "center" }}><span className="ln" /><span className="dot" /><span className="lbl">Reserva direta</span></div>
          <h2 style={{ fontSize: "clamp(32px,3.8vw,50px)" }}>Faça sua reserva.</h2>
        </div>
        {formState === "success" ? (
          <div className="am-msg ok" style={{ maxWidth: 640, margin: "0 auto" }}>
            Reserva recebida! A pousada vai confirmar em breve pelo e-mail informado.
          </div>
        ) : (
          <form className="am-form" onSubmit={handleSubmit}>
            <div>
              <label>Quarto</label>
              <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} required>
                {site.rooms.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>
            <div className="am-form-row">
              <div><label>Check-in</label><input type="date" value={checkinDate} onChange={(e) => setCheckinDate(e.target.value)} required /></div>
              <div><label>Check-out</label><input type="date" value={checkoutDate} onChange={(e) => setCheckoutDate(e.target.value)} required /></div>
            </div>
            <div><label>Nome completo</label><input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} required /></div>
            <div className="am-form-row">
              <div><label>E-mail</label><input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required /></div>
              <div><label>Telefone</label><input type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} /></div>
            </div>
            {nights > 0 && <div className="am-total">{nights} noite{nights > 1 ? "s" : ""}</div>}
            {formState === "unavailable" && <div className="am-msg warn">Esse quarto já está reservado nessas datas. Tente outro período.</div>}
            {formState === "error" && <div className="am-msg err">{errorMessage}</div>}
            <button className="am-submit" type="submit" disabled={formState === "checking" || formState === "submitting"}>
              {formState === "checking" ? "Verificando disponibilidade..." : formState === "submitting" ? "Enviando..." : "Solicitar reserva"}
            </button>
            {site.paymentMethods.length > 0 && (
              <div>
                <label>Formas de pagamento aceitas</label>
                <div className="am-pay">{site.paymentMethods.map((pm) => <span key={pm.id}>{paymentLabels[pm.tipo] || pm.tipo}</span>)}</div>
              </div>
            )}
          </form>
        )}
      </section>

      {/* ── CTA final ── */}
      <section className="am-ink am-final-cta">
        <div className="am-ink-blob" style={{ left: -180, bottom: -200 }} />
        <div style={{ position: "relative", maxWidth: 1240, margin: "0 auto", padding: "0 40px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 56 }}>
          <div style={{ flex: "1 1 420px" }}>
            <div className="am-kicker on-ink"><span className="ln" /><span className="dot" /><span className="lbl">Tranquilidade e liberdade</span></div>
            <h2>Sua estadia em Praia do Forte começa aqui.</h2>
            <p>Escolha o quarto e reserve diretamente com a pousada.</p>
            <button className="am-btn am-btn-gold" style={{ border: "none", cursor: "pointer" }} onClick={() => scrollTo("reservar")}>Reservar agora →</button>
          </div>
          {site.organization.logoUrl && (
            <div style={{ flex: "0 1 300px", display: "grid", placeItems: "center" }}>
              <img src={assetUrl(site.organization.logoUrl)} alt="" style={{ width: "clamp(200px,24vw,300px)", height: "clamp(200px,24vw,300px)", borderRadius: 999, objectFit: "cover", border: "4px solid rgba(226,192,122,.45)", boxShadow: "var(--shadow-lg)" }} />
            </div>
          )}
        </div>
      </section>

      {/* ── footer ── */}
      <footer className="am-footer">
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 40px" }}>
          <div className="am-footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                {site.organization.logoUrl && <img src={assetUrl(site.organization.logoUrl)} alt="" style={{ width: 44, height: 44, borderRadius: 999, objectFit: "cover" }} />}
                <span style={{ fontFamily: "var(--font-heading)", fontSize: 18 }}>{site.organization.nome}</span>
              </div>
              <p style={{ maxWidth: "30ch" }}>No coração da Vila de Praia do Forte, litoral norte da Bahia.</p>
            </div>
            <div>
              <div className="am-footer-label">Endereço</div>
              <p>Beco Dona Nita, 22<br />Vila de Praia do Forte<br />Bahia · Brasil</p>
            </div>
            <div>
              <div className="am-footer-label">Horários</div>
              <p>Check-in 14h – 22h<br />Check-out até 12h<br />Pets bem-vindos</p>
            </div>
            <div>
              <div className="am-footer-label">Reservas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 14 }}>
                <a onClick={() => scrollTo("reservar")}>Reservar agora</a>
                <a onClick={() => scrollTo("quartos")}>Tipos de quarto</a>
                <a onClick={() => scrollTo("gastronomia")}>Café da manhã e restaurante</a>
              </div>
            </div>
          </div>
          <div className="am-footer-bottom">
            <p style={{ color: "var(--color-neutral-700)" }}>© {new Date().getFullYear()} {site.organization.nome} · Praia do Forte, Bahia</p>
            <p style={{ color: "var(--color-gold-700)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Tranquilidade e liberdade</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
