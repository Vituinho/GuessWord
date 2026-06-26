import { FormEvent, useMemo } from "react";
import { AuthMode } from "@/lib/types";

export const nationalities = [
  "Brazil",
  "United States",
  "Canada",
  "Mexico",
  "Portugal",
  "Spain",
  "United Kingdom",
  "Argentina",
  "Colombia",
  "Japan",
  "South Korea",
  "Other",
];

type AuthShellProps = {
  authMode: AuthMode;
  switchAuthMode: (mode: AuthMode) => void;
  submitAuth: () => void;
  loginName: string;
  setLoginName: (val: string) => void;
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginPasswordConfirmation: string;
  setLoginPasswordConfirmation: (val: string) => void;
  loginNationality: string;
  setLoginNationality: (val: string) => void;
  loginError: string;
  authLoading: boolean;
  startGoogleLogin: () => void;
};

export function AuthShell({
  authMode,
  switchAuthMode,
  submitAuth,
  loginName,
  setLoginName,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginPasswordConfirmation,
  setLoginPasswordConfirmation,
  loginNationality,
  setLoginNationality,
  loginError,
  authLoading,
  startGoogleLogin,
}: AuthShellProps) {
  const passwordChecks = useMemo(
    () => ({
      length: loginPassword.length >= 8,
      mixedCase: /[a-z]/.test(loginPassword) && /[A-Z]/.test(loginPassword),
      number: /\d/.test(loginPassword),
      match: loginPassword.length > 0 && loginPassword === loginPasswordConfirmation,
    }),
    [loginPassword, loginPasswordConfirmation],
  );
  
  const passwordScore = Object.values(passwordChecks).filter(Boolean).length;

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-lockup">
          <div className="brand-mark">GW</div>
          <div>
            <p className="eyebrow">GuessWord</p>
            <h1>Vocabulary</h1>
          </div>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Autenticacao">
          <button
            className={authMode === "login" ? "active" : ""}
            onClick={() => switchAuthMode("login")}
            type="button"
          >
            Entrar
          </button>
          <button
            className={authMode === "register" ? "active" : ""}
            onClick={() => switchAuthMode("register")}
            type="button"
          >
            Criar conta
          </button>
        </div>

        <form
          className="login-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            submitAuth();
          }}
        >
          {authMode === "register" ? (
            <label>
              Nome
              <input
                autoComplete="name"
                onChange={(event) => setLoginName(event.target.value)}
                placeholder="Seu nome"
                value={loginName}
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setLoginEmail(event.target.value)}
              placeholder="voce@email.com"
              type="email"
              value={loginEmail}
            />
          </label>
          <label>
            Senha
            <input
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
              onChange={(event) => setLoginPassword(event.target.value)}
              placeholder={authMode === "login" ? "Sua senha" : "Minimo de 8 caracteres"}
              type="password"
              value={loginPassword}
            />
          </label>

          {authMode === "register" ? (
            <>
              <label>
                Confirmar senha
                <input
                  autoComplete="new-password"
                  onChange={(event) => setLoginPasswordConfirmation(event.target.value)}
                  placeholder="Repita a senha"
                  type="password"
                  value={loginPasswordConfirmation}
                />
              </label>

              <div className="password-panel" aria-live="polite">
                <div className="password-meter">
                  <span style={{ width: `${(passwordScore / 4) * 100}%` }} />
                </div>
                <div className="password-rules">
                  <span className={passwordChecks.length ? "ok" : ""}>8+ caracteres</span>
                  <span className={passwordChecks.mixedCase ? "ok" : ""}>Maiuscula e minuscula</span>
                  <span className={passwordChecks.number ? "ok" : ""}>Número</span>
                  <span className={passwordChecks.match ? "ok" : ""}>Confirmação igual</span>
                </div>
              </div>

              <label>
                Nacionalidade
                <select onChange={(event) => setLoginNationality(event.target.value)} value={loginNationality}>
                  {nationalities.map((nationality) => (
                    <option key={nationality} value={nationality}>
                      {nationality}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {loginError ? <div className="login-error">{loginError}</div> : null}

          <div className="login-actions">
            <button disabled={authLoading} type="submit">
              {authLoading ? "Aguarde" : authMode === "login" ? "Entrar" : "Criar conta"}
            </button>
            <button className="gmail-button" disabled={authLoading} onClick={startGoogleLogin} type="button">
              Continuar com Google
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
