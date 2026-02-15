// Estado global da aplicação
let state = {
    isRunning: false,
    isPaused: false,
    currentPhase: null,
    phaseTimeRemaining: 0,
    totalTimeElapsed: 0,
    cyclesCompleted: 0,
    currentProfile: null,
    currentCycle: 0,
    calories: 0,
    distance: 0,
    avgSpeed: 0,
    heartRate: 0,
    gpsEnabled: true,
    lastPosition: null,
    settings: {
        weight: 70,
        age: 30,
        maxHR: 190,
        soundEnabled: true,
        vibrationEnabled: true,
        motivationalEnabled: true,
        gpsEnabled: true,
        voiceEnabled: true, // ← NOVA CONFIGURAÇÃO!
        screenTimeout: 1,   // Minutos até desligar ecrã (0 = sempre ligado)
        theme: 'default'
    }
};

// Perfis de treino pré-definidos
const defaultProfiles = [
    {
        id: 'beginner',
        name: 'Iniciante',
        level: 'Fácil',
        warmup: 3 * 60,
        high: 30,
        low: 90,
        cycles: 6,
        cooldown: 3 * 60,
        targetHR: '60-70%'
    },
    {
        id: 'intermediate',
        name: 'Intermediário',
        level: 'Médio',
        warmup: 2 * 60,
        high: 45,
        low: 75,
        cycles: 8,
        cooldown: 2 * 60,
        targetHR: '70-80%'
    },
    {
        id: 'advanced',
        name: 'Avançado',
        level: 'Difícil',
        warmup: 2 * 60,
        high: 60,
        low: 60,
        cycles: 10,
        cooldown: 2 * 60,
        targetHR: '80-90%'
    },
    {
        id: 'hiit',
        name: 'HIIT Extremo',
        level: 'Muito Difícil',
        warmup: 2 * 60,
        high: 20,
        low: 40,
        cycles: 12,
        cooldown: 3 * 60,
        targetHR: '85-95%'
    },
    {
        id: 'endurance',
        name: 'Resistência',
        level: 'Longo',
        warmup: 5 * 60,
        high: 180,
        low: 120,
        cycles: 5,
        cooldown: 5 * 60,
        targetHR: '65-75%'
    },
    {
        id: 'fatburn',
        name: 'Queima Gordura',
        level: 'Moderado',
        warmup: 3 * 60,
        high: 90,
        low: 90,
        cycles: 8,
        cooldown: 3 * 60,
        targetHR: '60-75%'
    }
];

// Conquistas
const achievements = [
    { id: 'first', icon: '🎯', name: 'Primeiro Treino', condition: 'workouts', value: 1 },
    { id: 'week', icon: '📅', name: '7 Dias', condition: 'workouts', value: 7 },
    { id: 'month', icon: '🗓️', name: '30 Dias', condition: 'workouts', value: 30 },
    { id: 'distance', icon: '🏃', name: '10km Total', condition: 'distance', value: 10 },
    { id: 'calories', icon: '🔥', name: '1000 Cal', condition: 'calories', value: 1000 },
    { id: 'time', icon: '⏱️', name: '5h Total', condition: 'time', value: 300 },
    { id: 'streak', icon: '⚡', name: '7 Dias Seguidos', condition: 'streak', value: 7 },
    { id: 'cycles', icon: '🔄', name: '100 Ciclos', condition: 'cycles', value: 100 },
    { id: 'warrior', icon: '💪', name: 'Guerreiro', condition: 'workouts', value: 50 }
];

// Mensagens motivacionais
const motivationalMessages = [
    "💪 Você consegue!",
    "🔥 Mantenha o ritmo!",
    "⚡ Energia máxima!",
    "🎯 Foco no objetivo!",
    "💯 Está indo muito bem!",
    "🚀 Vamos lá!",
    "⭐ Excelente trabalho!",
    "🏆 Campeão!",
    "✨ Supere seus limites!",
    "💥 Dê tudo de si!"
];

let intervalId = null;
let gpsWatchId = null;
let wakeLock = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    loadProfiles();
    loadHistory();
    renderProfiles();
    updateAchievements();
    initGPS();
});

// === FUNÇÕES DE ARMAZENAMENTO ===

