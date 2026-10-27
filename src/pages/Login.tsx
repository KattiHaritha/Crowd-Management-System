import { useState, type FormEvent } from "react";
import { Activity, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { login } from "../services/api";

type LoginProps = { onLogin: () => void };

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      if (!sessionStorage.getItem("crowd_access_token")) {
        throw new Error("The login response did not include an access token.");
      }
      onLogin();
    } catch {
      setError("Login failed. Check your credentials or API access and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand-icon"><Activity size={30} /></div>
        <h1>Welcome to the Crowd Management System</h1>
        <p className="login-subtitle">Sign in to your Crowd Management workspace.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email / Login ID</label>
          <input id="email" type="email" autoComplete="username" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="login-submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
        </form>
        <div className="login-security"><LockKeyhole size={16} /> Secure access to your workspace</div>
      </section>
    </main>
  );
}
