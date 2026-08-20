export default function OceanWaveStrip({ className = '' }) {
  return (
    <div className={`ocean-wave-strip ${className}`} aria-hidden="true">
      <svg className="ocean-wave-strip__layer ocean-wave-strip__layer--one" viewBox="0 0 2400 120" preserveAspectRatio="none">
        <path d="M0,50 Q300,20 600,50 T1200,50 T1800,50 T2400,50 L2400,120 L0,120 Z" />
      </svg>
      <svg className="ocean-wave-strip__layer ocean-wave-strip__layer--two" viewBox="0 0 2400 120" preserveAspectRatio="none">
        <path d="M0,66 Q300,90 600,66 T1200,66 T1800,66 T2400,66 L2400,120 L0,120 Z" />
      </svg>
      <svg className="ocean-wave-strip__layer ocean-wave-strip__layer--three" viewBox="0 0 2400 120" preserveAspectRatio="none">
        <path d="M0,80 Q150,96 300,80 T600,80 T900,80 T1200,80 T1500,80 T1800,80 T2100,80 T2400,80 L2400,120 L0,120 Z" />
      </svg>
    </div>
  );
}
