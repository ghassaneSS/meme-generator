import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Meme } from '../../models/meme.model';
import { MemeStorageService } from '../../services/meme-storage.service';
import { ShareService, SocialNetwork } from '../../services/share.service';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryComponent implements OnInit, OnDestroy {
  memes: Meme[] = [];
  selected: Meme | null = null;

  private sub?: Subscription;

  constructor(
    private readonly storage: MemeStorageService,
    private readonly share: ShareService,
  ) {}

  ngOnInit(): void {
    this.sub = this.storage.memes$.subscribe((memes) => {
      this.memes = memes;
      if (this.selected && !memes.find((m) => m.id === this.selected!.id)) {
        this.selected = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  trackById = (_: number, item: Meme): string => item.id;

  open(meme: Meme): void {
    this.selected = meme;
  }

  close(): void {
    this.selected = null;
  }

  remove(meme: Meme, event?: Event): void {
    event?.stopPropagation();
    if (!confirm(`Supprimer "${meme.title}" ?`)) return;
    this.storage.remove(meme.id);
  }

  clearAll(): void {
    if (!this.memes.length) return;
    if (!confirm('Supprimer tous les mèmes de la galerie ?')) return;
    this.storage.clear();
  }

  download(meme: Meme, event?: Event): void {
    event?.stopPropagation();
    const link = document.createElement('a');
    link.href = meme.finalDataUrl;
    link.download = `${slugify(meme.title)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  shareOn(meme: Meme, network: SocialNetwork, event?: Event): void {
    event?.stopPropagation();
    const url = this.share.buildShareUrl(network, meme.title);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async shareNative(meme: Meme, event?: Event): Promise<void> {
    event?.stopPropagation();
    const ok = await this.share.shareNative(meme.title, meme.title, meme.finalDataUrl);
    if (!ok) alert('Le partage natif n’est pas disponible sur ce navigateur.');
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'meme';
}
