import { useState } from 'react';

/**
 * Accessible mathematical expression renderer.
 * Reason (R-06, R-25): Uses high-contrast serif mathematical typography on warm
 * vellum plates so fractions, limits, and integrals read like a typeset textbook.
 */
export function MathExpression({ tex = '', block = false, className = '' }) {
  const rendered = parseMathTokens(tex);
  return (
    <span
      className={`cq-math-expr ${block ? 'cq-math-block' : 'cq-math-inline'} ${className}`}
      role="math"
      aria-label={tex}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '3px',
        fontFamily: '"Cambria Math", "Times New Roman", Georgia, serif',
        fontSize: block ? '1.22rem' : '1.06rem',
        fontWeight: 700,
        letterSpacing: '0.01em',
        lineHeight: 1.4,
        color: 'inherit',
      }}
    >
      {rendered}
    </span>
  );
}

export function RichMathText({ text = '', className = '' }) {
  if (!text) return null;
  const parts = String(text).split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  return (
    <span className={className} style={{ lineHeight: 1.6 }}>
      {parts.map((part, idx) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return (
            <span
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'center',
                margin: '10px 0',
                padding: '10px 14px',
                background: '#EDE3CE',
                borderRadius: '6px',
                border: '2px solid #6E4726',
                color: '#231A12',
              }}
            >
              <MathExpression tex={part.slice(2, -2)} block />
            </span>
          );
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          return <MathExpression key={idx} tex={part.slice(1, -1)} />;
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}

function extractBraced(str, startIndex) {
  if (str[startIndex] !== '{') return { content: str[startIndex] || '', nextIndex: startIndex + 1 };
  let depth = 0;
  let i = startIndex;
  for (; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) {
        return { content: str.slice(startIndex + 1, i), nextIndex: i + 1 };
      }
    }
  }
  return { content: str.slice(startIndex + 1), nextIndex: str.length };
}

function parseMathTokens(tex) {
  const elements = [];
  let i = 0;
  let keyCounter = 0;

  while (i < tex.length) {
    if (tex.startsWith('\\lim_', i)) {
      i += 5;
      const sub = extractBraced(tex, i);
      i = sub.nextIndex;
      elements.push(
        <span
          key={keyCounter++}
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginRight: '4px',
            verticalAlign: 'middle',
          }}
        >
          <span style={{ fontStyle: 'normal', fontWeight: 700, fontSize: '0.95em', lineHeight: 1 }}>lim</span>
          <span style={{ fontSize: '0.74em', lineHeight: 1.1 }}>
            {parseMathTokens(sub.content)}
          </span>
        </span>
      );
      continue;
    }

    if (tex.startsWith('\\frac', i)) {
      i += 5;
      while (tex[i] === ' ') i++;
      const num = extractBraced(tex, i);
      i = num.nextIndex;
      while (tex[i] === ' ') i++;
      const den = extractBraced(tex, i);
      i = den.nextIndex;
      elements.push(
        <span
          key={keyCounter++}
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            verticalAlign: 'middle',
            margin: '0 3px',
          }}
        >
          <span style={{ padding: '0 4px', borderBottom: '1.5px solid currentColor', lineHeight: 1.15 }}>
            {parseMathTokens(num.content)}
          </span>
          <span style={{ padding: '0 4px', lineHeight: 1.15 }}>
            {parseMathTokens(den.content)}
          </span>
        </span>
      );
      continue;
    }

    if (tex.startsWith('\\int', i)) {
      i += 4;
      let lower = null;
      let upper = null;
      if (tex[i] === '_') {
        i++;
        const l = extractBraced(tex, i);
        lower = l.content;
        i = l.nextIndex;
      }
      if (tex[i] === '^') {
        i++;
        const u = extractBraced(tex, i);
        upper = u.content;
        i = u.nextIndex;
      }
      elements.push(
        <span
          key={keyCounter++}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginRight: '3px',
            verticalAlign: 'middle',
          }}
        >
          <span style={{ fontSize: '1.45em', fontStyle: 'italic', lineHeight: 1 }}>∫</span>
          {(lower !== null || upper !== null) && (
            <span
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontSize: '0.68em',
                marginLeft: '1px',
                lineHeight: 1,
                height: '2.1em',
              }}
            >
              <span>{upper ? parseMathTokens(upper) : ''}</span>
              <span>{lower ? parseMathTokens(lower) : ''}</span>
            </span>
          )}
        </span>
      );
      continue;
    }

    if (tex.startsWith('\\sqrt', i)) {
      i += 5;
      const rad = extractBraced(tex, i);
      i = rad.nextIndex;
      elements.push(
        <span key={keyCounter++} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ fontSize: '1.15em', marginRight: '1px' }}>√</span>
          <span style={{ borderTop: '1.5px solid currentColor', paddingTop: '1px' }}>
            {parseMathTokens(rad.content)}
          </span>
        </span>
      );
      continue;
    }

    const macros = [
      ['\\to', '→'],
      ['\\infty', '∞'],
      ['\\pi', 'π'],
      ['\\cdot', '·'],
      ['\\times', '×'],
      ['\\leq', '≤'],
      ['\\geq', '≥'],
      ['\\neq', '≠'],
      ['\\pm', '±'],
    ];
    let matchedMacro = false;
    for (const [cmd, sym] of macros) {
      if (tex.startsWith(cmd, i)) {
        elements.push(<span key={keyCounter++} style={{ margin: '0 2px' }}>{sym}</span>);
        i += cmd.length;
        matchedMacro = true;
        break;
      }
    }
    if (matchedMacro) continue;

    if (tex[i] === '^') {
      i++;
      const sup = extractBraced(tex, i);
      i = sup.nextIndex;
      elements.push(
        <sup key={keyCounter++} style={{ fontSize: '0.74em', lineHeight: 0, marginLeft: '1px' }}>
          {parseMathTokens(sup.content)}
        </sup>
      );
      continue;
    }

    if (tex[i] === '_') {
      i++;
      const sub = extractBraced(tex, i);
      i = sub.nextIndex;
      elements.push(
        <sub key={keyCounter++} style={{ fontSize: '0.74em', lineHeight: 0, marginLeft: '1px' }}>
          {parseMathTokens(sub.content)}
        </sub>
      );
      continue;
    }

    elements.push(<span key={keyCounter++}>{tex[i]}</span>);
    i++;
  }

  return elements;
}

