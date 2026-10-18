import { useState } from "react";
import { Building2, GraduationCap, Mail, Lock, LogIn, AlertTriangle, Sparkles, Users } from "lucide-react";
import { api } from "../lib/api";

export default function AuthScreen({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authRole, setAuthRole] = useState("student");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // A known email logs in; a new IPU email creates an account and logs in.
  const handleFormLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    if (authRole === "student" && !/^[^\s@]+@ipu\.ac\.in$/i.test(trimmedEmail)) {
      setError("INVALID DOMAIN: Use your official IPU email ending with @ipu.ac.in");
      setLoading(false);
      return;
    }

    try {
      const data = await api.loginOrRegister({
        email: trimmedEmail,
        password,
        role: authRole,
      });

      const authenticatedUser = data.data?.user || {
        name: trimmedEmail.split("@")[0].toUpperCase().replace(".", " "),
        email: trimmedEmail,
        role: authRole,
        branch: null,
        cgpa: null
      };

      if (data.data?.accessToken) {
        localStorage.setItem("token", data.data.accessToken);
      }

      onAuthSuccess(authenticatedUser);
    } catch (err) {
      const apiErrorMessage = err.response?.data?.message || err.message;
      console.warn("Backend auth server error:", apiErrorMessage);
      setError(`AUTHENTICATION ERROR: ${apiErrorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-black font-sans flex items-center justify-center p-4">

      {/* High Contrast Stark Auth Card */}
      <div className="w-full max-w-md card-stark bg-white p-6 space-y-6 border-2 border-black shadow-bold-lg">

        {/* Brand Header */}
        <div className="text-center space-y-1.5 border-b-2 border-black pb-4">
          <div className="inline-block bg-black text-white font-black text-2xl px-3 py-1 border-2 border-black mb-1">
            TNP.AI
          </div>
          <h1 className="font-extrabold text-xl uppercase tracking-tight">
            IPU PLACEMENT PORTAL
          </h1>
          <p className="text-xs font-semibold text-gray-600">
            Institutional Email Authentication
          </p>
        </div>



        {/* Error Alert Message */}
        {error && (
          <div className="bg-red-100 border-2 border-black p-3 text-xs font-bold text-black flex items-start gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Authentication Form */}
        <div className="space-y-4">

          <div className="grid grid-cols-3 border-2 border-black bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => { setAuthRole("student"); setError(null); }}
              className={`flex items-center justify-center gap-2 px-2 py-2 text-[10px] font-black uppercase ${authRole === "student" ? "bg-black text-white" : "bg-transparent text-black"}`}
            >
              <GraduationCap className="h-4 w-4" /> Student
            </button>
            <button
              type="button"
              onClick={() => { setAuthRole("tpo"); setError(null); }}
              className={`flex items-center justify-center gap-2 px-2 py-2 text-[10px] font-black uppercase ${authRole === "tpo" ? "bg-black text-white" : "bg-transparent text-black"}`}
            >
              <Building2 className="h-4 w-4" /> College TPO
            </button>
            <button
              type="button"
              onClick={() => { setAuthRole("alumni"); setError(null); }}
              className={`flex items-center justify-center gap-2 px-2 py-2 text-[10px] font-black uppercase ${authRole === "alumni" ? "bg-black text-white" : "bg-transparent text-black"}`}
            >
              <Users className="h-4 w-4" /> Alumni
            </button>
          </div>

          <form onSubmit={handleFormLogin} className="space-y-4">

                {/* Email Input Field */}
                <div>
                  <label className="block text-xs font-extrabold uppercase mb-1">
                    {authRole === "tpo" ? "APPROVED COLLEGE TPO EMAIL" : authRole === "alumni" ? "ALUMNI EMAIL ADDRESS" : "OFFICIAL IPU EMAIL ADDRESS"}
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 absolute left-3 text-gray-500 z-10 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={authRole === "tpo" ? "tpo@college.edu" : authRole === "alumni" ? "alumni@example.com" : "student@ipu.ac.in"}
                      className="input-stark w-full text-xs font-mono"
                      style={{ paddingLeft: "2.6rem" }}
                    />
                  </div>
                </div>

                {/* Password Input Field */}
                <div>
                  <label className="block text-xs font-extrabold uppercase mb-1">
                    PASSWORD
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3 text-gray-500 z-10 pointer-events-none" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input-stark w-full text-xs font-mono"
                      style={{ paddingLeft: "2.6rem" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-2.5 text-xs font-extrabold tracking-wider cursor-pointer"
                >
                  {loading ? (
                    <Sparkles className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{authRole === "tpo" ? "CONTINUE AS TPO" : authRole === "alumni" ? "CONTINUE AS ALUMNI" : "CONTINUE AS STUDENT"}</span>
                    </>
                  )}
                </button>
          </form>

        </div>

        {/* Footer info */}
        <div className="text-[10px] text-center text-gray-500 font-semibold pt-2 border-t border-gray-200">
          {authRole === "tpo"
            ? "First use registers the approved TPO • Later uses sign in to the same account"
            : authRole === "alumni"
              ? "First use creates an unverified alumni profile • Verification will be added later"
            : "New student emails are registered automatically • Existing emails are signed in"}
        </div>

      </div>

    </div>
  );
}
