import { Injectable } from '@angular/core';

export type SocialNetwork = 'twitter' | 'facebook' | 'whatsapp' | 'telegram' | 'reddit';

@Injectable({ providedIn: 'root' })
export class ShareService {
  buildShareUrl(network: SocialNetwork, text: string, pageUrl: string = window.location.href): string {
    const t = encodeURIComponent(text);
    const u = encodeURIComponent(pageUrl);

    switch (network) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${t}%20${u}`;
      case 'telegram':
        return `https://t.me/share/url?url=${u}&text=${t}`;
      case 'reddit':
        return `https://www.reddit.com/submit?url=${u}&title=${t}`;
    }
  }

  async shareNative(title: string, text: string, dataUrl: string): Promise<boolean> {
    const navAny = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    if (!navAny.share) return false;

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${this.slugify(title)}.png`, { type: 'image/png' });
      const data: ShareData = { title, text, files: [file] };

      if (navAny.canShare && navAny.canShare(data)) {
        await navigator.share(data);
        return true;
      }

      await navigator.share({ title, text });
      return true;
    } catch {
      return false;
    }
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'meme';
  }
}
