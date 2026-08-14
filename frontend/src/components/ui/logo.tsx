interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({
  size = 80,
  className = "",
}: LogoProps) {
  return (
    <div
      className={`ml-auto mr-auto relative rounded-full bg-blue-600 ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      {/* Top */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white"
        style={{
          width: size * 0.15,
          height: size * 0.25,
          top: size * 0.15,
        }}
      />

      {/* Bottom */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white"
        style={{
          width: size * 0.15,
          height: size * 0.25,
          bottom: size * 0.15,
        }}
      />

      {/* Top Left */}
      <div
        className="absolute rounded-full bg-white rotate-[60deg]"
        style={{
          width: size * 0.15,
          height: size * 0.25,
          left: size * 0.25,
          top: size * 0.25,
        }}
      />

      {/* Top Right */}
      <div
        className="absolute rounded-full bg-white -rotate-[60deg]"
        style={{
          width: size * 0.15,
          height: size * 0.25,
          right: size * 0.25,
          top: size * 0.25,
        }}
      />

      {/* Bottom Left */}
      <div
        className="absolute rounded-full bg-white -rotate-[60deg]"
        style={{
          width: size * 0.15,
          height: size * 0.25,
          left: size * 0.25,
          bottom: size * 0.25,
        }}
      />

      {/* Bottom Right */}
      <div
        className="absolute rounded-full bg-white rotate-[60deg]"
        style={{
          width: size * 0.15,
          height: size * 0.25,
          right: size * 0.25,
          bottom: size * 0.25,
        }}
      />

      {/* Center Dot */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{
          width: size * 0.12,
          height: size * 0.12,
        }}
      />
    </div>
  );
}