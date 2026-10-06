export function HouseRoleSeal({
  mark,
  overlay = false,
}: {
  mark: "admin" | "staff" | "member";
  overlay?: boolean;
}) {
  const label = mark === "admin" ? "Admin" : mark === "staff" ? "Staff" : "Member";
  return (
    <span
      className={`house-role-seal is-${mark}${overlay ? " is-overlay" : ""}`}
      title={label}
      aria-hidden="true"
    >
      <b>{label}</b>
    </span>
  );
}

export function houseRoleLabel(mark: "admin" | "staff" | "member") {
  return mark === "admin" ? "Admin" : mark === "staff" ? "Staff" : "Member";
}
