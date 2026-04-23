import { STATUS_LABELS, STATUS_COLORS } from "../../config/coordinator/statusLabels";

export default function StatusBadge({ status, size = "sm" }) {
  const label = STATUS_LABELS[status] || status;
  const colors = STATUS_COLORS[status] || { bg: "#e9ecef", text: "#495057" };

  const sizeStyles =
    size === "lg"
      ? { padding: "6px 14px", fontSize: "14px" }
      : { padding: "3px 8px", fontSize: "12px" };

  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        borderRadius: "6px",
        fontWeight: 700,
        display: "inline-block",
        whiteSpace: "nowrap",
        ...sizeStyles,
      }}
    >
      {label}
    </span>
  );
}
