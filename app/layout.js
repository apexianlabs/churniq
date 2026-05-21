export const metadata = {
  title: 'ChurnIQ — AI-powered SaaS retention for founders',
  description: 'AI-powered SaaS retention for founders',
}
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      </head>
      <body style={{margin:0,padding:0,fontFamily:'Inter,sans-serif'}}>{children}</body>
    </html>
  )
}
