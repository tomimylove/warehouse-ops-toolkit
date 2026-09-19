import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import './Field.css';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`ui-input ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`ui-textarea ${props.className ?? ''}`} />;
}
