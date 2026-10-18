import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import {
  CheckCircle, XCircle, ArrowUpCircle, Clock, Package, Building,
  TrendingUp, Lock, AlertTriangle, Star, Zap
} from "lucide-react";

const STATUS_STYLES = {
  extended:  { bg: "bg-blue-100",   text: "text-blue-900",  border: "border-blue-900",  label: "PENDING RESPONSE" },
  accepted:  { bg: "bg-green-200",  text: "text-green-900", border: "border-green-900", label: "ACCEPTED" },
  rejected:  { bg: "bg-red-100",    text: "text-red-900",   border: "border-red-900",   label: "REJECTED" },
  withdrawn: { bg: "bg-gray-200",   text: "text-gray-700",  border: "border-gray-500",  label: "WITHDRAWN" },
  expired:   { bg: "bg-orange-100", text: "text-orange-900",border: "border-orange-900",label: "EXPIRED" },
  placed:    { bg: "bg-black",      text: "text-white",     border: "border-black",      label: "PLACED ✓" },
};

const OFFER_TYPE_STYLES = {
  "normal":     { icon: Package,    color: "bg-gray-100",   label: "OFFER" },
  "dream":      { icon: Star,       color: "bg-yellow-200", label: "DREAM OFFER" },
  "super-dream":{ icon: Zap,        color: "bg-purple-200", label: "SUPER DREAM" },
};

