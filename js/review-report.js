/* =========================================
   REVIEW REPORT DATA
========================================= */

const selectedContract = JSON.parse(
    localStorage.getItem("selectedContract") || "null"
);

const reportData = {
    fileName:
        selectedContract?.name ||
        'Construction Agreement.pdf',

    reviewedBy:
        selectedContract?.reviewedBy ||
        'Jana Khalid',

    reviewedDate:
        selectedContract?.date ||
        'August 11, 2026',

    overallScore:
        selectedContract?.score ??
        selectedContract?.riskScore ??
        25,

    completeness:
        selectedContract?.completeness ??
        92,

    highRisk:
        selectedContract?.highRisk ??
        7,

    mediumRisk:
        selectedContract?.mediumRisk ??
        8,

    lowRisk:
        selectedContract?.lowRisk ??
        13,

    totalClauses:
        selectedContract?.totalClauses ??
        28,
};


/* =========================================
   CLAUSES DATA
========================================= */

const clauses = [
  {
    id: '01',
    title: 'Limitation of Liability',
    description:
      'This clause may make the company responsible for high costs if a problem occurs.',
    level: 'High',
  },

  {
    id: '02',
    title: 'Indemnification',
    description:
      'This clause may require one party to pay for losses or claims caused by the other party.',
    level: 'High',
  },

  {
    id: '03',
    title: 'Termination for Convenience',
    description:
      'This clause may allow the contract to be ended at any time with little or no notice.',
    level: 'High',
  },

  {
    id: '04',
    title: 'Payment Terms',
    description:
      'Payment deadlines and penalty conditions should be reviewed carefully.',
    level: 'Medium',
  },

  {
    id: '05',
    title: 'Dispute Resolution',
    description:
      'The dispute resolution process may need clearer procedures and responsibilities.',
    level: 'Medium',
  },

  {
    id: '06',
    title: 'Confidentiality',
    description:
      'The confidentiality requirements are clearly defined and present limited risk.',
    level: 'Low',
  },

  {
    id: '07',
    title: 'Scope of Work',
    description:
      'The scope of work is clearly described and responsibilities are well defined.',
    level: 'Low',
  },
]


/* =========================================
   POSITIVE POINTS
========================================= */

const positivePoints = [
  'Clear payment terms are included.',
  'The project scope is well defined.',
  'Confidentiality requirements are included.',
]


/* =========================================
   AREAS FOR IMPROVEMENT
========================================= */

const improvementAreas = [
  'Termination notice period needs clarification.',
  'Liability responsibilities could be more specific.',
  'Some obligations do not include clear deadlines.',
]


/* =========================================
   RECOMMENDATIONS
========================================= */

const recommendations = [
  'Clarify the termination notice period before approval.',
  'Define liability limits and responsibilities more clearly.',
  'Add specific deadlines to key contractual obligations.',
]


/* =========================================
   RISK LOGIC
========================================= */

function getRiskInfo(score) {
  if (score >= 70) {
    return {
      label: 'HIGH RISK',
      color: '#E65561',
      message:
        'This contract contains several high-risk clauses and requires careful review.',
    }
  }

  if (score >= 40) {
    return {
      label: 'MEDIUM RISK',
      color: '#D99000',
      message:
        'This contract contains some clauses that may require additional review.',
    }
  }

  return {
    label: 'LOW RISK',
    color: '#20A66A',
    message:
      'This contract contains relatively low-risk clauses and may require standard review.',
  }
}


/* =========================================
   USER INITIALS
========================================= */

function getInitials(name) {
  return name
    .trim()
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}


/* =========================================
   SET BASIC REPORT DATA
========================================= */

document.getElementById('fileName').textContent =
  reportData.fileName

document.getElementById('reviewedBy').textContent =
  reportData.reviewedBy

document.getElementById('reviewedByTop').textContent =
  reportData.reviewedBy

document.getElementById('reviewedDate').textContent =
  reportData.reviewedDate

document.getElementById('userAvatar').textContent =
  getInitials(reportData.reviewedBy)


/* =========================================
   OVERALL RISK SCORE
========================================= */

const riskInfo = getRiskInfo(reportData.overallScore)

const riskRing =
  document.getElementById('riskRing')

const overallScore =
  document.getElementById('overallScore')

const riskLevel =
  document.getElementById('riskLevel')

const riskMessage =
  document.getElementById('riskMessage')


