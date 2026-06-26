import { Language } from "@/lib/types";
import { LocalModeToggle } from "./LocalModeToggle";

type TopbarProps = {
  apiOnline: boolean | null;
  lang: Language;
  toggleLanguage: () => void;
  logout: () => void;
};

export function Topbar({ apiOnline, lang, toggleLanguage, logout }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark">GW</div>
        <div>
          <p className="eyebrow">GuessWord</p>
          <h1>Recall arena</h1>
        </div>
      </div>
      <div className="top-actions">
        <LocalModeToggle />
        {apiOnline !== false ? (
          <div className={`api-status ${apiOnline ? "online" : ""}`}>
            <span />
            {apiOnline ? "API online" : "Conectando"}
          </div>
        ) : null}
        <button
          className="ghost-button compact language-toggle-btn"
          onClick={toggleLanguage}
          type="button"
          title="Mudar idioma / Switch language"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          {lang === "pt" ? "🇧🇷 PT" : "🇺🇸 EN"}
        </button>
        <button className="ghost-button compact" onClick={logout} type="button">
          Sair
        </button>
      </div>
    </header>
  );
}

