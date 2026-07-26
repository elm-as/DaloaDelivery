import { FileText, Globe, Shield, Mail, MapPin, User } from 'lucide-react';

export default function MentionsLegalesPage() {
  return (
    <div className="container-custom py-8 pb-20">
      <div className="max-w-3xl mx-auto bg-white rounded-card shadow-soft p-6 lg:p-10">
        {/* Header */}
        <div className="text-center mb-8 pb-8 border-b border-grey-200">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-grey-900 mb-2">
            Mentions Légales
          </h1>
          <p className="text-sm text-grey-500 max-w-lg mx-auto">
            Conformément à la législation ivoirienne en vigueur, vous trouverez ci-dessous les informations légales relatives à la plateforme DaloaDelivery.
          </p>
        </div>

        <div className="space-y-8 lg:space-y-10 text-grey-800">
          {/* Section 1 */}
          <section>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">1. Informations générales</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Le site internet accessible à l'adresse <strong>daloa-delivery.shop</strong> (ci-après le « Site ») est édité par ELMAS, entreprise individuelle de droit ivoirien, dans le cadre de sa plateforme de mise en relation entre clients et livreurs professionnels indépendants à Daloa, en République de Côte d'Ivoire.</p>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-grey-50">
                      <User className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-grey-800">Éditeur du Site</p>
                        <p className="text-xs text-grey-500">ELMAS</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-grey-50">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-grey-800">Siège social</p>
                        <p className="text-xs text-grey-500">Daloa, République de Côte d'Ivoire</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-grey-50">
                      <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-grey-800">Contact</p>
                        <p className="text-xs text-grey-500">support@daloamarket.shop</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-grey-50">
                      <PhoneIcon className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-grey-800">Téléphone</p>
                        <p className="text-xs text-grey-500">+225 07 88 00 08 31</p>
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
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-3 text-grey-900">2. Hébergement</h2>
                <div className="space-y-2 text-sm text-grey-600 leading-relaxed">
                  <p>Le Site est hébergé par :</p>
                  <div className="p-3 rounded-xl bg-grey-50 mt-2">
                    <p className="text-sm"><strong className="text-grey-800">Netlify, Inc.</strong></p>
                    <p className="text-xs text-grey-500 mt-1">2325 3rd Street, Suite 296, San Francisco, California 94107, États-Unis</p>
                    <p className="text-xs text-grey-500">Site web : https://www.netlify.com</p>
                  </div>
                  <p className="mt-2">La base de données et le stockage des fichiers sont assurés par :</p>
                  <div className="p-3 rounded-xl bg-grey-50 mt-2">
                    <p className="text-sm"><strong className="text-grey-800">Supabase, Inc.</strong></p>
                    <p className="text-xs text-grey-500 mt-1">525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis</p>
                    <p className="text-xs text-grey-500">Site web : https://supabase.com</p>
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
                  <p>Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition et de portabilité de vos données personnelles. Pour exercer ces droits, contactez-nous à <strong>support@daloamarket.shop</strong>.</p>
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
