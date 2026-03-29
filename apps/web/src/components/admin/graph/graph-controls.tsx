'use client';

interface GraphControlsProps {
  categories: string[];
  selectedCategory: string;
  nodeLimit: number;
  onCategoryChange: (category: string) => void;
  onNodeLimitChange: (limit: number) => void;
  totalNodes: number;
  totalEdges: number;
}

const LIMITS = [50, 100, 200, 500] as const;

export function GraphControls({
  categories,
  selectedCategory,
  nodeLimit,
  onCategoryChange,
  onNodeLimitChange,
  totalNodes,
  totalEdges,
}: GraphControlsProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <label htmlFor="category-filter" className="text-xs text-gray-500 whitespace-nowrap">
          Category
        </label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="node-limit" className="text-xs text-gray-500 whitespace-nowrap">
          Limit
        </label>
        <select
          id="node-limit"
          value={nodeLimit}
          onChange={(e) => onNodeLimitChange(Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {LIMITS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
        <span>
          <span className="font-semibold text-gray-700">{totalNodes}</span> nodes
        </span>
        <span>
          <span className="font-semibold text-gray-700">{totalEdges}</span> edges
        </span>
      </div>
    </div>
  );
}
