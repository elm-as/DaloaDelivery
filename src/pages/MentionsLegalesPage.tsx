import { FileText, Globe, Shield, Mail, MapPin, User, Phone, Server } from 'lucide-react';

export default function MentionsLegalesPage() {
  return (
    <div className="container-custom py-8 pb-24 max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-10">
        {/* Header */}
        <div className="text-center mb-8 pb-8 border-b border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 mb-2">
            Mentions Légales
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto font-medium">
            Informations légales et techniques relatives à la plateforme DaloaDelivery et à son réseau de coursiers de proximité.
          </p>
        </div>

        <div className="space-y-8 lg:space-y-10 text-gray-800">
          {/* Section 1 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5 text-primary">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black mb-3 text-gray-900 uppercase tracking-wider">1. Informations Générales & Éditeur</h2>
                <div className="space-y-2 text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                  <p>La plateforme accessible à l'adresse <strong>delivery.daloamarket.com</strong> (ci-après « DaloaDelivery ») est un service technologique de mise en relation entre commerçants, clients et livreurs professionnels indépendants à Daloa (Côte d'Ivoire), édité par <strong>OULOBO Elmas Tresor</strong>.</p>
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                      <User className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-gray-900">Fondateur & Direction</p>
                        <p className="text-xs text-gray-600">OULOBO Elmas Tresor</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-gray-900">Implantation & Activité</p>
                        <p className="text-xs text-gray-600">Daloa / Abidjan, Côte d'Ivoire</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                      <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-gray-900">E-mails Officiels</p>
                        <p className="text-xs text-gray-600">contact@daloamarket.com / support@daloamarket.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                      <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-gray-900">Ligne Directe / WhatsApp</p>
                        <p className="text-xs text-gray-600">+225 07 88 00 08 31</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5 text-primary">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black mb-3 text-gray-900 uppercase tracking-wider">2. Hébergement & Infrastructure Technique</h2>
                <div className="space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                  <p>L'infrastructure de DaloaDelivery s'appuie sur des standards modernes de haute disponibilité :</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-bold text-gray-900">Hébergement Frontend & CDN</p>
                      <p className="text-xs text-gray-600 mt-0.5">Netlify, Inc. (San Francisco, CA, USA)</p>
                      <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">www.netlify.com</a>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-bold text-gray-900">Base de Données & Authentification</p>
                      <p className="text-xs text-gray-600 mt-0.5">Supabase, Inc. (PostgreSQL chiffré)</p>
                      <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">supabase.com</a>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-bold text-gray-900">Backend Paiements & Webhooks</p>
                      <p className="text-xs text-gray-600 mt-0.5">Render Services (Node.js Escrow Engine)</p>
                      <a href="https://render.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">render.com</a>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-bold text-gray-900">Bureau d'Enregistrement Domaine</p>
                      <p className="text-xs text-gray-600 mt-0.5">LWS (Ligne Web Services)</p>
                      <a href="https://www.lws.fr" target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">www.lws.fr</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">3. Propriété intellectuelle</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>L'ensemble du Site, y compris sa structure, son design, son code source, ses textes, ses images, ses logos, ses icônes et ses bases de données, est la propriété exclusive de DaloaDelivery.</p>
                  <p>Toute reproduction, représentation, modification, adaptation, traduction, diffusion, totale ou partielle, du Site ou de son contenu, par quelque procédé que ce soit, sans l'autorisation expresse et préalable de DaloaDelivery, est strictement interdite et constituerait une contrefaçon sanctionnée par les lois ivoiriennes et internationales relatives à la propriété intellectuelle.</p>
                  <p>Les marques et logos figurant sur le Site sont des marques déposées par DaloaDelivery ou par des tiers. Toute reproduction, imitation ou usage de ces marques sans autorisation préalable est prohibé.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">4. Protection des données personnelles</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>DaloaDelivery s'engage à protéger les données personnelles de ses utilisateurs conformément à la législation ivoirienne en vigueur, notamment la loi relative à la protection des données à caractère personnel.</p>
                  <p>Pour plus d'informations sur la collecte et le traitement de vos données, veuillez consulter notre <a href="/privacy" className="text-primary hover:underline font-medium">Politique de Confidentialité</a>.</p>
                  <p>Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition et de portabilité de vos données personnelles. Pour exercer ces droits, contactez-nous à <strong>support@daloamarket.com</strong>.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">5. Cookies</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Le Site utilise des cookies strictement nécessaires à son fonctionnement, notamment pour maintenir votre session de connexion et mémoriser vos préférences d'affichage.</p>
                  <p>DaloaDelivery n'utilise pas de cookies publicitaires, de cookies de tracking tiers, ni de pixels de suivi à des fins de profilage commercial.</p>
                  <p>Vous pouvez configurer votre navigateur pour bloquer les cookies. Cependant, cela pourrait affecter le bon fonctionnement du Site, notamment la connexion à votre compte.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">6. Responsabilité</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>DaloaDelivery met tout en œuvre pour assurer l'exactitude et la mise à jour des informations diffusées sur le Site. Toutefois, DaloaDelivery ne peut garantir l'exhaustivité, la précision ou l'actualité de ces informations.</p>
                  <p>DaloaDelivery décline toute responsabilité :</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>En cas d'interruption ou d'indisponibilité temporaire du Site</li>
                    <li>En cas de dommages directs ou indirects résultant de l'utilisation du Site</li>
                    <li>Concernant le contenu des sites tiers vers lesquels le Site pourrait renvoyer via des liens hypertextes</li>
                    <li>Concernant les relations contractuelles entre clients et livreurs, DaloaDelivery n'étant qu'une plateforme de mise en relation</li>
                  </ul>
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
                <h2 className="text-lg font-bold mb-3 text-grey-900">7. Droit applicable</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Les présentes mentions légales sont régies par le droit ivoirien. Tout litige relatif au Site ou à son utilisation sera soumis aux tribunaux compétents de Daloa, République de Côte d'Ivoire.</p>
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
