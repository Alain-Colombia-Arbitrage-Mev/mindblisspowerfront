import { useState, useEffect } from 'react';

/**
 * Dynamic Content Renderer
 * Pulls active variations from admin and renders them dynamically
 * Tracks impressions & clicks for A/B testing analytics
 */

export default function DynamicContentRenderer({ location, type, fallback = '' }) {
  const [content, setContent] = useState(fallback);
  const [variationId, setVariationId] = useState(null);

  useEffect(() => {
    // In production, fetch from API/backend
    // For now, mock the variation selection
    const mockVariations = {
      hero_headline: {
        id: 'var_2',
        content: 'Join 50K+ Members Building Wealth',
      },
      hero_cta: {
        id: 'var_3',
        content: 'Get Started Now',
      },
      footer_text: {
        id: 'var_1',
        content: 'Build Your Financial Future Today',
      },
    };

    const key = `${location}_${type}`;
    const variation = mockVariations[key];

    if (variation) {
      setContent(variation.content);
      setVariationId(variation.id);

      // Track impression (send to analytics)
      trackImpression(variation.id);
    }
  }, [location, type]);

  const trackImpression = (vid) => {
    // In production: send to backend analytics
    console.log(`[Analytics] Impression tracked for variation: ${vid}`);
  };

  const trackClick = () => {
    if (variationId) {
      console.log(`[Analytics] Click tracked for variation: ${variationId}`);
    }
  };

  return { content, trackClick, variationId };
}

/**
 * Usage Example:
 * 
 * const { content: headline, trackClick } = DynamicContentRenderer({
 *   location: 'hero',
 *   type: 'headline',
 *   fallback: 'Default Headline'
 * });
 * 
 * <h1 onClick={trackClick}>{headline}</h1>
 */