// ── CDC BMI-for-age LMS data (ages 2–20, 6-month intervals) ──
// Each entry: [ageMonths, L, M, S]
const LMS_BOYS = [
  [24,-2.37,16.86,0.0763],[30,-1.81,16.47,0.0762],[36,-1.39,16.17,0.0769],
  [42,-1.07,15.93,0.0780],[48,-0.82,15.75,0.0794],[54,-0.62,15.60,0.0810],
  [60,-0.46,15.49,0.0829],[66,-0.33,15.42,0.0849],[72,-0.22,15.39,0.0872],
  [78,-0.12,15.39,0.0896],[84,-0.04,15.43,0.0921],[90,0.03,15.50,0.0947],
  [96,0.09,15.61,0.0974],[102,0.13,15.75,0.1001],[108,0.17,15.92,0.1028],
  [114,0.19,16.12,0.1055],[120,0.21,16.36,0.1082],[126,0.22,16.62,0.1108],
  [132,0.22,16.92,0.1133],[138,0.22,17.24,0.1156],[144,0.21,17.58,0.1178],
  [150,0.20,17.94,0.1198],[156,0.19,18.32,0.1217],[162,0.17,18.70,0.1233],
  [168,0.15,19.09,0.1248],[174,0.13,19.48,0.1261],[180,0.11,19.86,0.1272],
  [186,0.09,20.24,0.1281],[192,0.07,20.60,0.1289],[198,0.05,20.95,0.1296],
  [204,0.03,21.28,0.1301],[210,0.01,21.59,0.1306],[216,-0.01,21.89,0.1309],
  [222,-0.03,22.17,0.1312],[228,-0.05,22.43,0.1314],[234,-0.07,22.67,0.1316],
  [240,-0.09,22.90,0.1317]
];
const LMS_GIRLS = [
  [24,-1.50,16.40,0.0810],[30,-0.97,16.05,0.0828],[36,-0.59,15.79,0.0849],
  [42,-0.30,15.59,0.0873],[48,-0.07,15.44,0.0899],[54,0.10,15.33,0.0927],
  [60,0.23,15.27,0.0957],[66,0.32,15.24,0.0988],[72,0.38,15.26,0.1020],
  [78,0.42,15.32,0.1052],[84,0.45,15.42,0.1085],[90,0.46,15.55,0.1118],
  [96,0.46,15.71,0.1150],[102,0.46,15.91,0.1181],[108,0.44,16.14,0.1211],
  [114,0.42,16.40,0.1239],[120,0.40,16.69,0.1266],[126,0.37,17.01,0.1291],
  [132,0.34,17.36,0.1314],[138,0.30,17.73,0.1335],[144,0.26,18.12,0.1354],
  [150,0.22,18.52,0.1370],[156,0.18,18.92,0.1384],[162,0.14,19.30,0.1396],
  [168,0.10,19.66,0.1406],[174,0.07,20.00,0.1414],[180,0.03,20.30,0.1420],
  [186,0.00,20.57,0.1425],[192,-0.03,20.81,0.1429],[198,-0.06,21.02,0.1432],
  [204,-0.08,21.20,0.1434],[210,-0.11,21.36,0.1436],[216,-0.13,21.50,0.1437],
  [222,-0.15,21.62,0.1438],[228,-0.17,21.73,0.1439],[234,-0.19,21.82,0.1439],
  [240,-0.21,21.90,0.1440]
];