export function InteractiveMathVisualizer({ config }) {
  const [sliderX, setSliderX] = useState(config?.initialX ?? 1.4);

  if (!config) return null;

  if (config.type === 'limit_approach') {
    const targetX = config.targetX ?? 2;
    const targetY = config.targetY ?? 4;
    const currentY = Math.abs(sliderX - targetX) < 0.001 ? null : sliderX + (targetY - targetX);

    return (
      <div
        style={{
          background: '#EDE3CE',
          border: '2px solid #6E4726',
          borderRadius: '6px',
          padding: '12px',
          marginTop: '10px',
          color: '#231A12',
        }}
        aria-label={config.altText || 'Interactive limit approach diagram'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#231A12', marginBottom: '6px' }}>
          <span>Slide x toward {targetX}:</span>
          <strong>
            x = {sliderX.toFixed(2)},{' '}
            {currentY === null ? 'Undefined (0/0 Hole at x = 2)' : `f(x) = ${currentY.toFixed(2)}`}
          </strong>
        </div>
        <input
          type="range"
          min={targetX - 1.5}
          max={targetX + 1.5}
          step={0.05}
          value={sliderX}
          onChange={(e) => setSliderX(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#266B3E', cursor: 'pointer' }}
          aria-label="Limit input x value"
        />
        <svg viewBox="0 0 320 90" style={{ width: '100%', height: '84px', marginTop: '4px' }}>
          <line x1="20" y1="56" x2="300" y2="56" stroke="#6E4726" strokeWidth="2.5" />
          <circle cx="160" cy="56" r="7" fill="#FFFDF8" stroke="#B83B2A" strokeWidth="2.5" />
          <text x="160" y="80" textAnchor="middle" fill="#231A12" fontSize="11" fontWeight="bold">
            Target x = {targetX} (Limit L = {targetY})
          </text>
          {(() => {
            const px = 160 + (sliderX - targetX) * 80;
            return (
              <g>
                <circle cx={px} cy="56" r="6" fill="#266B3E" />
                <text x={px} y="36" textAnchor="middle" fill="#231A12" fontSize="11" fontWeight="bold">
                  {currentY === null ? '0/0' : currentY.toFixed(2)}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    );
  }

  if (config.type === 'composite_layers') {
    return (
      <div
        style={{
          background: '#EDE3CE',
          border: '2px solid #6E4726',
          borderRadius: '6px',
          padding: '12px',
          marginTop: '10px',
          color: '#231A12',
        }}
        aria-label={config.altText || 'Composite function layers diagram'}
      >
        <div style={{ fontSize: '0.8rem', color: '#5C4938', marginBottom: '8px', fontWeight: 800 }}>
          COMPOSITE FUNCTION STRUCTURE
        </div>
        <div
          style={{
            border: '2px dashed #6E4726',
            borderRadius: '6px',
            padding: '10px',
            background: '#FFFDF8',
          }}
        >
          <div style={{ fontSize: '0.86rem', color: '#231A12' }}>
            <strong>Outer Layer f(u):</strong> {config.outerLabel || 'u^4 gives df/du = 4u^3'}
          </div>
          <div
            style={{
              marginTop: '8px',
              border: '2px solid #266B3E',
              borderRadius: '6px',
              padding: '8px',
              background: '#E3F2E7',
              fontSize: '0.86rem',
              color: '#231A12',
            }}
          >
            <strong>Inner Core u = g(x):</strong> {config.innerLabel || '3x^2 + 1 gives du/dx = 6x'}
          </div>
        </div>
      </div>
    );
  }

  if (config.type === 'tangent_gradient') {
    const x0 = config.x0 ?? 2;
    const y0 = config.y0 ?? 4;
    const slope = config.slope ?? 4;
    return (
      <div
        style={{
          background: '#EDE3CE',
          border: '2px solid #6E4726',
          borderRadius: '6px',
          padding: '10px',
          marginTop: '10px',
        }}
        aria-label={config.altText || `Graph of curve with tangent line at x=${x0}`}
      >
        <svg viewBox="0 0 280 120" style={{ width: '100%', height: '115px' }}>
          <line x1="30" y1="100" x2="260" y2="100" stroke="#5C4938" strokeWidth="1.5" />
          <line x1="60" y1="10" x2="60" y2="110" stroke="#5C4938" strokeWidth="1.5" />
          <path d="M 40 92 Q 110 108 190 20" fill="none" stroke="#266B3E" strokeWidth="2.5" />
          <line x1="95" y1="98" x2="185" y2="22" stroke="#B83B2A" strokeWidth="2" strokeDasharray="4 2" />
          <circle cx="145" cy="56" r="5" fill="#231A12" />
          <text x="155" y="54" fill="#231A12" fontSize="11" fontWeight="bold">
            P({x0}, {y0})
          </text>
          <text x="155" y="70" fill="#5C4938" fontSize="10" fontWeight="bold">
            Tangent slope m = f&apos;({x0}) = {config.hideSlope ? '?' : slope}
          </text>
        </svg>
      </div>
    );
  }

  if (config.type === 'signed_area') {
    return (
      <div
        style={{
          background: '#EDE3CE',
          border: '2px solid #6E4726',
          borderRadius: '6px',
          padding: '10px',
          marginTop: '10px',
        }}
        aria-label={config.altText || 'Graph showing shaded area under the curve'}
      >
        <svg viewBox="0 0 280 120" style={{ width: '100%', height: '115px' }}>
          <line x1="25" y1="85" x2="260" y2="85" stroke="#5C4938" strokeWidth="1.5" />
          <line x1="45" y1="12" x2="45" y2="108" stroke="#5C4938" strokeWidth="1.5" />
          <polygon
            points="45,85 45,65 185,25 185,85"
            fill="rgba(38, 107, 62, 0.25)"
            stroke="#266B3E"
            strokeWidth="1.5"
          />
          <line x1="35" y1="68" x2="210" y2="18" stroke="#231A12" strokeWidth="2.5" />
          <text x="45" y="102" textAnchor="middle" fill="#231A12" fontSize="10" fontWeight="bold">
            x = {config.a ?? 0}
          </text>
          <text x="185" y="102" textAnchor="middle" fill="#231A12" fontSize="10" fontWeight="bold">
            x = {config.b ?? 3}
          </text>
          <text x="115" y="64" textAnchor="middle" fill="#194A2A" fontSize="11" fontWeight="bold">
            {config.regionLabel || 'Shaded Area'}
          </text>
        </svg>
      </div>
    );
  }

  return null;
}
