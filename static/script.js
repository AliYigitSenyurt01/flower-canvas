const canvas = document.getElementById("flowerCanvas");
const ctx = canvas.getContext("2d");

// Çiçeği detaylı çizip taşıyacağımız offscreen canvas
const offscreen = document.createElement("canvas");
const offCtx = offscreen.getContext("2d");

// Çiçek çevresindeki parıltılar
let sparkles = [];

let time = 0;
let reveal = 0; // 0→1: aşağıdan yukarıya açılma miktarı
const REVEAL_SPEED = 0.18; // açılma hızı
let lastTimestamp = 0;

// Not paneli metni
const NOTE_TITLE = "ÇİÇEK NOTU";
const NOTE_LINES = [
    "",
    "Yengeçlerin manipülasyon konusunda",
    "iyi olduklarını söylerler.",
    "Ama asıl tehlike",
    "kalbini usulca ele geçirmeleri olabilir.",
    ""
];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;

    createSparkles();
}
window.addEventListener("resize", resize);
resize();

// ----------------- PARILTILAR -----------------

function createSparkles() {
    sparkles = [];
    const count = 42;
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.18;

    for (let i = 0; i < count; i++) {
        sparkles.push({
            angle: Math.random() * Math.PI * 2,
            dist: baseRadius * (0.9 + Math.random() * 0.4),
            size: 1.2 + Math.random() * 1.8,
            speed: 0.2 + Math.random() * 0.6,
            phase: Math.random() * Math.PI * 2
        });
    }
}

// ----------------- ÇİÇEĞİ OFFSCREEN'E ÇİZ -----------------

function drawFlowerToOffscreen() {
    offCtx.clearRect(0, 0, offscreen.width, offscreen.height);

    const cx = offscreen.width * 0.29;
    const cy = offscreen.height / 2;

    // Çok büyük bir çiçek için ölçek
    const baseScale = Math.min(offscreen.width, offscreen.height) / 30;
    const breathing = 0.96 + Math.sin(time * 0.7) * 0.03;
    const scale = baseScale * breathing;

    offCtx.save();
    offCtx.translate(cx, cy);

    const petals = 900;
    const baseHue = 200;
    const baseSat = 88;
    const baseLight = 68;

    let prevX = null;
    let prevY = null;

    // Hafif glow için gölge
    offCtx.shadowColor = "rgba(56, 189, 248, 0.6)";
    offCtx.shadowBlur = 18;

    // Ana çiçeği çiz
    offCtx.lineWidth = 2.1;
    for (let i = 0; i < petals; i++) {
        const t = (i / petals) * Math.PI * 24;

        const r =
            5 * (1 + Math.sin((11 * t) / 5)) -
            4 * Math.pow(Math.sin((17 * t) / 3), 4);

        const x = scale * r * Math.cos(t);
        const y = scale * r * Math.sin(t);

        const light = baseLight + Math.sin(i / 40 + time * 0.4) * 5;
        offCtx.strokeStyle = `hsl(${baseHue}, ${baseSat}%, ${light}%)`;

        if (prevX !== null && prevY !== null) {
            offCtx.beginPath();
            offCtx.moveTo(prevX, prevY);
            offCtx.lineTo(x, y);
            offCtx.stroke();
        }

        prevX = x;
        prevY = y;
    }

    // Hafif ikinci kontur (parlak kenar)
    prevX = null;
    prevY = null;
    offCtx.shadowBlur = 0;
    offCtx.globalAlpha = 0.45;
    offCtx.lineWidth = 1.1;

    for (let i = 0; i < petals; i++) {
        const t = (i / petals) * Math.PI * 24;
        const r =
            5.4 * (1 + Math.sin((11 * t) / 5)) -
            4.4 * Math.pow(Math.sin((17 * t) / 3), 4);

        const x = scale * r * Math.cos(t);
        const y = scale * r * Math.sin(t);
        offCtx.strokeStyle = `hsl(${baseHue}, 96%, 82%)`;

        if (prevX !== null && prevY !== null) {
            offCtx.beginPath();
            offCtx.moveTo(prevX, prevY);
            offCtx.lineTo(x, y);
            offCtx.stroke();
        }

        prevX = x;
        prevY = y;
    }

    offCtx.globalAlpha = 1;

    // Merkez parlaması
    const centerRadius = scale * 1.8;
    const grad = offCtx.createRadialGradient(0, 0, 0, 0, 0, centerRadius);
    grad.addColorStop(0, "rgba(248, 250, 252, 0.9)");
    grad.addColorStop(1, "rgba(56, 189, 248, 0)");
    offCtx.fillStyle = grad;
    offCtx.beginPath();
    offCtx.arc(0, 0, centerRadius, 0, Math.PI * 2);
    offCtx.fill();

    offCtx.restore();
}

