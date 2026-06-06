import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, DollarSign, Languages, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GlobalSystemAdapter() {
  const [countries, setCountries] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('countries');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [countriesRes, languagesRes] = await Promise.all([
          base44.functions.invoke('globalSystemService', {
            action: 'get_all_countries'
          }),
          base44.functions.invoke('globalSystemService', {
            action: 'get_languages'
          })
        ]);

        if (countriesRes.data.success) setCountries(countriesRes.data.countries);
        if (languagesRes.data.success) setLanguages(languagesRes.data.languages);
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCountrySelect = async (countryCode) => {
    try {
      const res = await base44.functions.invoke('globalSystemService', {
        action: 'get_country_settings',
        country_code: countryCode
      });
      if (res.data.success) {
        setSettings(res.data);
        setSelectedCountry(countryCode);
      }
    } catch (error) {
      console.error('Settings error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div style={{ color: '#3b82f6', fontSize: 14 }}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Globe size={24} style={{ color: '#3b82f6' }} />
          <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0, fontFamily: 'Montserrat' }}>
            SISTEMA GLOBAL
          </p>
        </div>
        <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
          Plataforma Global Real
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
          Multi-moneda • Multi-idioma • Adaptación de timezone • Selector de país
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'rgba(59,130,246,0.15)' }}>
        {['countries', 'languages', 'currencies'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-3 border-b-2 transition-all"
            style={{
              borderColor: activeTab === tab ? '#3b82f6' : 'transparent',
              color: activeTab === tab ? '#3b82f6' : 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: activeTab === tab ? 600 : 400,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}
          >
            {tab === 'countries' && '🌍 Países'}
            {tab === 'languages' && '🗣️ Idiomas'}
            {tab === 'currencies' && '💱 Monedas'}
          </button>
        ))}
      </div>

      {/* COUNTRIES */}
      {activeTab === 'countries' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
            SELECTOR DE PAÍS
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((country, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleCountrySelect(country.country_code)}
                className="p-6 rounded-lg text-left transition-all"
                style={{
                  background:
                    selectedCountry === country.country_code
                      ? 'rgba(59,130,246,0.2)'
                      : 'rgba(59,130,246,0.08)',
                  border:
                    selectedCountry === country.country_code
                      ? '2px solid rgba(59,130,246,0.5)'
                      : '1px solid rgba(59,130,246,0.15)',
                  cursor: 'pointer'
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p style={{ color: 'white', fontSize: 14, fontWeight: 600, margin: '0 0 4px 0' }}>
                      {country.country_name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
                      {country.country_code}
                    </p>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      background:
                        country.compliance_status === 'compliant'
                          ? 'rgba(16,185,129,0.2)'
                          : 'rgba(251,146,60,0.2)',
                      color:
                        country.compliance_status === 'compliant'
                          ? '#10b981'
                          : '#fb923c',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 9,
                      fontWeight: 600
                    }}
                  >
                    {country.compliance_status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DollarSign size={14} style={{ color: '#3b82f6' }} />
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                      {country.currency_code}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Languages size={14} style={{ color: '#3b82f6' }} />
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                      {country.language_code.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={14} style={{ color: '#3b82f6' }} />
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                      {country.timezone}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Selected Country Details */}
          {settings && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-2xl"
              style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>
                {settings.country_name.toUpperCase()} - CONFIGURACIÓN ACTIVA
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>
                    MONEDA
                  </p>
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
                    {settings.currency_symbol} {settings.currency_code}
                  </p>
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>
                    IDIOMA
                  </p>
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
                    {settings.language_code.toUpperCase()}
                  </p>
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>
                    ZONA HORARIA
                  </p>
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
                    {settings.timezone}
                  </p>
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>
                    FORMATO DECIMAL
                  </p>
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
                    {settings.decimal_separator}
                  </p>
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>
                    SEPARADOR DE MILES
                  </p>
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
                    {settings.thousands_separator}
                  </p>
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>
                    ESTADO LEGAL
                  </p>
                  <p
                    style={{
                      color:
                        settings.compliance_status === 'compliant'
                          ? '#10b981'
                          : '#fb923c',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    {settings.compliance_status}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* LANGUAGES */}
      {activeTab === 'languages' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
            IDIOMAS SOPORTADOS
          </p>

          <div className="space-y-2">
            {languages.map((lang, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-4 rounded-lg"
                style={{
                  background:
                    lang.status === 'complete'
                      ? 'rgba(16,185,129,0.08)'
                      : 'rgba(251,146,60,0.08)',
                  border:
                    lang.status === 'complete'
                      ? '1px solid rgba(16,185,129,0.2)'
                      : '1px solid rgba(251,146,60,0.2)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 2px 0' }}>
                      {lang.name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
                      {lang.native_name} {lang.rtl && '(RTL)'}
                    </p>
                  </div>
                  <span
                    style={{
                      background:
                        lang.status === 'complete'
                          ? 'rgba(16,185,129,0.2)'
                          : 'rgba(251,146,60,0.2)',
                      color:
                        lang.status === 'complete'
                          ? '#10b981'
                          : '#fb923c',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600
                    }}
                  >
                    {lang.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CURRENCIES */}
      {activeTab === 'currencies' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl"
          style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>
            TASAS DE CAMBIO
          </p>

          <div className="text-center p-12">
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Las tasas de cambio se actualizan automáticamente diariamente desde fuentes confiables.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 12 }}>
              Cada conversión en el sistema usa tasas en tiempo real para garantizar precisión.
            </p>
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="p-6 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          { icon: '🌍', label: 'Países', count: countries.length },
          { icon: '🗣️', label: 'Idiomas', count: languages.length },
          { icon: '💱', label: 'Monedas', count: 'Activas' },
          { icon: '⏰', label: 'Timezones', count: 'Auto' }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            className="p-4 rounded-lg text-center"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
          >
            <p style={{ fontSize: 20, margin: '0 0 4px 0' }}>{item.icon}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
              {item.label}
            </p>
            <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>
              {item.count}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}