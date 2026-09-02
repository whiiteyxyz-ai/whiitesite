"use client";

import { useState } from "react";

interface DescriptionResult {
  headline?: string;
  body: string;
  bullets?: string[];
  cta?: string;
  metaDescription?: string;
  language: string;
  wordCount: number;
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function DescriptionPage() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [features, setFeatures] = useState("");
  const [targetAudience, setTargetAudience] = useState<string>("b2c");
  const [tone, setTone] = useState<string>("professional");
  const [length, setLength] = useState<string>("medium");
  const [language, setLanguage] = useState<string>("de");
  const [includeBullets, setIncludeBullets] = useState(false);
  const [includeMeta, setIncludeMeta] = useState(true);
  const [includeCta, setIncludeCta] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DescriptionResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          category: category || undefined,
          keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
          features: features ? features.split("\n").map((f) => f.trim()).filter(Boolean) : undefined,
          targetAudience,
          tone,
          length,
          language,
          includeBullets,
          includeMeta,
          includeCta,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        setError(typeof data.error === "string" ? data.error : "Fehler");
        return;
      }
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          Produkt <span>Beschreibungen</span>
        </h1>
        <div className="status-badge">
          <div className="status-dot" />
          <span>Ollama + OpenAI</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>Produktname *</label>
          <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="z.B. Espresso Maschine X1" required />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>Kategorie</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="z.B. Küchengeräte" />
          </div>

          <div className="form-group">
            <label>Zielgruppe</label>
            <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
              <option value="b2c">B2C – Endkunden</option>
              <option value="b2b">B2B – Geschäftskunden</option>
              <option value="premium">Premium-Kunden</option>
              <option value="young">Jung & trendy</option>
              <option value="family">Familien</option>
              <option value="technical">Technik-affin</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tonalität</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="professional">Professionell</option>
              <option value="casual">Locker</option>
              <option value="luxurious">Edel</option>
              <option value="playful">Verspielt</option>
              <option value="technical">Technisch</option>
              <option value="storytelling">Erzählerisch</option>
            </select>
          </div>

          <div className="form-group">
            <label>Länge</label>
            <select value={length} onChange={(e) => setLength(e.target.value)}>
              <option value="short">Kurz</option>
              <option value="medium">Mittel</option>
              <option value="long">Lang</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sprache</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="de">Deutsch</option>
              <option value="en">Englisch</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Keywords (kommagetrennt)</label>
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Premium, handlich, leise..." />
        </div>

        <div className="form-group">
          <label>Features (eine pro Zeile)</label>
          <textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={3} placeholder="Edelstahlgehäuse&#10;15 Bar Pumpendruck&#10;Integrierter Mahlwerk" />
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", margin: "16px 0" }}>
          {[
            { label: "Stichpunkte", checked: includeBullets, toggle: () => setIncludeBullets(!includeBullets) },
            { label: "CTA", checked: includeCta, toggle: () => setIncludeCta(!includeCta) },
            { label: "Meta-Description", checked: includeMeta, toggle: () => setIncludeMeta(!includeMeta) },
          ].map(({ label, checked, toggle }) => (
            <label key={label} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.9rem" }}>
              <input type="checkbox" checked={checked} onChange={toggle} />
              {label}
            </label>
          ))}
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: "8px" }}>
          {loading ? (
            <span className="generating"><div className="spinner" />Generiere...</span>
          ) : (
            "Beschreibung generieren"
          )}
        </button>
      </form>

      {error && <div className="error-msg">{error}</div>}

      {result && (
        <div className="result-card">
          {result.headline && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--whiite-silver)", fontWeight: 600, marginBottom: "6px" }}>
                Überschrift
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700 }}>{result.headline}</h3>
                <button className="btn btn-secondary" style={{ flexShrink: 0, padding: "6px 12px", fontSize: "0.75rem" }} onClick={() => copyText(result.headline!)}>
                  Copy
                </button>
              </div>
            </div>
          )}

          {result.bullets && result.bullets.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--whiite-silver)", fontWeight: 600, marginBottom: "8px" }}>
                Stichpunkte
              </div>
              <ul style={{ paddingLeft: "20px", lineHeight: 1.8 }}>
                {result.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--whiite-silver)", fontWeight: 600, marginBottom: "8px" }}>
              Beschreibungstext
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
              <p style={{ lineHeight: 1.8 }}>{result.body}</p>
              <button className="btn btn-secondary" style={{ flexShrink: 0, padding: "6px 12px", fontSize: "0.75rem" }} onClick={() => copyText(result.body)}>
                Copy
              </button>
            </div>
          </div>

          {result.cta && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--whiite-silver)", fontWeight: 600, marginBottom: "6px" }}>
                Call-to-Action
              </div>
              <p style={{ fontWeight: 600, color: "var(--whiite-text)" }}>{result.cta}</p>
            </div>
          )}

          {result.metaDescription && (
            <div>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--whiite-silver)", fontWeight: 600, marginBottom: "6px" }}>
                Meta-Description
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <p style={{ lineHeight: 1.6, color: "var(--whiite-text-soft)", fontSize: "0.9rem" }}>{result.metaDescription}</p>
                <button className="btn btn-secondary" style={{ flexShrink: 0, padding: "6px 12px", fontSize: "0.75rem" }} onClick={() => copyText(result.metaDescription!)}>
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="meta">{result.wordCount} Wörter · {result.language === "de" ? "Deutsch" : "Englisch"}</div>
        </div>
      )}
    </div>
  );
}