function loadSettings() {
    const saved = localStorage.getItem('cardioSettings');
    if (saved) {
        state.settings = { ...state.settings, ...JSON.parse(saved) };
        
        document.getElementById('userWeight').value = state.settings.weight;
        document.getElementById('userAge').value = state.settings.age;
        document.getElementById('maxHR').value = state.settings.maxHR;
        document.getElementById('soundEnabled').checked = state.settings.soundEnabled;
        document.getElementById('vibrationEnabled').checked = state.settings.vibrationEnabled;
        document.getElementById('motivationalEnabled').checked = state.settings.motivationalEnabled;
        document.getElementById('gpsEnabled').checked = state.settings.gpsEnabled;
        
        // Carregar configuração de voz (se existir)
        const voiceCheckbox = document.getElementById('voiceEnabled');
        if (voiceCheckbox) {
            voiceCheckbox.checked = state.settings.voiceEnabled !== false;
        }

        // Carregar timeout do ecrã
        const screenTimeoutEl = document.getElementById('screenTimeout');
        if (screenTimeoutEl) {
            screenTimeoutEl.value = state.settings.screenTimeout ?? 1;
        }
        
        if (state.settings.theme === 'dark') {
            document.body.classList.add('dark');
        } else if (state.settings.theme === 'light') {
            document.body.classList.add('light');
        }
    }
}

function saveSettings() {
    state.settings.weight = parseInt(document.getElementById('userWeight').value);
    state.settings.age = parseInt(document.getElementById('userAge').value);
    state.settings.maxHR = parseInt(document.getElementById('maxHR').value);
    state.settings.soundEnabled = document.getElementById('soundEnabled').checked;
    state.settings.vibrationEnabled = document.getElementById('vibrationEnabled').checked;
    state.settings.motivationalEnabled = document.getElementById('motivationalEnabled').checked;
    state.settings.gpsEnabled = document.getElementById('gpsEnabled').checked;
    
    // Salvar configuração de voz
    const voiceCheckbox = document.getElementById('voiceEnabled');
    if (voiceCheckbox) {
        state.settings.voiceEnabled = voiceCheckbox.checked;
    }

    // Salvar timeout do ecrã
    const screenTimeoutEl = document.getElementById('screenTimeout');
    if (screenTimeoutEl) {
        state.settings.screenTimeout = parseInt(screenTimeoutEl.value);
    }
    
    localStorage.setItem('cardioSettings', JSON.stringify(state.settings));
    
    showNotification('✅ Configurações salvas!');
    
    if (state.settings.gpsEnabled && !gpsWatchId) {
        initGPS();
    } else if (!state.settings.gpsEnabled && gpsWatchId) {
        stopGPS();
    }
}

function loadProfiles() {
    const saved = localStorage.getItem('customProfiles');
    if (saved) {
        const custom = JSON.parse(saved);
        defaultProfiles.push(...custom);
    }
}

function saveProfile(profile) {
    const saved = localStorage.getItem('customProfiles');
    const custom = saved ? JSON.parse(saved) : [];
    custom.push(profile);
    localStorage.setItem('customProfiles', JSON.stringify(custom));
}

function loadHistory() {
    const saved = localStorage.getItem('workoutHistory');
    return saved ? JSON.parse(saved) : [];
}

function saveWorkout(workout) {
    const history = loadHistory();
    history.unshift(workout);
    
    // Manter apenas últimos 50 treinos
    if (history.length > 50) {
        history.pop();
    }
    
    localStorage.setItem('workoutHistory', JSON.stringify(history));
    updateAchievements();
}

// === INTERFACE ===

function switchTab(tab) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    event.target.classList.add('active');
    
    if (tab === 'workout') {
        document.getElementById('workoutScreen').classList.add('active');
    } else if (tab === 'profiles') {
        document.getElementById('profilesScreen').classList.add('active');
        renderProfiles();
    } else if (tab === 'guide') {
        document.getElementById('guideScreen').classList.add('active');
        calculateMaxHR();
    } else if (tab === 'history') {
        document.getElementById('historyScreen').classList.add('active');
        renderHistory();
    } else if (tab === 'settings') {
        document.getElementById('settingsScreen').classList.add('active');
    }
}

