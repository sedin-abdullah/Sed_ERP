/**
 * Static directory content for the SedIoT informational sections (Industries,
 * Process Technologies, Services). These are catalog/reference pages — no
 * real-time backing needed — so the data lives client-side as typed
 * constants. Slugs are stable and used in data-testid attributes for
 * automation.
 */

export interface Industry {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  applications: string[];
  metric: { label: string; value: string };
}

export interface ProcessTech {
  slug: string;
  name: string;
  category: string;
  description: string;
  benefits: string[];
}

export interface ServiceOffering {
  slug: string;
  name: string;
  summary: string;
  includes: string[];
  /** Maps to a SedService request category (Phase 4/5 integration). */
  requestCategory: string;
}

export const INDUSTRIES: Industry[] = [
  {
    slug: 'grain-milling',
    name: 'Grain Milling',
    tagline: 'Flour, semolina & specialty milling',
    description:
      'End-to-end grain processing — from intake and cleaning to grinding, sifting and blending — monitored line-by-line for yield and quality.',
    applications: ['Wheat & rye flour', 'Durum semolina', 'Corn milling', 'Rice processing'],
    metric: { label: 'Typical yield gain', value: '+3.5%' },
  },
  {
    slug: 'coffee-cocoa',
    name: 'Coffee & Cocoa',
    tagline: 'Roasting, grinding & conching',
    description:
      'Precise thermal and mechanical control across roasting and grinding lines to protect aroma profiles and batch consistency.',
    applications: ['Batch & continuous roasting', 'Cocoa bean processing', 'Cold-brew extraction'],
    metric: { label: 'Roast repeatability', value: '99.2%' },
  },
  {
    slug: 'animal-feed',
    name: 'Animal Feed & Aqua',
    tagline: 'Pelleting & extrusion',
    description:
      'Extrusion and pelleting lines with tight moisture and temperature control for durable, nutrient-stable feed.',
    applications: ['Poultry & livestock feed', 'Aqua feed', 'Pet food'],
    metric: { label: 'Energy per tonne', value: '-8%' },
  },
  {
    slug: 'plastics-recycling',
    name: 'Plastics & Recycling',
    tagline: 'Sorting, washing & compounding',
    description:
      'Optical sorting and compounding lines that lift recyclate purity and throughput while cutting contamination rejects.',
    applications: ['PET flake sorting', 'Film & rigid recycling', 'Compounding'],
    metric: { label: 'Sort purity', value: '99.6%' },
  },
  {
    slug: 'advanced-materials',
    name: 'Advanced Materials',
    tagline: 'Battery, powder & thin-film',
    description:
      'High-precision powder handling, coating and drying processes for battery and specialty materials manufacturing.',
    applications: ['Battery electrode coating', 'Powder metallurgy', 'Optical coatings'],
    metric: { label: 'Coating uniformity', value: '±1.2%' },
  },
  {
    slug: 'consumer-foods',
    name: 'Consumer Foods',
    tagline: 'Snacks, pasta & confectionery',
    description:
      'Mixing, forming and drying lines tuned for texture and shelf-life across high-volume consumer food production.',
    applications: ['Pasta & noodles', 'Snack extrusion', 'Chocolate & confectionery'],
    metric: { label: 'Line uptime', value: '98.4%' },
  },
];

export const PROCESS_TECHS: ProcessTech[] = [
  {
    slug: 'grinding-dispersion',
    name: 'Grinding & Dispersion',
    category: 'Size reduction',
    description: 'Roller and impact milling with in-line particle-size feedback for consistent granulation.',
    benefits: ['Tighter particle distribution', 'Lower specific energy', 'Reduced rework'],
  },
  {
    slug: 'thermal-processing',
    name: 'Thermal Processing',
    category: 'Heat & dry',
    description: 'Roasting, drying and cooling with closed-loop temperature control and heat recovery.',
    benefits: ['Batch repeatability', 'Heat-recovery savings', 'Profile protection'],
  },
  {
    slug: 'extrusion',
    name: 'Extrusion',
    category: 'Forming',
    description: 'Single and twin-screw extrusion with torque, moisture and pressure monitoring.',
    benefits: ['Stable throughput', 'Texture control', 'Fast recipe changeover'],
  },
  {
    slug: 'optical-sorting',
    name: 'Optical Sorting',
    category: 'Separation',
    description: 'Camera and NIR sorting that removes defects and foreign material at line speed.',
    benefits: ['Higher purity', 'Fewer good-product rejects', 'Traceable reject data'],
  },
  {
    slug: 'automation-control',
    name: 'Automation & Control',
    category: 'Digital',
    description: 'PLC/SCADA integration feeding the SedIoT live stream and closed-loop setpoints.',
    benefits: ['Real-time visibility', 'Remote setpoints', 'Alarm management'],
  },
  {
    slug: 'condition-monitoring',
    name: 'Condition Monitoring',
    category: 'Digital',
    description: 'Vibration and temperature analytics that forecast wear before failure.',
    benefits: ['Predictive maintenance', 'Less unplanned downtime', 'Longer asset life'],
  },
];

export const SERVICE_OFFERINGS: ServiceOffering[] = [
  {
    slug: 'preventive-maintenance',
    name: 'Preventive Maintenance',
    summary: 'Scheduled inspections and part replacement to keep lines running at rated capacity.',
    includes: ['Scheduled site visits', 'Wear-part replacement', 'Calibration & alignment'],
    requestCategory: 'maintenance',
  },
  {
    slug: 'emergency-repair',
    name: 'Emergency Repair',
    summary: 'Rapid-response field technicians for unplanned stoppages and critical faults.',
    includes: ['24/7 dispatch', 'On-site diagnosis', 'Priority spare parts'],
    requestCategory: 'repair',
  },
  {
    slug: 'installation-commissioning',
    name: 'Installation & Commissioning',
    summary: 'Turnkey installation, integration into SedIoT, and performance sign-off.',
    includes: ['Mechanical install', 'IoT gateway setup', 'Acceptance testing'],
    requestCategory: 'installation',
  },
  {
    slug: 'training-optimization',
    name: 'Training & Optimization',
    summary: 'Operator training and process-tuning engagements to lift yield and efficiency.',
    includes: ['Operator workshops', 'Recipe optimization', 'Energy audit'],
    requestCategory: 'consulting',
  },
  {
    slug: 'remote-monitoring',
    name: 'Remote Monitoring',
    summary: 'Continuous remote surveillance of your plant stream with proactive alerting.',
    includes: ['24/7 stream monitoring', 'Alert triage', 'Monthly health report'],
    requestCategory: 'monitoring',
  },
  {
    slug: 'spare-parts',
    name: 'Genuine Spare Parts',
    summary: 'OEM-grade spare parts with guaranteed fit and traceability.',
    includes: ['Genuine parts catalog', 'Fast logistics', 'Fitment guarantee'],
    requestCategory: 'parts',
  },
];
