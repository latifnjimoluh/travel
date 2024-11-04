<?php
function encryptEmail($email, $secretKey) {
    // Générer un vecteur d'initialisation (IV)
    $ivLength = openssl_cipher_iv_length('aes-256-cbc');
    $iv = openssl_random_pseudo_bytes($ivLength);
    
    // Chiffrer l'email
    $encryptedEmail = openssl_encrypt($email, 'aes-256-cbc', $secretKey, 0, $iv);

    // Retourner l'email chiffré avec l'IV pour déchiffrement
    return base64_encode($iv . $encryptedEmail);
}

function decryptEmail($encryptedEmailWithIv, $secretKey) {
    // Décoder l'email chiffré
    $data = base64_decode($encryptedEmailWithIv);
    
    // Récupérer l'IV et l'email chiffré
    $ivLength = openssl_cipher_iv_length('aes-256-cbc');
    $iv = substr($data, 0, $ivLength);
    $encryptedEmail = substr($data, $ivLength);

    // Déchiffrer l'email
    return openssl_decrypt($encryptedEmail, 'aes-256-cbc', $secretKey, 0, $iv);
}

// Exemple d'utilisation
$email = "user@example.com";
$secretKey = "votre_cle_secrete"; // Assurez-vous que la clé est suffisamment longue

$encryptedEmail = encryptEmail($email, $secretKey);
echo "Email chiffré : " . $encryptedEmail . "\n";

$decryptedEmail = decryptEmail($encryptedEmail, $secretKey);
echo "Email déchiffré : " . $decryptedEmail . "\n";
?>
