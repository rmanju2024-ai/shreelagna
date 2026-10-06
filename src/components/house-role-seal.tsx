import { useId } from "react";

export function HouseRoleSeal({
  mark,
  overlay = false,
}: {
  mark: "admin" | "staff" | "member";
  overlay?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const label = mark === "admin" ? "Admin" : mark === "staff" ? "Staff" : "Member";
  return (
    <span
      className={`house-role-seal is-${mark}${overlay ? " is-overlay" : ""}`}
      title={label}
      aria-hidden="true"
    >
      <svg className="house-star" viewBox="0 0 64 64">
        <defs>
          <linearGradient id={`${uid}-fill`} x1="18%" y1="6%" x2="84%" y2="96%">
            <stop offset="0%" stopColor="#fff8d4" />
            <stop offset="38%" stopColor="#ffd45c" />
            <stop offset="72%" stopColor="#f0a429" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id={`${uid}-edge`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff7e0" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="42%" r="48%">
            <stop offset="0%" stopColor="#fffce8" />
            <stop offset="55%" stopColor="#ffd56a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="28" fill={`url(#${uid}-glow)`} className="house-star-halo" />
        <path
          className="house-star-body"
          fill={`url(#${uid}-fill)`}
          stroke={`url(#${uid}-edge)`}
          strokeWidth="1.4"
          strokeLinejoin="round"
          d="M32 6.2 38.4 23.4 56.6 24.1 42.4 35.6 47.6 53.4 32 43.8 16.4 53.4 21.6 35.6 7.4 24.1 25.6 23.4Z"
        />
        <path
          className="house-star-shine"
          fill="#fffdf4"
          opacity="0.72"
          d="M32 11.4 35.1 22.2 32 21.2 28.9 22.2Z"
        />
        <circle className="house-star-spark" cx="40.5" cy="18.5" r="2.1" fill="#fff" />
      </svg>
      <b>{label}</b>
    </span>
  );
}

export function houseRoleLabel(mark: "admin" | "staff" | "member") {
  return mark === "admin" ? "Admin" : mark === "staff" ? "Staff" : "Member";
}
