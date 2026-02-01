"use client";

import { useEffect } from "react";

export default function FixCzechTypography() {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isProcessing = false;
    
    // Funkce pro nahrazení " a " za non-breaking space
    const fixCzechConjunction = () => {
      if (isProcessing) return;
      isProcessing = true;
      
      try {
        // Projdeme všechny elementy s textem
        const allElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, td, th, label, button, a');
        
        allElements.forEach((element) => {
          // Přeskočíme script, style a další technické tagy
          if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE' || element.tagName === 'NOSCRIPT') {
            return;
          }
          
          // Přeskočíme elementy, které už byly upraveny
          if (element.getAttribute('data-czech-fixed') === 'true') {
            return;
          }
          
          // Získáme všechny textové uzly v elementu
          const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null
          );

          const textNodes: Text[] = [];
          let node;
          while ((node = walker.nextNode())) {
            if (node.nodeValue && / a /.test(node.nodeValue)) {
              textNodes.push(node as Text);
            }
          }

          textNodes.forEach((textNode) => {
            const originalText = textNode.nodeValue!;
            
            // Přeskočíme, pokud už obsahuje non-breaking space
            if (originalText.includes('\u00A0a ')) {
              return;
            }
            
            // Nahradíme " a " za non-breaking space
            const newText = originalText.replace(/ a /g, "\u00A0a ");
            
            if (newText !== originalText) {
              textNode.nodeValue = newText;
            }
          });
          
          // Označíme element jako upravený
          if (textNodes.length > 0) {
            element.setAttribute('data-czech-fixed', 'true');
          }
        });
      } catch (error) {
        console.error('Error fixing Czech typography:', error);
      } finally {
        isProcessing = false;
      }
    };

    // Spustíme po načtení DOM
    const runFix = () => {
      requestAnimationFrame(() => {
        fixCzechConjunction();
      });
    };

    // Spustíme několikrát s různými zpožděními, aby to zachytilo všechny případy
    runFix();
    timeoutId = setTimeout(runFix, 100);
    setTimeout(runFix, 500);
    setTimeout(runFix, 1000);
    
    // Spustíme také po načtení stránky
    if (document.readyState === 'complete') {
      setTimeout(runFix, 200);
    } else {
      window.addEventListener('load', () => {
        setTimeout(runFix, 200);
      });
    }
    
    // Spustíme také po změně obsahu (pro dynamický obsah)
    const observer = new MutationObserver((mutations) => {
      let shouldRun = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          shouldRun = true;
        }
      });
      
      if (shouldRun) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(runFix, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Spustíme také při změně velikosti okna (text se může přelomit jinak)
    window.addEventListener('resize', runFix);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener('resize', runFix);
    };
  }, []);

  return null;
}
