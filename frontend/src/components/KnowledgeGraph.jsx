import { useEffect, useState, useRef, useCallback } from 'react';

// Domain color mapping
const DOMAIN_COLORS = {
  'Backend Engineering': { fill: '#6366f1', light: '#eef2ff' },
  'Frontend Development': { fill: '#8b5cf6', light: '#f5f3ff' },
  'Sales': { fill: '#f59e0b', light: '#fefce8' },
  'Marketing': { fill: '#ec4899', light: '#fdf2f8' },
  'Data Science': { fill: '#10b981', light: '#ecfdf5' },
  'Project Management': { fill: '#3b82f6', light: '#eff6ff' },
  'DevOps': { fill: '#14b8a6', light: '#f0fdfa' },
  'HR': { fill: '#f97316', light: '#fff7ed' },
  'Product Management': { fill: '#06b6d4', light: '#ecfeff' },
  'QA': { fill: '#a855f7', light: '#faf5ff' },
};

function getColor(domain) {
  return DOMAIN_COLORS[domain] || { fill: '#6366f1', light: '#eef2ff' };
}

// Simple force-directed layout positions
function computeLayout(nodes, edges, width, height) {
  const positions = nodes.map((_, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const rx = width * 0.32;
    const ry = height * 0.34;
    return {
      x: width / 2 + rx * Math.cos(angle - Math.PI / 2),
      y: height / 2 + ry * Math.sin(angle - Math.PI / 2),
    };
  });

  // Simple spring iteration for better spacing
  for (let iter = 0; iter < 60; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      let fx = 0, fy = 0;

      // Repulsion from other nodes
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = 3000 / (dist * dist);
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      }

      // Attraction to center
      const cx = positions[i].x - width / 2;
      const cy = positions[i].y - height / 2;
      fx -= cx * 0.005;
      fy -= cy * 0.005;

      // Edge attraction
      for (const edge of edges) {
        let partner = -1;
        if (edge.source === i) partner = edge.target;
        else if (edge.target === i) partner = edge.source;
        if (partner >= 0) {
          const dx = positions[partner].x - positions[i].x;
          const dy = positions[partner].y - positions[i].y;
          fx += dx * 0.003;
          fy += dy * 0.003;
        }
      }

      positions[i].x += fx * 0.3;
      positions[i].y += fy * 0.3;

      // Clamp
      const pad = 60;
      positions[i].x = Math.max(pad, Math.min(width - pad, positions[i].x));
      positions[i].y = Math.max(pad, Math.min(height - pad, positions[i].y));
    }
  }

  return positions;
}

