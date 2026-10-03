// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const router = { replace: vi.fn(), refresh: vi.fn() };

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/app/app/profiles/actions", () => ({
  deleteOwnProfile: async () => ({ ok: true }),
}));

vi.mock("@/app/desk/profiles/actions", () => ({
  deleteDeskProfile: async () => ({ ok: true }),
}));

import { ProfileDeleteControl } from "./profile-delete-control";

afterEach(() => {
  cleanup();
  router.replace.mockClear();
  router.refresh.mockClear();
});

describe("ProfileDeleteControl", () => {
  it("keeps the permanent action disabled until the exact confirmation is supplied", () => {
    render(<ProfileDeleteControl profileId="profile-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Delete profile" }));

    const dialog = screen.getByRole("dialog", { name: "Delete this profile?" });
    const confirm = screen.getByRole("button", { name: "Delete permanently" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "remove" } });
    expect(confirm.disabled).toBe(true);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: " delete " } });
    expect(confirm.disabled).toBe(false);
    expect(dialog).toBeTruthy();
  });

  it("closes safely when the member keeps the profile", () => {
    render(<ProfileDeleteControl profileId="profile-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Delete profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep profile" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("closes on Escape without deleting", () => {
    render(<ProfileDeleteControl profileId="profile-1" staff compact />);
    fireEvent.click(screen.getByRole("button", { name: "Delete profile" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