// Standard normal CDF (Abramowitz & Stegun)
function normalCDF(z) {
  if (z < -6) return 0;
  if (z > 6) return 1;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

// Inverse normal CDF (rational approximation)
function invNormalCDF(p) {
  if (p <= 0) return -6;
  if (p >= 1) return 6;
  if (p < 0.5) return -invNormalCDF(1 - p);
  const t = Math.sqrt(-2 * Math.log(1 - p));
  const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
  const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
  return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
}

// Interpolate LMS values for a given age
function getLMS(ageMonths, sex) {
  const data = sex === 'male' ? LMS_BOYS : LMS_GIRLS;
  const clamped = Math.max(24, Math.min(240, ageMonths));
  let i = 0;
  while (i < data.length - 1 && data[i + 1][0] <= clamped) i++;
  if (i >= data.length - 1) return { L: data[data.length - 1][1], M: data[data.length - 1][2], S: data[data.length - 1][3] };
  const [a0, L0, M0, S0] = data[i];
  const [a1, L1, M1, S1] = data[i + 1];
  const frac = (clamped - a0) / (a1 - a0);
  return { L: L0 + frac * (L1 - L0), M: M0 + frac * (M1 - M0), S: S0 + frac * (S1 - S0) };
}

// BMI percentile for a child
function calcPercentile(bmi, ageMonths, sex) {
  const { L, M, S } = getLMS(ageMonths, sex);
  const z = Math.abs(L) > 0.001 ? (Math.pow(bmi / M, L) - 1) / (L * S) : Math.log(bmi / M) / S;
  return normalCDF(z) * 100;
}

// BMI at a given percentile for a child
function bmiAtPercentile(pct, ageMonths, sex) {
  const { L, M, S } = getLMS(ageMonths, sex);
  const z = invNormalCDF(pct / 100);
  return Math.abs(L) > 0.001 ? M * Math.pow(1 + L * S * z, 1 / L) : M * Math.exp(S * z);
}

// Child BMI category based on percentile (CDC cut-points)
function getChildCategory(pct) {
  if (pct < 5)  return { label: 'Underweight', color: '#60a5fa' };
  if (pct < 85) return { label: 'Healthy Weight', color: '#059669' };
  if (pct < 95) return { label: 'Overweight', color: '#d97706' };
  return { label: 'Obese', color: '#dc2626' };
}

// Ordinal suffix helper
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── Bar chart marker (adult) ──
function updateChartMarker(bmi) {
  const clipped = Math.min(Math.max(bmi, 10), 45);
  const y = 8 + (45 - clipped) / 35 * 234;
  const marker = document.getElementById('chart-marker');
  marker.style.transform = `translateY(${y.toFixed(1)}px)`;
  marker.style.opacity   = '1';
  document.getElementById('m-bmi').textContent = 'BMI ' + bmi.toFixed(1);
}

// ── Bar chart marker (child percentile) ──
function updateChildChartMarker(percentile) {
  const clipped = Math.min(Math.max(percentile, 0), 100);
  const y = 8 + (100 - clipped) / 100 * 234;
  const marker = document.getElementById('chart-marker-child');
  marker.style.transform = `translateY(${y.toFixed(1)}px)`;
  marker.style.opacity   = '1';
  const pctRound = Math.max(1, Math.min(99, Math.round(percentile)));
  document.getElementById('m-pct').textContent = percentile < 1 ? '<1st' : percentile > 99 ? '>99th' : ordinal(pctRound);
}

// ── State ──
let unit   = 'imperial';
let gender = 'male';

function setUnit(u) {
  unit = u;
  document.getElementById('btn-imperial').classList.toggle('active', u === 'imperial');
  document.getElementById('btn-metric').classList.toggle('active', u === 'metric');
  document.getElementById('height-imperial').style.display = u === 'imperial' ? 'flex' : 'none';
  document.getElementById('inp-cm').classList.toggle('hidden', u !== 'metric');
  document.getElementById('lbl-weight').textContent = u === 'imperial' ? 'Weight (lbs)' : 'Weight (kg)';
  document.getElementById('inp-weight').placeholder = u === 'imperial' ? 'e.g. 154' : 'e.g. 70';
}

function setGender(g) {
  gender = g;
  document.getElementById('btn-male').classList.toggle('active', g === 'male');
  document.getElementById('btn-female').classList.toggle('active', g === 'female');
}

// ── BMI category helper ──
function getCategory(bmi) {
  if (bmi < 16)   return { label: 'Severe Thinness',   color: '#1d4ed8' };
  if (bmi < 17)   return { label: 'Moderate Thinness', color: '#3b82f6' };
  if (bmi < 18.5) return { label: 'Mild Thinness',     color: '#60a5fa' };
  if (bmi < 25)   return { label: 'Normal Weight',     color: '#059669' };
  if (bmi < 30)   return { label: 'Overweight',        color: '#d97706' };
  if (bmi < 35)   return { label: 'Obese Class I',     color: '#ea580c' };
  if (bmi < 40)   return { label: 'Obese Class II',    color: '#dc2626' };
  return            { label: 'Obese Class III',         color: '#991b1b' };
}

// ── Calculate ──
function calculate() {
  const ageVal = parseFloat(document.getElementById('inp-age').value);
  let heightM, weightKg;

  if (unit === 'imperial') {
    const ft  = parseFloat(document.getElementById('inp-ft').value)     || 0;
    const ins = parseFloat(document.getElementById('inp-in').value)     || 0;
    const totalIn = ft * 12 + ins;
    if (totalIn <= 0) { shake('inp-ft'); return; }
    heightM = totalIn * 0.0254;
    const wLbs = parseFloat(document.getElementById('inp-weight').value);
    if (!wLbs || wLbs <= 0) { shake('inp-weight'); return; }
    weightKg = wLbs * 0.453592;
  } else {
    const cm = parseFloat(document.getElementById('inp-cm').value);
    if (!cm || cm <= 0) { shake('inp-cm'); return; }
    heightM = cm / 100;
    const wKg = parseFloat(document.getElementById('inp-weight').value);
    if (!wKg || wKg <= 0) { shake('inp-weight'); return; }
    weightKg = wKg;
  }

  const bmi = weightKg / (heightM * heightM);
  const bmiPrime = bmi / 25;
  const pi = weightKg / (heightM ** 3);
  const isChild = ageVal >= 2 && ageVal < 20;

  let cat, rangeStr;
  const ib = document.getElementById('insight-box');
  let insightMsg = '', insightBg = '', insightColor = '';

  if (isChild) {
    // ── Child: use CDC percentile-based categories ──
    const ageMonths = Math.round(ageVal * 12);
    const percentile = calcPercentile(bmi, ageMonths, gender);
    cat = getChildCategory(percentile);

    // Healthy weight range from 5th–85th percentile BMI
    const bmiLow  = bmiAtPercentile(5, ageMonths, gender);
    const bmiHigh = bmiAtPercentile(85, ageMonths, gender);
    const minKg = bmiLow * heightM * heightM;
    const maxKg = bmiHigh * heightM * heightM;
    if (unit === 'imperial') {
      rangeStr = `${(minKg / 0.453592).toFixed(1)} – ${(maxKg / 0.453592).toFixed(1)} lbs`;
    } else {
      rangeStr = `${minKg.toFixed(1)} – ${maxKg.toFixed(1)} kg`;
    }

    // Show percentile
    const pctRound = Math.max(1, Math.min(99, Math.round(percentile)));
    let pctDisplay;
    if (percentile < 1) pctDisplay = '<1st';
    else if (percentile > 99) pctDisplay = '>99th';
    else pctDisplay = ordinal(pctRound);
    document.getElementById('metric-pct').classList.remove('hidden');
    document.getElementById('r-pct').textContent = pctDisplay;

    // Toggle to child chart
    document.getElementById('chart-svg').classList.add('hidden');
    document.getElementById('chart-svg-child').classList.remove('hidden');
    document.getElementById('legend-adult').classList.add('hidden');
    document.getElementById('legend-child').classList.remove('hidden');
    document.getElementById('chart-label').textContent = 'Percentile Chart';
    updateChildChartMarker(percentile);

    // Insight
    if (percentile < 5) {
      insightMsg = `At the ${pctDisplay} percentile, this child is classified as underweight for their age and sex. Consider discussing healthy weight gain with a doctor.`;
      insightBg = '#eff6ff'; insightColor = '#1e40af';
    } else if (percentile < 85) {
      insightMsg = `At the ${pctDisplay} percentile, this child is at a healthy weight for their age and sex. Encourage a balanced diet and regular physical activity.`;
      insightBg = '#f0fdf4'; insightColor = '#166534';
    } else if (percentile < 95) {
      insightMsg = `At the ${pctDisplay} percentile, this child is classified as overweight for their age and sex. Consider discussing healthy habits with a doctor.`;
      insightBg = '#fff7ed'; insightColor = '#9a3412';
    } else {
      insightMsg = `At the ${pctDisplay} percentile, this child is classified as obese for their age and sex. It is recommended to consult a doctor for guidance.`;
      insightBg = '#fff7ed'; insightColor = '#9a3412';
    }
  } else {
    // ── Adult: use fixed BMI categories ──
    cat = getCategory(bmi);
    const minKg = 18.5 * heightM * heightM;
    const maxKg = 24.9 * heightM * heightM;
    if (unit === 'imperial') {
      rangeStr = `${(minKg / 0.453592).toFixed(1)} – ${(maxKg / 0.453592).toFixed(1)} lbs`;
    } else {
      rangeStr = `${minKg.toFixed(1)} – ${maxKg.toFixed(1)} kg`;
    }
    document.getElementById('metric-pct').classList.add('hidden');

    // Toggle to adult chart
    document.getElementById('chart-svg').classList.remove('hidden');
    document.getElementById('chart-svg-child').classList.add('hidden');
    document.getElementById('legend-adult').classList.remove('hidden');
    document.getElementById('legend-child').classList.add('hidden');
    document.getElementById('chart-label').textContent = 'BMI Chart';

    // Insight
    if (bmi < 18.5) {
      const diffKg = (18.5 * heightM * heightM) - weightKg;
      const diffLbs = diffKg / 0.453592;
      const amount = unit === 'imperial' ? `${diffLbs.toFixed(1)} lbs` : `${diffKg.toFixed(1)} kg`;
      insightMsg = `You are ${amount} below the healthy weight range. Consider speaking to your GP about healthy weight gain.`;
      insightBg = '#eff6ff'; insightColor = '#1e40af';
    } else if (bmi < 25) {
      insightMsg = 'Great news — your BMI is within the healthy range. Maintain a balanced diet and regular physical activity.';
      insightBg = '#f0fdf4'; insightColor = '#166534';
    } else {
      const diffKg = weightKg - (24.9 * heightM * heightM);
      const diffLbs = diffKg / 0.453592;
      const amount = unit === 'imperial' ? `${diffLbs.toFixed(1)} lbs` : `${diffKg.toFixed(1)} kg`;
      insightMsg = `You are ${amount} above the healthy weight range. Even small reductions in weight can significantly improve health outcomes.`;
      insightBg = '#fff7ed'; insightColor = '#9a3412';
    }
  }

  // Update metrics
  document.getElementById('r-bmi').textContent     = bmi.toFixed(1);
  document.getElementById('r-cat').textContent     = cat.label;
  document.getElementById('r-cat').style.color     = cat.color;
  document.getElementById('r-range').textContent   = rangeStr;
  document.getElementById('r-prime').textContent   = bmiPrime.toFixed(2);
  document.getElementById('r-ponderal').textContent = pi.toFixed(2) + ' kg/m³';
  ib.textContent = insightMsg;
  ib.style.cssText = `background:${insightBg}; color:${insightColor}; border-radius:10px; border-left:3px solid ${insightColor}; padding:.8rem 1rem; margin-top:.9rem; font-size:.82rem; line-height:1.6; display:block;`;

  // Chart marker (adult only — child marker updated in branch above)
  if (!isChild) updateChartMarker(bmi);

  // Show results
  const wrap = document.getElementById('results-wrap');
  wrap.classList.remove('hidden');
  document.getElementById('nhs-note').style.display = 'block';

  // Smooth scroll
  setTimeout(() => wrap.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}


// ── Accordion ──
function toggleAcc(head) {
  head.parentElement.classList.toggle('open');
}

// ── Input shake on error ──
function shake(id) {
  const el = document.getElementById(id);
  el.style.borderColor = '#ef4444';
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shakeX .3s ease';
  setTimeout(() => { el.style.borderColor = ''; el.style.animation = ''; }, 600);
}

// Allow Enter key to calculate
document.addEventListener('keydown', e => { if (e.key === 'Enter') calculate(); });
