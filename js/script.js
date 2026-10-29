/* Monsters Jump - Lógica do Jogo com Ranking MySQL */

document.addEventListener('DOMContentLoaded', () => {

    // ===== PERSONAGENS JOGÁVEIS =====
    const PERSONAGENS = {
        sulley:  { nome: 'Sulley',  img: 'assets/sulley.png',  jogador: 120 },
        boo:     { nome: 'Boo',     img: 'assets/boo.png',     jogador: 110 },
        mike:    { nome: 'Mike',    img: 'assets/mike.png',    jogador: 130 },
        randall: { nome: 'Randall', img: 'assets/randall.png', jogador: 90 },
        roz:     { nome: 'Roz',     img: 'assets/roz.svg',     jogador: 115 },
        mario:   { nome: 'Mario',   img: 'assets/mario.gif',   jogador: 100 }
    };

    // Obstáculo fixo do jogo: Tubo de Susto (Largura aumentada para 85px)
    const OBSTACULO_TUBO = { nome: 'Tubo de Susto', img: 'assets/tubo_susto.svg', largura: 85 };

    const IMG_LOGO = 'assets/logo.png';
    const PONTOS_POR_MOEDA = 10;

    // Elementos do Jogo
    const mario = document.querySelector('.mario');
    const pipe = document.querySelector('.pipe');
    const clouds = document.querySelector('.clouds');
    const doorsBg = document.getElementById('doors-bg');
    const coin = document.getElementById('coin');
    const gameBoard = document.getElementById('game-board');

    const hudPlayerName = document.getElementById('hud-player-name');
    const scoreDisplay = document.getElementById('score-display');
    const levelDisplay = document.getElementById('level-display');
    const coinsDisplay = document.getElementById('coins-display');
    const jumpTip = document.getElementById('jump-tip');

    // Modais e Telas
    const characterModal = document.getElementById('character-modal');
    const charGrid = document.getElementById('char-grid');
    const btnContinue = document.getElementById('btn-continue');

    const startModal = document.getElementById('start-modal');
    const startForm = document.getElementById('start-form');
    const playerInput = document.getElementById('player-input');
    const chosenImg = document.getElementById('chosen-img');
    const chosenName = document.getElementById('chosen-name');
    const btnBack = document.getElementById('btn-back');
    const btnViewRanking = document.getElementById('btn-view-ranking');

    const gameoverModal = document.getElementById('gameover-modal');
    const finalScoreValue = document.getElementById('final-score-value');
    const finalCoinsValue = document.getElementById('final-coins-value');
    const saveStatusMsg = document.getElementById('save-status-msg');
    const rankingBody = document.getElementById('ranking-body');
    const btnRestart = document.getElementById('btn-restart');
    const btnChangePlayer = document.getElementById('btn-change-player');

    // Variáveis de Estado
    let currentPlayer = '';
    let personagemEscolhido = null; 
    let score = 0;
    let coinsCollected = 0;
    let isPlaying = false;
    let gameLoop = null;
    let scoreLoop = null;

    // ===== AJUSTE DE TAMANHO DOS ELEMENTOS =====
    function applySizes() {
        const celular = window.matchMedia('(max-width: 600px)').matches;
        const f = celular ? 0.75 : 1;
        const jogador = PERSONAGENS[personagemEscolhido] || PERSONAGENS.sulley;

        mario.style.width = Math.round(jogador.jogador * f) + 'px';
        pipe.style.width = Math.round(OBSTACULO_TUBO.largura * f) + 'px';
    }

    window.addEventListener('resize', () => { if (isPlaying) applySizes(); });

    // ===== ESCOLHA DO PERSONAGEM =====
    function escolherPersonagem(chave) {
        if (!PERSONAGENS[chave]) return;
        personagemEscolhido = chave;
        localStorage.setItem('mario_jump_char', chave);

        charGrid.querySelectorAll('.char-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.char === chave);
        });
        btnContinue.disabled = false;

        mario.src = PERSONAGENS[chave].img;
        chosenImg.src = PERSONAGENS[chave].img;
        chosenName.textContent = PERSONAGENS[chave].nome;
        applySizes();
    }

    charGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.char-card');
        if (card) escolherPersonagem(card.dataset.char);
    });

    btnContinue.addEventListener('click', () => {
        if (!personagemEscolhido) return;
        characterModal.classList.remove('active');
        startModal.classList.add('active');
        playerInput.focus();
    });

    btnBack.addEventListener('click', () => {
        startModal.classList.remove('active');
        characterModal.classList.add('active');
    });

    // A moeda reaparece a cada ciclo de animação
    coin.addEventListener('animationiteration', () => {
        if (isPlaying) coin.style.visibility = 'visible';
    });

    // ===== TABELA DE NÍVEIS =====
    const LEVELS = [
        { nivel: 1, pontos: 0,   velocidade: 1.0  },
        { nivel: 2, pontos: 150, velocidade: 1.28 },
        { nivel: 3, pontos: 300, velocidade: 1.68 }
    ];
    let currentLevel = LEVELS[0];

    function getLevelByScore(pontos) {
        let resultado = LEVELS[0];
        for (const lvl of LEVELS) {
            if (pontos >= lvl.pontos) resultado = lvl;
        }
        return resultado;
    }

    function applySpeed() {
        [pipe, coin, clouds, doorsBg].forEach(el => {
            if (el) {
                el.getAnimations().forEach(anim => {
                    anim.playbackRate = currentLevel.velocidade;
                });
            }
        });
    }

    // Carregar configurações salvas
    const savedName = localStorage.getItem('mario_jump_player');
    if (savedName && playerInput) {
        playerInput.value = savedName;
    }
    const savedChar = localStorage.getItem('mario_jump_char');
    if (savedChar && PERSONAGENS[savedChar]) {
        escolherPersonagem(savedChar);
    } else {
        escolherPersonagem('sulley');
    }

    pipe.src = OBSTACULO_TUBO.img;
    pipe.alt = OBSTACULO_TUBO.nome;

    function atualizarPontos() {
        scoreDisplay.textContent = score;
    }

    // Controles de Pulo
    function handleJumpInput(e) {
        if (e.type === 'keydown' && e.code !== 'Space') return;
        jump();
    }

    document.addEventListener('keydown', handleJumpInput);
    gameBoard.addEventListener('touchstart', jump);
    gameBoard.addEventListener('mousedown', jump);

    function startGame() {
        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        resetElements();

        isPlaying = true;
        score = 0;
        coinsCollected = 0;
        atualizarPontos();
        coinsDisplay.textContent = '0';
        hudPlayerName.textContent = currentPlayer || 'Jogador';

        currentLevel = LEVELS[0];
        levelDisplay.textContent = '1';

        gameBoard.classList.add('running');
        applySpeed();

        scoreLoop = setInterval(() => {
            if (isPlaying) {
                score += 1;
                atualizarPontos();

                const novoNivel = getLevelByScore(score);
                if (novoNivel.nivel !== currentLevel.nivel) {
                    currentLevel = novoNivel;
                    levelDisplay.textContent = currentLevel.nivel;
                    applySpeed();
                }
            }
        }, 100);

        gameLoop = setInterval(checkCollision, 10);
    }

    function resetElements() {
        pipe.style.animation = '';
        pipe.style.left = '';

        coin.style.animation = '';
        coin.style.visibility = 'visible';

        const jogador = PERSONAGENS[personagemEscolhido] || PERSONAGENS.sulley;
        mario.src = jogador.img;
        mario.style.animation = '';
        mario.style.bottom = '0px';
        applySizes();
        mario.style.marginLeft = '';
        mario.classList.remove('jump');

        if (jumpTip) {
            jumpTip.style.opacity = '1';
        }
    }

    function jump() {
        if (!isPlaying) return;
        if (mario.classList.contains('jump')) return;

        mario.classList.add('jump');

        if (jumpTip) {
            jumpTip.style.opacity = '0';
        }

        setTimeout(() => {
            mario.classList.remove('jump');
        }, 500);
    }

    function checkCollision() {
        if (!isPlaying) return;

        const pipePosition = pipe.offsetLeft;
        const marioPosition = +window.getComputedStyle(mario).bottom.replace('px', '');

        const jogadorEsquerda = mario.offsetLeft + mario.offsetWidth * 0.20;
        const jogadorDireita = mario.offsetLeft + mario.offsetWidth * 0.80;
        const obstEsquerda = pipePosition + pipe.offsetWidth * 0.10;
        const obstDireita = pipePosition + pipe.offsetWidth * 0.85;
        const alturaObst = pipe.offsetHeight * 0.6;

        if (obstEsquerda < jogadorDireita && obstDireita > jogadorEsquerda && marioPosition < alturaObst) {
            triggerGameOver(pipePosition, marioPosition);
            return;
        }

        // ===== COLETA DA MOEDA =====
        if (coin.style.visibility !== 'hidden') {
            const moedaEsquerda = coin.offsetLeft;
            const moedaDireita = moedaEsquerda + coin.offsetWidth;
            const moedaBase = parseFloat(window.getComputedStyle(coin).bottom) || 0;
            const moedaTopo = moedaBase + coin.offsetHeight;

            const jogadorBase = marioPosition + mario.offsetHeight * 0.10;
            const jogadorTopo = marioPosition + mario.offsetHeight * 0.85;

            const tocouX = moedaEsquerda < jogadorDireita && moedaDireita > jogadorEsquerda;
            const tocouY = moedaBase < jogadorTopo && moedaTopo > jogadorBase;

            if (tocouX && tocouY) {
                coin.style.visibility = 'hidden';
                coinsCollected += 1;
                score += PONTOS_POR_MOEDA;
                atualizarPontos();
                coinsDisplay.textContent = coinsCollected;
            }
        }
    }

    function triggerGameOver(pipePosition, marioPosition) {
        isPlaying = false;
        clearInterval(gameLoop);
        clearInterval(scoreLoop);

        gameBoard.classList.remove('running');

        pipe.style.animation = 'none';
        pipe.style.left = `${pipePosition}px`;
        coin.style.visibility = 'hidden';

        mario.style.animation = 'none';
        mario.style.bottom = `${marioPosition}px`;
        mario.src = IMG_LOGO;
        mario.style.width = '130px';
        mario.style.marginLeft = '20px';

        finalScoreValue.textContent = score;
        finalCoinsValue.textContent = coinsCollected;
        saveStatusMsg.textContent = 'Salvando pontuação no banco...';
        saveStatusMsg.style.color = '#ffcc00';

        gameoverModal.classList.add('active');
        saveScore(currentPlayer, score);
    }

    function saveScore(playerName, finalScore) {
        fetch('salvar_ranking.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: playerName, pontos: finalScore })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                saveStatusMsg.textContent = 'Pontuação registrada no banco!';
                saveStatusMsg.style.color = '#10b981';
                if (data.ranking) {
                    renderRanking(data.ranking, playerName, finalScore);
                }
            } else {
                saveStatusMsg.textContent = '⚠️ ' + (data.message || 'Erro ao registrar.');
                saveStatusMsg.style.color = '#ef4444';
            }
        })
        .catch(err => {
            console.error('Erro na requisição:', err);
            saveStatusMsg.textContent = '⚠️ Erro ao conectar ao servidor.';
            saveStatusMsg.style.color = '#ef4444';
        });
    }

    function fetchRanking() {
        fetch('obter_ranking.php')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success' && data.ranking) {
                    renderRanking(data.ranking);
                }
            })
            .catch(err => console.error('Erro ao buscar ranking:', err));
    }

    function renderRanking(list, highlightName = null, highlightScore = null) {
        if (!rankingBody) return;
        rankingBody.innerHTML = '';

        if (!list || list.length === 0) {
            rankingBody.innerHTML = '<tr><td colspan="3" class="loading-cell">Nenhuma pontuação registrada ainda.</td></tr>';
            return;
        }

        let highlighted = false;

        list.forEach((item, index) => {
            const tr = document.createElement('tr');

            if (!highlighted && highlightName && item.nome === highlightName && parseInt(item.pontos, 10) === highlightScore) {
                tr.classList.add('highlight-current');
                highlighted = true;
            }

            let medal = `${index + 1}º`;
            if (index === 0) medal = '🥇 1º';
            else if (index === 1) medal = '🥈 2º';
            else if (index === 2) medal = '🥉 3º';

            tr.innerHTML = `
                <td class="ranking-pos">${medal}</td>
                <td><strong>${escapeHtml(item.nome)}</strong></td>
                <td>${parseInt(item.pontos, 10)} pts</td>
            `;

            rankingBody.appendChild(tr);
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    startForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameValue = playerInput.value.trim();
        if (!nameValue) {
            playerInput.focus();
            return;
        }
        currentPlayer = nameValue;
        localStorage.setItem('mario_jump_player', currentPlayer);
        startModal.classList.remove('active');
        startGame();
    });

    btnViewRanking.addEventListener('click', () => {
        fetchRanking();
        finalScoreValue.textContent = '---';
        finalCoinsValue.textContent = '---';
        saveStatusMsg.textContent = '';
        startModal.classList.remove('active');
        gameoverModal.classList.add('active');
    });

    btnRestart.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        if (!currentPlayer) {
            if (personagemEscolhido) {
                startModal.classList.add('active');
                playerInput.focus();
            } else {
                characterModal.classList.add('active');
            }
        } else {
            startGame();
        }
    });

    btnChangePlayer.addEventListener('click', () => {
        gameoverModal.classList.remove('active');
        characterModal.classList.add('active');
    });
});