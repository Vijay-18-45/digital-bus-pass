import React, { useState, useEffect } from "react";
import "./header.css";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
// download logo and keep in assets

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  const teluguTitle = t('telugu_title');
  const englishTitle = t('english_title');

  const [displayText, setDisplayText] = useState("");
  const [isTelugu, setIsTelugu] = useState(true);

  useEffect(() => {
    let charIndex = 0;
    let typingInterval;
    let pauseTimeout;

    const currentText = isTelugu ? teluguTitle : englishTitle;
    const windowDuration = 10000; // 10 seconds per title (20s total cycle)
    const typingSpeed = 50; // Fast typing speed

    setDisplayText("");
    charIndex = 0;

    typingInterval = setInterval(() => {
      if (charIndex < currentText.length) {
        setDisplayText(currentText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
        // Wait for the remainder of the 10s window
        const typingDuration = charIndex * typingSpeed;
        pauseTimeout = setTimeout(() => {
          setIsTelugu(!isTelugu);
        }, Math.max(0, windowDuration - typingDuration));
      }
    }, typingSpeed);

    return () => {
      clearInterval(typingInterval);
      clearTimeout(pauseTimeout);
    };
  }, [isTelugu, teluguTitle, englishTitle]); // Added dependencies

  return (
    <div className="apsrtc-top-header">

      {/* Left Section */}
      <div className="left-section">
        <img src="/logo.png" alt="APSRTC Logo" className="apsrtc-logo" />

        <div className="title-section">
          <h1 className="animated-title">
            {displayText}
          </h1>
        </div>
      </div>

      {/* Right Section */}
      <div className="right-section">
        <button className="lang-toggle" onClick={toggleLanguage} aria-label="Toggle Language">
          {language === 'en' ? 'తెలుగు' : 'English'}
        </button>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="support-icon">
          <img src="/support-icon.png" alt="Support" />
        </div>
        <div>
          <p className="support-text">{t('support_text')}</p>
          <h2 className="support-number">XXXX XXXX</h2>
        </div>
      </div>

    </div>
  );
};

export default Header;