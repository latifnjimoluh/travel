<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use Dotenv\Dotenv;

require 'vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$mail = new PHPMailer(true);

// Configuration du serveur de messagerie
$mail->isSMTP();
$mail->Host = $_ENV['SMTP_HOST'];
$mail->SMTPAuth = true;
$mail->Username = $_ENV['SMTP_USERNAME'];
$mail->Password = $_ENV['SMTP_PASSWORD'];
$mail->SMTPSecure = $_ENV['SMTP_SECURE'];
$mail->Port = $_ENV['SMTP_PORT'];

// Destinataire
$mail->setFrom($_ENV['SMTP_USERNAME'], 'Notifier');
$commitAuthorEmail = getenv('GITHUB_ACTOR') . '@gmail.com'; // Remplacez "example.com" par votre domaine, si possible.
$mail->addAddress($commitAuthorEmail); // Utiliser l'email de l'auteur du commit comme destinataire

// Informations du commit
$commitAuthor = getenv('GITHUB_ACTOR');
$commitMessage = getenv('GITHUB_COMMIT_MESSAGE');
$commitUrl = getenv('GITHUB_COMMIT_URL');

// Analyse des suggestions
$reportFile = getenv('GITHUB_WORKSPACE') . '/eslint_report.txt';
$reportContent = file_exists($reportFile) ? file_get_contents($reportFile) : "Pas de suggestions.";

// Contenu de l'email
$mail->isHTML(true);
$mail->Subject = "Nouveau commit par $commitAuthor : $commitMessage";
$mail->Body = "
    <h1>Commit notification</h1>
    <p><strong>Auteur :</strong> $commitAuthor</p>
    <p><strong>Message de commit :</strong> $commitMessage</p>
    <p><strong>URL du commit :</strong> <a href='$commitUrl'>$commitUrl</a></p>
    <h2>Suggestions d'améliorations :</h2>
    <pre>$reportContent</pre>
";

// Inclure les suggestions IA dans l'email
$codeContent = file_get_contents('path_to_code_file'); // Chargez le code à analyser
$aiRecommendations = getAIRecommendations($codeContent);
$mail->Body .= "<h2>Suggestions IA :</h2><pre>$aiRecommendations</pre>";

// Envoi de l'email
try {
    $mail->send();
    echo 'Notification envoyée';
} catch (Exception $e) {
    echo "L'envoi de l'email a échoué : {$mail->ErrorInfo}";
}

// Fonction pour obtenir des suggestions IA
function getAIRecommendations($code) {
    $apiKey = $_ENV['OPENAI_API_KEY'];

    $data = [
        "model" => "text-davinci-003",
        "prompt" => "Donnez des recommandations pour améliorer le code suivant :\n\n" . $code,
        "max_tokens" => 100,
    ];

    $ch = curl_init('https://api.openai.com/v1/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);
    return $result['choices'][0]['text'] ?? "Aucune recommandation trouvée.";
}
