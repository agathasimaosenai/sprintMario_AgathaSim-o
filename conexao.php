<?php
/* Conexão com o MySQL/MariaDB (Laragon)
   - Cria o banco "sprintMario" se ele ainda não existir
   - Cria a tabela "pontuacoes" se ela ainda não existir
   Os outros arquivos PHP usam: require_once 'conexao.php';  e depois a variável $pdo */

$host   = "localhost";
$port   = "3306";
$user   = "root";
$pass   = "mysql";
$dbname = "sprintMario";

try {
    // Conecta ao servidor MySQL (ainda sem escolher o banco)
    $pdo = new PDO(
        "mysql:host=$host;port=$port;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    // Cria o banco de dados, se não existir
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");

    // Cria a tabela de pontuações, se não existir
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `pontuacoes` (
            `id`           INT AUTO_INCREMENT PRIMARY KEY,
            `nome`         VARCHAR(50) NOT NULL,
            `pontos`       INT NOT NULL,
            `dataRegistro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
} catch (PDOException $e) {
    // Se der erro, responde em JSON para o JavaScript conseguir mostrar a mensagem
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'status'  => 'error',
        'message' => 'Não foi possível conectar ao Banco de Dados. ' . $e->getMessage()
    ]);

    exit;
}
?>