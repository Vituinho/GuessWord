import { useLocalMode } from "@/store/LocalModeContext";

export function LocalModeToggle() {
  const { isLocalMode, toggleLocalMode } = useLocalMode();

  return (
    <button
      className={`ghost-button compact ${isLocalMode ? "primary" : ""}`}
      onClick={toggleLocalMode}
      type="button"
      title={isLocalMode ? "Conectado ao Laravel local (localhost)" : "Conectar ao Laravel local (localhost)"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        borderColor: isLocalMode ? "var(--green)" : "var(--line)",
        color: isLocalMode ? "var(--green)" : "var(--muted)",
        background: isLocalMode ? "rgba(94, 224, 141, 0.08)" : "transparent",
        transition: "all 0.15s ease",
      }}
    >
      <span>🔌</span> {isLocalMode ? "Local: Ativo" : "Rodar localmente"}
    </button>
  );
}
export default LocalModeToggle;