export default function KnowledgeGraph({ transitions = [], employees = [], stats = null }) {
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({ width, height: Math.max(400, Math.min(520, width * 0.55)) });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Build node/edge data from transitions + employees
  const { nodes, edges } = buildGraph(transitions, employees);
  const positions = computeLayout(nodes, edges, dimensions.width, dimensions.height);

  const handleNodeEnter = useCallback((node, pos) => {
    setHoveredNode(node.id);
    setTooltip({ node, x: pos.x, y: pos.y });
  }, []);

  const handleNodeLeave = useCallback(() => {
    setHoveredNode(null);
    setTooltip(null);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="w-full"
      >
        {/* Background decorative circles */}
        <defs>
          <radialGradient id="bgGlow1" cx="30%" cy="40%" r="40%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bgGlow2" cx="70%" cy="60%" r="35%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGlow1)" rx="16" />
        <rect width="100%" height="100%" fill="url(#bgGlow2)" rx="16" />

        {/* Edges */}
        {edges.map((edge, i) => {
          const src = positions[edge.source];
          const tgt = positions[edge.target];
          if (!src || !tgt) return null;

          const midX = (src.x + tgt.x) / 2;
          const midY = (src.y + tgt.y) / 2 - 20;
          const isHighlighted = hoveredNode === nodes[edge.source]?.id || hoveredNode === nodes[edge.target]?.id;

          return (
            <g key={`edge-${i}`} className="kg-edge animate-draw-line" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
              <path
                d={`M ${src.x} ${src.y} Q ${midX} ${midY} ${tgt.x} ${tgt.y}`}
                fill="none"
                stroke={isHighlighted ? '#6366f1' : '#d1d5db'}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
                strokeDasharray={isHighlighted ? 'none' : '6 4'}
                opacity={hoveredNode && !isHighlighted ? 0.2 : 0.7}
              />
              {edge.label && (
                <text
                  x={midX}
                  y={midY - 6}
                  textAnchor="middle"
                  className="kg-label"
                  fontSize="10"
                  fill={isHighlighted ? '#4f46e5' : '#9ca3af'}
                  fontWeight={isHighlighted ? '600' : '400'}
                  opacity={hoveredNode && !isHighlighted ? 0.2 : 1}
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const pos = positions[i];
          if (!pos) return null;
          const color = getColor(node.domain);
          const radius = 18 + (node.resilience || 50) / 10;
          const isHovered = hoveredNode === node.id;
          const isFaded = hoveredNode && !isHovered &&
            !edges.some(e =>
              (nodes[e.source]?.id === hoveredNode && nodes[e.target]?.id === node.id) ||
              (nodes[e.target]?.id === hoveredNode && nodes[e.source]?.id === node.id)
            );

          return (
            <g
              key={`node-${node.id}`}
              className="kg-node animate-node-appear"
              style={{ animationDelay: `${i * 0.08}s` }}
              onMouseEnter={() => handleNodeEnter(node, pos)}
              onMouseLeave={handleNodeLeave}
              opacity={isFaded ? 0.25 : 1}
            >
              {/* Glow */}
              {isHovered && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius + 8}
                  fill={color.fill}
                  opacity={0.12}
                />
              )}
              {/* Main circle */}
              <circle
                className="kg-node-circle"
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill={isHovered ? color.fill : color.light}
                stroke={color.fill}
                strokeWidth={isHovered ? 3 : 1.5}
              />
              {/* Initials */}
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                className="kg-label"
                fontSize={radius > 24 ? '12' : '10'}
                fontWeight="700"
                fill={isHovered ? '#fff' : color.fill}
              >
                {node.initials}
              </text>
              {/* Name below */}
              <text
                x={pos.x}
                y={pos.y + radius + 14}
                textAnchor="middle"
                className="kg-label"
                fontSize="11"
                fontWeight="500"
                fill="#374151"
                opacity={isFaded ? 0.3 : 0.8}
              >
                {node.name.length > 14 ? node.name.slice(0, 12) + '…' : node.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="kg-tooltip animate-fade-in"
          style={{
            left: Math.min(tooltip.x + 20, dimensions.width - 240),
            top: Math.max(tooltip.y - 60, 8),
          }}
        >
          <p className="text-sm font-semibold text-surface-900">{tooltip.node.name}</p>
          <p className="text-xs text-surface-500 mt-0.5">{tooltip.node.domain}</p>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-primary-600 font-medium">
              Resilience: {tooltip.node.resilience || '—'}
            </span>
            {tooltip.node.suggestedRole && (
              <span className="text-emerald-600 font-medium">
                → {tooltip.node.suggestedRole}
              </span>
            )}
          </div>
          {tooltip.node.matchPct && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-surface-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500"
                  style={{ width: `${tooltip.node.matchPct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-primary-600">{tooltip.node.matchPct}%</span>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {Object.entries(DOMAIN_COLORS).slice(0, 6).map(([domain, color]) => (
          <div key={domain} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color.fill }} />
            <span className="text-xs text-surface-500">{domain}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildGraph(transitions, employees) {
  const nodes = employees.map(emp => ({
    id: emp.id,
    name: emp.name,
    initials: emp.name.split(' ').map(n => n[0]).join(''),
    domain: emp.primary_domain,
    resilience: emp.soft_skill_score ? Math.round(emp.soft_skill_score * 10) : 50,
    suggestedRole: null,
    matchPct: null,
  }));

  const edges = [];

  // Connect employees that share the same growth path (transition)
  for (const t of transitions) {
    // Find employees in this domain
    const domainEmps = nodes.filter(n => n.domain === t.from_domain);
    for (let i = 0; i < domainEmps.length; i++) {
      for (let j = i + 1; j < domainEmps.length; j++) {
        const srcIdx = nodes.findIndex(n => n.id === domainEmps[i].id);
        const tgtIdx = nodes.findIndex(n => n.id === domainEmps[j].id);
        if (srcIdx >= 0 && tgtIdx >= 0) {
          // Avoid duplicate edges
          if (!edges.some(e => (e.source === srcIdx && e.target === tgtIdx) || (e.source === tgtIdx && e.target === srcIdx))) {
            edges.push({
              source: srcIdx,
              target: tgtIdx,
              label: `→ ${t.to_role.split(' ').slice(0, 2).join(' ')}`,
            });
          }
        }
      }
    }
  }

  // Also connect nearby nodes if they don't have enough edges (for visual density)
  if (edges.length < nodes.length) {
    for (let i = 0; i < nodes.length; i++) {
      const hasEdge = edges.some(e => e.source === i || e.target === i);
      if (!hasEdge && nodes.length > 1) {
        const partner = (i + 1) % nodes.length;
        edges.push({ source: i, target: partner, label: '' });
      }
    }
  }

  return { nodes, edges };
}