function toggleTheme() {
    if (document.body.classList.contains('dark')) {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        state.settings.theme = 'light';
    } else if (document.body.classList.contains('light')) {
        document.body.classList.remove('light');
        state.settings.theme = 'default';
    } else {
        document.body.classList.add('dark');
        state.settings.theme = 'dark';
    }
    
    localStorage.setItem('cardioSettings', JSON.stringify(state.settings));
}

function showNotification(message) {
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    notif.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(16, 185, 129, 0.95);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 2000;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// === PERFIS ===

function renderProfiles() {
    const grid = document.getElementById('profileGrid');
    grid.innerHTML = '';
    
    defaultProfiles.forEach(profile => {
        const totalTime = profile.warmup + (profile.high + profile.low) * profile.cycles + profile.cooldown;
        const card = document.createElement('div');
        card.className = 'profile-card';
        if (state.currentProfile?.id === profile.id) {
            card.classList.add('selected');
        }
        
        card.innerHTML = `
            <div class="profile-header">
                <div class="profile-name">${profile.name}</div>
                <div class="profile-badge">${profile.level}</div>
            </div>
            <div class="profile-details">
                <div class="profile-detail">
                    <div class="profile-detail-value">${profile.cycles}</div>
                    <div>Ciclos</div>
                </div>
                <div class="profile-detail">
                    <div class="profile-detail-value">${Math.floor(totalTime / 60)}'</div>
                    <div>Duração</div>
                </div>
                <div class="profile-detail">
                    <div class="profile-detail-value">${profile.targetHR}</div>
                    <div>FC Alvo</div>
                </div>
            </div>
        `;
        
        card.onclick = () => selectProfile(profile);
        grid.appendChild(card);
    });
}

function selectProfile(profile) {
    state.currentProfile = profile;
    renderProfiles();
    showNotification(`✅ Perfil "${profile.name}" selecionado`);
}

function createCustomProfile() {
    document.getElementById('customProfileModal').classList.add('show');
}

function closeCustomProfile() {
    document.getElementById('customProfileModal').classList.remove('show');
}

function saveCustomProfile() {
    const name = document.getElementById('customName').value;
    if (!name) {
        alert('Digite um nome para o perfil');
        return;
    }
    
    const profile = {
        id: 'custom_' + Date.now(),
        name: name,
        level: 'Personalizado',
        warmup: parseInt(document.getElementById('customWarmup').value) * 60,
        high: parseInt(document.getElementById('customHigh').value),
        low: parseInt(document.getElementById('customLow').value),
        cycles: parseInt(document.getElementById('customCycles').value),
        cooldown: parseInt(document.getElementById('customCooldown').value) * 60,
        targetHR: 'Personalizado'
    };
    
    saveProfile(profile);
    defaultProfiles.push(profile);
    renderProfiles();
    closeCustomProfile();
    showNotification('✅ Perfil criado com sucesso!');
}

// === TREINO ===

function startWorkout() {
    if (!state.currentProfile) {
        showNotification('⚠️ Selecione um perfil primeiro!');
        switchTab('profiles');
        document.getElementById('profilesScreen').classList.add('active');
        return;
    }
    
    if (state.isPaused) {
        state.isPaused = false;
    } else {
        // Novo treino
        state.currentPhase = 'warmup';
        state.phaseTimeRemaining = state.currentProfile.warmup;
        state.totalTimeElapsed = 0;
        state.cyclesCompleted = 0;
        state.currentCycle = 0;
        state.calories = 0;
        state.distance = 0;
        state.lastPosition = null;
    }
    
    state.isRunning = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('stopBtn').disabled = false;

    updateDisplay();
    playSoundPhase('warmup'); // Som de aquecimento
    vibrate([200]);
    speak('Aquecimento');

    if (state.settings.gpsEnabled) startGPS();
    requestWakeLock();
    intervalId = setInterval(tick, 1000);
}

function pauseWorkout() {
    state.isPaused = true;
    state.isRunning = false;
    clearInterval(intervalId);
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('startBtn').innerHTML = '▶️ Retomar';
    
    document.getElementById('phaseLabel').textContent = '⏸️ PAUSADO';
    
    stopGPS();
    releaseWakeLock();
}

function stopWorkout() {
    const wasRunning = state.isRunning || state.isPaused;
    
    state.isRunning = false;
    state.isPaused = false;
    clearInterval(intervalId);
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('startBtn').innerHTML = '▶️ Iniciar';
    
    document.getElementById('mainDisplay').className = 'main-display';
    document.getElementById('phaseIcon').textContent = '🏃‍♂️';
    document.getElementById('phaseLabel').textContent = 'PRONTO PARA COMEÇAR';
    document.getElementById('timer').textContent = '0:00';
    document.getElementById('nextPhase').textContent = 'Selecione um perfil e pressione Iniciar';
    
    stopGPS();
    releaseWakeLock();
    
    // Salvar treino se foi significativo
    if (wasRunning && state.totalTimeElapsed > 60) {
        saveWorkout({
            date: new Date().toISOString(),
            profile: state.currentProfile.name,
            duration: state.totalTimeElapsed,
            cycles: state.cyclesCompleted,
            calories: Math.round(state.calories),
            distance: parseFloat(state.distance.toFixed(2)),
            avgHR: state.heartRate || 0
        });
        
        showNotification('✅ Treino salvo!');
    }
}

function tick() {
    if (!state.isRunning) return;
    
    state.phaseTimeRemaining--;
    state.totalTimeElapsed++;
    
    // Calcular calorias (MET aproximado)
    const met = state.currentPhase === 'high' ? 8.0 : (state.currentPhase === 'low' ? 5.0 : 3.5);
    state.calories += (met * state.settings.weight * (1/3600));
    
    // Simular frequência cardíaca (atualiza a cada segundo com transição suave)
    const maxHR = state.settings.maxHR;
    let targetHR;
    
    if (state.currentPhase === 'warmup') {
        targetHR = maxHR * 0.6 + Math.random() * 10;
    } else if (state.currentPhase === 'high') {
        targetHR = maxHR * 0.85 + Math.random() * 15;
    } else if (state.currentPhase === 'low') {
        targetHR = maxHR * 0.65 + Math.random() * 10;
    } else if (state.currentPhase === 'cooldown') {
        targetHR = maxHR * 0.55 + Math.random() * 10;
    } else {
        targetHR = maxHR * 0.6; // Estado inicial
    }
    
    // Transição suave - FC não muda bruscamente
    if (state.heartRate === 0) {
        state.heartRate = Math.floor(targetHR);
    } else {
        const diff = targetHR - state.heartRate;
        state.heartRate += Math.floor(diff * 0.2); // Ajusta 20% por segundo
    }
    
    // Alertas contagem regressiva (últimos 3 segundos)
    if (state.phaseTimeRemaining === 3 || state.phaseTimeRemaining === 2 || state.phaseTimeRemaining === 1) {
        playSoundPhase('countdown');
        vibrate([100]);
    }
    
    // Mensagem motivacional aleatória
    if (state.settings.motivationalEnabled && state.totalTimeElapsed % 60 === 0 && Math.random() < 0.3) {
        const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        showNotification(msg);
    }
    
    // Mudança de fase
    if (state.phaseTimeRemaining <= 0) {
        changePhase();
    }
    
    updateDisplay();
}

function changePhase() {
    const profile = state.currentProfile;
    
    if (state.currentPhase === 'warmup') {
        state.currentPhase = 'high';
        state.phaseTimeRemaining = profile.high;
        playSoundPhase('high');   // ⬆️⬆️ 2 bips agudos
        vibrate([300, 100, 300]);
        speak('Rápido!');

    } else if (state.currentPhase === 'high') {
        state.currentPhase = 'low';
        state.phaseTimeRemaining = profile.low;
        playSoundPhase('low');    // ⬇️⬇️ 2 bips graves
        vibrate([300]);
        speak('Normal');

    } else if (state.currentPhase === 'low') {
        state.currentCycle++;

        if (state.currentCycle < profile.cycles) {
            state.currentPhase = 'high';
            state.phaseTimeRemaining = profile.high;
            state.cyclesCompleted++;
            playSoundPhase('high'); // ⬆️⬆️ 2 bips agudos
            vibrate([300, 100, 300]);
            speak('Rápido!');
        } else {
            state.currentPhase = 'cooldown';
            state.phaseTimeRemaining = profile.cooldown;
            state.cyclesCompleted++;
            playSoundPhase('cooldown'); // ⬇️⬇️⬇️ 3 bips descentes
            vibrate([400]);
            speak('Arrefecimento');
        }

    } else if (state.currentPhase === 'cooldown') {
        playSoundPhase('complete'); // 🎉 4 bips ascendentes
        vibrate([500, 200, 500]);
        speak('Treino completo! Parabéns!');
        showNotification('🎉 Treino concluído! Parabéns!');
        stopWorkout();
    }
}

function updateDisplay() {
    const icons = {
        warmup: '🔥',
        high: '⚡',
        low: '✅',
        cooldown: '❄️'
    };
    
    const labels = {
        warmup: 'AQUECIMENTO',
        high: 'ALTA INTENSIDADE',
        low: 'BAIXA INTENSIDADE',
        cooldown: 'ARREFECIMENTO'
    };
    
    document.getElementById('phaseIcon').textContent = icons[state.currentPhase] || '🏃‍♂️';
    document.getElementById('phaseLabel').textContent = labels[state.currentPhase] || 'PRONTO';
    document.getElementById('timer').textContent = formatTime(state.phaseTimeRemaining);
    document.getElementById('totalTime').textContent = formatTime(state.totalTimeElapsed);
    document.getElementById('cycles').textContent = state.cyclesCompleted;
    document.getElementById('calories').textContent = Math.round(state.calories);
    document.getElementById('distance').innerHTML = state.distance.toFixed(2) + '<span class="stat-unit">km</span>';
    document.getElementById('hrValue').textContent = state.heartRate || '--';
    
    // Atualizar classe do display
    const display = document.getElementById('mainDisplay');
    display.className = 'main-display ' + (state.currentPhase || '');
    
    // Zona de FC
    const hrPercent = state.heartRate ? (state.heartRate / state.settings.maxHR) * 100 : 0;
    document.getElementById('hrZoneFill').style.width = Math.min(hrPercent, 100) + '%';
    
    // Próxima fase
    if (state.currentPhase === 'warmup') {
        document.getElementById('nextPhase').textContent = `Próximo: ${state.currentProfile.high}s alta intensidade`;
    } else if (state.currentPhase === 'high') {
        document.getElementById('nextPhase').textContent = `Próximo: ${state.currentProfile.low}s baixa intensidade`;
    } else if (state.currentPhase === 'low') {
        if (state.currentCycle < state.currentProfile.cycles - 1) {
            document.getElementById('nextPhase').textContent = `Ciclo ${state.currentCycle + 1}/${state.currentProfile.cycles}`;
        } else {
            document.getElementById('nextPhase').textContent = 'Próximo: Arrefecimento';
        }
    } else if (state.currentPhase === 'cooldown') {
        document.getElementById('nextPhase').textContent = 'Quase lá! Continue...';
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// === HISTÓRICO ===

function renderHistory() {
    const history = loadHistory();
    const list = document.getElementById('historyList');
    
    if (history.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <div>Nenhum treino registrado ainda</div>
            </div>
        `;
        return;
    }
    
    list.innerHTML = '';
    history.slice(0, 20).forEach(workout => {
        const date = new Date(workout.date);
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="history-header">
                <div class="history-date">
                    ${date.toLocaleDateString('pt-PT')} às ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div class="history-duration">${formatTime(workout.duration)}</div>
            </div>
            <div style="margin-bottom: 10px; opacity: 0.8;">${workout.profile}</div>
            <div class="history-stats">
                <div>
                    <span class="history-stat-value">🔄 ${workout.cycles}</span>
                    <div>Ciclos</div>
                </div>
                <div>
                    <span class="history-stat-value">🔥 ${workout.calories}</span>
                    <div>Calorias</div>
                </div>
                <div>
                    <span class="history-stat-value">📏 ${workout.distance}</span>
                    <div>km</div>
                </div>
                <div>
                    <span class="history-stat-value">❤️ ${workout.avgHR || '--'}</span>
                    <div>BPM</div>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
    
    renderChart();
}

// === GPS ===

let gpsPermissionGranted = false;

function initGPS() {
    if (!navigator.geolocation) {
        showNotification('⚠️ GPS não disponível neste dispositivo');
        return;
    }
    if (!state.settings.gpsEnabled) return;

    // Pedir permissão e posição inicial
    navigator.geolocation.getCurrentPosition(
        position => {
            gpsPermissionGranted = true;
            state.lastPosition = position;
            updateGpsStatus('ok');
            showNotification('📍 GPS pronto!');
        },
        error => {
            gpsPermissionGranted = false;
            updateGpsStatus('error');
            if (error.code === 1) {
                showNotification('⚠️ Permita acesso à localização nas definições');
            } else if (error.code === 2) {
                showNotification('⚠️ Sinal GPS fraco - vá para exterior');
            } else {
                showNotification('⚠️ GPS timeout - tente novamente');
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

function startGPS() {
    if (!state.settings.gpsEnabled || !navigator.geolocation) return;

    // Se ainda não tem permissão, pedir primeiro e depois iniciar
    if (!gpsPermissionGranted) {
        navigator.geolocation.getCurrentPosition(
            position => {
                gpsPermissionGranted = true;
                state.lastPosition = position;
                updateGpsStatus('active');
                iniciarWatch();
            },
            error => {
                gpsPermissionGranted = false;
                updateGpsStatus('error');
                showNotification('⚠️ GPS sem permissão - distância não será registada');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    } else {
        iniciarWatch();
    }
}

function iniciarWatch() {
    // Parar watch anterior se existir
    if (gpsWatchId) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }

    gpsWatchId = navigator.geolocation.watchPosition(
        position => {
            const accuracy = position.coords.accuracy; // Precisão em metros

            if (state.lastPosition && state.isRunning) {
                const distance = calculateDistance(
                    state.lastPosition.coords.latitude,
                    state.lastPosition.coords.longitude,
                    position.coords.latitude,
                    position.coords.longitude
                );

                // Filtro mais permissivo:
                // - Mínimo: 1 metro (0.001 km) para contar
                // - Máximo: 200 metros (0.2 km) por leitura (evita saltos GPS)
                // - Só conta se precisão melhor que 50 metros
                if (distance > 0.001 && distance < 0.2 && accuracy < 50) {
                    state.distance += distance;
                }
            }

            state.lastPosition = position;
            updateGpsStatus('active');
        },
        error => {
            updateGpsStatus('error');
            // Tentar reiniciar após erro
            if (error.code === 3) { // Timeout
                setTimeout(() => {
                    if (state.isRunning) iniciarWatch();
                }, 3000);
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 30000,   // 30 segundos timeout (mais generoso)
            maximumAge: 1000  // Aceitar posição com até 1 segundo de idade
        }
    );
}

function stopGPS() {
    if (gpsWatchId) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    updateGpsStatus('idle');
}

function updateGpsStatus(status) {
    const el = document.getElementById('gpsStatus');
    if (!el) return;

    if (!state.settings.gpsEnabled) {
        el.textContent = 'GPS: OFF';
        el.style.color = '#ef4444';
    } else if (status === 'active') {
        el.textContent = 'GPS: ✓';
        el.style.color = '#10b981';
    } else if (status === 'ok') {
        el.textContent = 'GPS: OK';
        el.style.color = '#f59e0b';
    } else if (status === 'error') {
        el.textContent = 'GPS: ✗';
        el.style.color = '#ef4444';
    } else {
        el.textContent = 'GPS: --';
        el.style.color = '#6b7280';
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    // Fórmula de Haversine - retorna distância em km
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// === CONQUISTAS ===

function updateAchievements() {
    const history = loadHistory();
    const stats = calculateStats(history);
    
    achievements.forEach(achievement => {
        const unlocked = checkAchievement(achievement, stats);
        const saved = localStorage.getItem('achievements') || '[]';
        const unlockedList = JSON.parse(saved);
        
        if (unlocked && !unlockedList.includes(achievement.id)) {
            unlockedList.push(achievement.id);
            localStorage.setItem('achievements', JSON.stringify(unlockedList));
            showNotification(`🏆 Nova conquista: ${achievement.name}!`);
        }
    });
}

function checkAchievement(achievement, stats) {
    switch (achievement.condition) {
        case 'workouts':
            return stats.totalWorkouts >= achievement.value;
        case 'distance':
            return stats.totalDistance >= achievement.value;
        case 'calories':
            return stats.totalCalories >= achievement.value;
        case 'time':
            return stats.totalTime >= achievement.value * 60;
        case 'cycles':
            return stats.totalCycles >= achievement.value;
        default:
            return false;
    }
}

function calculateStats(history) {
    return {
        totalWorkouts: history.length,
        totalDistance: history.reduce((sum, w) => sum + (w.distance || 0), 0),
        totalCalories: history.reduce((sum, w) => sum + (w.calories || 0), 0),
        totalTime: history.reduce((sum, w) => sum + (w.duration || 0), 0),
        totalCycles: history.reduce((sum, w) => sum + (w.cycles || 0), 0)
    };
}

function showAchievements() {
    const grid = document.getElementById('achievementsGrid');
    const unlockedList = JSON.parse(localStorage.getItem('achievements') || '[]');
    
    grid.innerHTML = '';
    achievements.forEach(achievement => {
        const div = document.createElement('div');
        div.className = 'achievement';
        if (unlockedList.includes(achievement.id)) {
            div.classList.add('unlocked');
        }
        div.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-name">${achievement.name}</div>
        `;
        grid.appendChild(div);
    });
    
    document.getElementById('achievementsModal').classList.add('show');
}

function closeAchievements() {
    document.getElementById('achievementsModal').classList.remove('show');
}

// === SONS, VOZ E VIBRAÇÃO ===

// AudioContext partilhado para funcionar em segundo plano
let sharedAudioContext = null;

function getAudioContext() {
    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
        sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Retomar se suspenso
    if (sharedAudioContext.state === 'suspended') {
        sharedAudioContext.resume();
    }
    return sharedAudioContext;
}

// Sons distintos por fase - funcionam em segundo plano
function playSoundPhase(phase) {
    if (!state.settings.soundEnabled) return;

    const ctx = getAudioContext();

    const sounds = {
        // Alta intensidade: 2 bips agudos rápidos ⬆️⬆️
        high: [
            { freq: 1000, start: 0,    dur: 0.15 },
            { freq: 1200, start: 0.2,  dur: 0.15 }
        ],
        // Baixa intensidade: 2 bips graves lentos ⬇️⬇️
        low: [
            { freq: 600,  start: 0,    dur: 0.2  },
            { freq: 500,  start: 0.25, dur: 0.2  }
        ],
        // Aquecimento: 1 bip médio suave
        warmup: [
            { freq: 700,  start: 0,    dur: 0.3  }
        ],
        // Arrefecimento: 3 bips descentes ⬇️⬇️⬇️
        cooldown: [
            { freq: 800,  start: 0,    dur: 0.15 },
            { freq: 650,  start: 0.2,  dur: 0.15 },
            { freq: 500,  start: 0.4,  dur: 0.2  }
        ],
        // Fim do treino: 4 bips ascendentes 🎉
        complete: [
            { freq: 600,  start: 0,    dur: 0.15 },
            { freq: 750,  start: 0.2,  dur: 0.15 },
            { freq: 900,  start: 0.4,  dur: 0.15 },
            { freq: 1100, start: 0.6,  dur: 0.3  }
        ],
        // Contagem regressiva: bip curto neutro
        countdown: [
            { freq: 750,  start: 0,    dur: 0.1  }
        ]
    };

    const pattern = sounds[phase] || sounds.countdown;

    pattern.forEach(({ freq, start, dur }) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.value = freq;

        const t = ctx.currentTime + start;
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.start(t);
        osc.stop(t + dur + 0.05);
    });
}

// Voz - só funciona com ecrã ligado
// Quando ecrã desligado, os sons distintos substituem a voz
function speak(text) {
    if (!state.settings.soundEnabled || !state.settings.voiceEnabled) return;

    // Verificar se documento está visível (ecrã ligado)
    if (document.visibilityState !== 'visible') {
        // Ecrã apagado - voz não funciona, sons já tratam disso
        return;
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Aguardar vozes carregarem (necessário em alguns browsers)
        const voices = window.speechSynthesis.getVoices();
        const ptVoice = voices.find(v =>
            v.lang.startsWith('pt') || v.lang.startsWith('PT')
        );

        if (ptVoice) utterance.voice = ptVoice;

        utterance.lang   = 'pt-PT';
        utterance.rate   = 1.0;
        utterance.pitch  = 1.0;
        utterance.volume = 1.0;

        window.speechSynthesis.speak(utterance);
    }
}

// Garantir que vozes estão carregadas
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

function playSound(frequency = 800, duration = 200) {
    if (!state.settings.soundEnabled) return;
    try {
        const ctx  = getAudioContext();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration / 1000 + 0.05);
    } catch (e) {
        console.log('Som não disponível');
    }
}

