import { Shield, UserCheck, Database, Share2, Lock, Cookie, Eye, Trash2, RefreshCw, Server, Mail, MapPin, Globe } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="container-custom py-8 pb-20">
      <div className="max-w-3xl mx-auto bg-white rounded-card shadow-soft p-6 lg:p-10">
        {/* Header */}
        <div className="text-center mb-8 pb-8 border-b border-grey-200">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-grey-900 mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-sm text-grey-500 max-w-lg mx-auto">
            Dernière mise à jour : 2 juillet 2026 — DaloaDelivery s'engage à protéger vos données personnelles.
          </p>
        </div>

        <div className="space-y-8 lg:space-y-10 text-grey-800">
          {/* Section 1 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">1. Introduction et principes généraux</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>La protection de vos données personnelles est une priorité pour DaloaDelivery. La présente Politique de Confidentialité explique quelles données nous collectons, comment nous les utilisons, avec qui nous les partageons, et quels sont vos droits.</p>
                  <p>Cette politique s'applique à tous les services fournis par DaloaDelivery via notre plateforme web accessible à l'adresse <strong>delivery.daloamarket.com</strong>.</p>
                  <p>Nous traitons vos données conformément à la loi ivoirienne relative à la protection des données à caractère personnel et aux principes de minimisation, transparence et sécurité.</p>
                  <p>En utilisant DaloaDelivery, vous acceptez les pratiques décrites dans la présente politique. Si vous n'êtes pas d'accord, veuillez ne pas utiliser nos services.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">2. Données collectées</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <h4 className="font-semibold text-grey-800 mt-3">2.1 Données fournies par l'utilisateur</h4>
                  <p>Lors de votre inscription et de l'utilisation de la Plateforme, nous collectons :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-grey-800">Identifiants :</strong> adresse email, mot de passe (chiffré)</li>
                    <li><strong className="text-grey-800">Profil :</strong> nom complet, photo de profil (optionnelle), numéro de téléphone, quartier/commune</li>
                    <li><strong className="text-grey-800">Profil livreur :</strong> type de véhicule, zones de couverture, tarifs, photo du véhicule, copie de la CNI/permis</li>
                    <li><strong className="text-grey-800">Avis :</strong> évaluations et commentaires laissés sur les profils de livreurs</li>
                  </ul>

                  <h4 className="font-semibold text-grey-800 mt-3">2.2 Données collectées automatiquement</h4>
                  <p>Lors de votre navigation, nous collectons automatiquement :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-grey-800">Données de navigation :</strong> pages visitées, profils consultés, recherches effectuées</li>
                    <li><strong className="text-grey-800">Données techniques :</strong> adresse IP, type de navigateur, système d'exploitation, identifiant de l'appareil</li>
                    <li><strong className="text-grey-800">Cookies essentiels :</strong> pour maintenir votre session et vos préférences</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">3. Utilisation des données</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Nous utilisons vos données pour les finalités suivantes :</p>
                  
                  <h4 className="font-semibold text-grey-800 mt-3">3.1 Fourniture du service</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Créer et gérer votre compte utilisateur</li>
                    <li>Afficher les profils de livreurs dans l'annuaire public</li>
                    <li>Permettre la recherche et le filtrage des livreurs par critères</li>
                    <li>Afficher les évaluations et avis sur les profils publics</li>
                    <li>Permettre aux clients de contacter les livreurs</li>
                  </ul>

                  <h4 className="font-semibold text-grey-800 mt-3">3.2 Amélioration du service</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Analyser l'utilisation de la Plateforme pour en améliorer les performances</li>
                    <li>Détecter et prévenir les activités frauduleuses</li>
                    <li>Améliorer les résultats de recherche de livreurs</li>
                  </ul>

                  <h4 className="font-semibold text-grey-800 mt-3">3.3 Communication</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Envoyer des notifications essentielles (confirmation de compte, alerte de sécurité)</li>
                    <li>Répondre à vos demandes d'assistance</li>
                    <li>Vous informer des modifications des CGU ou de la politique de confidentialité</li>
                  </ul>

                  <h4 className="font-semibold text-grey-800 mt-3">3.4 Base légale du traitement</h4>
                  <p>Le traitement de vos données repose sur :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-grey-800">L'exécution du contrat :</strong> pour la fourniture des services que vous avez demandés</li>
                    <li><strong className="text-grey-800">Votre consentement :</strong> pour les finalités optionnelles (ex : inscription livreur)</li>
                    <li><strong className="text-grey-800">L'intérêt légitime :</strong> pour la sécurité, la prévention de la fraude, et l'amélioration de la Plateforme</li>
                    <li><strong className="text-grey-800">L'obligation légale :</strong> pour répondre aux demandes des autorités compétentes</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Share2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">4. Partage et divulgation des données</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <h4 className="font-semibold text-grey-800 mt-3">4.1 Données publiques</h4>
                  <p>Certaines informations sont publiques et visibles par les autres utilisateurs : les profils des livreurs (nom, photo, type de véhicule, zones de couverture, tarifs, évaluations). Ne publiez pas d'informations que vous souhaitez garder privées.</p>
                  
                  <h4 className="font-semibold text-grey-800 mt-3">4.2 Prestataires de services</h4>
                  <p>Nous partageons des données avec les prestataires suivants, strictement dans le cadre du fonctionnement de la Plateforme :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-grey-800">Supabase :</strong> hébergement de la base de données et du stockage des fichiers (photos de profil, photos de véhicules)</li>
                    <li><strong className="text-grey-800">Netlify :</strong> hébergement et déploiement de l'application</li>
                  </ul>
                  <p>Ces prestataires sont contractuellement tenus de protéger vos données et de ne les utiliser que pour les services spécifiés.</p>

                  <h4 className="font-semibold text-grey-800 mt-3">4.3 Obligations légales</h4>
                  <p>Nous pouvons divulguer vos données si la loi ivoirienne nous y oblige, notamment sur demande des autorités judiciaires compétentes, dans le cadre d'une procédure légale, ou pour protéger les droits, la propriété ou la sécurité de DaloaDelivery, de ses utilisateurs ou du public.</p>

                  <h4 className="font-semibold text-grey-800 mt-3">4.4 Pas de vente de données</h4>
                  <p><strong className="text-grey-800">DaloaDelivery ne vend pas vos données personnelles.</strong> Nous ne monnayons pas vos informations auprès d'annonceurs, de courtiers en données, ou de tiers commerciaux.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">5. Sécurité des données</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-grey-800">Chiffrement :</strong> toutes les données en transit sont protégées par le protocole TLS (HTTPS). Les mots de passe sont hachés avec des algorithmes modernes (bcrypt).</li>
                    <li><strong className="text-grey-800">Contrôle d'accès :</strong> l'accès aux données est strictement limité aux membres de l'équipe qui en ont besoin pour fournir le service.</li>
                    <li><strong className="text-grey-800">Row Level Security (RLS) :</strong> notre base de données Supabase est configurée avec des politiques de sécurité au niveau des lignes pour garantir que chaque utilisateur n'accède qu'à ses propres données.</li>
                    <li><strong className="text-grey-800">Surveillance :</strong> nous surveillons les accès non autorisés et les comportements suspects.</li>
                  </ul>
                  <p>Cependant, aucun système de sécurité n'est infaillible. En cas de violation de données, nous nous engageons à vous en informer dans les meilleurs délais et à prendre les mesures correctives nécessaires.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">6. Cookies et technologies similaires</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Nous utilisons des cookies strictement nécessaires au fonctionnement de la Plateforme :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-grey-800">Cookie de session :</strong> maintient votre connexion active pendant votre navigation. Il expire à la fermeture du navigateur.</li>
                    <li><strong className="text-grey-800">Cookie de préférence :</strong> mémorise vos préférences d'affichage (thème, langue).</li>
                  </ul>
                  <p><strong className="text-grey-800">Nous n'utilisons pas de cookies publicitaires</strong>, de cookies de tracking tiers, ni de pixels de suivi à des fins de profilage commercial.</p>
                  <p>Vous pouvez configurer votre navigateur pour bloquer les cookies. Cependant, cela pourrait affecter le bon fonctionnement de la Plateforme (notamment la connexion à votre compte).</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">7. Conservation des données</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Nous conservons vos données personnelles uniquement pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-grey-800">Données de compte :</strong> pendant toute la durée de vie de votre compte, puis 90 jours après sa suppression (délai de rétention légal).</li>
                    <li><strong className="text-grey-800">Profils livreurs :</strong> jusqu'à leur suppression par le livreur ou la désactivation du compte. Les profils supprimés sont définitivement effacés sous 30 jours.</li>
                    <li><strong className="text-grey-800">Avis et évaluations :</strong> conservés pendant la durée de vie du profil livreur associé pour l'historique des évaluations.</li>
                    <li><strong className="text-grey-800">Documents d'identité (CNI, permis) :</strong> conservés pendant la durée de vie du compte livreur pour vérification, puis détruits à la suppression du compte.</li>
                    <li><strong className="text-grey-800">Logs techniques :</strong> conservés 12 mois pour la sécurité et le diagnostic.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">8. Vos droits</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Conformément à la législation ivoirienne sur la protection des données à caractère personnel, vous disposez des droits suivants :</p>
                  
                  <div className="grid gap-3 mt-3">
                    <div className="flex gap-3 p-3 rounded-xl bg-grey-50">
                      <Eye className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-grey-800">Droit d'accès</p>
                        <p className="text-xs text-grey-500">Vous pouvez demander une copie des données personnelles que nous détenons à votre sujet.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-xl bg-grey-50">
                      <RefreshCw className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-grey-800">Droit de rectification</p>
                        <p className="text-xs text-grey-500">Vous pouvez corriger des données inexactes ou incomplètes à tout moment depuis vos paramètres de profil.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-xl bg-grey-50">
                      <Trash2 className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-grey-800">Droit à l'effacement</p>
                        <p className="text-xs text-grey-500">Vous pouvez demander la suppression de vos données, sous réserve des obligations légales de conservation.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-xl bg-grey-50">
                      <BanIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-grey-800">Droit d'opposition</p>
                        <p className="text-xs text-grey-500">Vous pouvez vous opposer au traitement de vos données pour des motifs légitimes.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 p-3 rounded-xl bg-grey-50">
                      <Share2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-grey-800">Droit à la portabilité</p>
                        <p className="text-xs text-grey-500">Vous pouvez demander à recevoir vos données dans un format structuré et lisible.</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3">Pour exercer ces droits, contactez-nous à <strong>support@daloamarket.com</strong>. Nous répondrons à votre demande dans un délai de 30 jours maximum. Une preuve d'identité pourra vous être demandée.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">9. Mineurs</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>La Plateforme DaloaDelivery n'est pas destinée aux personnes de moins de 16 ans. Nous ne collectons pas sciemment des données personnelles auprès de mineurs de moins de 16 ans.</p>
                  <p>Si vous êtes parent ou tuteur et que vous apprenez que votre enfant nous a fourni des données personnelles sans votre consentement, contactez-nous à <strong>support@daloamarket.com</strong>. Nous prendrons les mesures nécessaires pour supprimer ces informations.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">10. Modifications de la politique</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Nous pouvons mettre à jour cette politique de confidentialité pour refléter les évolutions de nos pratiques, de nos services, ou de la réglementation applicable.</p>
                  <p>En cas de modification substantielle, nous vous en informerons par email (à l'adresse associée à votre compte) ou par une notification visible sur la Plateforme au moins 15 jours avant l'entrée en vigueur des modifications.</p>
                  <p>Votre utilisation continuée de la Plateforme après l'entrée en vigueur des modifications vaut acceptation de la nouvelle politique.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">11. Contact et réclamations</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Pour toute question, demande d'exercice de vos droits, ou réclamation relative à la protection de vos données :</p>
                  <ul className="space-y-2 mt-2">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-3 h-3 text-primary" />
                      </span>
                      <span><strong className="text-grey-800">Email :</strong> support@daloamarket.com</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-3 h-3 text-primary" />
                      </span>
                      <span><strong className="text-grey-800">Site :</strong> delivery.daloamarket.com</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-3 h-3 text-primary" />
                      </span>
                      <span><strong className="text-grey-800">Adresse :</strong> Daloa, Côte d'Ivoire</span>
                    </li>
                  </ul>
                  <p className="mt-3">Si vous estimez que vos droits n'ont pas été respectés, vous avez la possibilité d'introduire une réclamation auprès de l'Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire (ARTCI), l'autorité compétente en matière de protection des données.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer note */}
        <div className="mt-10 pt-6 border-t border-grey-200 text-center text-xs text-grey-400">
          <p>© {new Date().getFullYear()} DaloaDelivery. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}

function BanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}
