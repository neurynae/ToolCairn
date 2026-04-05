import { Head, Html, Main, NextScript } from 'next/document';

// Required to suppress Next.js's Html-outside-_document prerender error
// when it generates internal error pages during `next build`.
// biome-ignore lint/style/noDefaultExport: Next.js requires default export for _document
export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
