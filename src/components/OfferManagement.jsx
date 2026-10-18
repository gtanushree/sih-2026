import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import {
  ShieldCheck, CheckCircle, XCircle, Package, Search,
  Filter, Zap, Star, RefreshCw, AlertTriangle, User,
  ChevronDown
} from "lucide-react";

const STATUS_STYLES = {
  extended:  { bg: "bg-blue-100",   label: "PENDING" },
  accepted:  { bg: "bg-green-200",  label: "ACCEPTED" },
  rejected:  { bg: "bg-red-100",    label: "REJECTED" },
  withdrawn: { bg: "bg-gray-200",   label: "WITHDRAWN" },
  expired:   { bg: "bg-orange-100", label: "EXPIRED" },
  placed:    { bg: "bg-black text-white", label: "PLACED ✓" },
};

export default function OfferManagement() {
  const [offers, setOffers] = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showOverride, setShowOverride] = useState(null); // offerId being overridden

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const res = await api.getAllOffers(params);
      setOffers(res.data?.offers || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const handlePlace = async (offerId) => {
    if (!confirm("Mark this student as officially placed?")) return;
    setActionLoading(offerId + "place");
    try {
      await api.markOfferPlaced(offerId);
      await fetchOffers();
    } catch (e) {
      alert(e.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOverride = async (offerId, newStatus, note) => {
    setActionLoading(offerId + "override");
    try {
      await api.tpoOverrideOffer(offerId, { newStatus, note });
      setShowOverride(null);
      await fetchOffers();
    } catch (e) {
      alert(e.response?.data?.message || "Override failed");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = offers.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.student?.name?.toLowerCase().includes(q) ||
      o.student?.email?.toLowerCase().includes(q) ||
      o.companyName?.toLowerCase().includes(q) ||
      o.roleTitle?.toLowerCase().includes(q)
    );
  });

  const stats = {
    extended: offers.filter(o => o.status === "extended").length,
    accepted: offers.filter(o => o.status === "accepted").length,
    placed:   offers.filter(o => o.status === "placed").length,
    rejected: offers.filter(o => o.status === "rejected").length,
  };

  return (
    <div className="card-stark bg-white mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-black pb-3 mb-4 gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="font-black text-sm uppercase">OFFER LIFECYCLE MANAGEMENT</h3>
        </div>
        <button onClick={fetchOffers} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> REFRESH
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "PENDING", count: stats.extended, bg: "bg-blue-50" },
          { label: "ACCEPTED", count: stats.accepted, bg: "bg-green-50" },
          { label: "PLACED", count: stats.placed, bg: "bg-black text-white" },
          { label: "REJECTED", count: stats.rejected, bg: "bg-red-50" },
        ].map(({ label, count, bg }) => (
          <div key={label} className={`border-2 border-black p-3 ${bg}`}>
            <div className="text-[10px] font-extrabold uppercase opacity-70">{label}</div>
            <div className="text-2xl font-black">{count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex items-center border-2 border-black bg-white flex-1">
          <Search className="ml-2.5 h-4 w-4 text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search student name, email, company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent py-2 pl-2 pr-3 text-xs font-medium outline-none"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", "extended", "accepted", "placed", "rejected", "withdrawn"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase border-2 border-black transition-colors ${filter === s ? "bg-black text-white" : "bg-white hover:bg-gray-100"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-xs font-bold p-4">Loading offers...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-2 border-black">
            <thead>
              <tr className="bg-black text-white text-xs uppercase">
                <th className="p-2 border-2 border-black">Student</th>
                <th className="p-2 border-2 border-black">Company / Role</th>
                <th className="p-2 border-2 border-black">Package</th>
                <th className="p-2 border-2 border-black">Type</th>
                <th className="p-2 border-2 border-black">Status</th>
                <th className="p-2 border-2 border-black">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs font-medium">
              {filtered.map(offer => {
                const ss = STATUS_STYLES[offer.status] || STATUS_STYLES.extended;
                return (
                  <tr key={offer._id} className={`hover:bg-gray-50 ${offer.tpoOverride ? "bg-purple-50" : ""}`}>
                    <td className="p-2 border-2 border-black">
                      <div className="font-extrabold">{offer.student?.name || "—"}</div>
                      <div className="text-[10px] text-gray-500">{offer.student?.email}</div>
                      <div className="text-[10px] font-bold">{offer.student?.branch} | CGPA: {offer.student?.cgpa}</div>
                    </td>
                    <td className="p-2 border-2 border-black">
                      <div className="font-black">{offer.companyName}</div>
                      <div className="text-[11px] text-gray-600">{offer.roleTitle}</div>
                    </td>
                    <td className="p-2 border-2 border-black font-black">{offer.packageLpa} LPA</td>
                    <td className="p-2 border-2 border-black">
                      {offer.offerType === "dream" && (
                        <span className="badge-stark bg-yellow-200 text-[9px]"><Star className="w-2.5 h-2.5" /> DREAM</span>
                      )}
                      {offer.offerType === "super-dream" && (
                        <span className="badge-stark bg-purple-200 text-[9px]"><Zap className="w-2.5 h-2.5" /> SUPER DREAM</span>
                      )}
                      {offer.offerType === "normal" && (
                        <span className="badge-stark bg-gray-100 text-[9px]">NORMAL</span>
                      )}
                    </td>
                    <td className="p-2 border-2 border-black">
                      <span className={`badge-stark text-[9px] ${ss.bg}`}>{ss.label}</span>
                      {offer.tpoOverride && <div className="text-[9px] text-purple-600 mt-0.5">TPO OVERRIDE</div>}
                    </td>
                    <td className="p-2 border-2 border-black">
                      <div className="flex flex-col gap-1">
                        {offer.status === "accepted" && (
                          <button
                            onClick={() => handlePlace(offer._id)}
                            disabled={actionLoading === offer._id + "place"}
                            className="btn-primary px-2 py-1 text-[9px]"
                          >
                            <CheckCircle className="w-3 h-3" />
                            {actionLoading === offer._id + "place" ? "..." : "MARK PLACED"}
                          </button>
                        )}
                        {showOverride === offer._id ? (
                          <OverridePanel
                            offerId={offer._id}
                            onSubmit={handleOverride}
                            onCancel={() => setShowOverride(null)}
                            loading={actionLoading === offer._id + "override"}
                          />
                        ) : (
                          <button
                            onClick={() => setShowOverride(offer._id)}
                            className="btn-secondary px-2 py-1 text-[9px]"
                          >
                            TPO OVERRIDE
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center border-2 border-black font-bold text-gray-500">
                    No offers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OverridePanel({ offerId, onSubmit, onCancel, loading }) {
  const [newStatus, setNewStatus] = useState("accepted");
  const [note, setNote] = useState("");

  return (
    <div className="border-2 border-purple-600 p-2 bg-purple-50 space-y-1.5">
      <div className="text-[9px] font-black uppercase text-purple-700">TPO Override</div>
      <select
        value={newStatus}
        onChange={e => setNewStatus(e.target.value)}
        className="w-full border border-black text-[10px] p-1 font-bold"
      >
        {["extended","accepted","rejected","expired","withdrawn","placed"].map(s => (
          <option key={s} value={s}>{s.toUpperCase()}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Override reason..."
        value={note}
        onChange={e => setNote(e.target.value)}
        className="w-full border border-black text-[10px] p-1 font-medium"
      />
      <div className="flex gap-1">
        <button
          onClick={() => onSubmit(offerId, newStatus, note)}
          disabled={loading}
          className="btn-primary px-2 py-1 text-[9px]"
        >
          {loading ? "..." : "APPLY"}
        </button>
        <button onClick={onCancel} className="btn-secondary px-2 py-1 text-[9px]">CANCEL</button>
      </div>
    </div>
  );
}