export default function StudentOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMyOffers();
      setOffers(res.data || []);
    } catch (e) {
      setError("Failed to fetch offers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const handleAction = async (action, offerId, extra = {}) => {
    setActionLoading(offerId + action);
    try {
      if (action === "accept")   await api.acceptOffer(offerId);
      if (action === "reject")   await api.rejectOffer(offerId, extra.reason);
      if (action === "withdraw") await api.withdrawOffer(offerId, extra.reason);
      await fetchOffers();
    } catch (e) {
      let msg = "Action failed.";
      try {
        const parsed = JSON.parse(e.response?.data?.message || e.message);
        msg = parsed.message || msg;
      } catch { msg = e.response?.data?.message || e.message || msg; }
      alert(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const acceptedOffer = offers.find(o => o.status === "accepted");
  const blockedByPolicy = !!acceptedOffer;

  if (loading) return (
    <div className="card-stark p-10 text-center">
      <div className="text-xs font-black uppercase animate-pulse">Loading your offers...</div>
    </div>
  );

  return (
    <div className="card-stark space-y-4 bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-black pb-3 gap-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          <h3 className="font-black text-sm uppercase">MY PLACEMENT OFFERS</h3>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="badge-stark bg-gray-100 text-xs">{offers.length} TOTAL</span>
          {acceptedOffer && (
            <span className="badge-stark bg-green-200 text-[10px]">
              <CheckCircle className="w-3 h-3" /> ACTIVE: {acceptedOffer.companyName} — {acceptedOffer.packageLpa} LPA
            </span>
          )}
        </div>
      </div>

      {/* Policy Block Banner */}
      {blockedByPolicy && (
        <div className="flex items-start gap-3 border-2 border-black bg-yellow-50 p-3">
          <Lock className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-black uppercase">ONE-OFFER POLICY ACTIVE</div>
            <p className="text-[11px] font-medium text-gray-700 mt-0.5">
              You have accepted an offer at <strong>{acceptedOffer.companyName}</strong> ({acceptedOffer.packageLpa} LPA).
              You are blocked from applying to new drives unless they qualify as a Dream Offer
              (≥ {((acceptedOffer.currentAcceptedPackage || acceptedOffer.packageLpa) * (acceptedOffer.dreamMultiplier || 1.5)).toFixed(1)} LPA).
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="border-2 border-red-900 bg-red-50 p-3 text-xs font-bold text-red-900">
          <AlertTriangle className="w-4 h-4 inline mr-1" />{error}
        </div>
      )}

      {/* Offers List */}
      {offers.length === 0 ? (
        <div className="border-2 border-dashed border-gray-400 p-10 text-center">
          <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <div className="text-xs font-black uppercase">No offers yet</div>
          <p className="text-[11px] text-gray-500 mt-1">When a company extends you an offer, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const statusStyle = STATUS_STYLES[offer.status] || STATUS_STYLES.extended;
            const typeStyle = OFFER_TYPE_STYLES[offer.offerType] || OFFER_TYPE_STYLES.normal;
            const TypeIcon = typeStyle.icon;
            const isLoading = (key) => actionLoading === offer._id + key;

            return (
              <div key={offer._id} className={`border-2 border-black p-4 space-y-3 ${offer.tpoOverride ? "border-purple-600" : ""}`}>
                {/* Card Header */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge-stark ${typeStyle.color} text-[10px] font-black`}>
                        <TypeIcon className="w-3 h-3" /> {typeStyle.label}
                      </span>
                      {offer.tpoOverride && (
                        <span className="badge-stark bg-purple-200 text-[9px]">TPO OVERRIDE</span>
                      )}
                      {offer.isDreamEligible && offer.status === "extended" && (
                        <span className="badge-stark bg-yellow-300 text-[9px] animate-pulse">UPGRADE ELIGIBLE</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Building className="w-4 h-4" />
                      <h4 className="font-black text-sm uppercase">{offer.companyName}</h4>
                    </div>
                    <div className="text-xs font-bold text-gray-600 mt-0.5">{offer.roleTitle}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black">{offer.packageLpa} LPA</div>
                    <span className={`badge-stark ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} text-[10px]`}>
                      {statusStyle.label}
                    </span>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 text-[11px] font-bold text-gray-500 border-t border-gray-200 pt-2">
                  {offer.expiresAt && offer.status === "extended" && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires: {new Date(offer.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                  {offer.academicYear && (
                    <span>Year: {offer.academicYear}</span>
                  )}
                  {offer.isDreamEligible && offer.status === "extended" && (
                    <span className="flex items-center gap-1 text-yellow-700">
                      <TrendingUp className="w-3 h-3" />
                      {offer.packageLpa}x vs current {offer.currentAcceptedPackage} LPA
                    </span>
                  )}
                </div>

                {/* Status History */}
                {offer.statusHistory?.length > 1 && (
                  <div className="space-y-1 border-t border-gray-200 pt-2">
                    <div className="text-[10px] font-extrabold uppercase text-gray-400">Timeline</div>
                    <div className="flex gap-2 flex-wrap">
                      {offer.statusHistory.map((h, i) => (
                        <span key={i} className="badge-stark bg-gray-100 text-[9px]">
                          {h.status.toUpperCase()} · {new Date(h.changedAt).toLocaleDateString()}
                          {h.note ? ` — ${h.note}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {offer.status === "extended" && (
                  <div className="flex flex-wrap gap-2 border-t-2 border-black pt-3">
                    <button
                      onClick={() => handleAction("accept", offer._id)}
                      disabled={isLoading("accept")}
                      className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isLoading("accept") ? "ACCEPTING..." : offer.isDreamEligible ? "UPGRADE & ACCEPT" : "ACCEPT OFFER"}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Reason for rejection (optional):");
                        handleAction("reject", offer._id, { reason });
                      }}
                      disabled={isLoading("reject")}
                      className="btn-secondary flex items-center gap-1.5 px-4 py-2 text-xs"
                    >
                      <XCircle className="w-4 h-4" />
                      {isLoading("reject") ? "REJECTING..." : "REJECT"}
                    </button>
                  </div>
                )}

                {offer.status === "accepted" && (
                  <div className="flex flex-wrap gap-2 border-t-2 border-black pt-3">
                    <div className="badge-stark bg-green-200 text-xs font-black">
                      <CheckCircle className="w-4 h-4" /> Offer Accepted — Awaiting placement confirmation
                    </div>
                    <button
                      onClick={() => {
                        if (!confirm("Are you sure you want to withdraw this offer?")) return;
                        const reason = prompt("Reason for withdrawal:");
                        handleAction("withdraw", offer._id, { reason });
                      }}
                      disabled={isLoading("withdraw")}
                      className="btn-secondary flex items-center gap-1 px-3 py-1.5 text-xs text-red-700 border-red-700"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      {isLoading("withdraw") ? "WITHDRAWING..." : "WITHDRAW ACCEPTANCE"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
