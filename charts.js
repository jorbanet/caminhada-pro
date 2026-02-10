// Gráficos de progresso

function renderChart() {
    const canvas = document.getElementById('progressChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const history = loadHistory();
    
    if (history.length === 0) {
        drawEmptyChart(ctx, canvas);
        return;
    }
    
    // Preparar dados (últimos 7 dias)
    const last7Days = getLast7Days();
    const data = last7Days.map(date => {
        const workouts = history.filter(w => {
            const wDate = new Date(w.date).toDateString();
            return wDate === date.toDateString();
        });
        
        return {
            date: date.toLocaleDateString('pt-PT', { weekday: 'short' }),
            calories: workouts.reduce((sum, w) => sum + (w.calories || 0), 0),
            distance: workouts.reduce((sum, w) => sum + (w.distance || 0), 0),
            duration: workouts.reduce((sum, w) => sum + (w.duration || 0), 0)
        };
    });
    
    drawBarChart(ctx, canvas, data);
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date);
    }
    return days;
}

function drawBarChart(ctx, canvas, data) {
    // Configurar canvas
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Limpar
    ctx.clearRect(0, 0, width, height);
    
    // Título
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Calorias - Últimos 7 Dias', width / 2, 20);
    
    // Encontrar valor máximo
    const maxCalories = Math.max(...data.map(d => d.calories), 100);
    const scale = chartHeight / maxCalories;
    
    // Desenhar barras
    const barWidth = chartWidth / data.length - 10;
    
    data.forEach((day, index) => {
        const x = padding + (chartWidth / data.length) * index + 5;
        const barHeight = day.calories * scale;
        const y = padding + chartHeight - barHeight;
        
        // Gradiente da barra
        const gradient = ctx.createLinearGradient(x, y, x, padding + chartHeight);
        gradient.addColorStop(0, '#ec4899');
        gradient.addColorStop(1, '#8b5cf6');
        
        // Desenhar barra
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 5);
        ctx.fill();
        
        // Valor
        if (day.calories > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(day.calories), x + barWidth / 2, y - 5);
        }
        
        // Label do dia
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '11px sans-serif';
        ctx.fillText(day.date, x + barWidth / 2, padding + chartHeight + 20);
    });
    
    // Eixo Y (linhas de grade)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
        
        // Label
        const value = Math.round(maxCalories * (1 - i / 4));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(value, padding - 5, y + 4);
    }
}

function drawEmptyChart(ctx, canvas) {
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sem dados para mostrar', width / 2, height / 2);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillText('Complete treinos para ver seu progresso', width / 2, height / 2 + 20);
}

// Polyfill para roundRect (caso navegador não suporte)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}
