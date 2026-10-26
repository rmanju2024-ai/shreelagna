import type { SceneId } from "@/lib/ui/scenes";

const ORBS = [
  { x: "12%", y: "22%", s: "4.2rem", d: "0s" },
  { x: "78%", y: "18%", s: "3.1rem", d: "1.2s" },
  { x: "18%", y: "68%", s: "2.4rem", d: "0.6s" },
  { x: "84%", y: "62%", s: "3.6rem", d: "1.8s" },
  { x: "46%", y: "12%", s: "1.8rem", d: "0.3s" },
];

export function WeddingScreensaver({ tone = "wedding" }: { tone?: SceneId }) {
  return (
    <div className={`foil-stage is-${tone}`} aria-hidden>
      <div className="foil-stage-sky" />
      <div className="foil-stage-silk" />
      <div className="foil-stage-floor" />
      <div className="foil-stage-world">
        <i className="foil-ring is-outer" />
        <i className="foil-ring is-mid" />
        <i className="foil-ring is-inner" />
        <div className="foil-lotus">
          {Array.from({ length: 8 }, (_, i) => (
            <b key={i} style={{ transform: `rotate(${i * 45}deg)` }} />
          ))}
          <em />
        </div>
      </div>
      {ORBS.map((orb) => (
        <span
          key={orb.x + orb.y}
          className="foil-orb"
          style={{ left: orb.x, top: orb.y, width: orb.s, height: orb.s, animationDelay: orb.d }}
        />
      ))}
    </div>
  );
}
