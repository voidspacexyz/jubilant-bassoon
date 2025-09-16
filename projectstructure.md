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

File: js/common.js
- Purpose: Shared state management, common DOM elements, and core utilities (e.g., updateResults, calculateEMI, modal, accordion handlers).
- Key features: Centralizes salary, allocated/actual values; exposes via window.AppCommon for modularity.

File: js/needs.js
- Purpose: Handles the 50% needs allocation, including loan/EMI calculations and the detailed needs items list with localStorage.
- Key features: Integrates needs items IIFE; updates actual50 based on items and EMI.

File: js/wants.js
- Purpose: Manages the 30% wants allocation (minimal for now; placeholder for future features like expense tracking).
- Key features: Updates allocated30 and actual30 (currently 0).

File: js/savings.js
- Purpose: Handles the 20% savings allocation, including SIP calculations.
- Key features: Computes future value, invested amount; updates actual20.

Notes and Next Steps
- The JavaScript is now modularized into separate files: common.js for shared logic, needs.js for needs-specific features, wants.js for wants, and savings.js for savings. This improves maintainability and testing.
- common.js acts as the central hub, with other files accessing shared state via window.AppCommon.
- You can extend individual files (e.g., add features to wants.js) without affecting others.
- If you want further splitting (e.g., extract modal/accordion to ui.js), let me know.
