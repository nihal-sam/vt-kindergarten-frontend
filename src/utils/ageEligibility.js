export const CUTOFF_DATE = new Date(2026, 2, 31);
export const CUTOFF_LABEL = "31 March 2026";

export const eligibilityLevels = [
  { grade: "Play Group", minYears: 2, accent: "orange" },
  { grade: "Pre KG", minYears: 3, accent: "teal" },
  { grade: "LKG", minYears: 4, accent: "yellow" },
  { grade: "UKG", minYears: 5, accent: "purple" },
];

export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const str = String(value).trim();
  let year, month, day;
  if (str.includes("-")) {
    const parts = str.split("-").map(Number);
    if (parts[0] > 1000) {
      [year, month, day] = parts;
    } else {
      [day, month, year] = parts;
    }
  } else if (str.includes("/")) {
    const parts = str.split("/").map(Number);
    if (parts[2] > 1000) {
      [day, month, year] = parts;
    } else if (parts[0] > 1000) {
      [year, month, day] = parts;
    }
  }
  if (!year || !month || !day) return null;
  const d = new Date(year, month - 1, day);
  return isNaN(d.getTime()) ? null : d;
}

export function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getAgeOnCutoff(dateOfBirth) {
  if (!dateOfBirth) return null;
  let years = CUTOFF_DATE.getFullYear() - dateOfBirth.getFullYear();
  let months = CUTOFF_DATE.getMonth() - dateOfBirth.getMonth();
  let days = CUTOFF_DATE.getDate() - dateOfBirth.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = CUTOFF_DATE.getMonth() - 1;
    const previousMonthYear =
      previousMonth < 0 ? CUTOFF_DATE.getFullYear() - 1 : CUTOFF_DATE.getFullYear();
    const normalizedPreviousMonth = previousMonth < 0 ? 11 : previousMonth;
    days += getDaysInMonth(previousMonthYear, normalizedPreviousMonth);
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

export function getEligibleGrade(age) {
  if (!age) return null;
  return [...eligibilityLevels]
    .reverse()
    .find((level) => age.years >= level.minYears);
}

export function formatAge(age) {
  if (!age) return "";
  const parts = [
    `${age.years} year${age.years === 1 ? "" : "s"}`,
    `${age.months} month${age.months === 1 ? "" : "s"}`,
  ];

  if (age.days > 0) parts.push(`${age.days} day${age.days === 1 ? "" : "s"}`);
  return parts.join(" ");
}

export function formatAgeShort(age) {
  if (!age) return "";
  const parts = [`${age.years}y`, `${age.months}m`];
  if (age.days > 0) parts.push(`${age.days}d`);
  return parts.join(" ");
}

export function parseEnquiryEligibility(enq = {}) {
  let calculatedAgeStr = '';
  let eligibilityStatus = '';
  let recommendedClass = enq.program || '';

  // 1. Check structured text inside enq.message if present
  if (enq.message) {
    const ageMatch = enq.message.match(/Calculated Age[^\n:]*:\s*([^\n]+)/i);
    if (ageMatch) calculatedAgeStr = ageMatch[1].trim();

    const statusMatch = enq.message.match(/Eligibility[^\n:]*:\s*([^\n]+)/i);
    if (statusMatch) eligibilityStatus = statusMatch[1].trim();

    const classMatch = enq.message.match(/Recommended Class[^\n:]*:\s*([^\n]+)/i);
    if (classMatch) recommendedClass = classMatch[1].trim();
  }

  // 2. If calculatedAgeStr is empty or we have DOB, calculate dynamically to ensure accuracy
  let calculatedAge = null;
  if (enq.dob) {
    const parsedDob = parseLocalDate(enq.dob);
    if (parsedDob) {
      calculatedAge = getAgeOnCutoff(parsedDob);
      if (!calculatedAgeStr) {
        calculatedAgeStr = formatAge(calculatedAge);
      }
      if (!recommendedClass || recommendedClass === 'General') {
        const grade = getEligibleGrade(calculatedAge);
        recommendedClass = grade ? grade.grade : 'Not Eligible (< 2 Years)';
      }
    }
  }

  // 3. Determine isEligible boolean
  const isUnderage =
    (recommendedClass && recommendedClass.toLowerCase().includes('not eligible')) ||
    (recommendedClass && recommendedClass.toLowerCase().includes('underage')) ||
    (enq.relation && enq.relation.toLowerCase().includes('not eligible')) ||
    (calculatedAge && calculatedAge.years < 2);

  const isEligible = !isUnderage && Boolean(recommendedClass && !recommendedClass.toLowerCase().includes('not eligible'));

  if (!recommendedClass) {
    recommendedClass = isEligible ? 'Play Group' : 'Not Eligible (< 2 Years)';
  }

  // 4. Extract clean parent note (strip automated system lines)
  let parentNote = enq.message || '';
  if (parentNote) {
    parentNote = parentNote
      .replace(/\((?:Source|Note):[^\n]*\)/gi, '')
      .replace(/Calculated Age[^\n]*\n*/gi, '')
      .replace(/Eligibility Status[^\n]*\n*/gi, '')
      .replace(/Eligibility[^\n:]*:[^\n]*\n*/gi, '')
      .replace(/Recommended Class[^\n]*\n*/gi, '')
      .replace(/Parent Note:\s*/gi, '')
      .trim();
  }

  return {
    calculatedAgeStr,
    calculatedAge,
    isEligible,
    recommendedClass,
    parentNote: parentNote || 'No specific questions provided.',
  };
}
