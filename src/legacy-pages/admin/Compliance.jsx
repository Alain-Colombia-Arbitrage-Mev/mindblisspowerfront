import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Shield, Brain } from 'lucide-react';
import KYCManager from '@/lib/KYCManager';
import AMLRiskManager from '@/lib/AMLRiskManager';
import TransactionMonitor from '@/lib/TransactionMonitor';
import SecurityAlertSystem from '@/lib/SecurityAlertSystem';
import PolicyEngine from '@/lib/PolicyEngine';
import ComplianceAIPanel from '@/components/admin/ComplianceAIPanel';
import LegalDocumentManager from '@/components/admin/LegalDocumentManager';
import ContractGenerationDashboard from '@/components/admin/ContractGenerationDashboard';
import DigitalSignatureUI from '@/components/admin/DigitalSignatureUI';
import DocumentManagerDashboard from '@/components/admin/DocumentManagerDashboard';
import LegalAuditDashboard from '@/components/admin/LegalAuditDashboard';
import { motion } from 'framer-motion';

export default function Compliance() {
  const [kycData, setKycData] = useState({ verified: 0, pending: 0, rejected: 0, notVerified: 0 });
  const [amlData, setAmlData] = useState({ low: 0, medium: 0, high: 0 });
  const [txData, setTxData] = useState({ flagged: 0, pending: 0, approved: 0, rejected: 0 });
  const [alerts, setAlerts] = useState([]);
  const [rules, setRules] = useState([]);
  const [report, setReport] = useState(null);

  useEffect(() => {
    updateComplianceData();

    const engine = PolicyEngine.getInstance();
    setRules(engine.getAllRules());
    setReport(engine.getComplianceReport());

    // Subscribe to updates
    const unsubKyc = KYCManager.subscribe(() => updateComplianceData());
    const unsubAml = AMLRiskManager.subscribe(() => updateComplianceData());
    const unsubTx = TransactionMonitor.subscribe(() => updateComplianceData());
    const unsubSec = SecurityAlertSystem.subscribe(() => updateComplianceData());
    const unsubPolicy = engine.subscribe((newReport) => setReport(newReport));

    return () => {
      unsubKyc();
      unsubAml();
      unsubTx();
      unsubSec();
      unsubPolicy();
    };
  }, []);

  const updateComplianceData = () => {
    // KYC data
    const allRecords = KYCManager.getAllRecords();
    const kycCounts = {
      verified: allRecords.filter(r => r.status === 'verified').length,
      pending: allRecords.filter(r => r.status === 'pending').length,
      rejected: allRecords.filter(r => r.status === 'rejected').length,
      notVerified: allRecords.filter(r => r.status === 'not_verified').length,
    };
    setKycData(kycCounts);

    // AML risk data
    const amlSummary = AMLRiskManager.getAMLSummary();
    setAmlData({
      low: amlSummary.totalPaymentsAssessed - amlSummary.highRiskPayments - amlSummary.mediumRiskPayments,
      medium: amlSummary.mediumRiskPayments,
      high: amlSummary.highRiskPayments,
    });

    // Transaction data
    const summary = TransactionMonitor.getDashboardSummary();
    setTxData({
      flagged: summary.flaggedTransactions,
      pending: summary.pendingReview,
      approved: summary.totalTransactions - summary.flaggedTransactions - summary.pendingReview,
      rejected: 0,
    });

    // Alerts
    const unacked = SecurityAlertSystem.getUnacknowledgedAlerts();
    setAlerts(unacked.slice(0, 10));
  };

  const totalKyc = kycData.verified + kycData.pending + kycData.rejected + kycData.notVerified;
  const totalTx = kycData.verified + kycData.pending + kycData.rejected + kycData.notVerified;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>Compliance Dashboard</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '4px 0 0 0' }}>
          Global view of KYC, AML risk, transaction compliance, and AI-driven risk intelligence
        </p>
      </div>

      {/* AI Compliance Intelligence */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
        <ComplianceAIPanel />
      </div>

      {/* Legal Framework & Document Management */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(59,130,246,0.2)' }}>
        <div className="p-6" style={{ background: 'rgba(8,18,40,0.5)' }}>
          <LegalDocumentManager />
        </div>
      </div>

      {/* Contract Generation */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="p-6" style={{ background: 'rgba(8,18,40,0.5)' }}>
          <ContractGenerationDashboard />
        </div>
      </div>

      {/* Digital Signature Demo */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(16,185,129,0.2)' }}>
        <div className="p-6" style={{ background: 'rgba(8,18,40,0.5)' }}>
          <h2 style={{ color: 'white', fontSize: 16, fontWeight: 900, margin: '0 0 16px 0' }}>Digital Signature Workflow</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 20px 0' }}>
            Multi-step signature process with acceptance confirmation and cryptographic recording
          </p>
          <DigitalSignatureUI
            document={{
              id: 'DOC-DEMO-001',
              type: 'participation_agreement',
              title: 'Participation Agreement Demo',
              generatedDate: new Date(),
              amount: 1000,
              currency: 'USD',
              content: `This is a demonstration participation agreement. The full document would contain all terms and conditions. This demo shows the multi-step digital signature workflow with acceptance checkboxes, signer information capture, and cryptographic recording of the signature.`,
            }}
            onSignatureComplete={(signature) => {
              console.log('Document signed:', signature);
            }}
          />
        </div>
      </div>

      {/* Document Manager */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(59,130,246,0.2)' }}>
        <div className="p-6" style={{ background: 'rgba(8,18,40,0.5)' }}>
          <DocumentManagerDashboard />
        </div>
      </div>

      {/* Legal Audit Trail */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="p-6" style={{ background: 'rgba(8,18,40,0.5)' }}>
          <LegalAuditDashboard />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <ComplianceStat
          label="KYC Verified"
          value={kycData.verified}
          color="#10b981"
          icon={CheckCircle}
          subtext={totalKyc > 0 ? `${Math.round((kycData.verified / totalKyc) * 100)}%` : '0%'}
        />
        <ComplianceStat
          label="KYC Pending"
          value={kycData.pending}
          color="#fb923c"
          icon={Clock}
          subtext={totalKyc > 0 ? `${Math.round((kycData.pending / totalKyc) * 100)}%` : '0%'}
        />
        <ComplianceStat
          label="High Risk"
          value={amlData.high}
          color="#ef4444"
          icon={AlertTriangle}
          subtext="Transactions"
        />
        <ComplianceStat
          label="Flagged TX"
          value={kycData.verified + kycData.pending + kycData.rejected + kycData.notVerified}
          color="#fb923c"
          icon={TrendingUp}
          subtext="Action needed"
        />
        <ComplianceStat
          label="Active Alerts"
          value={alerts.length}
          color="#3b82f6"
          icon={AlertTriangle}
          subtext="Unacknowledged"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* KYC Status Distribution */}
        <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>KYC Status Distribution</h2>
          <div className="mt-6 space-y-4">
            {[
              { status: 'Verified', count: kycData.verified, color: '#10b981' },
              { status: 'Pending', count: kycData.pending, color: '#fb923c' },
              { status: 'Rejected', count: kycData.rejected, color: '#ef4444' },
              { status: 'Not Verified', count: kycData.notVerified, color: '#9ca3af' },
            ].map(item => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{item.status}</span>
                  <span style={{ color: item.color, fontWeight: 700, fontSize: 12 }}>{item.count}</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${totalKyc > 0 ? (item.count / totalKyc) * 100 : 0}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AML Risk Distribution */}
        <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>AML Risk Distribution</h2>
          <div className="mt-6 space-y-4">
            {[
              { level: 'Low Risk', count: amlData.low, color: '#10b981' },
              { level: 'Medium Risk', count: amlData.medium, color: '#fb923c' },
              { level: 'High Risk', count: amlData.high, color: '#ef4444' },
            ].map(item => {
              const total = amlData.low + amlData.medium + amlData.high;
              return (
                <div key={item.level}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{item.level}</span>
                    <span style={{ color: item.color, fontWeight: 700, fontSize: 12 }}>{item.count}</span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${total > 0 ? (item.count / total) * 100 : 0}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pending Verifications */}
      <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Pending Verifications</h2>
        {kycData.pending === 0 ? (
          <div className="text-center p-8" style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8 }}>
            <CheckCircle size={24} style={{ color: '#10b981', margin: '0 auto 8px' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>All verifications up to date</p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>KYC Submissions Awaiting Review</p>
              <p style={{ color: '#fb923c', fontSize: 18, fontWeight: 900, margin: '4px 0 0 0' }}>
                {kycData.pending}
              </p>
            </div>
            <Clock size={28} style={{ color: '#fb923c' }} />
          </div>
        )}
      </div>

      {/* Flagged Transactions */}
      <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Flagged Transactions</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending Review', count: kycData.pending, color: '#fb923c' },
            { label: 'High Risk', count: amlData.high, color: '#ef4444' },
            { label: 'Suspicious Pattern', count: Math.max(0, kycData.pending - Math.floor(kycData.pending / 3)), color: '#ef4444' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-lg" style={{ background: `${item.color}12`, border: `1px solid ${item.color}30` }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, margin: 0 }}>
                {item.label}
              </p>
              <p style={{ color: item.color, fontSize: 20, fontWeight: 900, margin: '4px 0 0 0' }}>
                {item.count}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Alerts */}
      <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Security Alerts</h2>
        {alerts.length === 0 ? (
          <div className="text-center p-8" style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8 }}>
            <CheckCircle size={24} style={{ color: '#10b981', margin: '0 auto 8px' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>No active security alerts</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: alert.severity === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(251,146,60,0.08)',
                  border: alert.severity === 'critical' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(251,146,60,0.2)',
                }}
              >
                <AlertTriangle
                  size={16}
                  style={{ color: alert.severity === 'critical' ? '#ef4444' : '#fb923c', flexShrink: 0, marginTop: 2 }}
                />
                <div className="flex-1">
                  <p style={{ color: 'white', fontWeight: 600, fontSize: 11, margin: 0 }}>
                    {alert.title}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '3px 0 0 0' }}>
                    {alert.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Policy Rules */}
      <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Active Policy Rules</h2>
        <div className="grid grid-cols-2 gap-4">
          {rules.map(rule => {
            const severityColor = {
              critical: '#ef4444',
              high: '#fb923c',
              medium: '#f59e0b',
              low: '#10b981',
            }[rule.severity];

            const actionColor = {
              BLOCK: '#ef4444',
              REQUIRE_REVIEW: '#fb923c',
              REQUIRE_APPROVAL: '#f59e0b',
              FLAG: '#3b82f6',
              RESTRICT: '#8b5cf6',
            }[rule.action];

            return (
              <div key={rule.id} className="p-4 rounded-lg" style={{ background: `${severityColor}12`, border: `1px solid ${severityColor}30` }}>
                <div className="flex items-start gap-3">
                  <Shield size={16} style={{ color: severityColor, flexShrink: 0, marginTop: 2 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 11, margin: 0 }}>
                      {rule.name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      {rule.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span style={{ color: actionColor, fontSize: 9, fontWeight: 700, padding: '2px 6px', background: `${actionColor}20`, borderRadius: 4 }}>
                        {rule.action}
                      </span>
                      {rule.threshold && (
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>
                          ${rule.threshold.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enforcement Summary */}
      {report && (
        <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(59,130,246,0.2)' }}>
          <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Policy Enforcement Summary</h2>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>Total Enforcements</p>
              <p style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: '6px 0 0 0' }}>
                {report.totalEnforcements}
              </p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>Blocked</p>
              <p style={{ color: '#ef4444', fontSize: 18, fontWeight: 900, margin: '6px 0 0 0' }}>
                {report.byAction.BLOCK}
              </p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>Review Required</p>
              <p style={{ color: '#fb923c', fontSize: 18, fontWeight: 900, margin: '6px 0 0 0' }}>
                {report.byAction.REQUIRE_REVIEW}
              </p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>Flagged</p>
              <p style={{ color: '#3b82f6', fontSize: 18, fontWeight: 900, margin: '6px 0 0 0' }}>
                {report.byAction.FLAG}
              </p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>Last 24h</p>
              <p style={{ color: '#10b981', fontSize: 18, fontWeight: 900, margin: '6px 0 0 0' }}>
                {report.last24hEnforcements}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Score */}
      <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>Overall Compliance Score</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '6px 0 0 0' }}>
              Based on KYC verification and AML risk assessment
            </p>
          </div>
          <div className="text-right">
            <p style={{ color: '#10b981', fontSize: 28, fontWeight: 900, margin: 0 }}>
              {totalKyc > 0
                ? Math.round(
                    ((kycData.verified / totalKyc) * 0.6 + (1 - amlData.high / Math.max(1, amlData.high + amlData.medium + amlData.low)) * 0.4) * 100
                  )
                : 0}
              %
            </p>
            <p style={{ color: '#10b981', fontSize: 11, fontWeight: 600, margin: '2px 0 0 0' }}>Compliant</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplianceStat({ label, value, color, icon: Icon, subtext }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>
            {label}
          </p>
          <p style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '4px 0 0 0' }}>
            {value}
          </p>
        </div>
        <Icon size={18} style={{ color }} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>{subtext}</p>
    </div>
  );
}