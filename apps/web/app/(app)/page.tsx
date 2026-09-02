export default function Home() {
  return (
    <div>
      <div className="page-header">
        <h1>
          Willkommen bei <span>WhiiteSite</span>
        </h1>
      </div>

      <div className="card">
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "12px" }}>
          Dein KI Multi-Tool
        </h2>
        <p style={{ color: "var(--whiite-text-soft)", lineHeight: 1.7, fontSize: "0.95rem" }}>
          WhiiteSite bilderstellt Bilder, schreibt Produktbeschreibungen und hat
          einen intelligenten Assistenten – Whiity. Alles lokal betreibbar mit
          Ollama oder in der Cloud mit OpenAI.
        </p>
      </div>

      <div className="grid-2">
        <a href="/imagegen" className="card" style={{ textDecoration: "none", display: "block" }}>
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🎨</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
            Bild-Studio
          </h3>
          <p style={{ color: "var(--whiite-text-soft)", fontSize: "0.85rem", lineHeight: 1.6 }}>
            Generiere Bilder mit DALL-E 3 oder Stable Diffusion XL
          </p>
        </a>

        <a href="/description" className="card" style={{ textDecoration: "none", display: "block" }}>
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>✍️</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
            Produkt-Beschreibungen
          </h3>
          <p style={{ color: "var(--whiite-text-soft)", fontSize: "0.85rem", lineHeight: 1.6 }}>
            GPT-4o oder lokales LLM schreibt SEO-Texte für deinen Shop
          </p>
        </a>

        <a href="/whiity" className="card" style={{ textDecoration: "none", display: "block" }}>
          <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🤖</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
            Whiity
          </h3>
          <p style={{ color: "var(--whiite-text-soft)", fontSize: "0.85rem", lineHeight: 1.6 }}>
            Dein KI-Assistent mit Memory und Werkzeug-Zugriff
          </p>
        </a>
      </div>
    </div>
  );
}
