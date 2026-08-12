import { Link } from 'react-router-dom';
import {
  Droplets,
  Recycle,
  MapPinned,
  Trophy,
  ArrowRight,
} from 'lucide-react';

const FONT_SANS = "var(--font-sans)";
const FONT_DISPLAY = "var(--font-display)";
const FONT_MONO = "var(--font-mono)";

export default function LandingPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6rem',
        paddingTop: '1.5rem',
        paddingBottom: '1.5rem',
        fontFamily: FONT_SANS,
        fontStyle: 'normal',
      }}
    >
      {/* ==================== HERO ==================== */}
      <section
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          className="rise"
          style={{
            margin: '0 auto',
            maxWidth: '48rem',
            textAlign: 'center',
          }}
        >
          {/* Badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '9999px',
              border: '1px solid var(--border-light)',
              background: 'rgba(255,255,255,0.035)',
              padding: '0.375rem 1rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#7de7f0',
              fontFamily: FONT_MONO,
              letterSpacing: '0',
            }}
          >
            <Droplets
              style={{
                width: '1rem',
                height: '1rem',
                flexShrink: 0,
              }}
            />

            Community science for a cleaner planet
          </span>

          {/* Main heading */}
          <h1
            style={{
              margin: '1.5rem 0 0',
              fontSize: 'clamp(2.75rem, 6vw, 3.75rem)',
              fontWeight: 500,
              lineHeight: 1.04,
              letterSpacing: '-0.045em',
              color: '#e8f2ff',
              fontFamily: FONT_DISPLAY,
              fontStyle: 'normal',
            }}
          >
            Map the litter.
            <br />

            <span
              style={{
                color: '#3dd6e0',
              }}
            >
              Mend the planet.
            </span>
          </h1>

          {/* Description */}
          <p
            style={{
              margin: '1.25rem auto 0',
              maxWidth: '40rem',
              fontSize: '1.125rem',
              fontWeight: 400,
              lineHeight: 1.7,
              letterSpacing: '0',
              color: 'rgba(232,242,255,0.70)',
              fontFamily: FONT_SANS,
            }}
          >
            Every photo you take of trash in the wild becomes a data point in
            an open map of pollution powering cleanups, research, and policy.
            And you earn eco badges along the way.
          </p>

          {/* Buttons */}
          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <Link
              to="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                borderRadius: '9999px',
                background: '#3dd6e0',
                padding: '0.875rem 1.75rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#041019',
                textDecoration: 'none',
                fontFamily: FONT_MONO,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                boxShadow: '0 20px 40px rgba(61,214,224,0.25)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#22b8c7';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3dd6e0';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Start contributing

              <ArrowRight
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                }}
              />
            </Link>

            <Link
              to="https://forecast.bluemind.si/"
              target='_blank'
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                border: '1px solid var(--border-light)',
                background: 'rgba(3,14,25,0.7)',
                padding: '0.875rem 1.75rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#e8f2ff',
                textDecoration: 'none',
                fontFamily: FONT_MONO,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'rgba(61,214,224,0.08)';
                e.currentTarget.style.borderColor =
                  'rgba(61,214,224,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  'rgba(3,14,25,0.7)';
                e.currentTarget.style.borderColor =
                  'var(--border-light)';
              }}
            >
              Explore the map
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div
          className="rise"
          style={{
            margin: '3.5rem auto 0',
            maxWidth: '56rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
            gap: '1rem',
            animationDelay: '0.15s',
          }}
        >
          {[
            {
              n: '8M tons',
              l: 'of plastic enter the ocean each year',
            },
            {
              n: '1 photo',
              l: 'is all it takes to add a data point',
            },
            {
              n: '100%',
              l: 'open, community-owned dataset',
            },
          ].map((s) => (
            <div
              key={s.l}
              className="glass"
              style={{
                borderRadius: '1.5rem',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color: '#3dd6e0',
                  fontFamily: FONT_DISPLAY,
                  letterSpacing: '-0.02em',
                }}
              >
                {s.n}
              </p>

              <p
                style={{
                  margin: '0.25rem 0 0',
                  fontSize: '0.75rem',
                  fontWeight: 400,
                  color: 'rgba(232,242,255,0.70)',
                  lineHeight: 1.5,
                  fontFamily: FONT_MONO,
                }}
              >
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== WHY ==================== */}
      <section
        style={{
          margin: '0 auto',
          maxWidth: '56rem',
          width: '100%',
        }}
      >
        <h2
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: '1.875rem',
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: '-0.025em',
            color: '#e8f2ff',
            fontFamily: FONT_DISPLAY,
          }}
        >
          Why BlueMind exists
        </h2>

        <p
          style={{
            margin: '0.75rem auto 0',
            maxWidth: '42rem',
            textAlign: 'center',
            fontSize: '1rem',
            fontWeight: 400,
            color: 'rgba(232,242,255,0.70)',
            lineHeight: 1.7,
            fontFamily: FONT_SANS,
          }}
        >
          Pollution is invisible until it is measured. Most litter is never
          recorded, so cleanups happen blind and researchers lack ground-truth
          data. BlueMind turns ordinary people with phones into a global
          sensing network documenting what's out there, where, and how urgent
          it is.
        </p>

        {/* Feature cards */}
        <div
          style={{
            marginTop: '2.5rem',
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
          }}
        >
          <Feature
            icon={MapPinned}
            title="Document"
            body="Snap a photo of any litter. AI identifies the type, material, and environmental impact in seconds."
          />

          <Feature
            icon={Recycle}
            title="Build the dataset"
            body="Each geotagged report joins an open map that NGOs, cities, and scientists can act on."
          />

          <Feature
            icon={Trophy}
            title="Get rewarded"
            body="Earn Bronze to Platinum badges, build streaks, and grow your Eco Score with every report."
          />
        </div>
      </section>

      {/* ==================== IMPACT ==================== */}
      <section
        style={{
          margin: '0 auto',
          maxWidth: '56rem',
          width: '100%',
        }}
      >
        <div
          className="glass"
          style={{
            borderRadius: '2rem',
            padding: 'clamp(2rem, 4vw, 3rem)',
            overflow: 'hidden',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.875rem',
              fontWeight: 500,
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              color: '#e8f2ff',
              fontFamily: FONT_DISPLAY,
            }}
          >
            The impact of every report
          </h2>

          <div
            style={{
              marginTop: '1.5rem',
              display: 'grid',
              gap: '1.5rem',
              gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
            }}
          >
            <p
              style={{
                margin: 0,
                color: 'rgba(232,242,255,0.70)',
                fontSize: '1rem',
                fontWeight: 400,
                lineHeight: 1.7,
                fontFamily: FONT_SANS,
              }}
            >
              A single bottle takes up to 450 years to break down.
              Documenting where it sits helps cleanup crews prioritize the
              most fragile ecosystems first — waterways, coastlines, and
              habitats where wildlife is most at risk.
            </p>

            <p
              style={{
                margin: 0,
                color: 'rgba(232,242,255,0.70)',
                fontSize: '1rem',
                fontWeight: 400,
                lineHeight: 1.7,
                fontFamily: FONT_SANS,
              }}
            >
              As reports accumulate, patterns emerge: pollution hotspots,
              recurring waste types, and the effect of local policy. That
              evidence is what turns awareness into action.
            </p>
          </div>

          <Link
            to="/signup"
            style={{
              marginTop: '2rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '9999px',
              background: '#3dd6e0',
              padding: '0.75rem 1.5rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#041019',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              fontFamily: FONT_MONO,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#22b8c7';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3dd6e0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Join the movement

            <ArrowRight
              style={{
                width: '1rem',
                height: '1rem',
              }}
            />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: any;
  title: string;
  body: string;
}) {
  return (
    <div
      className="glass"
      style={{
        borderRadius: '1.5rem',
        padding: '1.5rem',
      }}
    >
      {/* Icon */}
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          width: '2.75rem',
          height: '2.75rem',
          borderRadius: '0.75rem',
          background: 'rgba(61,214,224,0.15)',
          color: '#3dd6e0',
        }}
      >
        <Icon
          style={{
            width: '1.25rem',
            height: '1.25rem',
          }}
        />
      </span>

      {/* Title */}
      <h3
        style={{
          margin: '1rem 0 0',
          fontSize: '1.125rem',
          fontWeight: 500,
          lineHeight: 1.3,
          color: '#e8f2ff',
          fontFamily: FONT_DISPLAY,
        }}
      >
        {title}
      </h3>

      {/* Body */}
      <p
        style={{
          margin: '0.25rem 0 0',
          fontSize: '0.875rem',
          fontWeight: 400,
          color: 'rgba(232,242,255,0.70)',
          lineHeight: 1.6,
          fontFamily: FONT_SANS,
        }}
      >
        {body}
      </p>
    </div>
  );
}