overallScore.textContent =
  reportData.overallScore

riskLevel.textContent =
  riskInfo.label

riskLevel.style.color =
  riskInfo.color

riskMessage.textContent =
  riskInfo.message


riskRing.style.setProperty(
  '--risk-color',
  riskInfo.color
)

riskRing.style.setProperty(
  '--score',
  `${reportData.overallScore}%`
)


/* =========================================
   COMPLETENESS
========================================= */

document.getElementById(
  'completenessPercentage'
).textContent =
  `${reportData.completeness}%`

document.getElementById(
  'progressFill'
).style.width =
  `${reportData.completeness}%`


/* =========================================
   RISK COUNTS
========================================= */

document.getElementById(
  'highRiskCount'
).textContent =
  reportData.highRisk

document.getElementById(
  'mediumRiskCount'
).textContent =
  reportData.mediumRisk

document.getElementById(
  'lowRiskCount'
).textContent =
  reportData.lowRisk

document.getElementById(
  'totalClausesCount'
).textContent =
  reportData.totalClauses

document.getElementById(
  'highRiskBadge'
).textContent =
  `${reportData.highRisk} High Risk`


/* =========================================
   CLAUSES
========================================= */

const clausesList =
  document.getElementById('clausesList')

const clausesTitle =
  document.getElementById('clausesTitle')

const clausesSubtitle =
  document.getElementById('clausesSubtitle')

const highRiskBadge =
  document.getElementById('highRiskBadge')

const viewAllButton =
  document.getElementById('viewAllButton')

let showAllClauses = false


function createClauseRow(clause) {
  const row =
    document.createElement('div')

  row.className = 'clause-row'

  row.innerHTML = `
    <span class="clause-number">
      ${clause.id}
    </span>

    <div class="clause-content">
      <h4>${clause.title}</h4>
      <p>${clause.description}</p>
    </div>

    <span class="clause-badge ${clause.level.toLowerCase()}">
      ${clause.level}
    </span>
  `

  return row
}


function renderClauses() {
  clausesList.innerHTML = ''

  let visibleClauses

  if (showAllClauses) {
    visibleClauses = clauses

    clausesTitle.textContent =
      'All Contract Clauses'

    clausesSubtitle.textContent =
      'All detected clauses and their risk levels.'

    highRiskBadge.style.display =
      'none'

    viewAllButton.textContent =
      'Show Less'
  } else {
    visibleClauses =
      clauses
        .filter(
          (clause) =>
            clause.level.toLowerCase() === 'high'
        )
        .slice(0, 3)

    clausesTitle.textContent =
      'High Risk Clauses'

    clausesSubtitle.textContent =
      'Clauses that require immediate attention.'

    highRiskBadge.style.display =
      'inline-block'

    viewAllButton.textContent =
      'View All Clauses'
  }

  visibleClauses.forEach((clause) => {
    clausesList.appendChild(
      createClauseRow(clause)
    )
  })
}


viewAllButton.addEventListener(
  'click',
  () => {
    showAllClauses = !showAllClauses

    renderClauses()
  }
)


renderClauses()


/* =========================================
   POSITIVE POINTS
========================================= */

const positivePointsList =
  document.getElementById(
    'positivePointsList'
  )

positivePoints.forEach((point) => {
  const item =
    document.createElement('li')

  item.textContent = point

  positivePointsList.appendChild(item)
})


/* =========================================
   AREAS FOR IMPROVEMENT
========================================= */

const improvementAreasList =
  document.getElementById(
    'improvementAreasList'
  )

improvementAreas.forEach((point) => {
  const item =
    document.createElement('li')

  item.textContent = point

  improvementAreasList.appendChild(item)
})


/* =========================================
   RECOMMENDATIONS
========================================= */

const recommendationsList =
  document.getElementById(
    'recommendationsList'
  )

recommendations.forEach(
  (recommendation, index) => {
    const item =
      document.createElement('div')

    item.className =
      'recommendation-item'

    item.innerHTML = `
      <span>
        ${String(index + 1).padStart(2, '0')}
      </span>

      <p>
        ${recommendation}
      </p>
    `

    recommendationsList.appendChild(item)
  }
)


/* =========================================
   DOWNLOAD REPORT
========================================= */

const downloadButton =
  document.getElementById(
    'downloadReportButton'
  )

downloadButton.addEventListener(
  'click',
  () => {
    window.print()
  }
)