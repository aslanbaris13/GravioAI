import type { CSSProperties } from "react";

export default function Ms({
  name,
  size = 20,
  color,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className="ms"
      style={{ fontSize: size, color, ...style }}
    >
      {name}
    </span>
  );
}
