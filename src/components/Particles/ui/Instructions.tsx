/**
 * Instructions overlay component
 * Displays usage instructions for particle interactions
 */
export function Instructions() {
  return (
    <div className="instructions absolute bottom-5 left-5 p-4 bg-black/30 backdrop-blur-md rounded-lg border border-white/20 shadow-lg text-center text-sm text-gray-200 max-w-[180px] z-20">
      <p>Move mouse to interact</p>
      <p className="mt-1">Click or Tap for shockwave</p>
    </div>
  );
}
