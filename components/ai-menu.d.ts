// The A&I logo button (https://appofapp-gh.vercel.app/ai-menu.js).
declare namespace JSX {
  interface IntrinsicElements {
    'ai-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { chat?: string; research?: string };
  }
}