// ----------------- NOT PANELİ + YENGEÇ -----------------

function drawNotePanel() {
    const sideMargin = Math.max(80, canvas.width * 0.08);
    const panelWidth = Math.min(canvas.width * 0.36, 500);
    const panelX = canvas.width - panelWidth - sideMargin;
    const panelY = canvas.height * 0.17;
    const panelHeight = canvas.height * 0.6;

    ctx.save();

    // Glow'lu kenar
    const radius = 28;
    ctx.beginPath();
    roundedRect(ctx, panelX, panelY, panelWidth, panelHeight, radius);
    const borderGrad = ctx.createLinearGradient(
        panelX,
        panelY,
        panelX + panelWidth,
        panelY + panelHeight
    );
    borderGrad.addColorStop(0, "rgba(96, 165, 250, 0.9)");
    borderGrad.addColorStop(0.5, "rgba(129, 140, 248, 0.7)");
    borderGrad.addColorStop(1, "rgba(45, 212, 191, 0.9)");

    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
    ctx.fill();

    // İç gölge
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    ctx.restore();

    const innerPaddingX = 26;
    let cursorY = panelY + 26;

    // Küçük üst etiket
    ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
    ctx.font =
        "600 11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    cursorY += 14;

    // Başlık
    ctx.fillStyle = "#e5f2ff";
    ctx.font =
        "800 26px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(NOTE_TITLE, panelX + innerPaddingX, cursorY);
    cursorY += 32;

    // İnce çizgi
    ctx.beginPath();
    ctx.moveTo(panelX + innerPaddingX, cursorY);
    ctx.lineTo(panelX + panelWidth - innerPaddingX, cursorY);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
    ctx.lineWidth = 1;
    ctx.stroke();
    cursorY += 20;

    // Metin
    ctx.fillStyle = "#d1ddff";
    ctx.font =
        "400 16px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    const lineHeight = 24;
    for (const line of NOTE_LINES) {
        ctx.fillText(line, panelX + innerPaddingX, cursorY);
        cursorY += lineHeight;
    }

    // Alt kısımda küçük bir not / imza alanı
    const footerY = panelY + panelHeight - 110;
    ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
    ctx.font =
        "500 12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillText(
        "– Bu sayfa senin yüzünde bir gülümseme için var.",
        panelX + innerPaddingX,
        footerY
    );

    // Yengeç animasyonu
    drawCrab(panelX, panelY, panelWidth, panelHeight);

    ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
}

