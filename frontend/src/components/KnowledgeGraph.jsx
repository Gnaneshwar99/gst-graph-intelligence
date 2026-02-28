import React, { useMemo, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getStoryteller } from '../services/api';

const KnowledgeGraph = ({ reconcileData }) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [story, setStory] = useState("");
    const [loadingStory, setLoadingStory] = useState(false);

    // Translate the flat reconcileData into nodes and links for visualization
    const graphData = useMemo(() => {
        const nodes = [];
        const links = [];
        const nodeIds = new Set();

        // Quick helper to add unique nodes
        const addNode = (id, group, val) => {
            if (!nodeIds.has(id)) {
                nodes.push({ id, group, val });
                nodeIds.add(id);
            }
        };

        // Parse /reconcile data into a knowledge graph
        reconcileData.forEach(row => {
            const taxpayerId = row.taxpayer;
            const invoiceId = row.invoice;
            const status = row.status;

            // Node 1: Taxpayer
            addNode(taxpayerId, 1, 3);

            // Node 2: Invoice
            const isHighRisk = status !== 'MATCHED';
            const invoiceGroup = isHighRisk ? 3 : 2; // 2 = safe, 3 = danger
            addNode(invoiceId, invoiceGroup, 2);

            // Link: Taxpayer -> Invoice
            links.push({
                source: taxpayerId,
                target: invoiceId,
                name: 'CLAIMED_ITC',
                color: 'rgba(255, 255, 255, 0.2)'
            });

            // Mocking Vendor connections dynamically for visualization
            if (status !== 'NO_VENDOR') {
                const vendorId = `V-${invoiceId.substring(0, 5)}`;
                addNode(vendorId, 4, 3);

                links.push({
                    source: invoiceId,
                    target: vendorId,
                    name: 'SUPPLIED_BY',
                    color: 'rgba(255, 255, 255, 0.2)'
                });

                if (status !== 'VENDOR_NOT_FILED_GSTR1') {
                    const gstr1 = `GSTR1-${vendorId}`;
                    addNode(gstr1, 5, 2);
                    links.push({
                        source: vendorId,
                        target: gstr1,
                        name: 'FILED',
                        color: 'rgba(16, 185, 129, 0.4)' // success green
                    });
                }
            }

        });

        return { nodes, links };
    }, [reconcileData]);

    const handleNodeClick = async (node) => {
        setSelectedNode(node);
        setStory("");
        setLoadingStory(true);
        try {
            const data = await getStoryteller(node.id);
            setStory(data.story);
        } catch (err) {
            setStory("Could not retrieve story for this node.");
        } finally {
            setLoadingStory(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[500px] w-full gap-4 relative">
            {/* Graph Panel */}
            <div className="glass-card flex-1 overflow-hidden relative border border-white/5 rounded-2xl">
                <div className="p-4 border-b border-white/5 absolute top-0 left-0 w-full z-10 pointer-events-none bg-gradient-to-b from-surface/80 to-transparent">
                    <h3 className="font-semibold text-white">GST Knowledge Graph</h3>
                    <p className="text-xs text-textSecondary">Real-time Multi-Hop Traversal</p>
                </div>

                <div className="w-full h-full bg-[#0a0a0a]">
                    <ForceGraph2D
                        graphData={graphData}
                        onNodeClick={handleNodeClick}
                        nodeLabel={() => ''}
                        nodeCanvasObject={(node, ctx, globalScale) => {
                            let color = '#9ca3af'; // default grey
                            switch (node.group) {
                                case 1: color = '#6366f1'; break; // Taxpayer (Indigo)
                                case 2: color = '#10b981'; break; // Safe Invoice (Green)
                                case 3: color = '#ef4444'; break; // Risk Invoice (Red)
                                case 4: color = '#f59e0b'; break; // Vendor (Yellow)
                                case 5: color = '#3b82f6'; break; // GSTR1 (Blue)
                            }

                            // Dynamic pulsing physics for more "powerful" aesthetic
                            const t = Date.now() / 1000;
                            let pulse = 1;

                            // Danger nodes get an aggressive heartbeat pulse
                            if (node.group === 3) {
                                pulse = 1 + Math.sin(t * 4) * 0.4;
                            }
                            // Taxpayer root node gets a gentle deep breath
                            else if (node.group === 1) {
                                pulse = 1 + Math.sin(t * 2) * 0.15;
                            }
                            const radius = node.val * pulse;

                            // Performance Upgrade: shadowBlur removed for smooth 60FPS. Geometry used instead.
                            ctx.beginPath();

                            // 1. DANGER INVOICE (Red Triangle)
                            if (node.group === 3) {
                                ctx.moveTo(node.x, node.y - radius * 1.5);
                                ctx.lineTo(node.x + radius * 1.5, node.y + radius * 1.2);
                                ctx.lineTo(node.x - radius * 1.5, node.y + radius * 1.2);
                                ctx.closePath();
                            }
                            // 2. ROOT TAXPAYER (Indigo Star)
                            else if (node.group === 1) {
                                const spikes = 5;
                                const outerRadius = radius * 1.6;
                                const innerRadius = radius * 0.7;
                                let rot = Math.PI / 2 * 3;
                                let x = node.x; let y = node.y;
                                const step = Math.PI / spikes;

                                ctx.moveTo(node.x, node.y - outerRadius);
                                for (let i = 0; i < spikes; i++) {
                                    x = node.x + Math.cos(rot) * outerRadius;
                                    y = node.y + Math.sin(rot) * outerRadius;
                                    ctx.lineTo(x, y);
                                    rot += step;

                                    x = node.x + Math.cos(rot) * innerRadius;
                                    y = node.y + Math.sin(rot) * innerRadius;
                                    ctx.lineTo(x, y);
                                    rot += step;
                                }
                                ctx.lineTo(node.x, node.y - outerRadius);
                                ctx.closePath();
                            }
                            // 3. VENDOR / GSTR (Yellow/Blue Diamond)
                            else if (node.group === 4 || node.group === 5) {
                                ctx.moveTo(node.x, node.y - radius * 1.4);
                                ctx.lineTo(node.x + radius * 1.4, node.y);
                                ctx.lineTo(node.x, node.y + radius * 1.4);
                                ctx.lineTo(node.x - radius * 1.4, node.y);
                                ctx.closePath();
                            }
                            // 4. SAFE INVOICE (Default Circle)
                            else {
                                ctx.arc(node.x, node.y, radius + 1, 0, 2 * Math.PI, false);
                            }

                            // Fill Geometry
                            ctx.fillStyle = color;
                            ctx.fill();

                            // Dark Inner Void for contrast
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, radius * 0.6, 0, 2 * Math.PI, false);
                            ctx.fillStyle = '#0a0a0a';
                            ctx.fill();

                            // Bright Energy Core
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, radius * 0.3, 0, 2 * Math.PI, false);
                            ctx.fillStyle = '#ffffff';
                            ctx.fill();

                            // Labels are completely removed for a clean, overwhelming massive-data look.
                        }}
                        linkColor={link => link.color}
                        linkWidth={1.5}
                        linkDirectionalParticles={3}
                        linkDirectionalParticleWidth={2}
                        linkDirectionalParticleSpeed={0.006}
                        nodeRelSize={4}
                        linkDirectionalArrowLength={0}
                        linkCurvature={0.25}
                        backgroundColor="#00000000" // transparent to let card show
                        dagMode="radialout" // Forces the graph into structured Star/Radial layouts instead of a random cube blob
                        dagLevelDistance={70} // Spread the rings for the stellar layout
                        d3AlphaDecay={0.05} // Increased to settle graph faster and reduce physics lag
                        d3VelocityDecay={0.2} // Increased friction to stop nodes sliding infinitely
                        enableNodeDrag={true}
                    />
                </div>

                {/* Legend overlay */}
                <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur border border-white/10 p-3 rounded-xl pointer-events-none">
                    <div className="text-xs font-semibold mb-2 text-white border-b border-white/10 pb-1">Graph Legend</div>
                    <div className="flex flex-col gap-1.5 text-[10px] text-textSecondary font-medium">
                        <div className="flex items-center gap-2">
                            <span className="text-[#6366f1] text-[14px] leading-none">★</span> Taxpayer Root
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#f59e0b] text-[12px] leading-none">◆</span> Vendor / GSTR-1
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#10b981] ml-0.5"></div><span className="ml-[1px]">Compliant Invoice</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#ef4444] text-[10px] leading-none ml-0.5">▲</span><span className="ml-1">Anomalous Invoice</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Storyteller Panel */}
            <div className="glass-card w-full md:w-80 border border-white/5 rounded-2xl p-6 flex flex-col bg-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                        <span className="text-xl">🤖</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-white leading-tight">AI Storyteller</h3>
                        <p className="text-[10px] text-primary uppercase tracking-wider font-semibold">Graph Assistant</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {!selectedNode ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                            <div className="text-4xl mb-3">✨</div>
                            <p className="text-sm text-textSecondary">Click any glowing node on the graph to hear its story.</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-mono text-white mb-4 break-all">
                                Node: {selectedNode.id}
                            </div>

                            {loadingStory ? (
                                <div className="space-y-3 mt-4 animate-pulse">
                                    <div className="h-3 bg-white/10 rounded w-3/4"></div>
                                    <div className="h-3 bg-white/10 rounded w-full"></div>
                                    <div className="h-3 bg-white/10 rounded w-5/6"></div>
                                    <div className="h-3 bg-white/10 rounded w-full"></div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-300 leading-relaxed font-medium">
                                    {story}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeGraph;
