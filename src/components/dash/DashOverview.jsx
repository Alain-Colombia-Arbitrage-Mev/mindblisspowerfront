import DashboardValue from './DashboardValue';

export default function DashOverview({ user }) {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 100%)' }}>
      <div className="px-4 sm:px-6 py-8">
        <DashboardValue user={user} />
      </div>
    </div>
  );
}