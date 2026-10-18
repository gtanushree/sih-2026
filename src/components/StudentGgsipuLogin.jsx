import React, { useEffect, useRef, useState } from "react";
import { RefreshCw, LogIn, AlertTriangle, Sparkles } from "lucide-react";
import { api } from "../lib/api";

// Reads an axios error's response body as text, even when the request used responseType: "blob"
async function extractErrorMessage(err, fallback) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return parsed?.message || fallback;
    } catch {
      return fallback;
    }
  }
  return data?.message || err?.message || fallback;
}

export default function StudentGgsipuLogin({ onAuthSuccess }) {
  const [captchaUrl, setCaptchaUrl] = useState(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [enrollment, setEnrollment] = useState("");
  const [password, setPassword] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const captchaUrlRef = useRef(null);

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    setError(null);
    try {
      const url = await api.getGgsipuCaptcha();
      if (captchaUrlRef.current) URL.revokeObjectURL(captchaUrlRef.current);
      captchaUrlRef.current = url;
      setCaptchaUrl(url);
    } catch (err) {
      setError(await extractErrorMessage(err, "Failed to load GGSIPU captcha."));
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
    return () => {
      if (captchaUrlRef.current) URL.revokeObjectURL(captchaUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.studentGgsipuLogin({ enrollment: enrollment.trim(), password, captcha: captchaText });
      if (data.data?.accessToken) {
        localStorage.setItem("token", data.data.accessToken);
      }
      onAuthSuccess(data.data.user);
    } catch (err) {
      setError(await extractErrorMessage(err, "GGSIPU login failed. Please check your details."));
      setPassword("");
      setCaptchaText("");
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="bg-red-100 border-2 border-black p-3 text-xs font-bold text-black flex items-start gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div>
        <label className="block text-xs font-extrabold uppercase mb-1">
          GGSIPU Enrollment Number
        </label>
        <input
          type="text"
          value={enrollment}
          onChange={(e) => setEnrollment(e.target.value)}
          required
          placeholder="011234567890"
          className="input-stark w-full text-xs font-mono"
        />
      </div>

      <div>
        <label className="block text-xs font-extrabold uppercase mb-1">
          GGSIPU Exam Portal Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input-stark w-full text-xs font-mono"
        />
      </div>

      <div className="flex items-end gap-2.5">
        <div className="shrink-0">
          <label className="block text-xs font-extrabold uppercase mb-1">Captcha</label>
          <div className="flex items-center gap-1.5">
            <div className="h-9 w-28 border-1.5 border-black bg-gray-100 flex items-center justify-center overflow-hidden">
              {captchaLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-500" />
              ) : captchaUrl ? (
                <img src={captchaUrl} alt="GGSIPU captcha" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[9px] text-gray-500">N/A</span>
              )}
            </div>
            <button
              type="button"
              onClick={loadCaptcha}
              disabled={captchaLoading}
              title="Refresh captcha"
              className="btn-secondary p-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${captchaLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-extrabold  mb-1">Captcha Text</label>
          <input
            type="text"
            value={captchaText}
            onChange={(e) => setCaptchaText(e.target.value)}
            required
            className="input-stark w-full text-xs font-mono "
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || captchaLoading || !captchaUrl}
        className="btn-primary w-full justify-center py-2.5 text-xs font-extrabold tracking-wider cursor-pointer"
      >
        {loading ? (
          <Sparkles className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            <span>AUTHENTICATE VIA GGSIPU</span>
          </>
        )}
      </button>
    </form>
  );
}
