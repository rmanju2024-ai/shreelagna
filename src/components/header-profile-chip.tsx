import Link from "next/link";
import { HouseRoleSeal, houseRoleLabel } from "@/components/house-role-seal";

export function HeaderProfileChip({
  name,
  pending,
  mark = "member",
  overlay = false,
}: {
  name: string;
  pending: boolean;
  mark?: "admin" | "staff" | "member";
  overlay?: boolean;
}) {
  const role = houseRoleLabel(mark);
  return (
    <Link
      href={pending ? "/app/profiles/new" : "/app"}
      className={`header-profile-chip is-${mark}${pending ? " is-pending" : ""}${overlay ? " is-overlay" : ""}`}
      aria-label={`${role}, ${name}`}
    >
      <HouseRoleSeal mark={mark} overlay={overlay} />
      <span className="header-profile-chip-copy">
        <span>{role}</span>
        <strong>{name}</strong>
      </span>
    </Link>
  );
}
