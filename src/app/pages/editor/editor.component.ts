import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Meme, MemeText, TextPosition } from '../../models/meme.model';
import { MemeStorageService } from '../../services/meme-storage.service';
import { ShareService, SocialNetwork } from '../../services/share.service';

const FONT_CHOICES = ['Impact', 'Arial Black', 'Comic Sans MS', 'Anton', 'Oswald', 'Roboto'];
const MAX_CANVAS_WIDTH = 1080;

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly fontChoices = FONT_CHOICES;
  readonly positions: TextPosition[] = ['top', 'middle', 'bottom'];

  title = '';
  imageDataUrl: string | null = null;
  texts: MemeText[] = [];
  feedback: { type: 'success' | 'error' | 'info'; message: string } | null = null;

  private image: HTMLImageElement | null = null;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly storage: MemeStorageService,
    private readonly share: ShareService,
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    this.drawPlaceholder();
  }

  ngOnDestroy(): void {
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
  }

  trackById = (_: number, item: MemeText): string => item.id;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.flash('error', 'Veuillez sélectionner un fichier image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.zone.run(() => {
        this.imageDataUrl = reader.result as string;
        this.loadImage(this.imageDataUrl);
        if (!this.title) this.title = file.name.replace(/\.[^.]+$/, '');
      });
    };
    reader.onerror = () => this.flash('error', 'Lecture du fichier impossible.');
    reader.readAsDataURL(file);
    input.value = '';
  }

  addText(position: TextPosition = 'top'): void {
    const text: MemeText = {
      id: cryptoRandomId(),
      content: position === 'top' ? 'TEXTE DU HAUT' : position === 'bottom' ? 'TEXTE DU BAS' : 'TEXTE',
      position,
      fontSize: 48,
      color: '#ffffff',
      strokeColor: '#000000',
      fontFamily: 'Impact',
      bold: true,
      italic: false,
      uppercase: true,
    };
    this.texts = [...this.texts, text];
    this.redraw();
  }

  removeText(id: string): void {
    this.texts = this.texts.filter((t) => t.id !== id);
    this.redraw();
  }

  duplicateText(id: string): void {
    const source = this.texts.find((t) => t.id === id);
    if (!source) return;
    this.texts = [...this.texts, { ...source, id: cryptoRandomId() }];
    this.redraw();
  }

  onTextChange(): void {
    this.redraw();
  }

  reset(): void {
    this.imageDataUrl = null;
    this.image = null;
    this.texts = [];
    this.title = '';
    this.drawPlaceholder();
  }

  downloadPng(): void {
    if (!this.image) {
      this.flash('error', 'Téléchargez d’abord une image.');
      return;
    }
    const dataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
    triggerDownload(dataUrl, `${slugify(this.title || 'meme')}.png`);
  }

  saveToGallery(): void {
    if (!this.image) {
      this.flash('error', 'Téléchargez d’abord une image.');
      return;
    }
    const finalDataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
    const meme: Meme = {
      id: cryptoRandomId(),
      title: this.title?.trim() || 'Mème sans titre',
      imageDataUrl: this.imageDataUrl!,
      finalDataUrl,
      texts: structuredClone(this.texts),
      createdAt: Date.now(),
    };
    this.storage.save(meme);
    this.flash('success', 'Mème enregistré dans la galerie.');
  }

  shareOn(network: SocialNetwork): void {
    const text = this.title || 'Mon mème créé avec MemeForge';
    const url = this.share.buildShareUrl(network, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async shareNative(): Promise<void> {
    if (!this.image) {
      this.flash('error', 'Téléchargez d’abord une image.');
      return;
    }
    const dataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
    const ok = await this.share.shareNative(this.title || 'Mon mème', this.title || 'Créé avec MemeForge', dataUrl);
    if (!ok) this.flash('info', 'Le partage natif n’est pas disponible. Utilisez les boutons réseaux sociaux.');
  }

  private loadImage(src: string): void {
    const img = new Image();
    img.onload = () => {
      this.zone.run(() => {
        this.image = img;
        this.resizeCanvas();
        this.redraw();
        if (this.texts.length === 0) {
          this.addText('top');
          this.addText('bottom');
        }
        this.cdr.markForCheck();
      });
    };
    img.onerror = () => this.flash('error', 'Impossible de charger l’image.');
    img.src = src;
  }

  private resizeCanvas(): void {
    if (!this.image) return;
    const canvas = this.canvasRef.nativeElement;
    const scale = this.image.naturalWidth > MAX_CANVAS_WIDTH ? MAX_CANVAS_WIDTH / this.image.naturalWidth : 1;
    canvas.width = Math.round(this.image.naturalWidth * scale);
    canvas.height = Math.round(this.image.naturalHeight * scale);
  }

  private redraw(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!this.image) {
      this.drawPlaceholder();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);

    for (const text of this.texts) {
      this.drawText(ctx, text, canvas.width, canvas.height);
    }
  }

  private drawText(ctx: CanvasRenderingContext2D, text: MemeText, width: number, height: number): void {
    const content = (text.uppercase ? text.content.toUpperCase() : text.content).trim();
    if (!content) return;

    const weight = text.bold ? 'bold' : 'normal';
    const style = text.italic ? 'italic' : 'normal';
    ctx.font = `${style} ${weight} ${text.fontSize}px "${text.fontFamily}", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = Math.max(2, text.fontSize / 12);
    ctx.strokeStyle = text.strokeColor;
    ctx.fillStyle = text.color;

    const maxWidth = width * 0.92;
    const lineHeight = text.fontSize * 1.1;
    const lines = wrapLines(ctx, content, maxWidth);

    const x = width / 2;
    let y: number;
    switch (text.position) {
      case 'top':
        ctx.textBaseline = 'top';
        y = height * 0.04;
        break;
      case 'middle':
        ctx.textBaseline = 'middle';
        y = height / 2 - ((lines.length - 1) * lineHeight) / 2;
        break;
      case 'bottom':
      default:
        ctx.textBaseline = 'bottom';
        y = height - height * 0.04 - (lines.length - 1) * lineHeight;
        break;
    }

    for (const line of lines) {
      ctx.strokeText(line, x, y);
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
  }

  private drawPlaceholder(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1f2937');
    gradient.addColorStop(1, '#111827');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 36px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Téléchargez une image pour commencer', canvas.width / 2, canvas.height / 2 - 10);

    ctx.font = '20px Arial, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('JPG · PNG · GIF · WEBP', canvas.width / 2, canvas.height / 2 + 30);
  }

  private flash(type: 'success' | 'error' | 'info', message: string): void {
    this.feedback = { type, message };
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.feedbackTimer = setTimeout(() => {
      this.zone.run(() => {
        this.feedback = null;
        this.cdr.markForCheck();
      });
    }, 3500);
  }
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split(/\n/);
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function triggerDownload(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'meme';
}

function cryptoRandomId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && 'randomUUID' in c) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
