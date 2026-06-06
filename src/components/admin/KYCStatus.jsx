import { useState } from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import KYCManager from '@/lib/KYCManager';
import KYCApprovalDialog from '@/components/admin/KYCApprovalDialog';

export default function KYCStatus({ userId, size = 'md', showActions = false, onStatusChange }) {
  const [showDialog, setShowDialog] = useState(false);
  const record = KYCManager.getKYCRecord(userId);
  const statusInfo = KYCManager.getStatusBadgeInfo(record.status);

  const handleStatusChange = () => {
    onStatusChange?.();
  };

  const iconMap = {
    not_verified: AlertCircle,
    pending: Clock,
    verified: CheckCircle,
    rejected: XCircle,
  };

  const Icon = iconMap[record.status] || AlertCircle;

  const sizeClasses = {
    xs: { icon: 12, text: 9, padding: 'px-2 py-1' },
    sm: { icon: 14, text: 10, padding: 'px-2.5 py-1.5' },
    md: { icon: 16, text: 11, padding: 'px-3 py-2' },
    lg: { icon: 18, text: 12, padding: 'px-4 py-2.5' },
  };

  const sizes = sizeClasses[size];

  return (
    <>
      <div
        className={`inline-flex items-center gap-2 rounded-lg ${sizes.padding} transition-all cursor-pointer hover:opacity-80`}
        style={{ background: `${statusInfo.bgColor}15`, border: `1px solid ${statusInfo.bgColor}30` }}
        onClick={() => showActions && setShowDialog(true)}
      >
        <Icon size={sizes.icon} style={{ color: statusInfo.color }} />
        <span style={{ color: statusInfo.color, fontSize: sizes.text, fontWeight: 600 }}>
          {statusInfo.label}
        </span>
      </div>

      {showDialog && (
        <KYCApprovalDialog
          userId={userId}
          onClose={() => setShowDialog(false)}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
}