#!/bin/bash

# Chemin vers le dossier contenant vos hooks
HOOKS_DIR="./hooks"

# Copier le script post-commit dans le dossier des hooks de Git
cp "${HOOKS_DIR}/post-commit" ".git/hooks/post-commit"

# Rendre le script exécutable
chmod +x ".git/hooks/post-commit"

echo "Hooks installés avec succès."
