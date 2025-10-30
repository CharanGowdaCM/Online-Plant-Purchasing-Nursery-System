import { useState, useEffect } from "react";

// Language data always displayed in native script, regardless of page translation
const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी" },
  { code: "kn", name: "ಕನ್ನಡ" },
];

export function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [isTranslateScriptLoaded, setIsTranslateScriptLoaded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Add CSS to hide ONLY the banner, not the translation functionality
    const style = document.createElement('style');
    style.id = 'hide-google-translate-banner';
    style.textContent = `
      /* Hide the banner frame only (not all iframes) */
      .goog-te-banner-frame.skiptranslate { 
        display: none !important; 
        visibility: hidden !important;
      }
      
      /* Prevent body from being pushed down by banner */
      body { 
        top: 0px !important; 
      }
      
      /* Hide tooltips */
      #goog-gt-tt, .goog-tooltip {
        display: none !important;
      }
      
      /* Remove text highlighting */
      .goog-text-highlight {
        background-color: transparent !important;
        box-shadow: none !important;
      }
      
      /* Hide the translate element container (we use cookies instead) */
      #google_translate_element { 
        display: none !important; 
      }
      
      /* Protect our language switcher from translation */
      .notranslate { 
        white-space: nowrap !important; 
      }
    `;
    
    // Only add style if not already added
    if (!document.getElementById('hide-google-translate-banner')) {
      document.head.appendChild(style);
    }
    
    // Function to hide only the banner iframe (not all Google Translate iframes)
    const hideBannerOnly = () => {
      // Target specifically the banner frame by its classes
      const bannerFrame = document.querySelector('iframe.goog-te-banner-frame');
      if (bannerFrame) {
        bannerFrame.style.display = 'none';
        bannerFrame.style.visibility = 'hidden';
      }
      
      // Also hide by checking iframe body for specific banner content
      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          // Check if this is the banner iframe by checking its style or parent
          if (iframe.className && iframe.className.includes('goog-te-banner-frame')) {
            iframe.style.display = 'none';
            iframe.style.visibility = 'hidden';
          }
        } catch (e) {
          // Cross-origin iframe, can't access - that's fine
        }
      });
    };
    
    // Run the banner hiding function periodically
    const intervalId = setInterval(hideBannerOnly, 500);
    
    // Also run immediately
    setTimeout(hideBannerOnly, 100);
    
    // Check if Google Translate script is already loaded
    if (!document.querySelector('script[src*="translate.google.com"]')) {
      // Create a hidden div for Google Translate
      const translateDiv = document.createElement('div');
      translateDiv.id = 'google_translate_element';
      translateDiv.style.display = 'none';
      document.body.appendChild(translateDiv);
      
      // Define the initialization function
      window.googleTranslateElementInit = function() {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,hi,kn',
          autoDisplay: false
        }, 'google_translate_element');
        
        setIsTranslateScriptLoaded(true);
        console.log('Google Translate initialized');
      };
      
      // Load Google Translate script
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
      console.log('Google Translate script loading...');
    } else {
      setIsTranslateScriptLoaded(true);
      console.log('Google Translate already loaded');
    }
    
    // Load stored language preference
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
      console.log('Loaded saved language:', savedLanguage);
    }
    
    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Protect language names from translation
  useEffect(() => {
    // Check if Google Translate has affected our elements and fix them
    const observer = new MutationObserver(() => {
      // Fix language names in dropdown
      document.querySelectorAll('[data-lang-name]').forEach(element => {
        const langCode = element.getAttribute('data-lang-name');
        const lang = languages.find(l => l.code === langCode);
        if (lang && element.textContent !== lang.name) {
          element.textContent = lang.name;
        }
      });
      
      // Fix current language name in button
      const currentLangButton = document.querySelector('[data-current-lang]');
      if (currentLangButton) {
        const lang = languages.find(l => l.code === currentLanguage);
        if (lang && !currentLangButton.textContent?.includes(lang.name)) {
          const iconHTML = '<i class="bi bi-globe me-2"></i>';
          currentLangButton.innerHTML = iconHTML + lang.name;
        }
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, [currentLanguage]);

  const handleLanguageChange = (langCode) => {
    console.log('Changing language to:', langCode);
    
    // Save selected language
    localStorage.setItem('selectedLanguage', langCode);
    setCurrentLanguage(langCode);
    setShowDropdown(false);
    
    // Method 1: Set cookies for all domains
    const domain = window.location.hostname;
    const cookieValue = langCode === "en" ? "" : `/en/${langCode}`;
    
    if (langCode === "en") {
      // Clear translation cookies to return to English
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=/en/en; path=/;";
      if (domain !== 'localhost') {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
        document.cookie = `googtrans=/en/en; path=/; domain=${domain};`;
      }
    } else {
      // Set translation cookies for the selected language
      document.cookie = `googtrans=${cookieValue}; path=/;`;
      if (domain !== 'localhost') {
        document.cookie = `googtrans=${cookieValue}; path=/; domain=${domain};`;
      }
    }
    
    console.log('Cookies set, reloading page...');
    
    // Small delay before reload to ensure cookies are set
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const currentLang = languages.find((lang) => lang.code === currentLanguage);

  return (
    <>
      <style>{`
        .lang-switcher-container {
          position: relative;
        }

        .lang-switcher-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          white-space: nowrap;
        }

        .lang-switcher-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .lang-flag {
          font-size: 18px;
          line-height: 1;
        }

        .lang-name {
          font-size: 14px;
          font-weight: 500;
        }

        .lang-chevron {
          font-size: 12px;
          transition: transform 0.3s ease;
        }

        .lang-switcher-btn:hover .lang-chevron {
          transform: translateY(2px);
        }

        .lang-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          min-width: 160px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          z-index: 1000;
          overflow: hidden;
        }

        .lang-dropdown.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .lang-dropdown::before {
          content: '';
          position: absolute;
          top: -6px;
          right: 20px;
          width: 12px;
          height: 12px;
          background: #fff;
          transform: rotate(45deg);
        }

        .lang-dropdown-item {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid #f3f4f6;
          color: #1f2937;
          text-decoration: none;
        }

        .lang-dropdown-item:last-child {
          border-bottom: none;
        }

        .lang-dropdown-item:hover {
          background: #f9fafb;
          padding-left: 20px;
        }

        .lang-dropdown-item.active {
          background: #f0fdf4;
          color: #2d5f3f;
          font-weight: 600;
        }

        .lang-dropdown-item.active::after {
          content: '✓';
          margin-left: auto;
          color: #2d5f3f;
          font-weight: bold;
        }

        @media (max-width: 576px) {
          .lang-switcher-btn {
            padding: 8px 12px;
          }

          .lang-name {
            display: none;
          }

          .lang-flag {
            font-size: 20px;
          }
        }
      `}</style>

      <div className="lang-switcher-container notranslate">
        <button
          className="lang-switcher-btn"
          onClick={() => setShowDropdown(!showDropdown)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          type="button"
          data-current-lang
        >
          <span className="lang-flag">{currentLang?.flag}</span>
          <span className="lang-name">{currentLang?.name || "Language"}</span>
          <i className={`bi bi-chevron-down lang-chevron ${showDropdown ? 'rotate-180' : ''}`}></i>
        </button>

        <div className={`lang-dropdown ${showDropdown ? 'show' : ''}`}>
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`lang-dropdown-item notranslate ${currentLanguage === lang.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
              data-lang-name={lang.code}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}