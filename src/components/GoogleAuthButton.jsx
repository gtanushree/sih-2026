import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { api } from "../lib/api";
import { ShieldAlert, ShieldCheck, Sparkles, LogIn, AlertTriangle } from "lucide-react";

export default function GoogleAuthButton({ mode = "student", onLoginSuccess }) {
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle actual Google OAuth credential callback from Google
  const handleGoogleSuccess = async (credentialResponse) => {
    setErrorMsg("");
    setLoading(true);
    try {
      const data = mode === "student"
        ? await api.studentGoogleLogin({ credential: credentialResponse.credential })
        : await api.companyGoogleLogin({ credential: credentialResponse.credential });

      localStorage.setItem("token", data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMsg(err.response.data.message || err.response.data.validationError);
      } else {
        setErrorMsg("Google Authentication failed. Please check network connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Direct 1-click simulated Google OAuth sign-in trigger
  const handleSimulatedGoogleAuth = async (simulatedEmail, simulatedName) => {
    setErrorMsg("");
    setLoading(true);
    try {
      const data = mode === "student"
        ? await api.studentGoogleLogin({
            email: simulatedEmail,
            name: simulatedName,
            googleId: "google_oauth_sub_" + Date.now()
          })
        : await api.companyGoogleLogin({
            email: simulatedEmail,
            companyName: simulatedName,
            googleId: "google_oauth_company_" + Date.now()
          });

      localStorage.setItem("token", data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMsg(err.response.data.message || err.response.data.validationError);
      } else {
        setErrorMsg("Google Authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-stark max-w-md mx-auto my-8 bg-white text-center">
      
      {/* Header Info */}
      <div className="border-b-2 border-black pb-4 mb-5">
        <div className="inline-flex items-center justify-center p-3 bg-black text-white mb-3 shadow-bold-sm">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight">
          {mode === "student" ? "STUDENT GOOGLE AUTHENTICATION" : "RECRUITER GOOGLE AUTHENTICATION"}
        </h2>
        <p className="text-xs font-semibold text-gray-600 mt-1 max-w-xs mx-auto">
          {mode === "student" ? (
            <>
              Sign in directly with your official GGSIPU college email (
              <span className="font-mono text-black font-extrabold">@ipu.ac.in</span>).
            </>
          ) : (
            <>Sign in with your official corporate email domain.</>
          )}
        </p>
      </div>

      {/* Validation Error Banner */}
      {errorMsg && (
        <div className="mb-5 p-3.5 bg-red-100 border-2 border-black text-left text-xs font-bold text-red-950 flex items-start gap-2.5 shadow-bold-sm">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-700 mt-0.5" />
          <div>
            <div className="font-extrabold uppercase text-red-950 mb-0.5">AUTHENTICATION DENIED</div>
            <p className="leading-relaxed text-red-900">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Pure Google OAuth Login Section (No Manual Input Forms) */}
      <div className="space-y-4 py-2 flex flex-col items-center">
        
        {loading ? (
          <div className="p-4 bg-yellow-100 border-2 border-black text-xs font-bold w-full flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>VERIFYING GOOGLE OAUTH CREDENTIALS...</span>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            {/* Standard React Google OAuth Login Widget */}
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErrorMsg("Google OAuth sign-in pop-up was closed or failed.")}
              useOneTap
              theme="outline"
              size="large"
              shape="square"
              text="continue_with"
            />
          </div>
        )}

        <div className="relative w-full my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-black"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase font-extrabold">
            <span className="bg-white px-2 text-gray-500">OR 1-CLICK GOOGLE OAUTH DEMO</span>
          </div>
        </div>

        {/* 1-Click Pure Google OAuth Sign-In Triggers */}
        {mode === "student" ? (
          <div className="w-full space-y-2">
            <button
              onClick={() => handleSimulatedGoogleAuth("alex.cs2026@ipu.ac.in", "Alex Rivera")}
              className="btn-primary w-full justify-center text-xs py-2.5"
            >
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>SIGN IN AS alex.cs2026@ipu.ac.in</span>
            </button>

            <button
              onClick={() => handleSimulatedGoogleAuth("priya.it2026@ipu.ac.in", "Priya Sharma")}
              className="btn-secondary w-full justify-center text-xs py-2.5"
            >
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>SIGN IN AS priya.it2026@ipu.ac.in</span>
            </button>

            <button
              onClick={() => handleSimulatedGoogleAuth("user@gmail.com", "Test User")}
              className="btn-secondary w-full justify-center text-xs py-2 text-red-700 bg-red-50 border-red-900 hover:bg-red-100"
              title="Click to test non-IPU domain rejection"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
              <span>TEST NON-IPU GOOGLE ACCOUNT (user@gmail.com)</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleSimulatedGoogleAuth("talent@google.com", "Google Hiring")}
            className="btn-primary w-full justify-center text-xs py-2.5"
          >
            <span>SIGN IN AS talent@google.com</span>
          </button>
        )}

      </div>

      <div className="mt-4 pt-3 border-t-2 border-black text-[11px] font-bold text-gray-500">
        Strictly restricted to GGSIPU college students with valid @ipu.ac.in Google workspace accounts.
      </div>
    </div>
  );
}
