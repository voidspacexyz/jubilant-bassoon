# 50 Planner — Blueprint

Purpose
- Define a sane, accessible, editable blueprint for the "50% Needs" planner. This document specifies default itemized inputs, percent allocations (relative to the Needs bucket and total income), input types, validation, and behavior for embedded loan calculators.

Design principles
- Keep the primary "Living Expenses" input required and editable.
- All sub-items default to sensible percentages of the 50% bucket but remain editable by the user.
- Allow items to accept either a percentage (of the 50% bucket) or an absolute monthly amount; keep a clear toggle and strong validation.
- Loan inputs remain calculators (principal, downpayment, interest, tenure) and never pre-filled as a percent allocation. Do not assume any loan unless the user has entered it.
- Ensure keyboard accessibility, ARIA labels, and clear inline error messaging.
- The inputs should come under te 50 Planner and nowhere else
- The default input boxes should contain the computed values and not the percentages. 
- The caption (for example: Living Expenses), will change to Living Expenses (x%), where X is the percentage total of my 50% of the value in the input box. For example, if my 50% is 10000, and I have entered 5000 in the living expenses input box, then the label will now say Living Expenses (50%).

Notation used here
- %50 = percentage within the Needs bucket (i.e., percentage of the 50% allocation).
- %Total = percentage of the user monthly income.
- Example: an item with %50 = 50% equals %Total = 25% of income.

Default itemized list (sensible defaults)
1. Living Expenses (mandatory)
   - Purpose: Rent, basic utilities, mandatory recurring bills required to keep a household running.
   - Default: %50 = 50% of the Needs bucket  (i.e., %Total = 25% of income)
   - Input type: amount or percent toggle; required field.
   - Notes: Always present and cannot be fully removed; editable amount/percent.

2. Groceries & Food
   - Purpose: All grocery shopping, food, household supplies, basic toiletries.
   - Default: %50 = 20% of the Needs bucket  (i.e., %Total = 10% of income)
   - Input type: amount or percent toggle; editable.

3. Home Loan / Mortgage (calculator)
   - Purpose: Loan EMI calculations; treated separately from fixed % allocations.
   - Default display: placeholder "0" under Needs allocation but the EMI is deducted from Needs usage when provided.
   - Inputs (calculator):
     - Principal (amount)
     - Downpayment (amount)
     - Interest rate (annual %)
     - Tenure (months)
   - Outputs: Monthly EMI, Total Payment, Interest Paid, Principal Paid.
   - UI behavior: When a valid EMI is present, show EMI as a separate line under Needs and subtract it from the Living Expenses/reserve display. Allow user to toggle whether EMI counts inside the 50% bucket or is paid from Savings (explicit confirmation required).

4. Utilities
   - Purpose: Electricity, water, gas/heating, internet, phone
   - Default: %50 = 10% of the Needs bucket  (i.e., %Total = 5% of income)
   - Input type: amount or percent toggle; editable.

5. Transportation
   - Purpose: Fuel, public transit, car payment (if not listed as loan), insurance, maintenance
   - Default: %50 = 8% of the Needs bucket  (i.e., %Total = 4% of income)
   - Input type: amount or percent toggle; editable.

6. Health
   - Purpose: Insurance premiums, prescriptions, out-of-pocket medical/dental/vision
   - Default: %50 = 6% of the Needs bucket  (i.e., %Total = 3% of income)
   - Input type: amount or percent toggle; editable.

7. Minimum Debt Payments
   - Purpose: Credit card minimums, student loan minimums, personal loan minimums (non-EMI items)
   - Default: %50 = 4% of the Needs bucket  (i.e., %Total = 2% of income)
   - Input type: amount or percent toggle; editable.

8. Misc Essentials / Contingency
   - Purpose: Unexpected essential outflows (basic clothing, small repairs, one-off essential purchases)
   - Default: %50 = 2% of the Needs bucket  (i.e., %Total = 1% of income)
   - Input type: amount or percent toggle; editable.

Notes on totals
- Defaults above sum to 100% of the Needs bucket (50% of income) except the Home Loan, which is modeled as a calculator and represented separately in the UI: either included or excluded from the 50% total per user choice.
- When the user edits any percent or amount, the system should show:
  - Live recalculated amounts in both currency and percent-of-income
  - Remaining/unallocated balance inside the Needs bucket (highlighted if negative)
  - Smart suggestions if the Needs bucket is over-allocated (e.g., propose small adjustments across non-mandatory items)

Suggested input fields and validation rules
- Global salary input should remain the single source of truth for conversions.
- Per-item input widget:
  - Label (required, visible)
  - Toggle: Percent-of-Needs vs Absolute monthly amount
  - Input: numeric, localized formatting (commas), accessible ARIA labels
  - Inline help text describing what goes into the category
  - Validation: numeric, >= 0; percent inputs sum enforcement up to 100% with friendly warnings
- Living Expenses: required; cannot be removed. If percent-based and user sets it to >100% of Needs, block submit and show error.
- Loan calculator: enforce principal > 0, tenure > 0, interest >= 0. Downpayment must be <= principal.

UI behaviors and interactions
- Default expanded item: Living Expenses open on first use.
- Ability to reorder items (drag handle) for user priority; reordering does not change allocation unless the user edits values.
- Add custom Needs item: simple modal with name, default percent suggestion, and input type.
- Persist user customizations locally (localStorage) with an explicit "Reset to defaults" action.
- When EMI is present and user chooses to include it in Needs: show EMI line item, and recalculate the remaining Needs reserve after EMI and Living Expenses.
- If EMI pushes Needs over 50% of income, show clear warning and recommended actions (increase income, move categories to Wants/Savings, refinance loan).

Accessibility & internationalization
- Provide ARIA labels for every input, and role="status" region for live recalculation summaries.
- Keyboard-focusable controls and visible focus rings (no reliance on hover-only affordances).
- Support localized currency formatting and number separators.
- Ensure color contrast for all category chips and warning states.

Analytics & telemetry (optional)
- Track user toggles for percent vs amount to improve defaults.
- Track when EMI inclusion is toggled to inform UX decisions.

Developer notes
- Keep the loan calculator code isolated from the percent-allocation logic — calculator returns an EMI number and related details only.
- UI should expose both percent-of-Needs and percent-of-Total conversions to avoid confusion.
- Provide unit tests around percent-sum validations and EMI calculation formulae (P, r, n -> EMI).

Example quick summary table (Defaults)
- Living Expenses: 50% of Needs (%Total = 25%) — required
- Groceries: 20% of Needs (%Total = 10%)
- Utilities: 10% of Needs (%Total = 5%)
- Transportation: 8% of Needs (%Total = 4%)
- Health: 6% of Needs (%Total = 3%)
- Minimum Debt Payments: 4% of Needs (%Total = 2%)
- Misc Essentials/Contingency: 2% of Needs (%Total = 1%)
- Home Loan: calculator (EMI) — included/excluded toggle

End of blueprint.
