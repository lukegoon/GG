const INDUSTRY_KEYWORDS = {
  Healthcare:    ['hospital', 'clinic', 'medical', 'health', 'pharma', 'dental', 'urgent care', 'nursing'],
  Technology:    ['tech', 'software', 'saas', ' it ', 'cloud', 'data', 'digital', 'cyber', 'ai '],
  Finance:       ['bank', 'financial', 'insurance', 'invest', 'credit', 'mortgage', 'accounting', 'cpa'],
  Manufacturing: ['manufactur', 'factory', 'industrial', 'warehouse', 'assembly', 'plant', 'logistics'],
  Retail:        ['retail', 'store', 'shop', 'ecommerce', 'merchant', 'boutique', 'supermarket'],
  Education:     ['school', 'university', 'college', 'education', 'training', 'tutoring', 'academy'],
  Construction:  ['construct', 'contractor', 'building', 'real estate', 'realty', 'renovation', 'hvac'],
  Staffing:      ['staffing', 'recruit', 'hiring', 'workforce', 'temp', 'placement', 'talent'],
  Transportation:['transport', 'trucking', 'delivery', 'fleet', 'logistics', 'shipping', 'freight'],
  Hospitality:   ['hotel', 'restaurant', 'hospitality', 'food service', 'catering', 'resort'],
}

export function tagIndustry(listName) {
  const lower = listName.toLowerCase()
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return industry
  }
  return 'Other'
}
