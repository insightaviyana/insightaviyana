import { 
  User, 
  Milestone, 
  FactCheckItem, 
  CSRImpact, 
  VoiceCut, 
  SERPItem, 
  ContentPipelineItem, 
  NotificationItem, 
  ReviewItem 
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-chairman',
    name: 'Dr. Thisara Hewawasam',
    role: 'IT_LEAD',
    accountType: 'staff',
    title: 'Chairman & Founder',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    email: 'chairman@aviyana.lk',
    password: 'aviyana2027',
    responsibilities: [
      'Overarching strategic vision for Sri Lanka\'s premier Ceylon resort',
      'Ensuring total environmental sustainability and high-tier luxury standards',
      'Diplomatic relationships, community development & international partnerships'
    ]
  },
  {
    id: 'usr-se',
    name: 'Ishan Ekanayake',
    role: 'IT_LEAD',
    accountType: 'staff',
    title: 'SE (Technical Lead & Web Architect)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    email: 'ishan.se@aviyana.lk',
    password: 'aviyana2027',
    responsibilities: [
      'Set up & maintain insight.aviyana.lk source of truth hub',
      'Technical SEO & JSON-LD Schema (AboutUs, FAQPage, NewsArticle)',
      'Review & approve story drafts in under 10 minutes',
      'Maintain site speed, mobile optimization & Search Console indexing',
      'Configure automated review & mention monitoring alerts'
    ]
  },
  {
    id: 'usr-coord',
    name: 'Sandaruwan Ekanayake',
    role: 'GUEST_COORDINATOR',
    accountType: 'staff',
    title: 'Operational & Guest Coordinator Lead',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    email: 'sandaruwan.coord@aviyana.lk',
    password: 'aviyana2027',
    responsibilities: [
      'Coordinate with VIPs, partners, early soft-launch guests, and vendors',
      'Lead soft launch guest feedback gathering and 5-star review collection',
      'Supervise operational alignment across resort departments'
    ]
  },
  {
    id: 'usr-media1',
    name: 'Nimesh & Sahan',
    role: 'STORY_HUNTER',
    accountType: 'staff',
    title: 'Story Hunters & Visual Media Crew',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    email: 'nimesh.sahan@aviyana.lk',
    password: 'aviyana2027',
    responsibilities: [
      'Capture 4K site progress photos, suite details, infinity pool visuals',
      'Record short audio/video clips of staff training and CSR initiatives',
      'Upload raw assets and descriptions for SE Lead approval'
    ]
  },
  {
    id: 'usr-media2',
    name: 'Samitha & Dilshan',
    role: 'STORY_HUNTER',
    accountType: 'staff',
    title: 'Video & Content Production Team',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    email: 'samitha.dilshan@aviyana.lk',
    password: 'aviyana2027',
    responsibilities: [
      'Drone cinematography, Villa interior teasers, and guest experience reels',
      'Editing footage for CapCut/InShot social distribution',
      'Submitting media drafts to SE publishing pipeline'
    ]
  },
  {
    id: 'usr-social',
    name: 'Hashini & Sadali',
    role: 'SOCIAL_MANAGER',
    accountType: 'staff',
    title: 'Social Media & Community Engagement',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    email: 'hashini.sadali@aviyana.lk',
    password: 'aviyana2027',
    responsibilities: [
      'Design graphics & quote posts using Canva Pro luxury templates',
      'Monitor Google My Business and Social Media comment sections',
      'Draft polite luxury responses using Gemini AI PR templates'
    ]
  },
  {
    id: 'usr-pr',
    name: 'Heshan',
    role: 'SOCIAL_MANAGER',
    accountType: 'staff',
    title: 'PR & Communications Specialist',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    email: 'heshan.pr@aviyana.lk',
    password: 'aviyana2027',
    responsibilities: [
      'Press release syndication to LinkedIn, Medium, and official media outlets',
      'Liaise with SE IT Lead for factual documentation verification',
      'Manage official media inquiries regarding August 2027 launch'
    ]
  }
];

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'ms-1',
    title: 'Official Central Environmental Authority (CEA) Approval & 100% Eco Clearance',
    category: 'Clearance',
    date: '2025-01-15',
    status: 'Verified',
    description: 'Comprehensive Environmental Impact Assessment (EIA) passed with 100% compliance certificate #CEA/7S/LK-2025.',
    documentUrl: '#certificate-cea',
    documentName: 'CEA_EIA_Environmental_Clearance_2025.pdf',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    verifiedBy: 'CEA Sri Lanka / SE Lead'
  },
  {
    id: 'ms-2',
    title: 'Ceylon Presidential Suites & Cliffside Infinity Pool Structural Topping Off',
    category: 'Construction',
    date: '2025-04-20',
    status: 'Verified',
    description: 'Structural topping off for all 24 luxury villa suites and the 120-meter cliffside infinity pool overlooking mountain ranges.',
    imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&auto=format&fit=crop&q=80',
    verifiedBy: 'Chief Resident Engineer'
  },
  {
    id: 'ms-3',
    title: 'Unveiling of Aviyana Bespoke Luxury Rolls-Royce & BMW 7 Series Chauffeur Fleet',
    category: 'Hospitality',
    date: '2025-11-10',
    status: 'Verified',
    description: 'Official press unveiling of our custom-ordered Rolls-Royce Phantom VIII and luxury BMW 7 Series airport transfer fleet for VIP guest arrivals.',
    imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80',
    verifiedBy: 'Fleet Logistics Directorate'
  },
  {
    id: 'ms-4',
    title: 'Clean Water Infrastructure & Community Development for Surrounding Villages',
    category: 'CSR',
    date: '2025-06-10',
    status: 'Verified',
    description: 'Installation of high-capacity water filtration and pipeline network delivering clean drinking water to 450 local households.',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=600&auto=format&fit=crop&q=80',
    verifiedBy: 'Village Community Council'
  },
  {
    id: 'ms-5',
    title: 'Hotel School Graduate Hospitality Training & Soft Launch VIP Trials',
    category: 'Hospitality',
    date: '2026-05-15',
    status: 'In Progress',
    description: 'Welcoming early soft-launch guests, international travel partners, and influencers with 120 trained Sri Lankan hospitality graduates.',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
    verifiedBy: 'Guest Coordinator Lead'
  },
  {
    id: 'ms-6',
    title: 'Official Strategic Grand Opening & Helipad Arrival Gala (August Launch)',
    category: 'Hospitality',
    date: '2026-08-01',
    status: 'Upcoming',
    description: 'The grand unveiling of Sri Lanka’s premier Ceylon luxury resort experience featuring private helicopter arrivals and gala events.',
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
    verifiedBy: 'Aviyana Board of Directors'
  }
];

