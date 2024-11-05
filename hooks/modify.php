// Dans le fichier functions.php de votre thème ou dans un plugin

// Fonction qui sera appelée par le hook
function my_custom_function() {
  echo '<p>Ceci est du contenu ajouté par mon hook personnalisé.</p>';
}

// Ajouter un action hook pour afficher du contenu dans le footer
add_action('wp_footer', 'my_custom_function');

// Fonction pour modifier un hook existant
function modify_existing_hook($content) {
  // Ajouter du texte au contenu
  return $content . '<p>Texte ajouté à la fin du contenu.</p>';
}

// Utiliser un filtre pour modifier le contenu des articles
add_filter('the_content', 'modify_existing_hook');