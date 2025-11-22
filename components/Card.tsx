import React from 'react';
import { PlayingCard } from '../types';

interface CardProps {
  card: PlayingCard;
  onClick: (card: PlayingCard) => void;
  disabled: boolean;
  selected: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled, selected }) => {
  return (
    <button
      onClick={() => !disabled && onClick(card)}
      disabled={disabled}
      className={`
        relative w-20 h-28 sm:w-24 sm:h-36 md:w-32 md:h-44 
        rounded-xl shadow-lg border-2 flex flex-col items-center justify-center
        transition-all duration-200 select-none
        ${disabled ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-300' : 'bg-white hover:-translate-y-1 cursor-pointer'}
        ${selected ? 'ring-4 ring-blue-400 transform -translate-y-2' : 'border-gray-200'}
        ${card.color === 'red' ? 'text-red-500' : 'text-gray-900'}
      `}
    >
      {/* Top Left Corner */}
      <div className="absolute top-2 left-2 flex flex-col items-center leading-none">
        <span className="text-sm font-bold">{card.value}</span>
        <span className="text-xs">{card.suit}</span>
      </div>

      {/* Center Big Number */}
      <div className="text-4xl sm:text-5xl md:text-6xl font-black font-fredoka">
        {card.value}
      </div>
      <div className="text-2xl sm:text-3xl mt-1">{card.suit}</div>

      {/* Bottom Right Corner (Inverted) */}
      <div className="absolute bottom-2 right-2 flex flex-col items-center leading-none transform rotate-180">
        <span className="text-sm font-bold">{card.value}</span>
        <span className="text-xs">{card.suit}</span>
      </div>
    </button>
  );
};

export default Card;