export const INITIAL_FACT_CHECKS: FactCheckItem[] = [
  {
    id: 'fc-1',
    rumor: 'Rumor: Aviyana Resort construction lacks proper environmental clearance and harms local forest reserves.',
    fact: 'Fact: Aviyana obtained full Environmental Impact Assessment (EIA) approval from the Central Environmental Authority (CEA) in 2025 with zero forest encroachment.',
    officialSource: 'Central Environmental Authority (Approval Ref #CEA/7S/LK-2025)',
    documentProof: 'CEA_EIA_Environmental_Clearance_2025.pdf',
    category: 'Environment',
    verifiedDate: 'Jan 2025',
    status: 'Verified Fact',
    approvalStatus: 'Published'
  },
  {
    id: 'fc-2',
    rumor: 'Rumor: The resort is blocking water access for neighboring agricultural land and local villagers.',
    fact: 'Fact: Aviyana constructed a dedicated $150,000 independent rainwater harvesting system and built fresh pipeline mains providing free clean water to 450 village homes.',
    officialSource: 'Water Supply & Drainage Board & Local Pradeshiya Sabha Report',
    documentProof: 'Community_Water_Project_Completion_Report.pdf',
    category: 'Community',
    verifiedDate: 'June 2025',
    status: 'Verified Fact',
    approvalStatus: 'Published'
  },
  {
    id: 'fc-3',
    rumor: 'Rumor: Foreign workers are replacing local staff and hotel graduates.',
    fact: 'Fact: Over 85% of our staff workforce consists of local Sri Lankan talent, including 120 Hotel School graduates undergoing Ceylon service training with competitive pay.',
    officialSource: 'Aviyana HR & Hotel School Partnership Directorate',
    documentProof: 'Aviyana_Local_Employment_Charter.pdf',
    category: 'Land & Permits',
    verifiedDate: 'Sep 2025',
    status: 'Verified Fact',
    approvalStatus: 'Published'
  },
  {
    id: 'fc-4',
    rumor: 'Rumor: Launch is indefinitely delayed due to structural inspection failures.',
    fact: 'Fact: Structural integrity was certified 100% sound by the National Engineering Research Centre. Target launch remains firmly set for August 2027.',
    officialSource: 'Chief Resident Engineer Certification',
    documentProof: 'Structural_Integrity_Certificate_2025.pdf',
    category: 'Construction',
    verifiedDate: 'March 2026',
    status: 'Verified Fact',
    approvalStatus: 'Published'
  }
];