function vibrate(pattern = [200]) {
    if (!state.settings.vibrationEnabled) return;
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// === WAKE LOCK & ECRÃ ===

let screenOffTimer = null;

async function requestWakeLock() {
    // Cancelar timer anterior se existir
    if (screenOffTimer) {
        clearTimeout(screenOffTimer);
        screenOffTimer = null;
    }

    const screenTimeout = state.settings.screenTimeout; // minutos (0 = sempre ligado)

    if (screenTimeout === 0) {
        // Manter ecrã sempre ligado
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            console.log('Wake Lock não disponível');
        }
    } else {
        // Manter ligado X minutos depois desliga
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            console.log('Wake Lock não disponível');
        }

        // Agendar desligar ecrã após timeout configurado
        screenOffTimer = setTimeout(async () => {
            await releaseWakeLock();
            showNotification(`📱 Ecrã desligado - treino continua em segundo plano`);
        }, screenTimeout * 60 * 1000);
    }
}

// Reativar ecrã quando o utilizador tocar
document.addEventListener('touchstart', async () => {
    if (state.isRunning && !wakeLock) {
        await requestWakeLock();
    }
}, { passive: true });

document.addEventListener('click', async () => {
    if (state.isRunning && !wakeLock) {
        await requestWakeLock();
    }
});

