<?php
require_once 'conexao.php';

// Busca inicial do ranking para carregar rápido na primeira abertura
$rankingInicial = [];
try {
    $stmt = $pdo->query("
        SELECT id, nome, pontos, DATE_FORMAT(dataRegistro, '%d/%m/%Y %H:%i') as data 
        FROM pontuacoes 
        ORDER BY pontos DESC, id ASC 
        LIMIT 10
    ");
    $rankingInicial = $stmt->fetchAll();
} catch (Exception $e) {
    $rankingInicial = [];
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monsters Jump - Jogo com Ranking MySQL</title> 
    <link rel="stylesheet" href="css/style.css?v=12">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
</head>
<body>

    <div class="game-container">
        
        <header class="hud-bar">
            <div class="player-info">
                <span class="label">JOGADOR:</span>
                <span class="value" id="hud-player-name">---</span>
            </div>

            <div class="score-info">
                <span class="label">NÍVEL:</span>
                <span class="value" id="level-display">1</span>
            </div>

            <div class="score-info">
                <span class="label">MOEDAS:</span>
                <span class="value" id="coins-display">0</span>
            </div>

            <div class="score-info">
                <span class="label">PONTOS:</span>
                <span class="value" id="score-display">0</span>
            </div>
        </header>

        <main class="game-board" id="game-board">
            <!-- 1. Logo Neon de Monstros S.A. no Fundo -->
            <div class="monsters-logo-bg">
                <div class="m-icon">M</div>
                <span class="logo-text">MONSTERS, INC.</span>
            </div>

            <!-- 2. Placa Neon do Setor Scream Floor -->
            <div class="scream-floor-sign">FÁBRICA DE GRITOS - SETOR 01</div>

            <!-- 3. Manômetro / Relógio de Pressão no Tubo Superior -->
            <div class="pressure-gauge">
                <div class="gauge-dial"></div>
            </div>

            <!-- 4. Esteira Voadora com Portas do Filme em Pixel Art -->
            <div class="doors-bg" id="doors-bg"></div>

            <!-- 5. Sombras/Fumaça de Fundo -->
            <img src="assets/clouds.png" class="clouds" alt="Fumaça Industrial">

            <!-- 6. Personagem, Obstáculo Tubo e Moeda -->
            <img src="assets/sulley.png" class="mario" alt="Personagem">
            <img src="assets/tubo_susto.svg" class="pipe" alt="Obstáculo Tubo de Susto">
            <img src="assets/moeda.png" class="coin" id="coin" alt="Moeda">
            
            <span class="jump-tip" id="jump-tip">Pressione ESPAÇO ou clique para pular</span>
        </main>
    </div>

    <!-- 0. TELA DE ESCOLHA DO PERSONAGEM -->
    <div class="modal-overlay active" id="character-modal">
        <div class="modal-card character-card">
            <div class="modal-header">
                <h1 class="game-title">MONSTERS JUMP</h1>
                <p class="game-subtitle">Escolha o seu personagem!</p>
            </div>

            <div class="char-grid" id="char-grid">
                <button type="button" class="char-card" data-char="sulley">
                    <img src="assets/sulley.png" alt="Sulley">
                    <span>SULLEY</span>
                </button>
                <button type="button" class="char-card" data-char="boo">
                    <img src="assets/boo.png" alt="Boo">
                    <span>BOO</span>
                </button>
                <button type="button" class="char-card" data-char="mike">
                    <img src="assets/mike.png" alt="Mike">
                    <span>MIKE</span>
                </button>
                <button type="button" class="char-card" data-char="randall">
                    <img src="assets/randall.png" alt="Randall">
                    <span>RANDALL</span>
                </button>
                <button type="button" class="char-card" data-char="roz">
                    <img src="assets/roz.svg" alt="Roz">
                    <span>ROZ</span>
                </button>
                <button type="button" class="char-card" data-char="mario">
                    <img src="assets/mario.gif" alt="Mario">
                    <span>MARIO</span>
                </button>
            </div>

            <div class="modal-actions">
                <button type="button" class="btn btn-primary" id="btn-continue" disabled>CONTINUAR</button>
            </div>
        </div>
    </div>

    <!-- 1. TELA DE INÍCIO / INSERIR NOME -->
    <div class="modal-overlay" id="start-modal">
        <div class="modal-card">
            <div class="modal-header">
                <h1 class="game-title">MONSTERS JUMP</h1>
                <p class="game-subtitle">Corra, desvie dos tubos de susto, pegue moedas e alcance o topo do ranking!</p>
            </div>

            <div class="chosen-box">
                <img src="assets/sulley.png" id="chosen-img" alt="Personagem escolhido">
                <span class="chosen-label">VOCÊ É: <strong id="chosen-name">SULLEY</strong></span>
            </div>

            <form class="start-form" id="start-form">
                <div class="input-group">
                    <label for="player-input">DIGITE SEU NOME:</label>
                    <input 
                        type="text" 
                        id="player-input" 
                        placeholder="Ex: Seu Nome" 
                        maxlength="30" 
                        required 
                        autocomplete="off"
                    >
                </div>

                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary" id="btn-start">INICIAR JOGO</button>
                    <button type="button" class="btn btn-secondary" id="btn-view-ranking">VER RANKING</button>
                    <button type="button" class="btn btn-secondary" id="btn-back">VOLTAR (TROCAR PERSONAGEM)</button>
                </div>
            </form>

            <div class="server-status" id="server-status">
                <span class="status-dot online"></span> Conectado ao MySQL
            </div>
        </div>
    </div>

    <!-- 2. TELA DE GAME OVER & RANKING -->
    <div class="modal-overlay" id="gameover-modal">
        <div class="modal-card gameover-card">
            <div class="modal-header">
                <h2 class="gameover-title">GAME OVER</h2>
                <div class="final-score-box">
                    <div class="final-score-label">SUA PONTUAÇÃO</div>
                    <div class="final-score-num" id="final-score-value">0</div>
                    <div class="final-coins">MOEDAS PEGAS: <span id="final-coins-value">0</span></div>
                    <div class="save-status" id="save-status-msg"></div>
                </div>
            </div>

            <!-- Tabela com o TOP 10 -->
            <div class="ranking-container">
                <h3 class="ranking-title">🏆 TOP 10 MELHORES PONTUAÇÕES</h3>
                <div class="table-wrapper">
                    <table class="ranking-table">
                        <thead>
                            <tr>
                                <th>POS</th>
                                <th>JOGADOR</th>
                                <th>PONTUAÇÃO</th>
                            </tr>
                        </thead>
                        <tbody id="ranking-body">
                            <?php if (!empty($rankingInicial)): ?>
                                <?php foreach ($rankingInicial as $i => $row): ?>
                                    <tr>
                                        <td class="ranking-pos">
                                            <?= $i === 0 ? '🥇 1º' : ($i === 1 ? '🥈 2º' : ($i === 2 ? '🥉 3º' : ($i + 1) . 'º')) ?>
                                        </td>
                                        <td><strong><?= htmlspecialchars($row['nome']) ?></strong></td>
                                        <td><?= (int)$row['pontos'] ?> pts</td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="3" class="loading-cell">Nenhuma pontuação gravada ainda. Jogue para ser o 1º!</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="modal-actions">
                <button type="button" class="btn btn-primary" id="btn-restart">JOGAR NOVAMENTE</button>
                <button type="button" class="btn btn-secondary" id="btn-change-player">TROCAR JOGADOR / PERSONAGEM</button>
            </div>
        </div>
    </div>

    <script src="js/script.js?v=12" defer></script>
</body>
</html>