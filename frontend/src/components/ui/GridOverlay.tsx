export function GridOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] opacity-20">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          maskImage: 'linear-gradient(to bottom, transparent, black, transparent)'
        }}
      />
    </div>
  );
}
