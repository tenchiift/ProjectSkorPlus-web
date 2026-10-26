// ============================================================================
// SKOR+ CalcQuest: Mathematical Evaluation & Misconception Engine
// Supports symbolic equivalence, numerical tolerance, step ordering,
// error detection, matching, and misconception classification.
// ============================================================================

/**
 * Normalizes a mathematical string for comparison and evaluation.
 */
export function normalizeMathString(raw = '') {
  return String(raw)
    .trim()
    .replace(/\s+/g, '')
    .replace(/−/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^\{([^}]+)\}/g, '^($1)')
    .toLowerCase();
}

/**
 * Safely evaluates a single-variable algebraic expression f(x) at a given numeric x.
 * Used for controlled multi-point symbolic equivalence checking across explicit domain points.
 */
export function evaluateExpressionAt(exprStr, xVal) {
  try {
    let s = normalizeMathString(exprStr);
    // Strip trailing +c or +C when checking derivative/algebraic part separately
    s = s.replace(/\+c$/i, '');
    if (!s) return NaN;

    // Reject unsafe characters
    if (/[^0-9x+\-*/^().sincotaglnep]/.test(s)) return NaN;

    // Replace constants and functions
    s = s
      .replace(/pi/g, `(${Math.PI})`)
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/exp\(/g, 'Math.exp(');

    // Insert explicit multiplication: 2x -> 2*x, )x -> )*x, x( -> x*(, 2( -> 2*(, )( -> )*(
    s = s
      .replace(/(\d)(x)/g, '$1*$2')
      .replace(/(\d)(\()/g, '$1*$2')
      .replace(/(\))(x)/g, '$1*$2')
      .replace(/(x)(\()/g, '$1*$2')
      .replace(/(\))(\()/g, '$1*$2');

    // Convert power operator ^ to **
    s = s.replace(/\^/g, '**');

    // Replace variable x with numeric value wrapped in parens
    s = s.replace(/x/g, `(${Number(xVal)})`);

    // Evaluate safely
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${s});`);
    const result = fn();
    return typeof result === 'number' && Number.isFinite(result) ? result : NaN;
  } catch {
    return NaN;
  }
}

/**
 * Checks whether two single-variable mathematical expressions are symbolically equivalent
 * over a safe set of domain test points.
 */
export function areExpressionsEquivalent(studentExpr, targetExpr, options = {}) {
  const { requireConstantC = false, domainPoints = [-2.5, -1.3, -0.7, 0.5, 1.2, 2.1, 3.4] } = options;

  const normStudent = normalizeMathString(studentExpr);
  const normTarget = normalizeMathString(targetExpr);

  if (!normStudent) return { equivalent: false, missingC: false };

  // Check if indefinite integral constant +C is required
  if (requireConstantC) {
    const hasC = /\+c$/i.test(normStudent) || /^c\+/i.test(normStudent);
    const studentWithoutC = normStudent.replace(/\+c$/i, '').replace(/^c\+/i, '');
    const targetWithoutC = normTarget.replace(/\+c$/i, '').replace(/^c\+/i, '');

    const coreMatch = compareCoreExpressions(studentWithoutC, targetWithoutC, domainPoints);
    if (coreMatch && !hasC) {
      return { equivalent: false, missingC: true };
    }
    return { equivalent: coreMatch && hasC, missingC: false };
  }

  return {
    equivalent: compareCoreExpressions(normStudent, normTarget, domainPoints),
    missingC: false,
  };
}

function compareCoreExpressions(exprA, exprB, domainPoints) {
  if (exprA === exprB) return true;

  let validComparisons = 0;
  for (const pt of domainPoints) {
    const valB = evaluateExpressionAt(exprB, pt);
    if (Number.isNaN(valB)) continue;
    const valA = evaluateExpressionAt(exprA, pt);
    if (Number.isNaN(valA)) return false;
    if (Math.abs(valA - valB) > 1e-4) return false;
    validComparisons += 1;
  }
  return validComparisons >= 3;
}

/**
 * Parses a numerical answer (supports decimals and fractions like -3/4).
 */
export function parseNumericalInput(raw) {
  const s = normalizeMathString(raw);
  if (!s) return NaN;
  if (/^-?\d+(\.\d+)?\/\d+(\.\d+)?$/.test(s)) {
    const [num, den] = s.split('/').map(Number);
    return den !== 0 ? num / den : NaN;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Validates any of the 9 question types and classifies potential misconceptions.
 */
export function validateQuestionAnswer(question, submittedAnswer) {
  const { question_type, answer_data, misconception_tags = [] } = question;
  let isCorrect = false;
  let detectedMisconception = null;
  let customFeedback = null;

  switch (question_type) {
    case 'multiple_choice':
    case 'missing_step':
    case 'spot_error':
    case 'graph_interpretation': {
      const chosenIndex = Number(submittedAnswer);
      isCorrect = chosenIndex === answer_data.correctIndex;
      if (!isCorrect && answer_data.optionMisconceptions) {
        detectedMisconception = answer_data.optionMisconceptions[chosenIndex] || null;
      }
      if (!isCorrect && answer_data.optionFeedback?.[chosenIndex]) {
        customFeedback = answer_data.optionFeedback[chosenIndex];
      }
      break;
    }

    case 'numerical': {
      const studentVal = parseNumericalInput(submittedAnswer);
      const targetVal = Number(answer_data.correctValue);
      const tolerance = answer_data.tolerance ?? 1e-3;
      isCorrect = !Number.isNaN(studentVal) && Math.abs(studentVal - targetVal) <= tolerance;

      if (!isCorrect && answer_data.commonWrongValues) {
        for (const trap of answer_data.commonWrongValues) {
          if (!Number.isNaN(studentVal) && Math.abs(studentVal - Number(trap.value)) <= tolerance) {
            detectedMisconception = trap.misconception;
            customFeedback = trap.feedback;
            break;
          }
        }
      }
      break;
    }

    case 'expression': {
      const { equivalent, missingC } = areExpressionsEquivalent(
        submittedAnswer,
        answer_data.correctExpression,
        {
          requireConstantC: !!answer_data.requireConstantC,
          domainPoints: answer_data.domainPoints,
        }
      );
      isCorrect = equivalent;

      if (!isCorrect) {
        if (missingC) {
          detectedMisconception = 'missing_integration_constant';
          customFeedback = 'Your antiderivative term is right, but remember to include the constant of integration (+ C) for indefinite integrals!';
        } else if (answer_data.commonWrongExpressions) {
          for (const trap of answer_data.commonWrongExpressions) {
            const trapMatch = areExpressionsEquivalent(submittedAnswer, trap.expression, {
              requireConstantC: false,
            });
            if (trapMatch.equivalent) {
              detectedMisconception = trap.misconception;
              customFeedback = trap.feedback;
              break;
            }
          }
        }
      }
      break;
    }

    case 'order_steps': {
      // submittedAnswer is an array of step IDs in the player's chosen order
      const targetOrder = answer_data.correctOrder || [];
      isCorrect =
        Array.isArray(submittedAnswer) &&
        submittedAnswer.length === targetOrder.length &&
        submittedAnswer.every((id, idx) => id === targetOrder[idx]);
      if (!isCorrect) {
        detectedMisconception = misconception_tags[0] || 'step_sequence_error';
      }
      break;
    }

    case 'matching': {
      // submittedAnswer is a map { leftId: rightId }
      const pairs = answer_data.pairs || [];
      isCorrect =
        submittedAnswer &&
        typeof submittedAnswer === 'object' &&
        pairs.every((p) => submittedAnswer[p.id] === p.id);
      if (!isCorrect) {
        detectedMisconception = misconception_tags[0] || null;
      }
      break;
    }

    case 'interactive_puzzle': {
      const studentVal = parseNumericalInput(submittedAnswer);
      const targetVal = Number(answer_data.correctValue);
      const tolerance = answer_data.tolerance ?? 0.05;
      isCorrect = !Number.isNaN(studentVal) && Math.abs(studentVal - targetVal) <= tolerance;
      if (!isCorrect && answer_data.commonWrongValues) {
        for (const trap of answer_data.commonWrongValues) {
          if (!Number.isNaN(studentVal) && Math.abs(studentVal - Number(trap.value)) <= tolerance) {
            detectedMisconception = trap.misconception;
            customFeedback = trap.feedback;
            break;
          }
        }
      }
      break;
    }

    default:
      isCorrect = false;
  }

  return {
    correct: isCorrect,
    detectedMisconception: isCorrect ? null : (detectedMisconception || 'unclassified'),
    feedback: isCorrect
      ? question.explanation
      : customFeedback || `Not quite! Review the concept: ${question.hint}`,
  };
}

/**
 * Catalogue of known Calculus misconceptions & Mistake-to-Mastery missions.
 */
export const MISCONCEPTION_CATALOG = {
  exponent_rule_confusion: {
    id: 'exponent_rule_confusion',
    title: 'Exponent Law Mix-Up',
    skillId: 'algebra',
    description: 'Confusing multiplying powers (add exponents: x^a · x^b = x^(a+b)) with raising a power to a power (multiply exponents: (x^a)^b = x^(ab)).',
    missionTitle: 'Special Mission: The Exponent Forge',
  },
  indeterminate_direct_substitution: {
    id: 'indeterminate_direct_substitution',
    title: 'Stopping at 0/0 Indeterminate Form',
    skillId: 'limits',
    description: 'Concluding a limit is 0 or undefined immediately when direct substitution yields 0/0, instead of factoring or rationalizing to cancel the common factor.',
    missionTitle: 'Special Mission: Beyond the 0/0 Veil',
  },
  one_sided_limit_mismatch: {
    id: 'one_sided_limit_mismatch',
    title: 'Two-Sided Limit Existence Condition',
    skillId: 'continuity',
    description: 'Assuming a two-sided limit exists even when the left-hand limit and right-hand limit approach different values.',
    missionTitle: 'Special Mission: Bridging Left & Right Limits',
  },
  power_rule_exponent_error: {
    id: 'power_rule_exponent_error',
    title: 'Power Rule Exponent Reduction',
    skillId: 'power_rule',
    description: 'Forgetting to subtract 1 from the exponent or multiplying by the wrong power when applying d/dx [x^n] = n·x^(n-1).',
    missionTitle: 'Special Mission: Power Gear Calibration',
  },
  naive_product_rule: {
    id: 'naive_product_rule',
    title: 'Differentiating Factors Separately',
    skillId: 'product_rule',
    description: 'Taking d/dx [f(x)g(x)] as f\'(x)·g\'(x) instead of applying the full Product Rule: f\'(x)g(x) + f(x)g\'(x).',
    missionTitle: 'Special Mission: Dual-Engine Synchronization',
  },
  quotient_sign_or_order_error: {
    id: 'quotient_sign_or_order_error',
    title: 'Quotient Rule Numerator Order',
    skillId: 'quotient_rule',
    description: 'Reversing the subtraction order in the Quotient Rule numerator: it must be (low · d(high) − high · d(low)) / low².',
    missionTitle: 'Special Mission: Pressure Valve Stabilization',
  },
  missing_inner_derivative: {
    id: 'missing_inner_derivative',
    title: 'Omitting the Inner Derivative (Chain Rule)',
    skillId: 'chain_rule',
    description: 'Differentiating only the outer function f(g(x)) -> f\'(g(x)) without multiplying by the derivative of the inner function g\'(x).',
    missionTitle: 'Special Mission: Chain Rule Rescue',
  },
  missing_integration_constant: {
    id: 'missing_integration_constant',
    title: 'Missing Constant of Integration (+ C)',
    skillId: 'indefinite_integration',
    description: 'Omitting + C when finding an indefinite integral, which represents a whole family of antiderivatives.',
    missionTitle: 'Special Mission: Anchoring the Aether Constant',
  },
  integration_power_rule_reversal: {
    id: 'integration_power_rule_reversal',
    title: 'Differentiating Instead of Integrating',
    skillId: 'indefinite_integration',
    description: 'Subtracting 1 from the exponent instead of adding 1 and dividing by (n + 1) when computing ∫ x^n dx = x^(n+1)/(n+1) + C.',
    missionTitle: 'Special Mission: Reverse the Flow',
  },
  signed_area_vs_geometric_area: {
    id: 'signed_area_vs_geometric_area',
    title: 'Signed Net Area vs. Total Area',
    skillId: 'definite_integration',
    description: 'Forgetting that regions below the x-axis contribute negatively to a definite integral ∫_a^b f(x) dx.',
    missionTitle: 'Special Mission: Balance of Light and Shadow',
  },
  u_substitution_differential_error: {
    id: 'u_substitution_differential_error',
    title: 'Unbalanced du Differential Factor',
    skillId: 'substitution',
    description: 'Substituting u = g(x) without adjusting for the constant factor in du = g\'(x) dx.',
    missionTitle: 'Special Mission: Portal Frequency Alignment',
  },
};

export const CALCULUS_SKILLS = [
  { id: 'algebra', name: 'Algebraic Foundations', worldId: 'world_1' },
  { id: 'functions', name: 'Functions & Evaluation', worldId: 'world_1' },
  { id: 'limits', name: 'Limit Evaluation', worldId: 'world_2' },
  { id: 'continuity', name: 'One-Sided Limits & Continuity', worldId: 'world_2' },
  { id: 'power_rule', name: 'Power & Sum Rules', worldId: 'world_3' },
  { id: 'product_rule', name: 'Product Rule', worldId: 'world_3' },
  { id: 'quotient_rule', name: 'Quotient Rule', worldId: 'world_3' },
  { id: 'chain_rule', name: 'Chain Rule', worldId: 'world_3' },
  { id: 'indefinite_integration', name: 'Antiderivatives & Indefinite Integrals', worldId: 'world_4' },
  { id: 'definite_integration', name: 'Definite Integrals & Signed Area', worldId: 'world_4' },
  { id: 'substitution', name: 'Integration by Substitution', worldId: 'world_4' },
  { id: 'applications', name: 'Tangents & Multi-Step Applications', worldId: 'world_5' },
];
