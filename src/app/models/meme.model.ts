export type TextPosition = 'top' | 'middle' | 'bottom';

export interface MemeText {
  id: string;
  content: string;
  position: TextPosition;
  fontSize: number;
  color: string;
  strokeColor: string;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  uppercase: boolean;
}

export interface Meme {
  id: string;
  title: string;
  imageDataUrl: string;
  finalDataUrl: string;
  texts: MemeText[];
  createdAt: number;
}
