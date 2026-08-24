import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { authLogin } from "../../../services/api";

const TOKENS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');

  .bm-login {
    --navy: #071B33;
    --ocean: #0A4F83;
    --marine: #14669E;
    --cobalt: #0B82C9;
    --sky: #7FC3E8;
    --sky-2: #A9D8F0;
    --teal: #2E9E9B;
    --teal-light: #6FC9C4;
    --on-dark: #F2F7FA;
    --on-dark-2: rgba(233,242,247,.68);
    --on-dark-3: rgba(233,242,247,.46);
    --line-dark: rgba(160,210,240,.18);

    --font-sans: 'Instrument Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
    --font-serif: 'Instrument Serif', ui-serif, Georgia, serif;

    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(2rem, 6vw, 4rem) 1.25rem;
    font-family: var(--font-sans);
    color: var(--on-dark);
    background:
      radial-gradient(90% 60% at 78% 6%, #17587F 0%, transparent 58%),
      radial-gradient(95% 70% at 10% 100%, #0A4F83 0%, transparent 62%),
      linear-gradient(172deg, #05192E 0%, #072744 44%, #08395F 100%);
    overflow: hidden;
  }

  /* ── Reset: neutralise global styles leaking in ── */
  .bm-login *, .bm-login *::before, .bm-login *::after { box-sizing: border-box; }
  .bm-login form { display: block; gap: unset; text-align: unset; }
  .bm-login label { all: unset; }
  /* only reset inputs, not buttons – buttons are handled individually */
  .bm-login input {
    all: unset;
    box-sizing: border-box;
    font-family: var(--font-sans);
  }

  .bm-login__grid {
    position: absolute; inset: -10%; z-index: 0; pointer-events: none;
    background-image: linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
    background-size: 70px 70px;
    mask-image: radial-gradient(65% 55% at 50% 40%, #000 0%, transparent 75%);
    -webkit-mask-image: radial-gradient(65% 55% at 50% 40%, #000 0%, transparent 75%);
  }

  .bm-login__signal { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: var(--sky); box-shadow: 0 0 9px 1px rgba(127,195,232,.45); animation: bmlPulse 5.5s ease infinite; }
  @keyframes bmlPulse { 0%,100% { opacity: .18; } 50% { opacity: .8; } }

  .bm-login__card {
    position: relative; z-index: 2; width: 100%; max-width: 480px;
    border: 1px solid var(--line-dark); border-radius: 16px;
    background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.02));
    backdrop-filter: blur(18px) saturate(1.3);
    padding: clamp(2rem, 3.5vw, 2.75rem);
    box-shadow: 0 40px 80px -30px rgba(3,12,22,.65);
  }

  .bm-login__logo { display: inline-flex; align-items: center; gap: .55rem; font-size: .95rem; font-weight: 600; letter-spacing: -.02em; color: var(--on-dark); margin-bottom: 1.75rem; text-decoration: none; }

  .bm-login__card h1 { margin: 0; font-size: clamp(1.6rem, 1.3rem + 1vw, 1.9rem); font-weight: 500; letter-spacing: -.03em; line-height: 1.1; color: #ffffff; }
  .bm-login__card h1 .serif { font-family: var(--font-serif); font-style: italic; font-weight: 400; color: #ffffff; }
  .bm-login__sub { margin: .55rem 0 0; font-size: .92rem; color: var(--on-dark-2); }

  .bm-field { position: relative; margin-top: 1.25rem; }
  .bm-field__icon { position: absolute; left: .95rem; top: 50%; transform: translateY(-50%); color: var(--on-dark-3); pointer-events: none; z-index: 1; }
  .bm-field input {
    display: block; width: 100%; padding: .85rem 2.8rem .85rem 2.55rem; border-radius: 10px;
    background: rgba(4,18,31,.55) !important; border: 1px solid var(--line-dark) !important; color: var(--on-dark) !important;
    font-size: .92rem; font-family: var(--font-sans); transition: border-color .2s ease, background .2s ease;
    min-height: unset !important;
  }
  .bm-field input::placeholder { color: var(--on-dark-3) !important; }
  .bm-field input:-webkit-autofill,
  .bm-field input:-webkit-autofill:hover,
  .bm-field input:-webkit-autofill:focus,
  .bm-field input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #061727 inset !important;
    -webkit-text-fill-color: var(--on-dark) !important;
    transition: background-color 5000s ease-in-out 0s;
  }
  .bm-field input:focus { outline: none !important; border-color: var(--cobalt) !important; background: rgba(4,18,31,.75) !important; box-shadow: 0 0 0 3px rgba(11,130,201,.18) !important; }
  .bm-field__toggle {
    position: absolute !important; right: .7rem; top: 50%; transform: translateY(-50%);
    background: none !important; border: none !important; color: var(--on-dark-3) !important;
    cursor: pointer; padding: .3rem; display: grid !important; place-items: center;
    transition: color .2s ease; line-height: 0;
  }
  .bm-field__toggle:hover { color: var(--on-dark) !important; }

  .bm-login__forgot-row { display: flex; justify-content: space-between; align-items: center; margin-top: .6rem; gap: .75rem; }
  .bm-login__forgot { color: var(--sky-2); font-size: .82rem; font-weight: 500; text-decoration: none; }
  .bm-login__forgot:hover { color: #fff; }

  /* submit button – full-width capsule */
  button.bm-login__btn {
    margin-top: 1.4rem;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    gap: .55rem;
    padding: .9rem 1.5rem;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: .88rem;
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: #04121F;
    background: linear-gradient(135deg, var(--teal-light), var(--teal));
    box-shadow: 0 18px 36px -14px rgba(46,158,155,.55);
    transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
    line-height: 1;
    box-sizing: border-box;
  }
  button.bm-login__btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 22px 40px -14px rgba(46,158,155,.65); }
  button.bm-login__btn:disabled { opacity: 0.7; cursor: not-allowed; }
  button.bm-login__btn .arrow { transition: transform .25s cubic-bezier(.16,1,.3,1); }
  button.bm-login__btn:hover:not(:disabled) .arrow { transform: translateX(3px); }

  .bm-login__spinner {
    width: 16px; height: 16px; border: 2px solid rgba(4,18,31,.3); border-top-color: #04121F;
    border-radius: 50%; animation: bmlSpin .65s linear infinite; flex-shrink: 0;
  }
  @keyframes bmlSpin { to { transform: rotate(360deg); } }

  .bm-login__error {
    margin-top: 1rem; padding: .65rem .9rem; border-radius: 8px;
    background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.25);
    color: #fca5a5; font-size: .85rem; line-height: 1.4;
  }

  .bm-login__divider { display: flex; align-items: center; gap: .85rem; margin: 1.5rem 0; color: var(--on-dark-3); font-size: .78rem; text-transform: uppercase; letter-spacing: .08em; }
  .bm-login__divider::before, .bm-login__divider::after { content: ""; flex: 1; height: 1px; background: var(--line-dark); }

  .bm-login__foot { text-align: center; font-size: .88rem; color: var(--on-dark-2); }
  .bm-login__foot a { color: var(--sky-2); font-weight: 500; text-decoration: none; }
  .bm-login__foot a:hover { color: #fff; }

  @media (prefers-reduced-motion: reduce) {
    .bm-login__signal { animation: none; }
    .bm-login__spinner { animation: none; }
  }
`;

function Logo() {
  return (
    <Link to="/" className="bm-login__logo" aria-label="BlueMind home">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2.9 9.6h18.2M2.9 14.4h18.2" stroke="currentColor" strokeWidth="1.1" opacity=".55" />
        <path
          d="M12 2.75c2.6 2.6 3.9 5.7 3.9 9.25S14.6 18.65 12 21.25c-2.6-2.6-3.9-5.7-3.9-9.25S9.4 5.35 12 2.75Z"
          stroke="currentColor"
          strokeWidth="1.1"
          opacity=".55"
        />
      </svg>
      Bluemind
    </Link>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = (role) => {
    if (role === "verifier") return "/verifier/pending";
    if (role === "citizen") return "/citizen/overview";
    return "/contributor/overview";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authLogin(email, password);
      if (data.ok) {
        if (data.user.role === "admin") {
          setError("Admin accounts cannot sign in here — use the admin portal instead.");
          return;
        }
        login(data.user, data.token);
        navigate(getRedirectPath(data.user.role), {
          replace: true,
          state: { flashMessage: "Login successful" },
        });
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bm-login">
      <style>{TOKENS}</style>
      <div className="bm-login__grid" aria-hidden="true" />
      <span className="bm-login__signal" style={{ left: "12%", top: "18%" }} aria-hidden="true" />
      <span className="bm-login__signal" style={{ left: "86%", top: "72%", animationDelay: "2.1s" }} aria-hidden="true" />
      <span className="bm-login__signal" style={{ left: "80%", top: "20%", animationDelay: "3.4s" }} aria-hidden="true" />

      <form className="bm-login__card" onSubmit={handleSubmit} noValidate>
        <Logo />

        <h1>
          Welcome <span className="serif">back.</span>
        </h1>
        <p className="bm-login__sub">Sign in to keep mapping.</p>

        {error && <div className="bm-login__error">{error}</div>}

        <div className="bm-field">
          <Mail className="bm-field__icon" size={16} />
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="bm-field">
          <Lock className="bm-field__icon" size={16} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={{
              position: 'absolute', right: '.7rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'rgba(233,242,247,.46)',
              cursor: 'pointer', padding: '.3rem', display: 'grid', placeItems: 'center',
              lineHeight: 0, transition: 'color .2s ease'
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="bm-login__forgot-row">
          <span style={{ fontSize: '.82rem', color: 'var(--on-dark-3)' }}>Need access help?</span>
          <Link className="bm-login__forgot" to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="bm-login__btn" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="bm-login__spinner" />
              Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight className="arrow" size={15} />
            </>
          )}
        </button>

        <div className="bm-login__divider">or</div>

        <p className="bm-login__foot">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
