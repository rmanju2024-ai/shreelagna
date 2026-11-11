// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThreadView } from "./thread-view";

vi.mock("@/app/app/match/actions", () => ({
  sendPeekChat: vi.fn(async () => ({ ok: true })),
  editChatMessage: vi.fn(async () => ({ ok: true })),
  deleteChatMessage: vi.fn(async () => ({ ok: true })),
}));

afterEach(cleanup);

describe("ThreadView message options", () => {
  it("lets you open Edit and Delete on your own message", () => {
    render(
      <ThreadView
        threadId="t1"
        myProfileId="me"
        canSend
        messages={[
          {
            id: "1",
            sender_profile_id: "me",
            body: "iji",
            created_at: "2026-09-28T10:00:00Z",
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Message options" }));
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect((screen.getByLabelText("Edit your note") as HTMLTextAreaElement).value).toBe("iji");
  });

  it("keeps send off until there is a note, and prints Sent not ticks", () => {
    render(
      <ThreadView
        threadId="t1"
        myProfileId="me"
        canSend
        messages={[
          {
            id: "1",
            sender_profile_id: "me",
            body: "Namaskara",
            created_at: "2026-09-28T10:00:00Z",
          },
        ]}
      />,
    );
    expect(screen.getByLabelText("Write to the family…")).toBeTruthy();
    expect(screen.getByLabelText("Sent")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Send" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
