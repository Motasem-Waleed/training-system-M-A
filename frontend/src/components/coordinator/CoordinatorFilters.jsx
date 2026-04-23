import { GOVERNING_BODIES, DIRECTORATES } from "../../config/coordinator/governingBodies";
import { TRACKS, SITE_TYPES } from "../../config/coordinator/trackFilters";
import { STATUS_LABELS } from "../../config/coordinator/statusLabels";

export default function CoordinatorFilters({
  filters,
  setFilters,
  showStatus = true,
  showDepartment = false,
  showPeriod = false,
  showGoverningBody = false,
  showTrack = false,
  showSiteType = false,
  showSearch = true,
  departments = [],
  periods = [],
  statusOptions = null,
}) {
  const update = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const effectiveStatusOptions =
    statusOptions ||
    Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <div className="filters-bar" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      {showSearch && (
        <input
          placeholder="بحث بالاسم أو الرقم الجامعي..."
          value={filters.search || ""}
          onChange={(e) => update("search", e.target.value)}
          style={{ minWidth: 200, flex: "1 1 200px" }}
        />
      )}

      {showStatus && (
        <select
          value={filters.status || ""}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="">كل الحالات</option>
          {effectiveStatusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {showDepartment && departments.length > 0 && (
        <select
          value={filters.department || ""}
          onChange={(e) => update("department", e.target.value)}
        >
          <option value="">كل الأقسام</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      )}

      {showPeriod && periods.length > 0 && (
        <select
          value={filters.period || ""}
          onChange={(e) => update("period", e.target.value)}
        >
          <option value="">كل الفترات</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || `فترة #${p.id}`}
            </option>
          ))}
        </select>
      )}

      {showGoverningBody && (
        <select
          value={filters.governing_body || ""}
          onChange={(e) => update("governing_body", e.target.value)}
        >
          <option value="">كل الجهات</option>
          {GOVERNING_BODIES.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      )}

      {showTrack && (
        <select
          value={filters.track || ""}
          onChange={(e) => update("track", e.target.value)}
        >
          <option value="">كل المسارات</option>
          {TRACKS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      )}

      {showSiteType && (
        <select
          value={filters.site_type || ""}
          onChange={(e) => update("site_type", e.target.value)}
        >
          <option value="">كل الأنواع</option>
          {SITE_TYPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      )}

      <button
        className="btn-sm btn-secondary"
        onClick={() =>
          setFilters({
            status: "",
            department: "",
            period: "",
            governing_body: "",
            track: "",
            site_type: "",
            search: "",
          })
        }
      >
        مسح الفلاتر
      </button>
    </div>
  );
}
