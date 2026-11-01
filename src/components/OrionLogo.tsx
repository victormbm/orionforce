export function OrionLogo({ size = 64 }: { size?: number }) {
  // Estrelas aproximando a constelação de Órion (cinturão + ombros + pés)
  const stars = [
    { x: 20, y: 14, r: 2.6 }, // Betelgeuse (ombro)
    { x: 46, y: 18, r: 2.0 }, // Bellatrix (ombro)
    { x: 30, y: 32, r: 2.0 }, // cinturão 1
    { x: 34, y: 36, r: 2.4 }, // cinturão 2
    { x: 38, y: 40, r: 2.0 }, // cinturão 3
    { x: 18, y: 54, r: 2.6 }, // Saiph (pé)
    { x: 50, y: 56, r: 3.0 }, // Rigel (pé)
  ];
  const lines = [
    [0, 2],
    [1, 4],
    [2, 3],
    [3, 4],
    [2, 5],
    [4, 6],
    [0, 1],
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="of-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f6bff" />
          <stop offset="100%" stopColor="#19c5e6" />
        </linearGradient>
      </defs>
      {lines.map(([a, b], i) => (
        <line
          key={i}
          x1={stars[a].x}
          y1={stars[a].y}
          x2={stars[b].x}
          y2={stars[b].y}
          stroke="url(#of-grad)"
          strokeWidth="1.4"
          strokeOpacity="0.55"
          strokeLinecap="round"
        />
      ))}
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="url(#of-grad)" />
      ))}
    </svg>
  );
}