// Şirin yengeç animasyonu
function drawCrab(panelX, panelY, panelWidth, panelHeight) {
    const marginX = 50;
    const areaLeft = panelX + marginX;
    const areaRight = panelX + panelWidth - marginX;
    const baseY = panelY + panelHeight - 45;

    const period = 4.5;
    const t = (time / period) % 2;
    const u = t < 1 ? t : 2 - t;
    const x = areaLeft + u * (areaRight - areaLeft);

    const bob = Math.sin(time * 3) * 2;

    const bodyWidth = 42;
    const bodyHeight = 24;

    ctx.save();
    ctx.translate(x, baseY + bob);

    // Gövde
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyWidth / 2, bodyHeight / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = "hsl(15, 85%, 60%)";
    ctx.fill();
    ctx.strokeStyle = "hsl(10, 80%, 52%)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bacaklar
    ctx.strokeStyle = "hsl(10, 80%, 52%)";
    ctx.lineWidth = 1.3;
    for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(i * (bodyWidth / 2 - 2), 2);
        ctx.lineTo(i * (bodyWidth / 2 + 8), 9);
        ctx.lineTo(i * (bodyWidth / 2 + 14), 15);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(i * (bodyWidth / 2 - 10), 0);
        ctx.lineTo(i * (bodyWidth / 2 - 4), 10);
        ctx.lineTo(i * (bodyWidth / 2 + 2), 16);
        ctx.stroke();
    }

    // Göz sapları
    ctx.strokeStyle = "hsl(10, 80%, 52%)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-11, -bodyHeight / 2 + 2);
    ctx.lineTo(-11, -bodyHeight / 2 - 8 + bob * 0.1);
    ctx.moveTo(11, -bodyHeight / 2 + 2);
    ctx.lineTo(11, -bodyHeight / 2 - 8 + bob * 0.1);
    ctx.stroke();

    // Gözler
    ctx.beginPath();
    ctx.arc(-11, -bodyHeight / 2 - 10, 3, 0, Math.PI * 2);
    ctx.arc(11, -bodyHeight / 2 - 10, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-11, -bodyHeight / 2 - 10, 1.6, 0, Math.PI * 2);
    ctx.arc(11, -bodyHeight / 2 - 10, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = "#020617";
    ctx.fill();

    // Pençeler – hafif açılıp kapanma
    const clawOpen = 0.3 + 0.2 * Math.sin(time * 4);
    for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(i * (bodyWidth / 2 - 6), -bodyHeight / 4);
        ctx.lineTo(i * (bodyWidth / 2 + 8), -bodyHeight / 2);
        ctx.stroke();

        ctx.beginPath();
        const baseAngle = i > 0 ? Math.PI * (0.2 - clawOpen) : Math.PI * (0.8 + clawOpen);
        const endAngle = i > 0 ? Math.PI * (1.2 - clawOpen) : Math.PI * (1.8 + clawOpen);
        ctx.arc(
            i * (bodyWidth / 2 + 12),
            -bodyHeight / 2,
            6,
            baseAngle,
            endAngle
        );
        ctx.stroke();
    }

    ctx.restore();
}

// ----------------- PARILTILARI ÇİZ -----------------

function drawSparkles() {
    const cx = offscreen.width * 0.29;
    const cy = offscreen.height / 2;

    ctx.save();

    for (const s of sparkles) {
        const angle = s.angle + time * s.speed;
        const x = cx + Math.cos(angle) * s.dist;
        const y = cy + Math.sin(angle * 1.1) * (s.dist * 0.6);

        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(time * 3 + s.phase));

        ctx.globalAlpha = 0.3 + 0.7 * twinkle;
        ctx.beginPath();
        ctx.arc(x, y, s.size * twinkle, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(191, 219, 254, 0.9)";
        ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
}

// ----------------- ANİMASYON DÖNGÜSÜ -----------------

function animate(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    time += dt;
    if (reveal < 1) {
        reveal += dt * REVEAL_SPEED;
        if (reveal > 1) reveal = 1;
    }

    // Arka plan
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Çiçeği offscreen'e çiz
    drawFlowerToOffscreen();

    const fullH = canvas.height;

    if (reveal < 1) {
        // Çiçek aşağıdan yukarıya açılırken pırıltı YOK
        const visibleH = fullH * reveal;
        const sy = fullH - visibleH;

        ctx.drawImage(
            offscreen,
            0,
            sy,
            canvas.width,
            visibleH,
            0,
            sy,
            canvas.width,
            visibleH
        );
    } else {
        // Çiçek tamamen ortaya çıkınca tam resmi çiz
        ctx.drawImage(offscreen, 0, 0);

        // Ve pırıltıları bundan SONRA ekle
        drawSparkles();
    }

    // Sağdaki not paneli her durumda görünsün
    drawNotePanel();

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