async function releaseWakeLock() {
    if (screenOffTimer) {
        clearTimeout(screenOffTimer);
        screenOffTimer = null;
    }
    if (wakeLock !== null) {
        try {
            await wakeLock.release();
        } catch (e) {}
        wakeLock = null;
    }
}

// === UTILIDADES ===

function calculateMaxHR() {
    const age = parseInt(document.getElementById('guideAge').value) || 30;
    const maxHR = 220 - age;
    
    const zones = [
        { name: 'Zona 1 - Muito Leve', min: Math.round(maxHR * 0.50), max: Math.round(maxHR * 0.60), color: '#10b981' },
        { name: 'Zona 2 - Queima Gordura', min: Math.round(maxHR * 0.60), max: Math.round(maxHR * 0.70), color: '#22c55e' },
        { name: 'Zona 3 - Aeróbico', min: Math.round(maxHR * 0.70), max: Math.round(maxHR * 0.80), color: '#3b82f6' },
        { name: 'Zona 4 - Limiar', min: Math.round(maxHR * 0.80), max: Math.round(maxHR * 0.90), color: '#f59e0b' },
        { name: 'Zona 5 - Máximo', min: Math.round(maxHR * 0.90), max: Math.round(maxHR * 1.00), color: '#ef4444' }
    ];
    
    let html = `
        <div style="text-align: center; font-size: 24px; font-weight: 700; margin-bottom: 20px; color: #ec4899;">
            Sua FC Máxima: ${maxHR} BPM
        </div>
        <div style="font-size: 14px; opacity: 0.8; text-align: center; margin-bottom: 20px;">
            (Baseado na fórmula: 220 - ${age} anos)
        </div>
        <div style="display: grid; gap: 10px;">
    `;
    
    zones.forEach(zone => {
        html += `
            <div style="background: rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 8px; 
                        border-left: 4px solid ${zone.color};">
                <strong>${zone.name}</strong><br>
                <span style="font-size: 18px; font-weight: 700;">${zone.min} - ${zone.max} BPM</span>
            </div>
        `;
    });
    
    html += '</div>';
    
    document.getElementById('hrResults').innerHTML = html;
}

function clearAllData() {
    if (confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita.')) {
        localStorage.clear();
        showNotification('✅ Todos os dados foram apagados');
        setTimeout(() => location.reload(), 1500);
    }
}

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

// Quando o ecrã volta (utilizador toca) - retomar GPS e Audio
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.isRunning) {
        // Retomar AudioContext se suspenso
        if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
            sharedAudioContext.resume();
        }
        // Reiniciar GPS se parou em segundo plano
        if (state.settings.gpsEnabled && !gpsWatchId) {
            iniciarWatch();
        }
        // Reativar ecrã
        requestWakeLock();
    }
});

// Prevenir zoom
document.addEventListener('touchmove', function (event) {
    if (event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
