# Résumé de la migration de sécurité DaloaDelivery

## Date
7 juillet 2026

## Contexte
Application des corrections de sécurité de DaloaMarket côté DaloaDelivery pour assurer la compatibilité entre les deux systèmes.

## Modifications apportées

### 1. Migration SQL - Ajout de champs à delivery_assignments
**Fichier**: `supabase/migrations/20260707_add_missing_delivery_assignments_fields.sql`

**Note importante**: La table `delivery_assignments` existe déjà avec la plupart des champs de sécurité. Cette migration ajoute uniquement les champs manquants.

- Ajout des champs de localisation:
  - `pickup_location` (adresse texte)
  - `dropoff_location` (adresse texte)
  - `pickup_address` (coordonnées GPS détaillées en jsonb)
  - `dropoff_address` (coordonnées GPS détaillées en jsonb)
- Ajout du prix de livraison: `delivery_price`
- Ajout de la photo de livraison: `delivery_photo_url`
- Ajout des champs de litige:
  - `disputed_at`
  - `dispute_reason`
- Ajout/mise à jour de la foreign key vers `delivery_persons`
- Création des index manquants pour les performances
- Création/mise à jour du trigger pour `updated_at`

**Champs déjà présents dans le schéma existant:**
- ✅ `pickup_otp`, `delivery_otp`
- ✅ `pickup_otp_attempts`, `delivery_otp_attempts`
- ✅ `pickup_gps`, `delivery_gps`
- ✅ `pickup_gps_distance_m`, `delivery_gps_distance_m`
- ✅ `pickup_photo_url`
- ✅ `accepted_at`, `pickup_confirmed_at`, `delivered_at`
- ✅ `pickup_confirmed_by_seller`
- ✅ Statuts corrects (y compris 'accepted')

### 2. Service deliveryAssignmentService
**Fichier**: `src/services/deliveryAssignmentService.ts`

- `getAvailableAssignments()`: Récupère les assignments disponibles (statut `awaiting_pickup`, `pickup_confirmed_by_seller = true`, pas de livreur assigné)
- `getMyAssignments()`: Récupère les assignments du livreur connecté
- `acceptAssignment()`: Accepte une assignment avec statut `'accepted'` (pas `'picked_up'`)
- `verifyPickup()`: Vérification complète du pickup:
  - Vérification du nombre de tentatives OTP (max 3)
  - Validation de `pickup_otp`
  - Photo obligatoire
  - Vérification GPS (max 100m)
  - Mise à jour vers statut `'picked_up'`
- `verifyDelivery()`: Vérification complète de la delivery:
  - Vérification du nombre de tentatives OTP (max 3)
  - Validation de `delivery_otp`
  - Photo obligatoire
  - Vérification GPS (max 100m)
  - Mise à jour vers statut `'delivered'`
- `updateStatus()`: Mise à jour simple du statut
- `getById()`: Récupération par ID
- Fonction utilitaire `calculateDistance()`: Calcul de distance GPS (formule Haversine)

### 3. Types TypeScript
**Fichier**: `src/types/livreur.ts`

- Ajout de l'interface `DeliveryAssignment` avec tous les champs de sécurité
- Types pour les statuts: `'awaiting_pickup' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'auto_released' | 'disputed' | 'cancelled'`

### 4. Composant PickupVerificationModal
**Fichier**: `src/components/livreur/PickupVerificationModal.tsx`

- Modal en 3 étapes: OTP → Photo → GPS
- Étape 1: Saisie du code OTP à 6 chiffres
- Étape 2: Capture photo obligatoire
- Étape 3: Vérification GPS avec calcul de distance
- Validation automatique via `deliveryAssignmentService.verifyPickup()`
- Gestion des erreurs et feedback utilisateur

### 5. Composant DeliveryVerificationModal
**Fichier**: `src/components/livreur/DeliveryVerificationModal.tsx`

