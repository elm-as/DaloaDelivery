export function getOptimizedImageUrl(url: string | null | undefined, width = 400, quality = 80): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  if (url.includes('.supabase.co/storage/v1/object/public/')) {
    const transformed = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    const separator = transformed.includes('?') ? '&' : '?';
    return `${transformed}${separator}width=${width}&quality=${quality}&resize=contain`;
  }

  if (url.includes('images.pexels.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=compress&cs=tinysrgb&w=${width}&q=${quality}`;
  }

  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&w=${width}&q=${quality}`;
  }

  return url;
}
