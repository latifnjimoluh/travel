<?php
// Vérifier si Composer est déjà installé
if (shell_exec('composer --version')) {
    echo "Composer est déjà installé.\n";
    exit;
}

// Téléchargement du script d'installation de Composer
echo "Téléchargement de Composer...\n";
$pharFile = 'composer.phar';
$installerUrl = 'https://getcomposer.org/installer';

// Utiliser file_get_contents pour récupérer le script
$installerContent = file_get_contents($installerUrl);
file_put_contents($pharFile, $installerContent);

// Vérifier l'intégrité du script
echo "Vérification de l'intégrité...\n";
$expectedSignature = file_get_contents($installerUrl . '.sig');
$actualSignature = hash('sha384', file_get_contents($pharFile));

if ($expectedSignature !== $actualSignature) {
    echo "Erreur de vérification de l'intégrité. Installation échouée.\n";
    unlink($pharFile); // Supprimer le fichier téléchargé
    exit;
}

// Installer Composer
echo "Installation de Composer...\n";
shell_exec("php $pharFile --install-dir=/usr/local/bin --filename=composer");

// Nettoyer
unlink($pharFile); // Supprimer le fichier .phar

echo "Composer a été installé avec succès.\n";
?>
