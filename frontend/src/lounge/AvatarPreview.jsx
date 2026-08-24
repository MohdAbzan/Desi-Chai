import { useEffect, useRef } from "react";
import { drawAvatar } from "./LoungeCanvas";

export default function AvatarPreview({ user, size = 160 }) {
  const ref = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    let raf;
    const loop = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const t = performance.now() / 1000;
      const pos = { x: size / 2, y: size * 0.78, s: 1.35, leanDir: 1 };
      drawAvatar(ctx, pos, { ...userRef.current, id: "preview" }, {}, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return <canvas ref={ref} style={{ width: size, height: size }} data-testid="avatar-preview" />;
}
