import { useEffect, useRef } from "react";
export type Motion =
  | "approach"
  | "rescue"
  | "talk"
  | "promise"
  | "scan"
  | "leave"
  | "build"
  | "release"
  | "conflict"
  | "rest"
  | "repair";
export function PixelWorld({
  scene = "wasteland",
  age = 0,
  damage = 0,
  hero = false,
  arc,
  motion = "approach",
  beat = 0,
  name = "ルカ",
}: {
  scene?: string;
  age?: number;
  damage?: number;
  hero?: boolean;
  arc?: string;
  motion?: Motion;
  beat?: number;
  name?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!,
      ctx = c.getContext("2d")!;
    const w = 480,
      h = 260;
    const started = performance.now();
    let frame = 0,
      raf = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,
    ) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
    };
    function draw() {
      frame++;
      const t = reduced ? 4 : (performance.now() - started) / 1000;
      const progress = reduced || beat > 0 ? 1 : Math.min(1, t / 2.8);
      const snow = scene === "snow",
        green = scene === "forest",
        lab = ["lab", "data"].includes(scene),
        village = ["village", "rebuilt"].includes(scene);
      ctx.clearRect(0, 0, w, h);
      rect(
        0,
        0,
        w,
        h,
        snow ? "#7e999f" : lab ? "#1b3034" : green ? "#728b80" : "#a79c80",
      );
      for (let y = 0; y < 175; y += 5)
        rect(
          0,
          y,
          w,
          5,
          lab
            ? `rgb(${27 + y / 18},${48 + y / 20},${52 + y / 20})`
            : snow
              ? `rgb(${126 + y / 8},${153 + y / 10},${159 + y / 12})`
              : `rgb(${159 + y / 7},${153 + y / 9},${127 + y / 13})`,
        );
      if (!lab) {
        rect(338, 32, 29, 29, "#e9d7a5");
        rect(333, 37, 39, 19, "#e9d7a5");
        rect(300, 66, 77, 2, "#cdc1a0");
        rect(66, 44, 92, 2, "#cbc3a5");
      }
      // Deterministic distant ruins: no external imagery.
      for (let i = 0; i < 22; i++) {
        const x = i * 25 - 12,
          ht = 23 + ((i * 37) % 73);
        rect(
          x,
          172 - ht,
          18 + (i % 4) * 3,
          ht,
          lab ? "#284348" : snow ? "#647e83" : green ? "#5c7165" : "#6b7770",
        );
        if (i % 3 === 0) rect(x + 3, 160 - ht, 4, 12, "#6b7770");
        for (let yy = 177 - ht; yy < 166; yy += 13)
          for (let xx = x + 4; xx < x + 17; xx += 7)
            rect(xx, yy, 3, 5, "#b7ab87");
      }
      rect(
        0,
        169,
        w,
        91,
        snow ? "#bccaca" : green ? "#5e7058" : lab ? "#283b3a" : "#7c7c61",
      );
      rect(0, 176, w, 4, snow ? "#d5deda" : "#929078");
      if (lab) {
        for (let i = 0; i < 5; i++) {
          rect(i * 108 + 15, 28, 66, 145, "#11282a");
          rect(i * 108 + 19, 32, 58, 4, "#54726b");
          for (let yy = 43; yy < 159; yy += 16) {
            rect(i * 108 + 23, yy, 49, 11, "#30494a");
            rect(
              i * 108 + 27,
              yy + 3,
              3,
              3,
              (i + yy) % 3 ? "#89bda4" : "#bc7856",
            );
          }
        }
        rect(0, 9, 480, 5, "#41615b");
      } else if (village) {
        for (let i = 0; i < 3; i++) {
          const x = i * 160 + 15;
          rect(x, 122, 105, 65, "#7b7760");
          rect(x - 5, 116, 115, 7, "#484e43");
          rect(x + 8, 108, 91, 8, "#626351");
          rect(x + 38, 149, 24, 38, "#353f39");
          rect(x + 10, 138, 18, 17, "#dbb978");
          rect(x + 77, 138, 18, 17, "#dbb978");
        }
        if (scene === "rebuilt") {
          rect(426, 73, 4, 100, "#484e43");
          rect(401, 94, 56, 3, "#484e43");
          rect(426, 67, 3, 62, "#485e48");
        }
      } else if (green) {
        for (let i = 0; i < 8; i++) {
          const x = i * 71 - 10;
          rect(x + 18, 95, 8, 98, "#424e3c");
          for (let j = 0; j < 4; j++)
            rect(x - j * 4, 65 + j * 13, 44 + j * 8, 24, "#455e46");
        }
        rect(0, 183, 480, 5, "#82936c");
      } else if (!snow) {
        rect(31, 104, 58, 82, "#4c5952");
        rect(34, 98, 35, 6, "#4c5952");
        rect(66, 89, 9, 19, "#4c5952");
        rect(44, 118, 16, 27, "#9a9b7e");
        rect(70, 151, 18, 35, "#293e3b");
        rect(379, 113, 74, 75, "#586258");
        rect(396, 104, 57, 9, "#586258");
        rect(399, 126, 18, 25, "#9d9e80");
        rect(425, 150, 24, 38, "#384b44");
        rect(117, 156, 28, 24, "#667063");
        rect(115, 152, 14, 5, "#667063");
      }
      for (let i = 0; i < 90; i++) {
        const x = (i * 133 + 19) % 480,
          y = 186 + ((i * 29) % 74);
        rect(
          x,
          y,
          2 + (i % 7),
          1 + (i % 2),
          snow ? "#9fb5b6" : green ? "#87956a" : "#939078",
        );
      }
      if (!lab) {
        rect(0, 234, 480, 26, snow ? "#9aafad" : green ? "#394e3d" : "#465244");
        for (let i = 0; i < 24; i++) {
          const x = i * 23;
          rect(x, 228 - (i % 4) * 3, 2, 10, "#465244");
          rect(x + 2, 226 - (i % 4) * 3, 4, 2, "#697354");
        }
      }
      if (scene === "coast") {
        rect(0, 145, 480, 88, "#628d89");
        for (let k = 0; k < 12; k++)
          rect((k * 57 + t * 8) % 480, 151 + ((k * 19) % 75), 28, 2, "#b1c6b1");
        rect(0, 222, 480, 38, "#9c9d78");
      }
      // Luka: a hand-drawn pixel silhouette with articulated joints and an amber heart.
      const animated = !!arc;
      const moving =
        motion === "leave"
          ? progress
          : motion === "approach"
            ? 1 - progress
            : 0;
      const rx = animated
          ? motion === "leave"
            ? 205 - progress * 110
            : 190 - moving * 80
          : hero
            ? 234
            : 232,
        ry =
          130 +
          (motion === "rest"
            ? 12
            : Math.floor(Math.sin(t * (moving ? 9 : 1.6)) * (moving ? 3 : 1)));
      // A second actor and authored action effects turn the scene into a short vignette.
      if (animated && arc !== "empty" && motion !== "rest") {
        const child = arc === "girl",
          machine = arc === "robots" || arc === "ai";
        const fallen =
          (arc === "traveler" || arc === "snow") &&
          (motion === "approach" || (motion === "rescue" && progress < 0.5));
        const ax = 330,
          ay = child ? 185 : 169;
        if (fallen) {
          rect(ax - 15, 218, 45, 13, "#4b5551");
          rect(ax + 22, 211, 13, 14, "#c8ab86");
        } else {
          rect(ax - 6, ay + 32, 6, 28, "#354540");
          rect(ax + 6, ay + 32, 6, 28, "#354540");
          rect(
            ax - 11,
            ay + 5,
            26,
            32,
            machine
              ? "#8c9f90"
              : arc === "war"
                ? "#68644c"
                : arc === "repair"
                  ? "#658481"
                  : "#b28b61",
          );
          rect(ax - 8, ay - 13, 20, 20, machine ? "#a7b6a0" : "#ccb18a");
          rect(ax - 9, ay - 16, 22, 7, "#48554a");
          rect(ax + 4, ay - 7, 3, 3, "#364b46");
          if (machine) {
            rect(ax - 5, ay - 8, 15, 7, "#304b44");
            rect(ax - 2, ay - 6, 3, 3, "#d3ba7d");
          }
          rect(
            ax - 19,
            ay + 8,
            8,
            23,
            motion === "rescue" ? "#c0a47c" : "#758875",
          );
        }
        if (motion === "rescue" || motion === "promise") {
          const ex = rx + 35 + (ax - rx - 40) * progress;
          rect(ex, 180, 7, 7, motion === "promise" ? "#91c9c0" : "#edce85");
          for (let k = 0; k < 5; k++)
            rect(
              ex - 12 + k * 6,
              194 + Math.sin(t * 3 + k) * 4,
              2,
              2,
              "#e1c58c",
            );
        }
        if (motion === "repair") {
          rect(rx + 20, 176, 105 * progress, 2, "#bac9a1");
          for (let k = 0; k < 5; k++)
            rect(
              rx + 30 + Math.sin(t * 7 + k) * 12,
              168 + Math.cos(t * 5 + k) * 12,
              3,
              3,
              k % 2 ? "#e5c481" : "#a8ceb5",
            );
          rect(rx + 49, 184, 4, 17, "#c4c8af");
          rect(rx + 45, 181, 12, 5, "#c4c8af");
        }
        if (motion === "talk") {
          for (let k = 0; k < 3; k++)
            rect(260 + k * 10, 130 - Math.sin(t * 2 + k) * 3, 4, 4, "#e2cc96");
        }
        if (motion === "scan") {
          ctx.fillStyle = "#c9e5ac24";
          ctx.fillRect(rx + 30, 120, 155 * progress, 105);
          rect(rx + 30 + 155 * progress, 120, 2, 105, "#c5db9f");
          rect(355, 190, 24, 18, "#c5bd8f");
        }
        if (motion === "build") {
          for (let k = 0; k < 5; k++)
            rect(275 + k * 14, 222 - Math.floor(k / 2) * 9, 12, 8, "#c1b68a");
          for (let k = 0; k < 4; k++) rect(20 + k * 120, 142, 6, 8, "#e9c579");
        }
        if (motion === "release") {
          for (let k = 0; k < 4; k++) {
            const bx = 270 + progress * 100 + k * 16,
              by = 145 - progress * 65 + (k % 2) * 7;
            rect(bx, by, 8, 2, "#d0d5ad");
            rect(bx + 4, by - 3 - Math.sin(t * 8 + k) * 2, 2, 5, "#d0d5ad");
          }
        }
        if (motion === "conflict") {
          rect(rx + 37, 175, 140 * progress, 3, "#d69763");
          for (let k = 0; k < 8; k++)
            rect(
              340 + Math.sin(k * 23 + t) * 22,
              169 + Math.cos(k * 11 + t) * 22,
              3,
              3,
              "#dfab72",
            );
        }
      }
      rect(rx - 24, 225, 63, 4, "#394b423f");
      rect(rx - 11, ry + 69, 10, 27, "#344b47");
      rect(rx + 13, ry + 69, 10, 27, "#344b47");
      rect(rx - 14, ry + 91, 17, 7, "#263e3c");
      rect(rx + 11, ry + 91, 17, 7, "#263e3c");
      rect(rx - 13, ry + 70, 13, 5, "#84928a");
      rect(rx + 11, ry + 70, 13, 5, "#84928a");
      rect(rx - 20, ry + 28, 52, 45, "#304c49");
      rect(rx - 16, ry + 27, 44, 41, "#9baba0");
      rect(rx - 13, ry + 31, 38, 4, "#c3c6b1");
      rect(rx - 13, ry + 38, 38, 26, "#687f75");
      rect(rx - 30, ry + 32, 11, 31, "#9baba0");
      rect(rx + 32, ry + 32, 10, 31, "#9baba0");
      rect(rx - 29, ry + 62, 10, 10, "#3c5650");
      if (damage < 35) rect(rx + 33, ry + 62, 10, 10, "#3c5650");
      rect(rx - 3, ry + 45, 15, 12, "#394f48");
      rect(rx + 1, ry + 48, 7, 5, age > 25 ? "#ba8a58" : "#e4be76");
      rect(rx - 8, ry + 20, 28, 8, "#344d48");
      rect(rx - 23, ry - 11, 55, 35, "#3b5650");
      rect(rx - 19, ry - 15, 47, 35, "#aeb7a5");
      rect(rx - 14, ry - 12, 38, 4, "#d1d1b9");
      rect(rx - 14, ry - 4, 37, 18, "#263f3d");
      rect(rx - 8, ry + 1, 7, 5, motion === "rest" ? "#63776a" : "#e3ce91");
      rect(rx + 10, ry + 1, 7, 5, motion === "rest" ? "#63776a" : "#e3ce91");
      rect(rx - 25, ry - 5, 5, 18, "#718a7b");
      rect(rx + 29, ry - 5, 5, 18, "#718a7b");
      rect(rx + 3, ry - 28, 3, 13, "#3c5750");
      rect(rx + 1, ry - 31, 7, 5, "#d0b373");
      rect(rx - 18, ry + 17, 42, 3, "#758e7e");
      if (age > 13) {
        rect(rx + 17, ry + 34, 5, 5, "#9f7154");
        rect(rx - 15, ry + 14, 7, 3, "#8c6b50");
      }
      if (damage > 15) {
        rect(rx + 20, ry - 9, 2, 6, "#4c6056");
        rect(rx + 17, ry - 4, 4, 2, "#4c6056");
      }
      rect(rx - 22, ry + 30, 9, 6, "#b77950");
      rect(rx - 25, ry + 33, 5, 19, "#b77950");
      for (let i = 0; i < 15; i++) {
        const x = (i * 87 + t * (snow ? 8 : 3)) % 480,
          y = (i * 43 + t * (snow ? 12 : -2)) % 240;
        rect(x, y, snow ? 2 : 1, snow ? 2 : 1, snow ? "#ebeee1" : "#d6c99a88");
      }
      if (!reduced) raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [scene, age, damage, hero, arc, motion, beat]);
  return (
    <canvas
      ref={ref}
      width={480}
      height={260}
      className="pixel-world"
      role="img"
      aria-label={`${scene}の風景。${name}${arc ? `と出会った人の${motion}の場面` : ""}`}
    />
  );
}
