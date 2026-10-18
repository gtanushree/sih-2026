import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { Settings, Save, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

export default function PolicyConfigPanel() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState(null);

  const fetchPolicy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPlacementPolicy();
      setPolicy(res.data || defaultPolicy());
    } catch {
      setPolicy(defaultPolicy());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPolicy(); }, [fetchPolicy]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.savePlacementPolicy(policy);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  const update = (key, value) => setPolicy(p => ({ ...p, [key]: value }));

  if (loading) return (
    <div className="card-stark p-6 mt-6 text-center">
      <div className="text-xs font-black uppercase animate-pulse">Loading policy...</div>
    </div>
  );

  return (
    <div className="card-stark bg-white mt-6">
      <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <h3 className="font-black text-sm uppercase">PLACEMENT POLICY CONFIGURATION</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPolicy} className="btn-secondary px-3 py-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> RESET
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-4 py-1.5 text-xs">
            <Save className="w-3.5 h-3.5" />
            {saving ? "SAVING..." : saved ? "SAVED ✓" : "SAVE POLICY"}
          </button>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 border-2 border-green-900 bg-green-50 p-3 mb-4 text-xs font-bold text-green-900">
          <CheckCircle className="w-4 h-4" /> Policy saved successfully and is now active.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 border-2 border-red-900 bg-red-50 p-3 mb-4 text-xs font-bold text-red-900">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Academic Year */}
        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase">Academic Year *</label>
          <input
            type="text"
            value={policy.academicYear || ""}
            onChange={e => update("academicYear", e.target.value)}
            placeholder="e.g. 2025-26"
            className="input-stark w-full py-2 text-sm font-bold"
          />
          <p className="text-[10px] text-gray-500">This policy will be activated for this academic year.</p>
        </div>

        {/* Offer Expiry */}
        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase">Offer Expiry (Days)</label>
          <input
            type="number" min="1" max="30"
            value={policy.offerExpiryDays || 7}
            onChange={e => update("offerExpiryDays", Number(e.target.value))}
            className="input-stark w-full py-2 text-sm font-bold"
          />
          <p className="text-[10px] text-gray-500">Students must respond to offers within this many days.</p>
        </div>

        {/* Max Pending Offers */}
        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase">Max Pending Offers Per Student</label>
          <input
            type="number" min="1" max="10"
            value={policy.maxPendingOffers || 3}
            onChange={e => update("maxPendingOffers", Number(e.target.value))}
            className="input-stark w-full py-2 text-sm font-bold"
          />
          <p className="text-[10px] text-gray-500">Max simultaneous unresolved offers a student can hold.</p>
        </div>

        {/* Dream Multiplier */}
        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase">Dream Offer Multiplier (×)</label>
          <input
            type="number" min="1.1" max="5" step="0.1"
            value={policy.dreamMultiplier || 1.5}
            onChange={e => update("dreamMultiplier", Number(e.target.value))}
            className="input-stark w-full py-2 text-sm font-bold"
          />
          <p className="text-[10px] text-gray-500">
            A student with an accepted offer can upgrade if new offer ≥ current × this multiplier.
          </p>
        </div>

        {/* Super Dream Multiplier */}
        <div className="space-y-1">
          <label className="text-[11px] font-black uppercase">Super Dream Multiplier (×)</label>
          <input
            type="number" min="1.5" max="10" step="0.1"
            value={policy.superDreamMultiplier || 2.0}
            onChange={e => update("superDreamMultiplier", Number(e.target.value))}
            className="input-stark w-full py-2 text-sm font-bold"
          />
          <p className="text-[10px] text-gray-500">Upgrade threshold for super-dream designation.</p>
        </div>
      </div>

      {/* Toggle Switches */}
      <div className="mt-6 space-y-4 border-t-2 border-black pt-4">
        <ToggleRow
          label="Enforce One-Offer-One-Student"
          description="Block students from applying to new drives once they have an accepted offer."
          checked={policy.enforceOneOffer ?? true}
          onChange={v => update("enforceOneOffer", v)}
        />
        <ToggleRow
          label="Allow Dream Offer Upgrades"
          description="Students with an accepted offer can still apply if the new offer meets the dream multiplier threshold."
          checked={policy.allowDreamUpgrade ?? true}
          onChange={v => update("allowDreamUpgrade", v)}
        />
      </div>

      {/* Live Preview */}
      <div className="mt-6 border-2 border-black bg-gray-50 p-4">
        <div className="text-[11px] font-black uppercase mb-2">Policy Preview</div>
        <div className="space-y-1 text-xs font-medium text-gray-700">
          <p>• One-Offer rule: <strong>{policy.enforceOneOffer ? "ENABLED" : "DISABLED"}</strong></p>
          <p>• Dream upgrades: <strong>{policy.allowDreamUpgrade ? "ENABLED" : "DISABLED"}</strong></p>
          <p>• Dream threshold: <strong>{policy.dreamMultiplier}× current package</strong></p>
          <p>• Super-Dream threshold: <strong>{policy.superDreamMultiplier}× current package</strong></p>
          <p>• Example: Student accepts ₹10 LPA → can upgrade with dream offer ≥ ₹<strong>{(10 * (policy.dreamMultiplier || 1.5)).toFixed(1)} LPA</strong></p>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-xs font-black uppercase">{label}</div>
        <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 h-6 w-12 border-2 border-black transition-colors ${checked ? "bg-black" : "bg-white"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 border border-black transition-all ${checked ? "left-6 bg-white" : "left-0.5 bg-black"}`} />
      </button>
    </div>
  );
}

function defaultPolicy() {
  const year = new Date().getFullYear();
  return {
    academicYear: `${year}-${String(year + 1).slice(-2)}`,
    enforceOneOffer: true,
    allowDreamUpgrade: true,
    dreamMultiplier: 1.5,
    superDreamMultiplier: 2.0,
    maxPendingOffers: 3,
    offerExpiryDays: 7,
  };
}
