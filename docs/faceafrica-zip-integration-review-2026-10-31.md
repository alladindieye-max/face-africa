# Revue d'intégration du ZIP FACEAFRICA — 31 octobre 2026

## Résultat

Le ZIP reçu n'est pas un ensemble de changements directement superposables au dépôt GitHub actuel. Il contient une application Next.js distincte, un schéma Prisma SQLite et une migration SQLite. Le dépôt existant est déjà une application Next.js reliée à Supabase/PostgreSQL.

## Éléments vérifiés

- Le dépôt GitHub actuel possède déjà une application sous `src/app`, et son `package.json` utilise Next.js 15, Supabase SSR et Supabase JS.
- Le ZIP utilise Next.js 16, Prisma 6, une sortie `standalone`, un fichier `bun.lock` et des scripts de lancement propres à cette autre application.
- `prisma/schema.prisma` du ZIP configure `provider = "sqlite"`.
- `prisma/migrations/20261031110302_init_securite/migration.sql` contient une migration SQLite (par exemple `DATETIME` et les clés primaires en syntaxe SQLite).
- Le projet Supabase existant contient déjà des tables PostgreSQL pour les profils utilisateurs, profils mannequins, photos, castings, candidatures, paiements, notifications, demandes de shooting et journal d'audit, avec RLS activé et des politiques existantes.

## Pourquoi la migration n'a pas été appliquée

Appliquer directement cette migration SQLite sur Supabase PostgreSQL échouerait. Convertir simplement les types ne serait pas suffisant : cela créerait aussi une deuxième série de tables métier parallèles (`Mannequin`, `Casting`, `Candidature`, `Transaction`, etc.) qui dupliquerait les tables Supabase existantes, et les règles d'accès RLS ne seraient pas automatiquement reproduites. Le code du ZIP utilise en outre une authentification personnalisée avec ses propres tables de comptes et sessions, distincte de Supabase Auth.

Aucune modification de schéma n'a donc été appliquée à la base de production.

## Plan d'intégration requis

1. Décider que Supabase Auth/PostgreSQL reste la source de vérité (recommandé), ou valider explicitement une migration d'architecture vers Prisma.
2. Adapter les routes API du ZIP aux tables et identités déjà présentes dans Supabase, en évitant de créer des comptes, castings et paiements en double.
3. Remplacer tout succès de paiement simulé par un statut en attente jusqu'à confirmation d'un webhook prestataire authentifié.
4. Vérifier chaque endpoint, les permissions, les règles RLS, les variables d'environnement et les tests.
5. Exécuter lint, vérification TypeScript, tests et build avant d'ouvrir une PR prête à tester.
6. N'appliquer une migration Supabase qu'après validation du SQL PostgreSQL, des politiques RLS et d'un plan de retour arrière.

## Portée de cette revue

Ce document ne prétend pas que le code du ZIP a déjà été intégré. Il décrit le blocage technique observé et le chemin sûr pour l'intégrer sans remplacer ni endommager l'application en production.
