"use client";
import Image from "next/image";
import { useState } from 'react';

const baseStyles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#333',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem 0',
    borderBottom: '1px solid #eaeaea',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logoH1: {
    fontSize: '1.5rem',
    fontWeight: 600,
    margin: 0,
  },
  navigation: {
    display: 'flex',
    gap: '2rem',
  },
  navLink: {
    textDecoration: 'none',
    color: '#555',
    fontSize: '1rem',
    transition: 'color 0.2s',
  },
  main: {
    padding: '4rem 0',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '4rem',
    padding: '6rem 2rem',
    borderRadius: '16px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: 'white',
  },
  heroH2: {
    fontSize: '3.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: '1rem',
    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
  },
  heroP: {
    fontSize: '1.3rem',
    marginBottom: '2.5rem',
    textShadow: '0 1px 8px rgba(0,0,0,0.5)',
  },
  ctaButton: {
    display: 'inline-block',
    padding: '1rem 2.5rem',
    backgroundColor: '#0070f3',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 14px rgba(0, 118, 255, 0.39)',
  },
  section: {
    marginBottom: '4rem',
  },
  sectionH3: {
    fontSize: '2.5rem',
    fontWeight: 600,
    marginBottom: '2.5rem',
    borderBottom: '3px solid #0070f3',
    paddingBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  eventCard: {
    backgroundColor: 'white',
    border: '1px solid #eaeaea',
    borderRadius: '12px',
    padding: '2.5rem',
    marginBottom: '1.5rem',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  eventCardH4: {
    fontSize: '1.75rem',
    fontWeight: 600,
    margin: '0 0 0.75rem 0',
    color: '#0070f3',
  },
  aboutP: {
    fontSize: '1.2rem',
    lineHeight: 1.8,
  },
  footer: {
    textAlign: 'center',
    padding: '3rem 0',
    borderTop: '1px solid #eaeaea',
    color: '#888',
  },
};

export default function Home() {
  const [ctaHover, setCtaHover] = useState(false);
  const [eventCardHover, setEventCardHover] = useState<number | null>(null);

  const ctaStyle = {
    ...baseStyles.ctaButton,
    transform: ctaHover ? 'translateY(-3px)' : 'translateY(0)',
    boxShadow: ctaHover ? '0 8px 20px rgba(0, 118, 255, 0.5)' : '0 4px 14px rgba(0, 118, 255, 0.39)',
  };

  const eventCardStyle = (index: number) => ({
    ...baseStyles.eventCard,
    transform: eventCardHover === index ? 'translateY(-5px)' : 'translateY(0)',
    boxShadow: eventCardHover === index ? '0 8px 25px rgba(0, 0, 0, 0.1)' : 'none',
  });
  
  const heroStyle = {
    ...baseStyles.hero,
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/hero-background.svg')`,
  };

  return (
    <div style={baseStyles.container}>
      <header style={baseStyles.header}>
        <div style={baseStyles.logo}>
          <Image src="/logo.svg" alt="Lightning Talk Circle Logo" width={50} height={50} />
          <h1 style={baseStyles.logoH1}>Lightning Talk Circle</h1>
        </div>
        <nav style={baseStyles.navigation}>
          <a href="#events" style={baseStyles.navLink}>Events</a>
          <a href="#about" style={baseStyles.navLink}>About</a>
          <a href="#join" style={baseStyles.navLink}>Join Us</a>
        </nav>
      </header>

      <main style={baseStyles.main}>
        <section style={heroStyle}>
          <h2 style={baseStyles.heroH2}>Spark Your Curiosity. Share Your Passion.</h2>
          <p style={baseStyles.heroP}>5分で世界が変わる。あなたの「好き」を語る場所。</p>
          <a 
            href="#events" 
            style={ctaStyle}
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
          >
            Upcoming Events
          </a>
        </section>

        <section id="events" style={baseStyles.section}>
          <h3 style={baseStyles.sectionH3}>
            <Image src="/calendar-icon.svg" alt="Calendar" width={32} height={32} />
            Upcoming Events
          </h3>
          <div 
            style={eventCardStyle(0)}
            onMouseEnter={() => setEventCardHover(0)}
            onMouseLeave={() => setEventCardHover(null)}
          >
            <h4 style={baseStyles.eventCardH4}>Tech Talk Night Vol. 3</h4>
            <p>Date: 2025-07-15</p>
            <p>A night of quick-fire talks on the latest in web development, AI, and more.</p>
          </div>
          <div 
            style={eventCardStyle(1)}
            onMouseEnter={() => setEventCardHover(1)}
            onMouseLeave={() => setEventCardHover(null)}
          >
            <h4 style={baseStyles.eventCardH4}>Designers' Hub Meetup</h4>
            <p>Date: 2025-08-02</p>
            <p>Share your design process, get feedback, and connect with fellow creatives.</p>
          </div>
        </section>

        <section id="about" style={baseStyles.section}>
          <h3 style={baseStyles.sectionH3}>
            <Image src="/info-icon.svg" alt="Info" width={32} height={32} />
            About the Circle
          </h3>
          <p style={baseStyles.aboutP}>
            The Lightning Talk Circle is a community for anyone who loves to learn and share.
            We believe that great ideas can come from anywhere, and that a 5-minute talk can be enough to spark a new passion.
          </p>
        </section>
      </main>

      <footer style={baseStyles.footer}>
        <p>&copy; 2025 Lightning Talk Circle. All rights reserved.</p>
      </footer>
    </div>
  );
}
