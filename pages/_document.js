import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  console.log("_document.js")
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
  }