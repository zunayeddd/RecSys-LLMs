// graph.js
class GraphVisualization {
    constructor(containerId, nodes, edges, onNodeClick) {
        this.containerId = containerId;
        this.nodes = nodes;
        this.edges = edges;
        this.onNodeClick = onNodeClick;
        this.selectedNode = null;
        
        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // Clear previous content
        container.innerHTML = '';
        
        // Create SVG
        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        
        // Create tooltip
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
        
        // Create simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force('charge', d3.forceManyBody().strength(-50))
            .force('link', d3.forceLink(this.edges).id(d => d.id).distance(100))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30));
        
        // Create links
        this.link = this.svg.append('g')
            .selectAll('line')
            .data(this.edges)
            .enter()
            .append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1.5);
        
        // Create nodes group
        this.node = this.svg.append('g')
            .selectAll('circle')
            .data(this.nodes)
            .enter()
            .append('circle')
            .attr('r', d => this.calculateNodeRadius(d))
            .attr('fill', d => this.calculateNodeColor(d))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .call(d3.drag()
                .on('start', (event, d) => this.dragStarted(event, d))
                .on('drag', (event, d) => this.dragged(event, d))
                .on('end', (event, d) => this.dragEnded(event, d)))
            .on('click', (event, d) => {
                event.stopPropagation();
                this.onNodeClick(d);
            })
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip());
        
        // Add node labels
        this.label = this.svg.append('g')
            .selectAll('text')
            .data(this.nodes)
            .enter()
            .append('text')
            .text(d => d.id)
            .attr('font-size', '10px')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .attr('pointer-events', 'none')
            .attr('fill', '#333');
        
        // Update simulation
        this.simulation.on('tick', () => {
            this.link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            this.node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
            
            this.label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });
        
        // Add click handler for background to deselect
        this.svg.on('click', () => {
            this.clearSelection();
        });
    }

    calculateNodeRadius(node) {
        // Scale radius based on PageRank score
        const baseRadius = 8;
        if (node.pagerank) {
            return baseRadius + (node.pagerank * 50); // Scale factor for visibility
        }
        return baseRadius;
    }

    calculateNodeColor(node) {
        // Color nodes based on PageRank score
        if (!node.pagerank) return '#69b3a2';
        
        // Normalize PageRank score for color scaling
        const scores = this.nodes.map(n => n.pagerank).filter(s => s !== undefined);
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);
        const normalizedScore = (node.pagerank - minScore) / (maxScore - minScore);
        
        // Interpolate from blue (low) to red (high)
        const color = d3.interpolateRgb('#4575b4', '#d73027')(normalizedScore);
        return color;
    }

    dragStarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    dragEnded(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    showTooltip(event, d) {
        const score = d.pagerank ? d.pagerank.toFixed(4) : 'N/A';
        this.tooltip
            .style('opacity', 1)
            .html(`Node ${d.id}<br>PageRank: ${score}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
    }

    hideTooltip() {
        this.tooltip.style('opacity', 0);
    }

    highlightNode(nodeId) {
        // Clear previous selection
        this.clearSelection();
        
        // Highlight selected node
        this.node
            .filter(d => d.id === nodeId)
            .attr('stroke', '#ff6b00')
            .attr('stroke-width', 3);
        
        // Highlight connected edges
        this.link
            .attr('stroke', d => {
                if (d.source.id === nodeId || d.target.id === nodeId) {
                    return '#ff6b00';
                }
                return '#999';
            })
            .attr('stroke-width', d => {
                if (d.source.id === nodeId || d.target.id === nodeId) {
                    return 3;
                }
                return 1.5;
            });
        
        this.selectedNode = nodeId;
    }

    clearSelection() {
        this.node
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        
        this.link
            .attr('stroke', '#999')
            .attr('stroke-width', 1.5);
        
        this.selectedNode = null;
        
        // Clear table selection
        document.querySelectorAll('#tableBody tr').forEach(row => {
            row.classList.remove('selected');
        });
        
        // Hide node info
        document.getElementById('nodeInfo').style.display = 'none';
    }

    updateData(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        
        // Restart simulation with new data
        this.simulation.nodes(this.nodes);
        this.simulation.force('link').links(this.edges);
        this.simulation.alpha(1).restart();
        
        // Update visual elements
        this.link = this.link.data(this.edges);
        this.link.exit().remove();
        this.link = this.link.enter()
            .append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1.5)
            .merge(this.link);
        
        this.node = this.node.data(this.nodes);
        this.node.exit().remove();
        this.node = this.node.enter()
            .append('circle')
            .attr('r', d => this.calculateNodeRadius(d))
            .attr('fill', d => this.calculateNodeColor(d))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .call(d3.drag()
                .on('start', (event, d) => this.dragStarted(event, d))
                .on('drag', (event, d) => this.dragged(event, d))
                .on('end', (event, d) => this.dragEnded(event, d)))
            .on('click', (event, d) => {
                event.stopPropagation();
                this.onNodeClick(d);
            })
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip())
            .merge(this.node);
        
        this.label = this.label.data(this.nodes);
        this.label.exit().remove();
        this.label = this.label.enter()
            .append('text')
            .text(d => d.id)
            .attr('font-size', '10px')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .attr('pointer-events', 'none')
            .attr('fill', '#333')
            .merge(this.label);
    }
}
