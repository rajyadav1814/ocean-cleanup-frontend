import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { authRequestPasswordReset } from "../../../services/api";

const TOKENS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');

  .bm-forgot {
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

  .bm-forgot *, .bm-forgot *::before, .bm-forgot *::after { box-sizing: border-box; }
  .bm-forgot input { all: unset; box-sizing: border-box; font-family: var(--font-sans); }
  .bm-forgot form { display: block; gap: unset; text-align: unset; }

  .bm-forgot__grid {
    position: absolute; inset: -10%; z-index: 0; pointer-events: none;
    background-image: linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
    background-size: 70px 70px;
    mask-image: radial-gradient(65% 55% at 50% 40%, #000 0%, transparent 75%);
    -webkit-mask-image: radial-gradient(65% 55% at 50% 40%, #000 0%, transparent 75%);
  }

  .bm-forgot__card {
    position: relative; z-index: 2; width: 100%; max-width: 480px;
    border: 1px solid var(--line-dark); border-radius: 16px;
    background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.02));
    backdrop-filter: blur(18px) saturate(1.3);
    padding: clamp(2rem, 3.5vw, 2.75rem);
    box-shadow: 0 40px 80px -30px rgba(3,12,22,.65);
  }

  .bm-forgot__logo { display: inline-flex; align-items: center; gap: .55rem; font-size: .95rem; font-weight: 600; letter-spacing: -.02em; color: var(--on-dark); margin-bottom: 1.75rem; text-decoration: none; }
  .bm-forgot__card h1 { margin: 0; font-size: clamp(1.6rem, 1.3rem + 1vw, 1.9rem); font-weight: 500; letter-spacing: -.03em; line-height: 1.1; color: #ffffff; }
  .bm-forgot__card h1 .serif { font-family: var(--font-serif); font-style: italic; font-weight: 400; color: #ffffff; }
  .bm-forgot__sub { margin: .55rem 0 0; font-size: .92rem; color: var(--on-dark-2); }
  .bm-forgot__notice {
    margin-top: 1rem; padding: .8rem .95rem; border-radius: 10px;
    background: rgba(45,212,191,.10); border: 1px solid rgba(45,212,191,.22);
    color: #c8fff8; font-size: .88rem; line-height: 1.45;
  }
  .bm-forgot__error {
    margin-top: 1rem; padding: .65rem .9rem; border-radius: 8px;
    background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.25);
    color: #fca5a5; font-size: .85rem; line-height: 1.4;
  }

  .bm-field { position: relative; margin-top: 1.25rem; }
  .bm-field__icon { position: absolute; left: .95rem; top: 50%; transform: translateY(-50%); color: var(--on-dark-3); pointer-events: none; z-index: 1; }
  .bm-field input {
    display: block; width: 100%; padding: .85rem 2.8rem .85rem 2.55rem; border-radius: 10px;
    background: rgba(4,18,31,.55) !important; border: 1px solid var(--line-dark) !important; color: var(--on-dark) !important;
    font-size: .92rem; font-family: var(--font-sans); transition: border-color .2s ease, background .2s ease;
    min-height: unset !important;
  }
  .bm-field input::placeholder { color: var(--on-dark-3) !important; }
  .bm-field input:focus { outline: none !important; border-color: var(--cobalt) !important; background: rgba(4,18,31,.75) !important; box-shadow: 0 0 0 3px rgba(11,130,201,.18) !important; }

  button.bm-forgot__btn {
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
  }
  button.bm-forgot__btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 22px 40px -14px rgba(46,158,155,.65); }
  button.bm-forgot__btn:disabled { opacity: 0.7; cursor: not-allowed; }
  .bm-forgot__spinner {
    width: 16px; height: 16px; border: 2px solid rgba(4,18,31,.3); border-top-color: #04121F;
    border-radius: 50%; animation: bffSpin .65s linear infinite; flex-shrink: 0;
  }
  @keyframes bffSpin { to { transform: rotate(360deg); } }
  .bm-forgot__foot { margin-top: 1.35rem; text-align: center; font-size: .88rem; color: var(--on-dark-2); }
  .bm-forgot__foot a { color: var(--sky-2); font-weight: 500; text-decoration: none; }
  .bm-forgot__foot a:hover { color: #fff; }

  @media (prefers-reduced-motion: reduce) {
    .bm-forgot__spinner { animation: none; }
  }
`;

function Logo() {
  return (
    <Link to="/login" className="bm-forgot__logo" aria-label="BlueMind login">
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

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authRequestPasswordReset(email.trim());
      if (data.ok) {
        setSent(true);
      } else {
        setError(data.message || "Unable to process password reset request.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bm-forgot">
      <style>{TOKENS}</style>
      <div className="bm-forgot__grid" aria-hidden="true" />

      <form className="bm-forgot__card" onSubmit={handleSubmit} noValidate>
        <Logo />

        <h1>
          Reset your <span className="serif">password.</span>
        </h1>
        <p className="bm-forgot__sub">We’ll send a secure reset link if that email exists in our system.</p>

        {sent && (
          <div className="bm-forgot__notice">
            If that email exists, we sent a reset link. Check your inbox and spam folder.
          </div>
        )}

        {error && <div className="bm-forgot__error">{error}</div>}

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

        <button className="bm-forgot__btn" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="bm-forgot__spinner" />
              Sending…
            </>
          ) : (
            <>
              Send reset link <ArrowRight size={15} />
            </>
          )}
        </button>

        <div className="bm-forgot__foot">
          Remembered it? <Link to="/login">Back to sign in</Link>
        </div>
      </form>
    </div>
  );
}
