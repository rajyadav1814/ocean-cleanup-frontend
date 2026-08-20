import OceanWaveStrip from '../../../components/common/OceanWaveStrip';

export default function AdminPageHeader({ eyebrow = 'Admin Space', title, subtitle, children }) {
  return (
    <div className="admin-hero mb-6">
      <OceanWaveStrip />
      <div>
        <div className="admin-hero__eyebrow">{eyebrow}</div>
        <h1 className="admin-hero__title">{title}</h1>
        {subtitle && <p className="admin-hero__sub">{subtitle}</p>}
      </div>
      {children && <div className="admin-hero__actions">{children}</div>}
    </div>
  );
}
