declare module '@wangeditor/editor-for-vue' {
  import { Component } from 'vue'
  
  export const Editor: Component
  export const Toolbar: Component
}

declare module '@wangeditor/editor' {
  export interface IEditorConfig {
    placeholder?: string;
    readOnly?: boolean;
    autoFocus?: boolean;
    [key: string]: any;
  }
  
  export interface IToolbarConfig {
    excludeKeys?: string[];
    [key: string]: any;
  }
  
  export interface IDomEditor {
    getHtml: () => string;
    getText: () => string;
    destroy: () => void;
    [key: string]: any;
  }
} 