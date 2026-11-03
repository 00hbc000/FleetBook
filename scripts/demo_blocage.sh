#!/bin/sh
# Démo UNIQUEMENT sur une branche secure de formation (aucune vraie clé).
set -eu
[ "$(git branch --show-current)" = secure ] || { echo 'Branche secure requise'; exit 1; }
file=demo/cle_factice.txt
case "${1:-}" in
  add)
    [ ! -e "$file" ] || { echo 'Fichier déjà présent'; exit 1; }
    mkdir -p demo
    # Construire une chaîne fictive sans l'inscrire en clair dans ce script.
    printf '%s_%s_%s\n' FAKE API_KEY FOR_TRAINING > "$file"
    git add "$file"
    git commit -m 'Démo locale : chaîne factice détectable'
    git push origin secure
    echo 'Attendre le job secrets rouge ; ne jamais utiliser de clé réelle.'
    ;;
  remove)
    [ -f "$file" ] || { echo 'Fichier de démo absent'; exit 1; }
    echo 'Confirmer d abord que la clé factice a été remplacée/révoquée dans le scénario.'
    git rm "$file"
    git commit -m 'Retirer la chaîne factice de la démo'
    git push origin secure
    echo 'Contrôler le job secrets ; l ancien commit subsiste dans l historique.'
    ;;
  *) echo 'Usage : sh scripts/demo_blocage.sh add|remove'; exit 2 ;;
esac
