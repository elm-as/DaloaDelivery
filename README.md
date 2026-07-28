# 🚚 DaloaDelivery

> **Plateforme de livreurs** pour la ville de Daloa, Côte d'Ivoire.  
> Trouvez un livreur fiable ou inscrivez-vous pour générer des revenus grâce à la livraison.

🌐 **Production** : [daloa-delivery.shop](https://daloa-delivery.shop)

---

## 📖 Description

DaloaDelivery est une application web progressive (PWA) dédiée aux livreurs de Daloa. Elle fait partie de l'écosystème [DaloaMarket](https://github.com/elm-as/DaloaMarket-v2) et gère l'intégralité du cycle de livraison :

- **Annuaire de livreurs** : Consultez les livreurs disponibles avec avis, notes et véhicules
- **Inscription livreur** : Processus complet avec vérification d'identité, choix du véhicule et zone de couverture
- **Dashboard livreur** : Tableau de bord avec commandes disponibles, commandes en cours, statistiques et revenus
- **Vérification sécurisée** : Système OTP + photo + GPS pour le ramassage et la livraison
- **Administration** : Gestion des livreurs, validation des inscriptions, statistiques

---

## 🏗️ Stack technique

| Couche | Technologies |
|--------|-------------|
| **Framework** | React 18 + TypeScript + Vite 6 |
| **Styling** | Tailwind CSS 3 |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, RLS) |
| **Cartographie** | Leaflet + React-Leaflet (itinéraires, positions GPS) |
| **Animations** | Framer Motion |
| **Notifications** | react-hot-toast |
| **Déploiement** | Netlify |

---

## 📂 Structure du projet

```
DaloaDelivery/
├── src/
│   ├── App.tsx                       # Routes (14 pages)
│   ├── main.tsx                      # Point d'entrée
│   ├── components/
│   │   ├── layout/                   # Layout principal (Header, Footer, Navbar)
│   │   ├── livreur/
│   │   │   ├── LivreurCard.tsx       # Carte livreur (annuaire)
│   │   │   ├── AvisLivreur.tsx       # Composant avis/notes
│   │   │   ├── PickupVerificationModal.tsx   # Modal 3 étapes (OTP→Photo→GPS)
│   │   │   └── DeliveryVerificationModal.tsx # Modal 3 étapes (OTP→Photo→GPS)
│   │   └── ui/                       # Composants réutilisables
│   ├── contexts/
│   │   └── SupabaseContext.tsx        # Auth + session utilisateur
│   ├── hooks/
│   │   └── useSupabase.ts            # Hook auth principal
│   ├── lib/
│   │   └── supabase.ts              # Client Supabase
│   ├── services/
│   │   ├── deliveryAssignmentService.ts  # 🔑 Service principal livraison
│   │   ├── deliveryOrderService.ts       # Service commandes (legacy)
│   │   ├── deliveryPersonService.ts      # Service profil livreur
│   │   ├── mapsService.ts               # Service cartographie (OSRM)
│   │   └── reviewService.ts             # Service avis/notes
│   ├── constants/
│   │   └── zones.ts                  # Zones de livraison à Daloa
│   ├── types/
│   │   └── livreur.ts               # Types TypeScript (DeliveryAssignment, etc.)
│   ├── pages/                        # 14 pages (voir Routes)
│   ├── assets/                       # Images, logos
│   ├── App.css                       # Styles globaux
│   └── index.css                     # Reset CSS + Tailwind
├── supabase/
│   └── migrations/                   # 6 fichiers SQL
├── public/                           # Assets statiques, manifest PWA
├── index.html                        # SEO, Open Graph, JSON-LD, PWA
├── netlify.toml                      # Config Netlify (SPA redirect, headers cache)
├── vite.config.ts
├── tailwind.config.js
└── SECURITY_MIGRATION_SUMMARY.md     # Résumé migration sécurité
```

---

## 🗺️ Routes

### Pages publiques
| Route | Page | Description |
|-------|------|-------------|
| `/` | HomePage | Landing page (redirige vers `/dashboard` si connecté) |
| `/annuaire` | AnnuairePage | Annuaire des livreurs |
| `/livreur/:id` | LivreurDetailPage | Profil détaillé d'un livreur |
| `/devenir-livreur` | InscriptionLivreur | Formulaire d'inscription livreur |
| `/login` | LoginPage | Connexion |
| `/register` | RegisterPage | Inscription |

### Pages authentifiées (livreurs)
| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | DashboardLivreur | Tableau de bord principal |
| `/dashboard/profil` | DashboardProfil | Mon profil livreur |
| `/dashboard/commandes` | DashboardCommandes | Commandes disponibles et en cours |

### Pages admin
| Route | Page | Description |
|-------|------|-------------|
| `/admin` | AdminPage | Dashboard admin livreurs |

### Pages légales
| Route | Page |
|-------|------|
| `/terms` | Conditions d'utilisation |
| `/privacy` | Politique de confidentialité |
| `/mentions-legales` | Mentions légales |

---

## 🔑 Service principal : `deliveryAssignmentService`

