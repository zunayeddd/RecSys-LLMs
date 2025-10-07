// graph.js
class GraphVisualization {
    constructor(containerId) {
        this.containerId = containerId;
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.colorScale = null;
        this.radiusScale = null;
    }

    render(graphData) {
        // Clear previous visualization
        d3.select(`#${this.containerId}`).html('');
        
        const container = document.getElementById(this.containerId);
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Create SVG
        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        
        this.nodes = graphData.nodes;
        this.links = graphData.edges.map(edge => ({
            source: edge.source,
            target: edge.target
        }));
        
        // Initialize color and radius scales
        this.colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, 1]);
        
        this.radiusScale = d3.scaleSqrt()
            .domain([0, 1])
            .range([3, 10]);
        
        // Create simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links).id(d => d.id).distance(50))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(12));
        
        // Create links
        const link = this.svg.append('g')
            .selectAll('line')
            .data(this.links)
            .join('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1);
        
        // Create nodes
        const node = this.svg.append('g')
            .selectAll('circle')
            .data(this.nodes)
            .join('circle')
            .attr('r', 5)
            .attr('fill', '#4285f4')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .call(this.drag(this.simulation));
        
        // Add node labels
        const label = this.svg.append('g')
            .selectAll('text')
            .data(this.nodes)
            .join('text')
            .text(d => d.id)
            .attr('font-size', '10px')
            .attr('dx', 8)
            .attr('dy', 3)
            .attr('fill', '#333');
        
        // Add tooltips
        node.append('title')
            .text(d => `Node ${d.id}`);
        
        // Add click handlers
        node.on('click', (event, d) => {
            if (window.app) {
                window.app.handleNodeClick(d.id);
            }
        });
        
        // Update positions on simulation tick
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
            
            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });
        
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.svg.selectAll('g').attr('transform', event.transform);
            });
        
        this.svg.call(zoom);
    }

    updateNodeScores(scores) {
        if (!this.svg || !scores) return;
        
        // Normalize scores for visualization
        const scoreValues = Object.values(scores);
        const minScore = Math.min(...scoreValues);
        const maxScore = Math.max(...scoreValues);
        
        this.colorScale.domain([minScore, maxScore]);
        this.radiusScale.domain([minScore, maxScore]);
        
        // Update node appearance
        this.svg.selectAll('circle')
            .transition()
            .duration(1000)
            .attr('fill', d => this.colorScale(scores[d.id]))
            .attr('r', d => this.radiusScale(scores[d.id]));
        
        // Update tooltips with scores
        this.svg.selectAll('circle')
            .select('title')
            .text(d => `Node ${d.id}\nPageRank: ${scores[d.id].toFixed(6)}`);
    }

    highlightNode(nodeId) {
        // Reset all nodes
        this.svg.selectAll('circle')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);
        
        // Highlight selected node
        this.svg.selectAll('circle')
            .filter(d => d.id === nodeId)
            .attr('stroke', '#ff6b6b')
            .attr('stroke-width', 3);
        
        // Highlight connected links
        this.svg.selectAll('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6);
        
        this.svg.selectAll('line')
            .filter(d => d.source.id === nodeId || d.target.id === nodeId)
            .attr('stroke', '#ff6b6b')
            .attr('stroke-opacity', 1)
            .attr('stroke-width', 2);
    }

    drag(simulation) {
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        
        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }
}
