import { Shield, FileText, Users, AlertTriangle, Ban, Scale, Zap, Mail, RefreshCw, Globe, Truck, UserCheck, MapPin } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="container-custom py-8 pb-20">
      <div className="max-w-3xl mx-auto bg-white rounded-card shadow-soft p-6 lg:p-10">
        {/* Header */}
        <div className="text-center mb-8 pb-8 border-b border-grey-200">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-grey-900 mb-2">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-sm text-grey-500 max-w-lg mx-auto">
            Dernière mise à jour : 2 juillet 2026 — Veuillez lire attentivement ces conditions avant d'utiliser DaloaDelivery.
          </p>
        </div>

        <div className="space-y-8 lg:space-y-10 text-grey-800">
          {/* Section 1 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">1. Acceptation des conditions</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>En accédant, en naviguant ou en utilisant la plateforme DaloaDelivery (ci-après la « Plateforme »), vous reconnaissez avoir lu, compris et accepté d'être lié par les présentes Conditions Générales d'Utilisation (ci-après les « CGU »).</p>
                  <p>Si vous n'acceptez pas l'intégralité de ces conditions, vous ne devez pas utiliser la Plateforme. L'utilisation de la Plateforme est conditionnée à votre acceptation pleine et entière des CGU.</p>
                  <p>Ces CGU constituent un contrat légalement contraignant entre vous (ci-après l'« Utilisateur ») et DaloaDelivery. En cochant la case « J'accepte les conditions générales d'utilisation » lors de votre inscription, vous confirmez votre accord.</p>
                  <p>DaloaDelivery se réserve le droit de modifier ces CGU à tout moment. Les modifications seront notifiées par email ou via une notification sur la Plateforme. Votre utilisation continuée de la Plateforme après modification vaut acceptation des nouvelles CGU.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">2. Description du service</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>DaloaDelivery est une plateforme de mise en relation entre des clients ayant besoin de services de livraison et des livreurs professionnels indépendants dans la ville de Daloa et ses environs, en République de Côte d'Ivoire.</p>
                  <p>La Plateforme permet aux utilisateurs de :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Consulter un annuaire de livreurs disponibles avec leurs profils détaillés</li>
                    <li>Rechercher des livreurs par type de véhicule, zone de couverture et évaluations</li>
                    <li>Consulter les avis et évaluations laissés par d'autres clients</li>
                    <li>Contacter des livreurs via les informations de contact fournies</li>
                    <li>S'inscrire en tant que livreur et créer un profil professionnel</li>
                  </ul>
                  <p className="font-semibold text-grey-800">DaloaDelivery n'est pas un service de livraison.</p>
                  <p>Nous ne sommes pas transporteur, ni mandataire, ni partie aux relations contractuelles entre clients et livreurs. La Plateforme est exclusivement un annuaire de mise en relation. Toute relation contractuelle, prestation de livraison ou transaction entre utilisateurs se fait à leurs risques et périls, sous leur entière responsabilité.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">3. Compte utilisateur</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <h4 className="font-semibold text-grey-800 mt-3">3.1 Création de compte</h4>
                  <p>Pour utiliser les fonctionnalités de la Plateforme, vous devez créer un compte. Lors de l'inscription, vous vous engagez à fournir des informations exactes, complètes et à jour. Toute fausse déclaration peut entraîner la suspension ou la suppression de votre compte.</p>
                  
                  <h4 className="font-semibold text-grey-800 mt-3">3.2 Sécurité du compte</h4>
                  <p>Vous êtes entièrement responsable de la confidentialité de vos identifiants de connexion (email et mot de passe). Toute activité effectuée depuis votre compte est présumée être de votre fait. Vous devez immédiatement nous signaler toute utilisation non autorisée de votre compte à support@daloamarket.com.</p>
                  
                  <h4 className="font-semibold text-grey-800 mt-3">3.3 Suppression du compte</h4>
                  <p>Vous pouvez demander la suppression de votre compte à tout moment. DaloaDelivery se réserve également le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU, de comportement frauduleux, ou de tout autre motif légitime, sans préavis ni indemnité.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">4. Règles relatives aux profils livreurs</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <h4 className="font-semibold text-grey-800 mt-3">4.1 Conditions d'inscription livreur</h4>
                  <p>Pour vous inscrire en tant que livreur sur DaloaDelivery, vous devez :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Être majeur (18 ans révolus) et juridiquement capable</li>
                    <li>Posséder un permis de conduire valide correspondant au type de véhicule déclaré</li>
                    <li>Disposer d'un véhicule en bon état de fonctionnement et assuré</li>
                    <li>Fournir des informations exactes sur votre identité, votre véhicule et vos zones de couverture</li>
                  </ul>

                  <h4 className="font-semibold text-grey-800 mt-3">4.2 Contenu du profil</h4>
                  <p>Chaque profil de livreur doit :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Comporter une photo de profil authentique et récente</li>
                    <li>Indiquer le type de véhicule réellement utilisé</li>
                    <li>Mentionner des zones de couverture effectivement desservies</li>
                    <li>Afficher des tarifs correspondant à la réalité des prestations</li>
                    <li>Ne pas usurper l'identité d'un autre livreur</li>
                  </ul>

                  <h4 className="font-semibold text-grey-800 mt-3">4.3 Contenus strictement interdits</h4>
                  <p>Sont formellement interdits et entraîneront la suppression immédiate du profil :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Les faux profils ou usurpations d'identité</li>
                    <li>Les informations frauduleuses sur les documents (permis, CNI, assurance)</li>
                    <li>Les profils proposant des services illicites</li>
                    <li>Les contenus haineux, racistes, xénophobes ou incitant à la violence</li>
                    <li>Les contenus à caractère pornographique ou sexuellement explicite</li>
                    <li>Le harcèlement ou les menaces envers d'autres utilisateurs</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">5. Statut d'indépendance et responsabilité des livreurs (DaloaDelivery)</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <h4 className="font-semibold text-grey-800 mt-3">5.1 Statut de prestataire indépendant & Absence de lien de subordination</h4>
                  <p>Les livreurs partenaires inscrits sur la plateforme DaloaDelivery agissent en qualité de <strong>prestataires de services indépendants et auto-entrepreneurs autonomes</strong>. Il n'existe **aucun contrat de travail, aucun lien de subordination, aucune relation d'employeur à employé**, ni aucun engagement d'exclusivité entre DaloaDelivery / ELMAS et les livreurs inscrits.</p>
                  <p>DaloaDelivery agit exclusivement en tant qu'éditeur de logiciel de mise en relation informatique. Le contrat de transport de livraison est conclu directement entre l'acheteur/vendeur et le livreur indépendant.</p>
                  
                  <h4 className="font-semibold text-grey-800 mt-3">5.2 Absolue liberté d'organisation, d'horaires et de pluriactivité</h4>
                  <p>Chaque livreur partenaire conserve la maîtrise totale et absolue de son activité :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-grey-800">Liberté de connexion :</strong> Le livreur fixe lui-même ses jours, heures et durées de connexion à l'application sans aucun quota minimum d'heures imposé.</li>
                    <li><strong className="text-grey-800">Liberté d'acceptation :</strong> Le livreur est totalement libre d'accepter ou de refuser toute proposition de course. Le refus d'une course n'entraîne aucune sanction ni pénalité disciplinaire.</li>
                    <li><strong className="text-grey-800">Pluriactivité & Non-exclusivité :</strong> Le livreur est pleinement autorisé à exercer d'autres activités professionnelles et à travailler simultanément pour d'autres entreprises ou plateformes concurrentes.</li>
                  </ul>

                  <h4 className="font-semibold text-grey-800 mt-3">5.3 Matériel, charges et obligations fiscales individuelles</h4>
                  <p>En tant qu'entrepreneur indépendant, le livreur assure la totalité de ses moyens d'exploitation :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Il fournit son propre matériel (véhicule, smartphone, forfait internet, carburant, casque).</li>
                    <li>Il assure l'entretien et la conformité légale de son véhicule (assurance responsabilité civile circulation obligatoire).</li>
                    <li>Il conserve la responsabilité exclusive de la déclaration de ses revenus et du paiement de ses impôts, cotisations sociales et taxes professionnelles auprès des administrations fiscales ivoiriennes.</li>
                  </ul>

                  <h4 className="font-semibold text-grey-800 mt-3">5.4 Rémunération des prestations et validation par code OTP</h4>
                  <p>Le paiement des prestations de livraison s'effectue en toute transparence. La libération des fonds vers le compte Mobile Money du livreur est déclenchée dès la validation conforme du <strong>Code OTP de livraison</strong> transmis par l'acheteur lors de la réception du colis. <strong>Une commission de service de 10% est retenue par la plateforme</strong> sur le montant de chaque course pour couvrir les frais de fonctionnement, d'assurance et de paiement Mobile Money. Le livreur reçoit ainsi 90% du prix de livraison convenu.</p>

                  <h4 className="font-semibold text-grey-800 mt-3">5.5 Couvre-feu nocturne de sécurité (22h30 — 05h30)</h4>
                  <p>Pour préserver l'intégrité physique des coursiers et la sécurité des biens transportés à Daloa, <strong>l'attribution de nouvelles courses est strictement suspendue entre 22h30 et 05h30</strong>. Seules les courses déjà acceptées avant 22h30 peuvent être finalisées. Aucun livreur ne peut être contraint ou sollicité pour démarrer une nouvelle livraison durant cette plage horaire.</p>

                  <h4 className="font-semibold text-grey-800 mt-3">5.6 Gestion des Destinataires Absents ou Refus Injustifié</h4>
                  <p>Si le livreur se présente à l'adresse convenue et que le client destinataire est injoignable ou refuse de réceptionner le colis sans motif légitime :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Le livreur signale l'incident via l'application (« Client Absent »).</li>
                    <li>L'équipe d'administration contacte le client pour vérification. Si l'absence est avérée, <strong>la prestation de transport est réputée accomplie : le livreur perçoit 100% de ses frais de livraison dus (90% net)</strong>.</li>
                    <li>L'acheteur est remboursé de la valeur du produit (hors frais de livraison non remboursables), et la marchandise est restituée au vendeur.</li>
                  </ul>

                  <h4 className="font-semibold text-grey-800 mt-3">5.7 Perte, vol, casse et responsabilité des marchandises</h4>
                  <p>Le livreur indépendant assume la garde juridique et matérielle complète des marchandises à compter de leur enlèvement chez le vendeur jusqu'à leur remise effective à l'acheteur.</p>
                  <p>En cas de <strong>vol, perte, casse ou dégradation des marchandises</strong> durant le trajet :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Le livreur est financièrement et civillement responsable de la valeur intégrale du bien transporté.</li>
                    <li>La rémunération de la prestation est annulée et l'acheteur est intégralement remboursé par la plateforme.</li>
                    <li>En cas de vol qualifié ou de faute lourde, le compte du livreur est immédiatement suspendu et ses coordonnées d'identité pourront être transmises aux autorités compétentes pour poursuites.</li>
                  </ul>

                  <h4 className="font-semibold text-grey-800 mt-3">5.8 Statut de Livreur Affilié & Encaissement d'espèces (COD)</h4>
                  <p>Un livreur indépendant peut conclure un partenariat d'affiliation volontaire avec un Vendeur Pro abonné sur DaloaMarket.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-grey-800">Partenariat Privilégié :</strong> L'affiliation accorde au livreur une priorité d'accès aux commandes privées émanant de ce Vendeur Pro, sans modifier son statut de prestataire indépendant.</li>
                    <li><strong className="text-grey-800">Reversement des espèces (COD) :</strong> Lors des livraisons payables en liquide à la livraison (Cash on Delivery), le livreur agit en qualité de mandataire de collecte et s'engage à restituer 100% des fonds encaissés au Vendeur Affilié. Tout détournement d'espèces constitue une infraction pénale grave (abus de confiance) entraînant la résiliation immédiate de son profil.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">6. Limitation de responsabilité</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <h4 className="font-semibold text-grey-800 mt-3">6.1 Contenu des profils</h4>
                  <p>DaloaDelivery n'exerce aucun contrôle éditorial a priori sur les profils publiés. Nous ne garantissons pas l'exactitude, la qualité, la sécurité ou la légalité des informations fournies par les livreurs. Les profils reflètent uniquement les déclarations de leurs auteurs.</p>
                  
                  <h4 className="font-semibold text-grey-800 mt-3">6.2 Prestations de livraison</h4>
                  <p>DaloaDelivery décline toute responsabilité concernant les litiges entre clients et livreurs, les retards de livraison, les dommages aux biens transportés, les défauts de paiement, ou tout autre différend né de la mise en relation via la Plateforme.</p>
                  
                  <h4 className="font-semibold text-grey-800 mt-3">6.3 Disponibilité du service</h4>
                  <p>Nous nous efforçons de maintenir la Plateforme accessible 24h/24 et 7j/7, mais ne pouvons garantir une disponibilité ininterrompue. Des interruptions peuvent survenir pour maintenance, mise à jour, ou cas de force majeure. DaloaDelivery ne pourra être tenu responsable des préjudices résultant d'une indisponibilité temporaire.</p>
                  
                  <h4 className="font-semibold text-grey-800 mt-3">6.4 Plafond de responsabilité</h4>
                  <p>Dans toute la mesure permise par la loi ivoirienne, la responsabilité de DaloaDelivery est limitée au montant des frais de service effectivement perçus auprès de l'Utilisateur au cours des 12 mois précédant le fait générateur.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">7. Propriété intellectuelle</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>La Plateforme DaloaDelivery, son nom, son logo, son design, son code source et l'ensemble de ses contenus éditoriaux sont la propriété exclusive de DaloaDelivery et sont protégés par les lois ivoiriennes et internationales relatives à la propriété intellectuelle.</p>
                  <p>En publiant du contenu (textes, photos) sur la Plateforme, vous conservez vos droits de propriété intellectuelle mais concédez à DaloaDelivery une licence non-exclusive, gratuite, mondiale et révocable d'utiliser, reproduire, afficher et distribuer ce contenu dans le cadre du fonctionnement de la Plateforme.</p>
                  <p>Toute reproduction, modification, diffusion ou exploitation commerciale de la Plateforme ou de son contenu sans autorisation écrite préalable est strictement interdite.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Ban className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">8. Suspension et résiliation</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>DaloaDelivery se réserve le droit de suspendre ou résilier le compte de tout Utilisateur, sans préavis ni indemnité, dans les cas suivants :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Violation des présentes CGU</li>
                    <li>Comportement frauduleux, trompeur ou malveillant</li>
                    <li>Plaintes répétées et fondées d'autres utilisateurs</li>
                    <li>Utilisation de la Plateforme à des fins illicites</li>
                    <li>Non-respect des règles relatives aux profils livreurs</li>
                    <li>Tentative de contournement des systèmes de sécurité</li>
                  </ul>
                  <p>En cas de résiliation, l'Utilisateur perd l'accès à son compte et à l'ensemble des données associées. Les profils sont retirés de la Plateforme.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">9. Droit applicable et juridiction</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Les présentes CGU sont régies et interprétées conformément au droit ivoirien. Tout litige relatif à l'interprétation, l'exécution ou la validité des présentes CGU sera soumis aux tribunaux compétents de Daloa, République de Côte d'Ivoire.</p>
                  <p>Préalablement à toute action judiciaire, les parties s'engagent à tenter de résoudre leur différend à l'amiable. Une tentative de médiation ou de conciliation pourra être engagée avant toute saisine des juridictions compétentes.</p>
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
                <h2 className="text-lg font-bold mb-3 text-grey-900">10. Modification des conditions</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>DaloaDelivery se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications au moins 15 jours avant leur entrée en vigueur par email ou notification sur la Plateforme.</p>
                  <p>Les modifications entrent en vigueur dès leur publication sur la Plateforme. Nous nous efforcerons d'informer les Utilisateurs des modifications substantielles par email ou notification sur la Plateforme.</p>
                  <p>Votre utilisation continuée de la Plateforme après l'entrée en vigueur des modifications constitue votre acceptation des nouvelles CGU. Si vous n'acceptez pas les modifications, vous devez cesser d'utiliser la Plateforme et supprimer votre compte.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">11. Signalement et modération</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Les utilisateurs peuvent signaler tout profil, avis ou comportement problématique à l'adresse support@daloamarket.com. Nous examinons chaque signalement dans les meilleurs délais.</p>
                  <p>DaloaDelivery dispose d'une équipe de modération qui peut :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Masquer ou supprimer un profil non conforme</li>
                    <li>Envoyer un avertissement à l'Utilisateur concerné</li>
                    <li>Suspendre temporairement ou définitivement un compte</li>
                  </ul>
                  <p>Les décisions de modération sont souveraines et sans recours, sous réserve des droits légaux de l'Utilisateur.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">12. Contact</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Pour toute question relative aux présentes CGU, vous pouvez nous contacter :</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-3 h-3 text-primary" />
                      </span>
                      <span><strong className="text-grey-800">Email :</strong> support@daloamarket.com</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <PhoneIcon className="w-3 h-3 text-primary" />
                      </span>
                      <span><strong className="text-grey-800">Téléphone :</strong> +225 07 88 00 08 31</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-3 h-3 text-primary" />
                      </span>
                      <span><strong className="text-grey-800">Adresse :</strong> Daloa, Côte d'Ivoire</span>
                    </li>
                  </ul>
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

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
