import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Meme } from '../models/meme.model';

const STORAGE_KEY = 'memeforge.gallery.v1';

@Injectable({ providedIn: 'root' })
export class MemeStorageService {
  private readonly memesSubject = new BehaviorSubject<Meme[]>(this.read());

  readonly memes$: Observable<Meme[]> = this.memesSubject.asObservable();

  list(): Meme[] {
    return this.memesSubject.value;
  }

  save(meme: Meme): void {
    const all = [meme, ...this.memesSubject.value.filter((m) => m.id !== meme.id)];
    this.write(all);
  }

  remove(id: string): void {
    this.write(this.memesSubject.value.filter((m) => m.id !== id));
  }

  clear(): void {
    this.write([]);
  }

  getById(id: string): Meme | undefined {
    return this.memesSubject.value.find((m) => m.id === id);
  }

  private read(): Meme[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Meme[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write(memes: Meme[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memes));
    this.memesSubject.next(memes);
  }
}
