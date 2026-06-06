import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function PersonalizationLayer({ children }) {
  const [personalization, setPersonalization] = useState(null);
  const [userType, setUserType] = useState('explorador');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initPersonalization = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) return;

        // Track page visit
        await base44.functions.invoke('personalizationEngine', {
          action: 'track_behavior',
          user_id: user.id,
          event_type: 'page_visit',
          data: { time_on_page: 5 }
        });

        // Detect user type
        const detection = await base44.functions.invoke('personalizationEngine', {
          action: 'detect_user_type',
          user_id: user.id
        });

        if (detection.data.success) {
          setUserType(detection.data.user_type);

          // Get personalized content
          const content = await base44.functions.invoke('personalizationEngine', {
            action: 'get_personalized_content',
            user_id: user.id
          });

          if (content.data.success) {
            setPersonalization(content.data.personalized_content);
          }
        }
      } catch (error) {
        console.error('Personalization init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initPersonalization();
  }, []);

  // Expose personalization via context/props
  const contextValue = {
    userType,
    content: personalization,
    loading,
    trackEvent: async (eventType) => {
      try {
        const user = await base44.auth.me();
        await base44.functions.invoke('personalizationEngine', {
          action: 'track_behavior',
          user_id: user.id,
          event_type: eventType
        });
      } catch (error) {
        console.error('Track event error:', error);
      }
    }
  };

  return (
    <div data-personalization-user-type={userType}>
      {children(contextValue)}
    </div>
  );
}