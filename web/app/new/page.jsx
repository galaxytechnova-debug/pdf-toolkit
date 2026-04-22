export default function RelativeLayout() {
  return (
    // Parent: Flex column, full screen height, with padding and a gap
    <div className="flex flex-col h-screen gap-4 p-4 bg-gray-100">
      
      {/* Child 1: Takes 5 parts */}
      <div className="flex-[5] bg-blue-500 rounded-2xl p-6 text-white shadow-md flex items-center justify-center">
        <h2 className="text-2xl font-bold">50% Space (Flex 5)</h2>
      </div>

      {/* Child 2: Takes 3 parts */}
      <div className="flex-[3] bg-emerald-500 rounded-2xl p-6 text-white shadow-md flex items-center justify-center">
        <h2 className="text-2xl font-bold">30% Space (Flex 3)</h2>
      </div>

      {/* Child 3: Takes 2 parts */}
      <div className="flex-[2] bg-purple-500 rounded-2xl p-6 text-white shadow-md flex items-center justify-center">
        <h2 className="text-2xl font-bold">20% Space (Flex 2)</h2>
      </div>
      
    </div>
  );
}