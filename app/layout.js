import './globals.css'

export const metadata = {
  title: 'Space Clicker - Galactic Edition',
  description: 'Tap your way through the solar system and beyond!',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
