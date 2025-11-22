import React from 'react';

const Confetti: React.FC = () => {
  // Generate random confetti pieces
  const pieces = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100 + '%',
    animationDelay: Math.random() * 2 + 's',
    backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)]
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-sm animate-bounce"
          style={{
            left: p.left,
            top: '-10px',
            backgroundColor: p.backgroundColor,
            animation: `fall ${2 + Math.random() * 3}s linear infinite`,
            animationDelay: p.animationDelay
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Confetti;