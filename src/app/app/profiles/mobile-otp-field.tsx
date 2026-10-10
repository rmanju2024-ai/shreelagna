"use client";

import { useState } from "react";
import { sendMobileOtp, verifyMobileOtp } from "@/app/app/profiles/otp-actions";
import { btnGhost, inputClass } from "@/lib/ui/classes";

export function VerifyFlag({
  on,
  label,
  tone = "gold",
}: {
  on: boolean;
  label: string;
  tone?: "whatsapp" | "gold";
}) {
  return (
    <span className={`verify-flag verify-flag-${tone}${on ? " is-on" : " is-off"}`}>
      <span className="verify-flag-mark" aria-hidden>
        {on ? "✓" : "•"}
      </span>
      {on ? label : `Not ${label.toLowerCase()}`}
    </span>
  );
}

export function MobileOtpField({
  profileId,
  defaultMobile,
  verified,
  staffView = false,
  embed = false,
}: {
  profileId?: string;
  defaultMobile: string;
  verified: boolean;
  staffView?: boolean;
  embed?: boolean;
}) {
  const [mobile, setMobile] = useState(defaultMobile);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [ok, setOk] = useState(verified);
  const sameAsSaved = mobile.replace(/\D/g, "") === defaultMobile.replace(/\D/g, "");
  const showVerified = ok && sameAsSaved;

  async function send() {
    if (!profileId) return;
    setBusy("send");
    setNote("");
    const result = await sendMobileOtp(profileId, mobile);
    setBusy(null);
    if (!result.ok) {
      setNote(result.error);
      return;
    }
    setSent(true);
    setOk(false);
    setPreview(result.preview ?? null);
    setNote(
      result.preview
        ? "Arattai is not live yet. Use this code to test Confirm."
        : "Code sent on Arattai.",
    );
  }

  async function verify() {
    if (!profileId) return;
    setBusy("verify");
    setNote("");
    const result = await verifyMobileOtp(profileId, mobile, code);
    setBusy(null);
    if (!result.ok) {
      setNote(result.error);
      return;
    }
    setOk(true);
    setSent(false);
    setCode("");
    setPreview(null);
    setNote("Mobile confirmed on Arattai.");
  }

  return (
    <>
      {embed ? null : (
        <input
          name="subject_mobile"
          required
          inputMode="numeric"
          minLength={10}
          maxLength={15}
          pattern="[0-9]{10,15}"
          value={mobile}
          onChange={(e) => {
            setMobile(e.target.value);
            setOk(false);
          }}
          className={inputClass}
        />
      )}
      {staffView ? (
        <p className="otp-hint">The member confirms this number on Arattai after they sign in.</p>
      ) : !profileId ? (
        <p className="otp-hint">Save the profile, then confirm this number on Arattai.</p>
      ) : showVerified ? (
        <VerifyFlag on tone="whatsapp" label="Arattai verified" />
      ) : (
        <div className="otp-row">
          <button type="button" className={btnGhost} disabled={busy !== null || mobile.replace(/\D/g, "").length < 10} onClick={send}>
            {busy === "send" ? "Sending…" : "Send Arattai code"}
          </button>
          {sent ? (
            <>
              <input
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={inputClass}
                autoComplete="one-time-code"
              />
              <button type="button" className={btnGhost} disabled={busy !== null || code.replace(/\D/g, "").length !== 6} onClick={verify}>
                {busy === "verify" ? "Checking…" : "Confirm"}
              </button>
            </>
          ) : null}
        </div>
      )}
      {preview ? <p className="otp-hint">Code {preview}</p> : null}
      {note ? <p className={showVerified || note.includes("confirmed") ? "otp-ok" : "otp-hint"}>{note}</p> : null}
    </>
  );
}
