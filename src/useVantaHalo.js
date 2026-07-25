import { useEffect, useRef } from "react";

export default function useVantaHalo() {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    const loadVanta = () => {
      if (vantaEffect.current) return;
      if (!window.VANTA) return;

      vantaEffect.current = window.VANTA.HALO({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
      });
    };

    // Inject Three.js
    const three = document.createElement("script");
    three.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js";
    three.onload = () => {
      // Inject Vanta after Three.js is ready
      const vanta = document.createElement("script");
      vanta.src = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.halo.min.js";
      vanta.onload = loadVanta;
      document.body.appendChild(vanta);
    };
    document.body.appendChild(three);

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  return vantaRef;
}