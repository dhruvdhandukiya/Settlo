"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Sparkles, Shield, Zap, Wifi } from "lucide-react";
import { useCurrency } from "@/components/providers/currency-context";
import { SettloLogo } from "@/components/settlo-logo";

export function Hero3DCard() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const { currency, currencySymbol, formatAmount, setCurrency } = useCurrency();

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 7.2;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const emeraldLight = new THREE.PointLight(0x10b981, 4.5, 20);
    emeraldLight.position.set(4, 3, 4);
    scene.add(emeraldLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 3.5, 20);
    cyanLight.position.set(-4, -3, 3);
    scene.add(cyanLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 1.6);
    topLight.position.set(0, 8, 6);
    scene.add(topLight);

    // 4. Main 3D Card Group
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);

    // Card Body
    const cardWidth = 4.4;
    const cardHeight = 2.75;
    const cardDepth = 0.12;
    const cardGeo = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth, 4, 4, 4);

    // Frosted obsidian glass material with emerald gradient sheen
    const cardMat = new THREE.MeshPhysicalMaterial({
      color: 0x071118,
      metalness: 0.45,
      roughness: 0.18,
      transmission: 0.55,
      thickness: 0.6,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.95,
    });
    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    cardGroup.add(cardMesh);

    // Metallic Emerald Card Border Glow Trim
    const edgeGeo = new THREE.BoxGeometry(
      cardWidth + 0.03,
      cardHeight + 0.03,
      cardDepth + 0.02
    );
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
    cardGroup.add(edgeMesh);

    // 3D EMV Smart Chip
    const chipGeo = new THREE.BoxGeometry(0.65, 0.48, 0.04);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.25,
    });
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    chipMesh.position.set(-1.45, 0.55, 0.08);
    cardGroup.add(chipMesh);

    // 5. Orbiting 3D Metallic Currency Tokens
    const currencyData = [
      { code: "USD", symbol: "$", color: 0x10b981 },
      { code: "EUR", symbol: "€", color: 0x06b6d4 },
      { code: "INR", symbol: "₹", color: 0x34d399 },
      { code: "GBP", symbol: "£", color: 0x8b5cf6 },
      { code: "AED", symbol: "د.إ", color: 0xf59e0b },
    ];
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    const orbitCoins = [];
    currencyData.forEach((curr, idx) => {
      const coinGroup = new THREE.Group();
      const coinGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 32);
      const coinMat = new THREE.MeshStandardMaterial({
        color: curr.color,
        metalness: 0.85,
        roughness: 0.2,
        emissive: curr.color,
        emissiveIntensity: 0.3,
      });
      const coinMesh = new THREE.Mesh(coinGeo, coinMat);
      coinMesh.rotation.x = Math.PI / 2;
      coinGroup.add(coinMesh);

      // Glowing outer ring
      const ringGeo = new THREE.TorusGeometry(0.4, 0.02, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: curr.color,
        transparent: true,
        opacity: 0.75,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      coinGroup.add(ringMesh);

      orbitGroup.add(coinGroup);
      orbitCoins.push({
        group: coinGroup,
        code: curr.code,
        speed: 0.7 + idx * 0.12,
        radiusX: 3.3 + (idx % 2) * 0.5,
        radiusY: 1.7 + (idx % 3) * 0.4,
        offset: (idx * Math.PI * 2) / currencyData.length,
        tilt: 0.25 + idx * 0.15,
      });
    });

    // 6. Background Subtle Grid Dots / Starfield
    const dotCount = 140;
    const dotGeo = new THREE.BufferGeometry();
    const dotPositions = new Float32Array(dotCount * 3);
    const dotColors = new Float32Array(dotCount * 3);

    const c1 = new THREE.Color(0x10b981);
    const c2 = new THREE.Color(0x06b6d4);
    const c3 = new THREE.Color(0x334155);

    for (let i = 0; i < dotCount; i++) {
      dotPositions[i * 3] = (Math.random() - 0.5) * 16;
      dotPositions[i * 3 + 1] = (Math.random() - 0.5) * 11;
      dotPositions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;

      const pickColor = Math.random() > 0.6 ? c1 : Math.random() > 0.3 ? c2 : c3;
      dotColors[i * 3] = pickColor.r;
      dotColors[i * 3 + 1] = pickColor.g;
      dotColors[i * 3 + 2] = pickColor.b;
    }

    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPositions, 3));
    dotGeo.setAttribute("color", new THREE.BufferAttribute(dotColors, 3));

    const dotMat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
    });
    const dots = new THREE.Points(dotGeo, dotMat);
    scene.add(dots);

    // 7. Mouse Interactions
    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseRef.current.targetX = x * 2;
      mouseRef.current.targetY = y * 2;
    };

    const handlePointerLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // 9. Animation Loop (60 FPS)
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      mouseRef.current.x +=
        (mouseRef.current.targetX - mouseRef.current.x) * 0.07;
      mouseRef.current.y +=
        (mouseRef.current.targetY - mouseRef.current.y) * 0.07;

      // Base card tilt angle (tilted like screenshot, plus mouse parallax)
      const baseTiltX = 0.12;
      const baseTiltY = -0.22;
      const baseTiltZ = -0.08;

      cardGroup.rotation.x =
        baseTiltX - mouseRef.current.y * 0.4 + Math.sin(elapsedTime * 0.8) * 0.05;
      cardGroup.rotation.y =
        baseTiltY + mouseRef.current.x * 0.5 + Math.cos(elapsedTime * 0.6) * 0.05;
      cardGroup.rotation.z = baseTiltZ + mouseRef.current.x * 0.08;

      cardGroup.position.y = Math.sin(elapsedTime * 1.4) * 0.12;
      cardGroup.position.z = Math.sin(elapsedTime * 1.1) * 0.1;

      // Orbit currency coins
      orbitCoins.forEach((coin, i) => {
        const angle = elapsedTime * coin.speed * 0.45 + coin.offset;
        const x = Math.cos(angle) * coin.radiusX;
        const y = Math.sin(angle) * coin.radiusY + Math.sin(elapsedTime + i) * 0.18;
        const z = Math.sin(angle) * 1.7;

        coin.group.position.set(x, y, z);
        coin.group.rotation.y = elapsedTime * 1.8 + i;
        coin.group.rotation.x = Math.sin(elapsedTime * 1.2 + i) * 0.4 + coin.tilt;
      });

      // Subtle dot drift
      dots.rotation.y = elapsedTime * 0.02;

      // Dynamic light movement
      emeraldLight.position.x = Math.sin(elapsedTime * 0.7) * 4.5;
      emeraldLight.position.y = Math.cos(elapsedTime * 0.5) * 3.5;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);

      cardGeo.dispose();
      cardMat.dispose();
      edgeGeo.dispose();
      edgeMat.dispose();
      chipGeo.dispose();
      chipMat.dispose();
      dotGeo.dispose();
      dotMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] flex items-center justify-center select-none"
    >
      {/* Three.js 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/15 rounded-full blur-[90px] pointer-events-none -z-10" />

      {/* Floating 2D/3D Hybrid Overlay on Card */}
      <div className="relative z-10 pointer-events-none w-[280px] sm:w-[320px] h-[175px] sm:h-[200px] flex flex-col justify-between p-5 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              TOTAL BALANCE ({currency})
            </span>
          </div>
          <Wifi className="h-4 w-4 text-emerald-400/80 rotate-90" />
        </div>

        <div className="space-y-0.5">
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
            {formatAmount(8420.51)}
          </div>
          <div className="text-[11px] text-emerald-300/80 font-medium">
            +₹3,200.00 from Alex • Settled in real-time
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>•••• 4829</span>
          <div className="flex items-center gap-1 font-sans">
            <span className="font-bold text-white text-xs tracking-tight">Settlo</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      {/* Currency Switcher Buttons around 3D space */}
      <div className="absolute bottom-2 right-4 sm:right-8 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-white/10 text-[11px] font-mono">
        <span className="text-slate-400 px-1 text-[10px]">CURRENCY:</span>
        {["USD", "INR", "EUR", "GBP"].map((code) => (
          <button
            key={code}
            onClick={() => setCurrency(code)}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              currency === code
                ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
}