export const INITIAL_CSR_IMPACT: CSRImpact[] = [
  {
    id: 'csr-1',
    title: 'Bespoke Rolls-Royce Phantom VIII Chauffeur Fleet',
    metricValue: '5 Star Fleet',
    metricLabel: 'Custom Luxury Cars',
    description: 'Bespoke extended wheelbase Rolls-Royce cars for seamless airport transfers and high-security VIP guest escorts.',
    location: 'Bandaranaike Int. Airport to Aviyana Estate',
    iconName: 'building',
    imageUrl: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'csr-2',
    title: 'Private Helipad & Airbus Helicopter Transfers',
    metricValue: '20 Mins',
    metricLabel: 'Colombo Air Transfer',
    description: 'On-site twin-engine private helipad allowing direct 20-minute scenic air transfers from Colombo international airport.',
    location: 'Aviyana Mountain Helipad',
    iconName: 'droplet',
    imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'csr-3',
    title: 'BMW 7 Series Security & VIP Arrival Escorts',
    metricValue: '100% VIP',
    metricLabel: 'Armored & Chauffeur Driven',
    description: 'Luxury BMW executive sedan fleet managed by elite trained security drivers ensuring royal guest arrival experiences.',
    location: 'Mountain Corridor Estate Route',
    iconName: 'users',
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_VOICE_CUTS: VoiceCut[] = [
  {
    id: 'vc-1',
    speakerName: 'Dr. Thisara Hewawasam',
    speakerRole: 'Chairman & Founder',
    title: 'Unveiling Sri Lanka’s Premier Ceylon Destination & Luxury Fleet',
    duration: '2:15',
    videoThumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    quote: 'Unwavering Excellence, Total Transparency & Authentic Hospitality — Elevating Sri Lanka’s Ceylon Benchmark to the World.',
    date: '2026-02-10'
  },
  {
    id: 'vc-2',
    speakerName: 'Heshan',
    speakerRole: 'PR & Media Communications Specialist',
    title: 'Press Briefing: Luxury Fleet Inspection & August Grand Opening',
    duration: '2:40',
    videoThumbnail: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
    quote: 'Our custom Rolls-Royce fleet and private helipad logistics establish a world-class luxury arrival standard previously unseen in South Asia.',
    date: '2026-03-18'
  },
  {
    id: 'vc-3',
    speakerName: 'Ishan Ekanayake',
    speakerRole: 'SE (Technical Lead & Web Architect)',
    title: 'Factual Transparency & Digital Hub Publishing (insight.aviyana.lk)',
    duration: '1:45',
    videoThumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    quote: 'Through insight.aviyana.lk, every milestone, news update, environmental clearance, and car fleet audit is published instantly with document proof.',
    date: '2026-03-04'
  }
];

export const INITIAL_SERP_ITEMS: SERPItem[] = [
  {
    id: 'serp-1',
    query: 'Aviyana Ceylon Hotel Sri Lanka updates',
    rank: 1,
    title: 'Official Journey & Verified Transparency Hub | insight.aviyana.lk',
    url: 'https://insight.aviyana.lk',
    domain: 'insight.aviyana.lk',
    type: 'Official Subdomain',
    status: 'Dominant',
    sentiment: 'Positive'
  },
  {
    id: 'serp-2',
    query: 'Aviyana Ceylon Hotel Sri Lanka updates',
    rank: 2,
    title: 'Aviyana Resort Sri Lanka Official Press & Milestone Tracker - Medium',
    url: 'https://medium.com/@aviyanaresort/official-updates-2026',
    domain: 'medium.com',
    type: 'High Authority Asset',
    status: 'Dominant',
    sentiment: 'Positive'
  },
  {
    id: 'serp-3',
    query: 'Aviyana Ceylon Hotel Sri Lanka updates',
    rank: 3,
    title: 'Aviyana Ceylon Resort Environmental Clearances & CSR Report - LinkedIn',
    url: 'https://linkedin.com/company/aviyana-resort',
    domain: 'linkedin.com',
    type: 'High Authority Asset',
    status: 'Dominant',
    sentiment: 'Positive'
  },
  {
    id: 'serp-4',
    query: 'Aviyana Resort Sri Lanka reviews',
    rank: 4,
    title: 'Inside Aviyana Ceylon Soft Opening & Guest Experience - YouTube',
    url: 'https://youtube.com/watch?v=aviyana-preview',
    domain: 'youtube.com',
    type: 'High Authority Asset',
    status: 'Dominant',
    sentiment: 'Positive'
  },
  {
    id: 'serp-5',
    query: 'Aviyana Resort Sri Lanka reviews',
    rank: 14,
    title: '[Suppressed Thread] Unverified Forum Discussion on Aviyana Resort - Reddit',
    url: 'https://reddit.com/r/srilanka/comments/fake_rumor_thread',
    domain: 'reddit.com',
    type: 'Forum/Reddit',
    status: 'Pushed Down',
    sentiment: 'Negative'
  }
];

export const INITIAL_CONTENT_PIPELINE: ContentPipelineItem[] = [
  {
    id: 'cp-1',
    title: '4K Architectural Footage of Infinity Pool & Mountain View',
    capturedBy: 'Nimesha (Media Crew)',
    role: 'STORY_HUNTER',
    date: '2026-07-27 10:15 AM',
    status: 'Pending SE Approval',
    platform: ['Facebook', 'Instagram', 'YouTube'],
    mediaPreviewUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&auto=format&fit=crop&q=80',
    notes: 'Captured morning sunlight on infinity pool. Added caption explaining eco-friendly pool filtration system.',
    publishTimeMinutes: 6
  },
  {
    id: 'cp-2',
    title: 'Interview Clip with Head of Hotel School Training Program',
    capturedBy: 'Dilshan (Media Crew)',
    role: 'STORY_HUNTER',
    date: '2026-07-27 11:30 AM',
    status: 'Pending SE Approval',
    platform: ['LinkedIn', 'Facebook', 'WhatsApp'],
    mediaPreviewUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80',
    notes: 'Short 45s reel featuring trainees expressing enthusiasm for Ceylon international hospitality standards.',
    publishTimeMinutes: 4
  },
  {
    id: 'cp-3',
    title: 'Community Water Filtration System Annual Maintenance Post',
    capturedBy: 'Kavinda (SE Lead)',
    role: 'IT_LEAD',
    date: '2026-07-26 04:00 PM',
    status: 'Published',
    platform: ['Facebook', 'Instagram', 'LinkedIn', 'YouTube', 'WhatsApp'],
    mediaPreviewUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=600&auto=format&fit=crop&q=80',
    notes: 'Published to insight.aviyana.lk and syndicated across social channels in 7 minutes.',
    publishTimeMinutes: 7
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
// Demo notifications were removed -- this list now only ever contains
// real, freshly-generated notifications from actual actions taken in the
// app (new inquiries, approvals, DB errors, etc). See pushNotification() in App.tsx.

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'Alexander & Elena V. (Dubai, UAE)',
    platform: 'Google My Business',
    rating: 5,
    date: '2026-07-25',
    comment: 'An extraordinary preview experience! The presidential villa views, butler service, and environmental harmony are unmatched in South Asia.',
    status: 'Published',
    response: 'Thank you for your generous praise, Alexander. At Aviyana, we are dedicated to setting new benchmarks for luxury and authentic Sri Lankan warmth. We look forward to welcoming you back for our August Grand Opening.',
    isSoftLaunchGuest: true
  },
  {
    id: 'rev-2',
    author: 'Diluksha Jayasekara',
    platform: 'Google My Business',
    rating: 5,
    date: '2026-07-26',
    comment: 'Proud to see a Ceylon resort of this caliber in Sri Lanka giving real job opportunities to local hotel graduates.',
    status: 'Published',
    response: 'Thank you, Diluksha! Empowering local talent is at the core of our philosophy. Learn more about our community initiatives at insight.aviyana.lk.',
    isSoftLaunchGuest: false
  },
  {
    id: 'rev-3',
    author: 'TravelEnthusiast_99',
    platform: 'TripAdvisor',
    rating: 4,
    date: '2026-07-27',
    comment: 'Was curious about rumors online, but visiting the site hub insight.aviyana.lk answered all my questions regarding permits and sustainability. Eager for launch!',
    status: 'Pending Response',
    isSoftLaunchGuest: false
  }
];

export const INITIAL_ARTICLES: any[] = [
  {
    id: 'art-1',
    title: 'Aviyana Ceylon Resort Confirms Strategic Grand Opening for August 2026',
    subtitle: 'Full 100% CEA Environmental Compliance, Presidential Suites Topping Off, and International Butler Training Benchmark',
    category: 'Grand Opening',
    author: 'Ishan Ekanayake',
    authorRole: 'SE (Technical Lead & Web Architect)',
    date: '2026-08-01',
    content: `Sri Lanka’s luxury hospitality landscape reaches a historic landmark as Aviyana Ceylon Resort confirms its grand opening for August 2026. Nestled in a pristine mountain estate with zero forest encroachment, the resort combines world-class architecture with total environmental harmony.

### Key Highlights & Verified Benchmarks
- **100% CEA Approval**: Full Environmental Impact Assessment (EIA) certification issued by Sri Lanka Central Environmental Authority.
- ** presidential Villa Suites**: Featuring private heated infinity pools, 24/7 royal butler service, and panoramic mountain views.
- **Community First**: Independent $150,000 rainwater harvesting plant supplying clean drinking water to 450 local households.
- **85%+ Local Workforce**: Over 120 Hotel School graduates undergoing international Ceylon luxury hospitality training.

Every update, document proof, and media asset is maintained transparently at our official source of truth hub: **insight.aviyana.lk**.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80',
    mediaType: 'video',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoCaption: 'Official 4K Drone Teaser: Presidential Suites & Infinity Pool Structure Overview',
    status: 'Published',
    viewsCount: 1420,
    featured: true,
    tags: ['Grand Opening', 'Ceylon Luxury', 'Sri Lanka Hospitality', 'August 2026']
  },
  {
    id: 'art-2',
    title: 'Comprehensive Central Environmental Authority (CEA) Compliance Report Released',
    subtitle: 'Transparent Publication of Official Environmental Clearances & Native Reforestation Buffer Drive',
    category: 'Sustainability & CEA',
    author: 'Heshan',
    authorRole: 'PR & Communications Specialist',
    date: '2026-07-28',
    content: `In line with Aviyana's unwavering commitment to total transparency, the complete Central Environmental Authority EIA compliance dossier has been made available for public review on insight.aviyana.lk.

### Environmental Stewardship Charter
1. **Zero Forest Encroachment**: Building footprint strictly mapped to pre-cleared plantation land.
2. **Eco-Kinetic Energy Integration**: Solar array providing 40% of baseline resort power requirements.
3. **10,000 Endemic Trees**: Active reforestation belt buffering the resort perimeter to protect native fauna.

"We do not spread noise or mud; we build enduring excellence with total transparency," remarked Chairman Dr. Thisara Hewawasam.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000&auto=format&fit=crop&q=80',
    mediaType: 'image',
    status: 'Published',
    viewsCount: 980,
    featured: true,
    tags: ['CEA Approval', 'Sustainability', 'Environment', 'Clean Water']
  },
  {
    id: 'art-3',
    title: 'Aviyana Ceylon Hospitality Academy Welcomes 120 Hotel School Graduates',
    subtitle: 'Empowering Local Youth with World-Class Butler Certification and High-Tier Compensation',
    category: 'Hotel School',
    author: 'Sandaruwan Ekanayake',
    authorRole: 'Operational & Guest Coordinator Lead',
    date: '2026-07-20',
    content: `The Aviyana Hospitality Academy has officially launched its flagship 6-month intensive training module for Sri Lankan hotel school graduates. Designed by international luxury hospitality veterans, the curriculum covers fine dining service, wine sommelier training, multi-lingual concierge communication, and eco-stewardship.

Trainees receive full stipends during the training period with guaranteed placement upon completion.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&auto=format&fit=crop&q=80',
    mediaType: 'video',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    videoCaption: 'Trainees at the Aviyana Hospitality Academy Practice Ceylon Butler Protocol',
    status: 'Published',
    viewsCount: 760,
    featured: false,
    tags: ['Hotel School', 'Hospitality Academy', 'Local Employment', 'Education']
  },
  {
    id: 'art-4',
    title: 'Investor Briefing Q3 2026: Financial Valuation & Equity Expansion Milestones',
    subtitle: 'Transparent Investment Highlights, ROI Projections & Villa Ownership Opportunities for Global Investors',
    category: 'Investor Update',
    author: 'Dr. Thisara Hewawasam',
    authorRole: 'Chairman & Founding Investor',
    date: '2026-08-02',
    content: `Aviyana Ceylon Resort presents its Q3 2026 Investor Progress Report. As construction reaches 88% completion with 100% CEA clearance secured, investor equity returns and private villa ownership yields are positioned for extraordinary performance.

### Highlights for Institutional & Private Investors:
- **Strong Capital Growth**: Land valuation in the pristine mountain corridor appreciated by 32% year-on-year.
- **Guaranteed Rental Yield**: Private Presidential Villa owners enjoy projected 14% annual USD ROI under managed Ceylon resort operations.
- **Audited Financial Transparency**: Fully verified compliance records and independent auditor reports available at insight.aviyana.lk.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
    mediaType: 'image',
    status: 'Published',
    viewsCount: 1120,
    featured: true,
    tags: ['Investor Update', 'ROI', 'Villa Ownership', 'Financial Growth']
  },
  {
    id: 'art-5',
    title: 'Career & Talent Recruitment Drive: 150+ Openings for August 2026 Opening',
    subtitle: 'Immediate Positions Open for Executive Chefs, Concierge Officers, Eco-Guides, and Housekeeping Leads',
    category: 'Career & Hiring',
    author: 'Sandaruwan Ekanayake',
    authorRole: 'Operational & Guest Coordinator Lead',
    date: '2026-08-03',
    content: `Aviyana Ceylon Resort is hiring! We invite passionate hospitality professionals, local talent, and hotel school graduates to join Sri Lanka's most prestigious luxury retreat team.

### Open Positions:
1. **Executive & Sous Chefs**: Fine Dining, Organic Sri Lankan Fusion, and Pastry.
2. **Ceylon Butler & Concierge Staff**: Multi-lingual hospitality professionals.
3. **Eco-Tour Guides & Botanists**: Native flora and wildlife specialists for CEA reserve trails.
4. **Maintenance & Solar Engineers**: Green building infrastructure managers.

Apply directly on our Education & Career Portal or email your CV to **insight@aviyana.lk**.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1000&auto=format&fit=crop&q=80',
    mediaType: 'image',
    status: 'Published',
    viewsCount: 890,
    featured: false,
    tags: ['Career & Hiring', 'Jobs', 'Hospitality Careers', 'Aviyana Hiring']
  }
];

export const INITIAL_COURSES: any[] = [
  {
    id: 'edu-1',
    title: 'International Ceylon Luxury Butler Certification',
    category: 'Hospitality Academy',
    duration: '6 Months (Full-Time)',
    instructor: 'Master Butler Hans von Berg & Aviyana Training Faculty',
    description: 'Comprehensive Ceylon butler training covering protocol, guest psychology, VIP concierge logistics, fine dining etiquette, and private villa management.',
    highlights: [
      'Guaranteed employment at Aviyana Ceylon Resort',
      'Full monthly training allowance & uniform provided',
      'Internationally accredited luxury service certificate',
      'Hands-on practice in mock Presidential Villa suites'
    ],
    enrolledCount: 60,
    badge: 'Fully Sponsored Scholarship',
    status: 'Open for Registration',
    schedule: 'Batch 3 Starts: September 15, 2026',
    syllabusDocName: 'Aviyana_Butler_Certification_Syllabus.pdf'
  },
  {
    id: 'edu-2',
    title: 'Eco-Hospitality & CEA Environmental Stewardship Program',
    category: 'Sustainability & CEA',
    duration: '3 Months (Part-Time)',
    instructor: 'Dr. Environmental Specialist Perera',
    description: 'Specialized training on zero-waste hotel operations, EIA environmental compliance, rainwater recycling management, and eco-certified guest experiences.',
    highlights: [
      'Learn rainwater harvesting plant operation',
      'Solar energy grid optimization for luxury resorts',
      'Endemic flora & fauna conservation guide certification',
      'Open to local community members and hotel students'
    ],
    enrolledCount: 45,
    badge: 'Community Free Workshop',
    status: 'Open for Registration',
    schedule: 'Every Saturday Morning',
    syllabusDocName: 'Eco_Stewardship_Module_Outline.pdf'
  },
  {
    id: 'edu-3',
    title: 'Multilingual VIP Concierge & Etiquette Masterclass',
    category: 'Language & Etiquette',
    duration: '2 Months',
    instructor: 'Madame Claire Dubois',
    description: 'Advanced conversational fluency in French, Mandarin, Arabic, and High-Tier Business English tailored for ultra-luxury international clientele.',
    highlights: [
      'Pronunciation & cultural diplomacy',
      'Crisis de-escalation & luxury guest care',
      'Wine & culinary terminology pairing'
    ],
    enrolledCount: 30,
    badge: 'Advanced Career Boost',
    status: 'Upcoming',
    schedule: 'Starts: October 1, 2026'
  }
];

export const INITIAL_SOCIAL_LINKS: any[] = [
  {
    platform: 'InsightAviyana',
    handle: '@insightaviyana',
    url: 'https://insight.aviyana.lk',
    iconName: 'globe',
    description: 'The official source-of-truth portal itself — verified news, milestones, and fact-checks, direct from Aviyana Ceylon Resort.'
  },
  {
    platform: 'Facebook',
    handle: '@aviyanaceylonresort',
    url: 'https://facebook.com/aviyanaceylonresort',
    iconName: 'facebook',
    description: 'Official Facebook Page for resort progress, community stories, and press releases.'
  },
  {
    platform: 'Instagram',
    handle: '@aviyanaresort',
    url: 'https://instagram.com/aviyanaresort',
    iconName: 'instagram',
    description: 'High-definition 4K visual reels of villa suites, infinity views, and luxury dining.'
  },
  {
    platform: 'LinkedIn',
    handle: 'Aviyana Ceylon Resort',
    url: 'https://linkedin.com/company/aviyana-resort',
    iconName: 'linkedin',
    description: 'Corporate announcements, CEA clearance documents, and executive leadership updates.'
  },
  {
    platform: 'YouTube',
    handle: '@aviyanaceylonresort',
    url: 'https://youtube.com/@aviyanaceylonresort',
    iconName: 'youtube',
    description: 'Official drone documentaries, voice cut interviews, and training academy reels.'
  },
  {
    platform: 'TikTok',
    handle: '@aviyanaresort',
    url: 'https://tiktok.com/@aviyanaresort',
    iconName: 'tiktok',
    description: 'Behind-the-scenes stories captured by our Hotel School Story Hunters.'
  },
  {
    platform: 'WhatsApp PR Line',
    handle: '+94 77 000 7777',
    url: 'https://wa.me/94770007777',
    iconName: 'whatsapp',
    description: 'Direct 24/7 WhatsApp hotline for media inquiries and soft-launch bookings.'
  }
];

export const INITIAL_INQUIRIES: any[] = [
  {
    id: 'inq-1',
    name: 'Ruwan Bandaranaike',
    email: 'ruwan.media@dailynews.lk',
    contact: '+94 71 234 5678',
    category: 'Press & Media',
    question: 'Could you please provide high-res press photos of the Presidential Suites and official confirmation of the CEA EIA certificate number for our feature article?',
    submittedAt: '2026-08-03 09:15 AM',
    status: 'Delivered to insight@aviyana.lk',
    ticketNumber: 'AV-2026-901'
  },
  {
    id: 'inq-2',
    name: 'Samanthika Gunawardena',
    email: 'samanthika.g@gmail.com',
    contact: '+94 77 987 6543',
    category: 'Employment & Academy',
    question: 'How can local hotel school graduates apply for the free 6-month Aviyana Luxury Butler Certification program starting September?',
    submittedAt: '2026-08-02 02:40 PM',
    status: 'Answered',
    ticketNumber: 'AV-2026-884'
  }
];

export const INITIAL_REGISTRATIONS: any[] = [
  {
    id: 'reg-1',
    name: 'Kusal Perera',
    email: 'kusal.p@srilankanmedia.com',
    contact: '+94 70 111 2222',
    organizationRole: 'Press & Journalist',
    registeredAt: '2026-08-01',
    interests: ['Press Releases', 'Grand Opening Invitations'],
    vipPassCode: 'AV-VIP-8801'
  }
];

