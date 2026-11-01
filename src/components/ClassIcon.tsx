"use client";

import { useState } from "react";
import { ROLE_COLOR, type GameClass } from "@/data/classes";

/**
 * Ícone da classe: mostra a arte oficial (campo `img`) quando existir,
 * caindo para um avatar com emoji + cor da função quando não houver.
 */
export function ClassIcon({
  gameClass,
  size = 56,
}: {
  gameClass: GameClass;
  size?: number;
}) {
  const [imgOk, setImgOk] = useState(true);
  const color = ROLE_COLOR[gameClass.role];
  const showImg = gameClass.img && imgOk;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(160deg, ${color}22 0%, ${color}11 100%)`,
        border: `1px solid ${color}55`,
      }}
      title={`${gameClass.name} · ${gameClass.role}`}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gameClass.img}
          alt={gameClass.name}
          className="h-full w-full object-contain"
          onError={() => setImgOk(false)}
        />
      ) : (
        <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>
          {gameClass.emoji}
        </span>
      )}

      {/* Badge da função */}
      <span
        className="absolute bottom-0.5 right-0.5 rounded px-1 text-[8px] font-extrabold leading-tight text-white"
        style={{ background: color }}
      >
        {gameClass.role}
      </span>
    </div>
  );
}
