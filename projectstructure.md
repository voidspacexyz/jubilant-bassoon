Project Structure for Money Planner

/ (project root)
- index.html
- projectstructure.md
- css/
  - styles.css        # Custom small overrides and helper classes
- js/
  - formatters.js    # Parsing and formatting helpers
  - app.js           # Main application logic, event handlers, calculations

File: css/styles.css
- Purpose: Minimal custom CSS for modal transitions and small UI tweaks when using Tailwind.
- Important classes defined:
  - .translate-x-full : utility to move modal off-canvas
  - .translate-x-0    : utility to position modal on-screen
- Future: add custom utility classes or component styles here.

File: js/formatters.js
- Purpose: Reusable number and currency parsing/formatting helpers used across the app.
- Functions defined:
  - parseCurrency(value)
      - Strips non-numeric characters and parses a float. Returns 0 for invalid inputs.
  - formatCurrency(num, digits = 0)
      - Formats a number using locale-aware separators; optional fraction digits.
  - clampNumber(n, min = -Infinity, max = Infinity)
      - Clamps a number between min and max.
  - safeFloat(v)
      - Returns a finite float or 0.

File: js/app.js
- Purpose: All DOM wiring, state updates, and calculation logic.
- Main responsibilities and top-level structure:
  - DOM element references (salary input, result areas, loan/SIP inputs, modal, accordion headers)
  - Event listeners for inputs and UI elements
  - Core functions:
    - updateResults()
        - Reads the salary, computes 50/30/20 allocations, updates displays, and triggers loan/SIP updates.
    - calculateEMI(principal, tenureMonths, annualRate)
        - Returns { emi, totalPayment, totalInterest } for a loan given principal, tenure in months, and annual rate.
    - updateLoan()
        - Reads loan inputs (loan amount, downpayment, tenure, rate), computes EMI and updates loan result fields.
    - updateSIP()
        - Reads SIP inputs (monthly amount, years tenure, expected annual return), computes future value, invested amount, and returns.
    - showModal(type)
        - Opens side modal with simple content for 'needs', 'wants', 'savings'.
    - Accordion toggle handlers
        - Expand/collapse planner sections.

Notes and Next Steps
- The JavaScript is modularized into two files: formatters.js for helpers and app.js for app logic. This makes testing and reuse easier.
- You can extend formatters.js with localization-aware currency support or more robust parsing.
- Move additional UI-specific styles into css/styles.css when needed; Tailwind covers the bulk of layout and design.
- If you want, I can further split app.js into separate modules (loan.js, sip.js, ui.js) for even better separation.
