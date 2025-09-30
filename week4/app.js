visualizeEmbeddings() {
    if (!this.model) return;
    
    const canvas = document.getElementById('embeddingChart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sample items for visualization
    const sampleSize = Math.min(1000, this.itemMap.size);
    const sampleIndices = Array.from({length: sampleSize}, (_, i) => 
        Math.floor(i * this.itemMap.size / sampleSize)
    );
    
    // Get embeddings and compute PCA - call arraySync() on the tensor
    const embeddings = this.model.getItemEmbeddings().arraySync();
    const sampleEmbeddings = sampleIndices.map(i => embeddings[i]);
    
    const projected = this.computePCA(sampleEmbeddings, 2);
    
    // Normalize to canvas coordinates
    const xs = projected.map(p => p[0]);
    const ys = projected.map(p => p[1]);
    
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    
    // Draw points
    ctx.fillStyle = 'rgba(0, 122, 204, 0.6)';
    sampleIndices.forEach((itemIdx, i) => {
        const x = ((projected[i][0] - xMin) / xRange) * (canvas.width - 40) + 20;
        const y = ((projected[i][1] - yMin) / yRange) * (canvas.height - 40) + 20;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    this.updateStatus('Embedding visualization completed.');
}
