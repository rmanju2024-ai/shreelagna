import { describe, expect, it } from "vitest";
import { canViewProfile, isPublicProfileStatus, oppositeType } from "./visibility";

describe("visibility", () => {
  it("maps vadhu to vara and back", () => {
    expect(oppositeType("vadhu")).toBe("vara");
    expect(oppositeType("vara")).toBe("vadhu");
  });

  it("lets a vadhu view an active vara only", () => {
    expect(
      canViewProfile({
        viewerType: "vadhu",
        viewerStatus: "active",
        targetType: "vara",
        targetStatus: "active",
        isOwner: false,
        isStaff: false,
      }),
    ).toBe(true);
    expect(
      canViewProfile({
        viewerType: "vadhu",
        viewerStatus: "active",
        targetType: "vadhu",
        targetStatus: "active",
        isOwner: false,
        isStaff: false,
      }),
    ).toBe(false);
  });

  it("blocks hidden and deleted profiles", () => {
    expect(isPublicProfileStatus("hidden")).toBe(false);
    expect(isPublicProfileStatus("banned")).toBe(false);
    expect(
      canViewProfile({
        viewerType: "vara",
        viewerStatus: "active",
        targetType: "vadhu",
        targetStatus: "hidden",
        isOwner: false,
        isStaff: false,
      }),
    ).toBe(false);
    expect(
      canViewProfile({
        viewerType: "vara",
        viewerStatus: "active",
        targetType: "vadhu",
        targetStatus: "hidden",
        isOwner: false,
        isStaff: true,
      }),
    ).toBe(true);
  });

  it("lets staff open a profile awaiting review", () => {
    expect(
      canViewProfile({
        viewerType: null,
        targetType: "vadhu",
        targetStatus: "pending_review",
        isOwner: false,
        isStaff: true,
      }),
    ).toBe(true);
    expect(
      canViewProfile({
        viewerType: "vara",
        viewerStatus: "active",
        targetType: "vadhu",
        targetStatus: "pending_review",
        isOwner: false,
        isStaff: false,
      }),
    ).toBe(false);
  });

  it("blocks hidden viewers from opening other profiles", () => {
    expect(
      canViewProfile({
        viewerType: "vara",
        viewerStatus: "hidden",
        targetType: "vadhu",
        targetStatus: "active",
        isOwner: false,
        isStaff: false,
      }),
    ).toBe(false);
  });

  it("lets sent or received interest open an active profile", () => {
    expect(
      canViewProfile({
        viewerType: null,
        viewerStatus: "hidden",
        targetType: "vadhu",
        targetStatus: "active",
        isOwner: false,
        isStaff: false,
        linkedByInterest: true,
      }),
    ).toBe(true);
    expect(
      canViewProfile({
        viewerType: "vara",
        viewerStatus: "active",
        targetType: "vadhu",
        targetStatus: "hidden",
        isOwner: false,
        isStaff: false,
        linkedByInterest: true,
      }),
    ).toBe(false);
  });

  it("lets the owner open their own hidden profile", () => {
    expect(
      canViewProfile({
        viewerType: "vadhu",
        viewerStatus: "hidden",
        targetType: "vadhu",
        targetStatus: "hidden",
        isOwner: true,
        isStaff: false,
      }),
    ).toBe(true);
  });

  it("hides admin-owned profiles from staff and members", () => {
    expect(
      canViewProfile({
        viewerType: "vadhu",
        viewerStatus: "active",
        targetType: "vara",
        targetStatus: "active",
        isOwner: false,
        isStaff: true,
        targetOwnerIsAdmin: true,
        viewerIsAdmin: false,
      }),
    ).toBe(false);
    expect(
      canViewProfile({
        viewerType: "vadhu",
        viewerStatus: "active",
        targetType: "vara",
        targetStatus: "active",
        isOwner: false,
        isStaff: false,
        targetOwnerIsAdmin: true,
        viewerIsAdmin: true,
      }),
    ).toBe(true);
  });

  it("allows staff to view active same-type profiles", () => {
    expect(
      canViewProfile({
        viewerType: "vadhu",
        viewerStatus: "active",
        targetType: "vadhu",
        targetStatus: "active",
        isOwner: false,
        isStaff: true,
      }),
    ).toBe(true);
  });
});
