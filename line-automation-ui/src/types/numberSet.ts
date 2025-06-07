export type InputType = 'manual' | 'text' | 'vcf';

export interface NumberSet {
  id: string;
  name: string;
  inputType: InputType;
  rawData?: string;  // raw text or file name
  chunks: string[][]; // grouped numbers
  createdAt: string;
} 