- Modal en 3 étapes: OTP → Photo → GPS
- Étape 1: Saisie du code OTP à 6 chiffres
- Étape 2: Capture photo obligatoire
- Étape 3: Vérification GPS avec calcul de distance
- Validation automatique via `deliveryAssignmentService.verifyDelivery()`
- Gestion des erreurs et feedback utilisateur

### 6. Mise à jour DashboardCommandes
**Fichier**: `src/pages/DashboardCommandes.tsx`

- Remplacement de `deliveryOrderService` par `deliveryAssignmentService`
- Changement du statut d'acceptation de `'pending'` à `'awaiting_pickup'`
- Intégration des modals de vérification
- Bouton "J'ai récupéré le colis" ouvre `PickupVerificationModal`
- Bouton "Colis livré au client" ouvre `DeliveryVerificationModal`
- Mise à jour automatique après vérification réussie

## Points clés de sécurité

### ✅ Statut 'accepted' intermédiaire
- Quand un livreur accepte une commande: statut passe à `'accepted'` (pas `'picked_up'`)
- Permet une séparation claire entre acceptation et pickup effectif

### ✅ OTP séparés
- `pickup_otp`: utilisé pour la vérification au ramassage
- `delivery_otp`: utilisé pour la vérification à la livraison
- Empêche la réutilisation du même OTP

### ✅ Photo obligatoire
- Photo requise pour le pickup ET la delivery
- Stockée dans `pickup_photo_url` et `delivery_photo_url`

### ✅ Vérification GPS avec seuil 100m
- Calcul de distance entre livreur et vendeur/acheteur
- Seuil maximum de 100 mètres
- Distance stockée dans `pickup_gps_distance_m` et `delivery_gps_distance_m`

### ✅ Tracking des tentatives OTP
- Maximum 3 tentatives pour pickup et delivery
- Au-delà de 3 tentatives: passage automatique en statut `'disputed'`
- Stocké dans `pickup_otp_attempts` et `delivery_otp_attempts`

### ✅ Filtrage des commandes disponibles
- Les livreurs ne voient que les commandes avec statut `'awaiting_pickup'`
- Exclusion du statut `'accepted'` (déjà prises par d'autres livreurs)
- Condition `pickup_confirmed_by_seller = true`

## Checklist de migration

- [x] Analyser le schéma existant de la base de données
- [x] Créer la migration ALTER TABLE pour les champs manquants
- [x] Créer `deliveryAssignmentService` avec vérifications
- [x] Mettre à jour les types TypeScript
- [x] Créer le modal de vérification pickup
- [x] Créer le modal de vérification delivery
- [x] Mettre à jour `DashboardCommandes`
- [x] Changer le statut d'acceptation à `'accepted'`
- [x] Utiliser `pickup_otp` pour la vérification pickup
- [x] Ajouter la vérification GPS (100m)
- [x] Rendre la photo obligatoire
- [x] Ajouter le tracking des tentatives OTP

## Prochaines étapes

1. **Appliquer la migration SQL**: Exécuter `20260707_add_missing_delivery_assignments_fields.sql` dans Supabase
2. **Tester le flow complet**:
   - Créer une commande dans DaloaMarket
   - Vérifier qu'elle apparaît dans DaloaDelivery
   - Tester l'acceptation (statut 'accepted')
   - Tester la vérification pickup (OTP + photo + GPS)
   - Tester la vérification delivery (OTP + photo + GPS)
3. **Vérifier l'intégration avec DaloaMarket**:
   - Les OTP doivent être générés par le webhook DaloaMarket
   - Les adresses GPS doivent être synchronisées
   - Le statut doit être mis à jour dans les deux systèmes

## Notes importantes

- La table `delivery_assignments` est partagée entre DaloaMarket et DaloaDelivery
- Les OTP doivent être générés côté DaloaMarket (webhook)
- Les adresses GPS (`pickup_address`, `dropoff_address`) doivent être fournies par DaloaMarket
- Le système de litige (`disputed`) est automatique après 3 tentatives OTP incorrectes
