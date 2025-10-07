// graph.js
class GraphVisualization {
    constructor(containerId, graphData, onNodeClick) {
        this.containerId = containerId;
        this.graphData = graphData;
        this.onNodeClick = onNodeClick;
        this.selectedNode = null;
        
        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        container.innerHTML = '';
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        
        // Create tooltip
        this.tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
        
        this.render();
    }

    render() {
        const width = this.svg.attr('width');
        const height = this.svg.attr('height');
        
        // Clear existing elements
        this.svg.selectAll('*').remove();
        
        // Create force simulation
        this.simulation = d3.forceSimulation(this.graphData.nodes)
            .force('link', d3.forceLink(this.graphData.edges).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30));
        
        // Create links
        this.link = this.svg.append('g')
            .selectAll('line')
            .data(this.graphData.edges)
            .enter()
            .append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 2);
        
        // Create nodes
        this.node = this.svg.append('g')
            .selectAll('circle')
            .data(this.graphData.nodes)
            .enter()
            .append('circle')
            .attr('r', 8)
            .attr('fill', d => this.getNodeColor(d.pagerank || 0))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .call(d3.drag()
                .on('start', (event, d) => this.dragStarted(event, d))
                .on('drag', (event, d) => this.dragged(event, d))
                .on('end', (event, d) => this.dragEnded(event, d)))
            .on('click', (event, d) => {
                event.stopPropagation();
                this.onNodeClick(d.id);
            })
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip());
        
        // Add node labels
        this.label = this.svg.append('g')
            .selectAll('text')
            .data(this.graphData.nodes)
            .enter()
            .append('text')
            .text(d => d.id)
            .attr('font-size', '10px')
            .attr('text-anchor', 'middle')
            .attr('dy', 4)
            .attr('pointer-events', 'none');
        
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
        
        // Background click to deselect
        this.svg.on('click', () => {
            this.deselectNode();
        });
    }

    getNodeColor(pagerank) {
        if (!pagerank) return '#ccc';
        
        // Color scale from blue (low) to red (high)
        const colorScale = d3.scaleLinear()
            .domain([0, d3.max(this.graphData.nodes, d => d.pagerank) || 1])
            .range(['#1f77b4', '#ff0000']);
        
        return colorScale(pagerank);
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

    highlightNode(nodeId) {
        // Reset all nodes
        this.node
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        
        // Highlight selected node
        this.node.filter(d => d.id === nodeId)
            .attr('stroke', '#ffeb3b')
            .attr('stroke-width', 4);
        
        // Highlight connected edges
        this.link
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6);
        
        const connectedEdges = this.graphData.edges.filter(edge => 
            edge.source.id === nodeId || edge.target.id === nodeId
        );
        
        this.link.filter(d => connectedEdges.includes(d))
            .attr('stroke', '#ffeb3b')
            .attr('stroke-opacity', 1);
        
        this.selectedNode = nodeId;
    }

    deselectNode() {
        this.node.attr('stroke', '#fff').attr('stroke-width', 2);
        this.link.attr('stroke', '#999').attr('stroke-opacity', 0.6);
        this.selectedNode = null;
        
        // Clear table selection
        document.querySelectorAll('#tableBody tr').forEach(row => {
            row.classList.remove('selected');
        });
        
        // Hide node info
        document.getElementById('nodeInfo').style.display = 'none';
    }

    updateData(graphData, pageRankScores) {
        this.graphData = graphData;
        
        // Update nodes with PageRank scores
        this.graphData.nodes.forEach((node, index) => {
            node.pagerank = pageRankScores ? pageRankScores[index] : null;
        });
        
        this.render();
        
        // Re-highlight if there was a selected node
        if (this.selectedNode) {
            this.highlightNode(this.selectedNode);
        }
    }

    destroy() {
        if (this.simulation) {
            this.simulation.stop();
        }
        if (this.tooltip) {
            this.tooltip.remove();
        }
    }
}
