# FACEAFRICA V2

Refonte full-stack progressive de FACEAFRICA, en conservant l'identité visuelle terre cuite / sable / brun de la V1. Le prototype original est conservé dans `public/v1-prototype.html`.

## Architecture

- Next.js App Router + React + TypeScript.
- Supabase Auth et PostgreSQL, avec Row Level Security.
- Migration SQL versionnée dans `supabase/migrations/`.
- Zod pour valider les entrées de l'API.
- Calcul de devis shooting isolé et testable dans `src/lib/config.ts`.

## Prérequis

- Node.js 20.9 ou supérieur.
- Un projet Supabase pour activer l'authentification et les données persistantes.

## Installation locale

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ouvrir `http://localhost:3000`.

Sans configuration Supabase, le site public et les pages d'information restent consultables, mais les fonctionnalités dépendantes du backend doivent afficher un état explicite. Le système ne prétend pas enregistrer les demandes ou les paiements lorsque la configuration est absente.

## Supabase

1. Créer un projet Supabase.
2. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local`.
3. Appliquer la migration `supabase/migrations/0001_initial_schema.sql` avec le Supabase CLI ou l'éditeur SQL du projet après revue.
4. Activer la confirmation d'email et configurer les URL de redirection autorisées dans Supabase Auth.
5. Créer et tester les buckets de stockage avant d'activer les téléversements. Les images privées doivent rester privées jusqu'à leur modération.
6. Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` au navigateur ni la committer.

## Variables d'environnement

Voir `.env.example`. Les clés de paiement et d'email restent vides tant qu'un fournisseur n'a pas été sélectionné et configuré.

## Commandes

```bash
npm run dev       # développement
npm run typecheck # vérification TypeScript
npm run lint      # lint
npm test          # tests unitaires
npm run build     # compilation de production
```

## Paramètres commerciaux initiaux

- Tarif d'une annonce : 2 000 XOF, modifiable dans `platform_settings`.
- Réduction shooting : 25 % pour les prestations éligibles, modifiable dans `platform_settings`.
- Ville prioritaire : Dakar, sans interdire les autres villes.

Les conditions de réduction doivent être convenues avec le photographe et confirmées avant de présenter un tarif comme définitif.

## État d'implémentation honnête

Déjà présents : page d'accueil éditoriale responsive, page catalogue branchée à la vue Supabase, formulaire d'inscription utilisant Supabase Auth lorsque configuré, formulaire shooting avec validation serveur et écriture Supabase côté serveur lorsque les variables sont configurées, schéma initial relationnel et RLS, calcul de réduction testable, pages de politique de confidentialité et conditions (brouillons à faire valider).

Pas encore activés : téléversement sécurisé des photos, Comp Card PDF, pages de profil détaillées, espace mannequin complet, espace annonceur, administration, candidatures, emails transactionnels, paiement marchand et webhooks. Aucune intégration de paiement n'est déclarée fonctionnelle. La route shooting échoue volontairement en mode fermé tant que la persistance serveur n'est pas implémentée.

## Paiements

Aucun fournisseur n'est configuré. Avant de sélectionner un prestataire, vérifier dans sa documentation officielle la disponibilité au Sénégal, la devise XOF, les moyens réellement pris en charge, les frais, les webhooks et les exigences de compte marchand. Les retours navigateur ne seront jamais considérés comme une preuve de paiement.

## Données de démonstration

Les portraits de la page d'accueil sont des images d'illustration et sont identifiés comme telles. Aucun faux profil, casting, partenaire, témoignage ou chiffre d'activité n'est présenté comme réel.
