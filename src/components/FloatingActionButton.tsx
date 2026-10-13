import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      title="Registrar nueva lectura"
      className="fixed bottom-20 right-5 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-white shadow-lg hover:shadow-sky-500/25 flex items-center justify-center transition-all duration-200"
    >
      <Plus size={26} strokeWidth={2.8} />
    </button>
  );
};
