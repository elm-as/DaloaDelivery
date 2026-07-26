import { useEffect } from 'react';

interface SEOOptions {
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  jsonLd?: object | object[];
}

export function useSEO(title: string, options: SEOOptions = {}) {
  useEffect(() => {
    // 1. Title
    const fullTitle = title.includes('DaloaDelivery') ? title : `${title} | DaloaDelivery`;
    document.title = fullTitle;

    // Helper for meta tags
    const setMetaTag = (nameAttr: string, keyName: string, content: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${keyName}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, keyName);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Description & Keywords
    if (options.description) {
      setMetaTag('name', 'description', options.description);
    }
    if (options.keywords) {
      setMetaTag('name', 'keywords', options.keywords);
    }

    // 3. OpenGraph
    const ogTitle = options.ogTitle || fullTitle;
    const ogDescription = options.ogDescription || options.description || "Trouvez un livreur de confiance à Daloa sur DaloaDelivery.";
    const ogImage = options.ogImage || 'https://daloa-delivery.shop/og-image.png';

    setMetaTag('property', 'og:title', ogTitle);
    setMetaTag('property', 'og:description', ogDescription);
    setMetaTag('property', 'og:image', ogImage);

    // 4. Twitter
    setMetaTag('name', 'twitter:title', ogTitle);
    setMetaTag('name', 'twitter:description', ogDescription);
    setMetaTag('name', 'twitter:image', ogImage);

    // 5. Canonical
    if (options.canonical) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', options.canonical);
    }

    // 6. JSON-LD
    let script = document.querySelector<HTMLScriptElement>('script[id="dynamic-jsonld"]');
    if (options.jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('id', 'dynamic-jsonld');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(options.jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, options]);
}
