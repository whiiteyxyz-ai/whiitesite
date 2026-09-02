"use client";

import { useEffect, useState } from "react";

interface ImageResult {
  id: string;
  prompt: string;
  url: string;
  dimensions: { width: number; height: number };
}

interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  configured: boolean;
}

export default function ImageGenPage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<"dalle" | "stability-ai">("dalle");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [providers, setProviders] = useState<{ providers: ProviderInfo[]; defaults: Record<string, unknown> } | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    fetch("/api/imagegen/providers")
      .then((r) => r.json())
      .then((data) => {
        setProviders(data);
        const anyConfigured = data.providers?.some((p: ProviderInfo) => p.configured);
        setStatus(anyConfigured ? "ready" : "loading");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    const endpoint = compareMode ? "/api/imagegen/parallel" : "/api/imagegen";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, width, height, count }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(typeof data.error === "string" ? data.error : "Generation fehlgeschlagen");
        return;
      }

      const imgs: ImageResult[] = [];
      if (compareMode && data.results) {
        for (const r of data.results) {
          for (const img of r.results) {
            imgs.push(img);
          }
        }
      } else if (data.generated) {
        for (const img of data.generated) {
          imgs.push(img);
        }
      }
      setResults(imgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  function downloadImage(url: string, id: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `whiite-${id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const currentProvider = providers?.providers.find((p) => p.id === model);
  const isConfigured = currentProvider?.configured ?? false;

  return (
    <div>
      <div className="page-header">
        <h1>
          Bild <span>Studio</span>
        </h1>
        <div className={`status-badge ${status === "ready" ? "ready" : ""}`}>
          <div className="status-dot" />
          <span>
            {status === "ready"
              ? "WHIITE bereit"
              : status === "error"
                ? "API offline"
                : "Verbinde..."}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Beschreibe dein Bild..."
            rows={3}
            required
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label>Modell</label>
            <select value={model} onChange={(e) => setModel(e.target.value as "dalle" | "stability-ai")}>
              {providers?.providers.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.configured}>
                  {p.name} {!p.configured ? "(kein Key)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Anzahl</label>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n} Bild{n > 1 ? "er" : ""}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Breite</label>
            <select value={width} onChange={(e) => setWidth(Number(e.target.value))}>
              {[512, 768, 1024, 1536, 1792].map((w) => (
                <option key={w} value={w}>{w}px</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Höhe</label>
            <select value={height} onChange={(e) => setHeight(Number(e.target.value))}>
              {[512, 768, 1024, 1536, 1792].map((h) => (
                <option key={h} value={h}>{h}px</option>
              ))}
            </select>
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", margin: "16px 0", fontSize: "0.9rem", color: "var(--whiite-text-soft)" }}>
          <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)} />
          Alle Modelle vergleichen
        </label>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || (!compareMode && !isConfigured)}
          style={{ width: "100%", marginTop: "8px" }}
        >
          {loading ? (
            <span className="generating">
              <div className="spinner" />
              Generiere...
            </span>
          ) : compareMode ? (
            "Alle Modelle vergleichen"
          ) : (
            "Bild generieren"
          )}
        </button>
      </form>

      {error && <div className="error-msg">{error}</div>}

      {results.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: "16px", fontWeight: 700 }}>
            {results.length} Bild{results.length > 1 ? "er" : ""} generiert
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {results.map((r) => (
              <div
                key={r.id}
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid var(--whiite-border)",
                }}
              >
                <img
                  src={r.url}
                  alt={r.prompt}
                  style={{ width: "100%", display: "block", aspectRatio: `${r.dimensions.width}/${r.dimensions.height}`, objectFit: "cover" }}
                />
                <div
                  style={{
                    padding: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--whiite)",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "var(--whiite-silver)" }}>
                    {r.dimensions.width}×{r.dimensions.height}
                  </span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "0.75rem" }}
                    onClick={() => downloadImage(r.url, r.id)}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