Le cœur de l'application est le service `deliveryAssignmentService.ts` qui gère le cycle de vie des livraisons :

| Méthode | Description |
|---------|-------------|
| `getAvailableAssignments()` | Commandes disponibles (`awaiting_pickup` + vendeur confirmé + sans livreur) |
| `getMyAssignments()` | Commandes du livreur connecté |
| `acceptAssignment()` | Accepter une commande → statut `accepted` |
| `verifyPickup()` | Vérification ramassage : OTP + photo + GPS ≤ 100m → `picked_up` |
| `verifyDelivery()` | Vérification livraison : OTP + photo + GPS ≤ 100m → `delivered` |
| `updateStatus()` | Mise à jour simple du statut |
| `getById()` | Récupération par ID |

### Flow de vérification (pickup et delivery)

Chaque vérification se fait en **3 étapes obligatoires** via un modal :

1. **🔢 OTP** — Le livreur saisit le code à 6 chiffres (max 3 tentatives, sinon → `disputed`)
2. **📷 Photo** — Photo obligatoire comme preuve visuelle
3. **📍 GPS** — Position GPS du livreur vérifiée (distance max 100m via formule Haversine)

---

## 🔒 Sécurité

### Système OTP double

| OTP | Qui le détient | Quand il est utilisé |
|-----|---------------|---------------------|
| `pickup_otp` | Le vendeur | Au ramassage : vendeur donne le code au livreur |
| `delivery_otp` | L'acheteur | À la livraison : acheteur donne le code au livreur |

### Protections

| Mécanisme | Description |
|-----------|-------------|
| **Limite 3 tentatives** | OTP incorrect 3× → statut `disputed` automatique |
| **Photo obligatoire** | Preuve visuelle au ramassage ET à la livraison |
| **Vérification GPS** | Distance max 100m entre livreur et point de pickup/delivery |
| **RLS Policies** | Vérifications dupliquées au niveau PostgreSQL (RPC `verify_pickup`, `verify_delivery`) |
| **Statut intermédiaire** | `accepted` empêche un livreur de sauter directement à `picked_up` |
| **Timeout 90 min** | Livreur qui ne se présente pas → commande remise en disponible |

---

## 🚀 Installation et lancement

### Prérequis

- Node.js ≥ 18
- npm ≥ 9
- Projet Supabase configuré (le **même** que DaloaMarket)

### Installation

```bash
cd DaloaDelivery
npm install
cp .env.example .env
# → Renseigner les variables d'environnement
```

### Variables d'environnement

```env
# Supabase (MÊME projet que DaloaMarket)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
# ou
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

### Développement

```bash
npm run dev                    # → http://localhost:5174
```

### Build production

```bash
npm run build                  # → ./dist/
npm run preview                # Prévisualiser le build
```

### Déploiement (Netlify)

Le fichier `netlify.toml` est pré-configuré :

- **Build** : `npm run build` → publie `dist/`
- **SPA Redirect** : Toutes les routes → `index.html`
- **Headers** : Cache immutable pour les assets, sécurité (X-Frame-Options, HSTS)

---

## 🗄️ Migrations Supabase

6 migrations SQL dans `supabase/migrations/` :

| Fichier | Description |
|---------|-------------|
| `20260701_create_delivery_schema.sql` | Schéma initial (tables delivery_persons, delivery_assignments) |
| `20260701_add_verification_columns.sql` | Colonnes de vérification (OTP, GPS, photo) |
| `20260701_fix_delivery_persons_rls.sql` | RLS policies pour delivery_persons |
| `20260701_fix_storage_policies.sql` | Policies stockage (photos livreurs) |
| `20260701_fix_vehicle_type_constraint.sql` | Contrainte type véhicule |
| `20260707_add_missing_delivery_assignments_fields.sql` | Champs sécurité manquants (adresses, prix, litiges) |

> ⚠️ Ces migrations complètent celles de DaloaMarket-v2. Les deux ensembles doivent être appliqués sur le même projet Supabase.

---

## 🔗 Connexion avec DaloaMarket & DaloaPay

DaloaDelivery partage la même base Supabase que [DaloaMarket-v2](https://github.com/elm-as/DaloaMarket-v2) et communique avec le service de paiement [DaloaPay](https://github.com/elm-as/DaloaPay). Les commandes créées dans DaloaMarket apparaissent automatiquement dans le dashboard des livreurs.

**Tables partagées clés** :
- `delivery_assignments` — Table pivot centrale entre les deux apps
- `orders` — Commandes clients (lecture seule côté livreur)
- `delivery_persons` — Profils livreurs
- `escrow_transactions` — Transactions escrow

---

## 📄 Licence & Propriété Intellectuelle

**Projet propriétaire d'ElmasCore (Elmas) — Tous droits réservés © 2025-2026.**

Ce code source, l'architecture et les composants de cet écosystème sont la propriété exclusive d'**ElmasCore**. Toute copie, reproduction, distribution ou réutilisation partielle ou totale est strictement interdite sans autorisation écrite préalable. Veuillez consulter le fichier [LICENSE](./LICENSE) pour les termes complets.
